import type { Character, GameData, Rarity, Row } from '@jolly-rogue/game-data';
import { type CombatEvent, type CombatOutcome, resolveCombat } from './combat.js';
import { indexOf, mustGet } from './data.js';
import { Rng, type RngState, isValidSeed, seedRng } from './rng.js';
import { type TeamMember, teamCombatants } from './team.js';
import { type WaveEnemy, generateWave, waveCombatants } from './waves.js';

/** Version des règles du moteur : épinglée dans chaque partie pour le rejeu serveur. */
export const ENGINE_VERSION = '0.1.0';

export type RunPhase =
  /** Placement libre, puis lancement de la vague. */
  | 'prep'
  /** Vague gagnée : choisir une recrue ou passer. */
  | 'recruit'
  /** Partie terminée (défaite). */
  | 'over';

/**
 * État d'une partie. JSON pur : ni classe, ni fonction, ni Map.
 * `JSON.parse(JSON.stringify(state))` redonne un état avec lequel la partie continue à l'identique.
 */
export interface RunState {
  engineVersion: string;
  seed: number;
  rng: RngState;
  phase: RunPhase;
  /** Numéro de la vague à affronter (ou de la vague perdue si la partie est finie). */
  wave: number;
  team: TeamMember[];
  /** Ennemis de la vague `wave`, déjà générés pour que le joueur puisse se placer. */
  enemies: WaveEnemy[];
  /** Slugs proposés au recrutement, ou null hors phase `recruit`. */
  offer: string[] | null;
  wavesCleared: number;
  /** Somme, sur les vagues gagnées, des PV restants de l'équipe en ‰ de ses PV max. */
  hpPermilleSum: number;
  score: number;
}

export type Choice =
  /** Recruter l'offre n° `offer` ; `replace` = index du perso remplacé si l'équipe est pleine. */
  | { type: 'recruit'; offer: number; replace?: number }
  /** Ne recruter personne. */
  | { type: 'skip' }
  /** Changer un perso de ligne. */
  | { type: 'move'; index: number; row: Row }
  /** Échanger les emplacements (et les lignes) de deux persos. */
  | { type: 'swap'; a: number; b: number }
  /** Lancer la vague. */
  | { type: 'start' };

export type RunEvent =
  | { type: 'run_start'; team: TeamMember[] }
  | { type: 'moved'; index: number; row: Row }
  | { type: 'swapped'; a: number; b: number }
  | { type: 'combat'; wave: number; outcome: CombatOutcome; events: CombatEvent[] }
  | { type: 'offer'; wave: number; offer: string[] }
  | { type: 'recruited'; slug: string; index: number; level: number; fused: boolean; replaced: string | null }
  | { type: 'skipped' }
  | { type: 'run_over'; wave: number; wavesCleared: number; score: number };

export type ChoiceErrorCode =
  | 'run_over'
  | 'wrong_phase'
  | 'bad_choice'
  | 'bad_index'
  | 'bad_offer_index'
  | 'team_full'
  | 'replace_not_allowed'
  | 'row_full'
  | 'same_row'
  | 'same_slot';

export interface ChoiceError {
  code: ChoiceErrorCode;
  message: string;
}

export type ChoiceResult =
  | { ok: true; state: RunState; events: RunEvent[] }
  | { ok: false; error: ChoiceError };

const fail = (code: ChoiceErrorCode, message: string): ChoiceResult => ({ ok: false, error: { code, message } });

const isIndex = (value: unknown, length: number): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < length;

const rowCount = (team: readonly TeamMember[], row: Row): number => team.filter((m) => m.row === row).length;

/** Ligne d'arrivée d'une recrue : sa ligne préférée (mêlée devant, distance derrière), sinon l'autre. */
function defaultRow(character: Character, team: readonly TeamMember[], data: GameData): Row {
  const preferred: Row = data.rules.archetypes[character.archetype]?.range === 'melee' ? 'front' : 'back';
  const other: Row = preferred === 'front' ? 'back' : 'front';
  return rowCount(team, preferred) < data.rules.team.rowMax ? preferred : other;
}

/** Probabilités de rareté (en %) de l'offre qui suit la vague `wave`. */
export function rarityChances(wave: number, data: GameData): Record<Rarity, number> {
  const curve = (c: GameData['rules']['offer']['rare']): number =>
    Math.min(c.cap, c.base + c.perStep * Math.floor(wave / c.step));
  const legendaire = curve(data.rules.offer.legendaire);
  const rare = curve(data.rules.offer.rare);
  return { legendaire, rare, commun: 100 - legendaire - rare };
}

const FALLBACK: Record<Rarity, readonly Rarity[]> = {
  legendaire: ['legendaire', 'rare', 'commun'],
  rare: ['rare', 'commun', 'legendaire'],
  commun: ['commun', 'rare', 'legendaire'],
};

/**
 * Tire l'offre de recrutement qui suit la vague `wave`.
 *
 * Consommation du RNG, pour chaque place de l'offre : `int(100)` (rareté), puis
 * `int(taille du vivier)` (perso). Si aucun perso n'est disponible, la place est omise
 * après le tirage de rareté, sans second tirage.
 */
function drawOffer(wave: number, team: readonly TeamMember[], data: GameData, rng: Rng): string[] {
  const index = indexOf(data);
  const chances = rarityChances(wave, data);
  const maxed = new Set(team.filter((m) => m.level >= data.rules.fusion.maxLevel).map((m) => m.slug));
  const offer: string[] = [];
  for (let i = 0; i < data.rules.offer.size; i++) {
    const roll = rng.int(100);
    const rarity: Rarity =
      roll < chances.legendaire ? 'legendaire' : roll < chances.legendaire + chances.rare ? 'rare' : 'commun';
    // Vivier : persos de la rareté tirée, hors persos déjà proposés ou au niveau max ;
    // s'il est vide, on se rabat sur la rareté suivante de FALLBACK.
    let pool: Character[] = [];
    for (const candidate of FALLBACK[rarity]) {
      pool = index.byRarity[candidate].filter((c) => !offer.includes(c.slug) && !maxed.has(c.slug));
      if (pool.length > 0) break;
    }
    if (pool.length === 0) continue;
    offer.push((pool[rng.int(pool.length)] as Character).slug);
  }
  return offer;
}

/**
 * Crée une partie.
 *
 * Consommation du RNG, dans cet ordre :
 *   1. équipe de départ : `startingCount` tirages sans remise parmi les persos de `startingRarity`
 *      triés par slug (`int(taille restante)` à chaque fois) ;
 *   2. génération de la vague 1 (voir `generateWave`).
 * Ensuite, à chaque vague lancée : tirages du combat (voir `resolveCombat`), puis, en cas de
 * victoire, tirages de l'offre (voir `drawOffer`), puis génération de la vague suivante.
 */
export function createRun(seed: number, data: GameData): { state: RunState; events: RunEvent[] } {
  if (!isValidSeed(seed)) throw new RangeError('seed : entier entre 0 et 4294967295 attendu');
  const index = indexOf(data);
  const rng = new Rng(seedRng(seed));

  const pool = [...index.byRarity[data.rules.team.startingRarity]];
  const team: TeamMember[] = [];
  for (let i = 0; i < data.rules.team.startingCount; i++) {
    const [character] = pool.splice(rng.int(pool.length), 1) as [Character];
    team.push({ slug: character.slug, level: 1, row: defaultRow(character, team, data) });
  }
  const enemies = generateWave(1, data, rng);

  const state: RunState = {
    engineVersion: ENGINE_VERSION,
    seed,
    rng: rng.state(),
    phase: 'prep',
    wave: 1,
    team,
    enemies,
    offer: null,
    wavesCleared: 0,
    hpPermilleSum: 0,
    score: 0,
  };
  return { state, events: [{ type: 'run_start', team: team.map((m) => ({ ...m })) }] };
}

/** Score (docs/regles-j1.md §11) : vagues gagnées, puis moyenne des PV restants en ‰. */
export function computeScore(wavesCleared: number, hpPermilleSum: number, data: GameData): number {
  const bonus = wavesCleared === 0 ? 0 : Math.min(data.rules.score.bonusCap, Math.floor(hpPermilleSum / wavesCleared));
  return wavesCleared * data.rules.score.perWave + bonus;
}

/**
 * Applique un choix du joueur. Fonction pure : `state` n'est pas modifié.
 * Un choix illégal renvoie une erreur explicite et ne consomme aucun tirage.
 */
export function applyChoice(state: RunState, choice: Choice, data: GameData): ChoiceResult {
  if (state.phase === 'over') return fail('run_over', 'la partie est terminée');
  if (typeof choice !== 'object' || choice === null) return fail('bad_choice', 'choix invalide');
  const { rules } = data;
  const team = state.team.map((m) => ({ ...m }));

  switch (choice.type) {
    case 'move': {
      if (state.phase !== 'prep') return fail('wrong_phase', 'le placement se fait avant de lancer la vague');
      if (!isIndex(choice.index, team.length)) return fail('bad_index', 'perso inexistant');
      if (choice.row !== 'front' && choice.row !== 'back') return fail('bad_choice', 'ligne invalide');
      const member = team[choice.index] as TeamMember;
      if (member.row === choice.row) return fail('same_row', 'le perso est déjà sur cette ligne');
      if (rowCount(team, choice.row) >= rules.team.rowMax) return fail('row_full', 'cette ligne est pleine');
      member.row = choice.row;
      return { ok: true, state: { ...state, team }, events: [{ type: 'moved', index: choice.index, row: choice.row }] };
    }

    case 'swap': {
      if (state.phase !== 'prep') return fail('wrong_phase', 'le placement se fait avant de lancer la vague');
      if (!isIndex(choice.a, team.length) || !isIndex(choice.b, team.length)) return fail('bad_index', 'perso inexistant');
      if (choice.a === choice.b) return fail('same_slot', 'il faut deux persos différents');
      // Les deux persos échangent leur emplacement et leur ligne.
      const a = team[choice.a] as TeamMember;
      const b = team[choice.b] as TeamMember;
      team[choice.a] = { ...b, row: a.row };
      team[choice.b] = { ...a, row: b.row };
      return { ok: true, state: { ...state, team }, events: [{ type: 'swapped', a: choice.a, b: choice.b }] };
    }

    case 'start': {
      if (state.phase !== 'prep') return fail('wrong_phase', 'il faut d\'abord choisir une recrue ou passer');
      const combat = resolveCombat(
        { player: teamCombatants(team, data), enemy: waveCombatants(state.enemies, data) },
        rules,
        state.rng,
      );
      const events: RunEvent[] = [{ type: 'combat', wave: state.wave, outcome: combat.outcome, events: combat.events }];
      if (combat.outcome === 'defeat') {
        events.push({ type: 'run_over', wave: state.wave, wavesCleared: state.wavesCleared, score: state.score });
        return { ok: true, state: { ...state, team, rng: combat.rng, phase: 'over' }, events };
      }
      const rng = new Rng(combat.rng);
      const wavesCleared = state.wavesCleared + 1;
      const hpPermilleSum = state.hpPermilleSum + Math.floor((1000 * combat.playerHp) / combat.playerMaxHp);
      const offer = drawOffer(state.wave, team, data, rng);
      const enemies = generateWave(state.wave + 1, data, rng);
      events.push({ type: 'offer', wave: state.wave, offer: [...offer] });
      return {
        ok: true,
        state: {
          ...state,
          team,
          rng: rng.state(),
          phase: 'recruit',
          wave: state.wave + 1,
          enemies,
          offer,
          wavesCleared,
          hpPermilleSum,
          score: computeScore(wavesCleared, hpPermilleSum, data),
        },
        events,
      };
    }

    case 'skip': {
      if (state.phase !== 'recruit') return fail('wrong_phase', 'aucune offre de recrutement en cours');
      return { ok: true, state: { ...state, team, phase: 'prep', offer: null }, events: [{ type: 'skipped' }] };
    }

    case 'recruit': {
      if (state.phase !== 'recruit' || state.offer === null) return fail('wrong_phase', 'aucune offre de recrutement en cours');
      if (!isIndex(choice.offer, state.offer.length)) return fail('bad_offer_index', 'cette recrue n\'est pas dans l\'offre');
      const slug = state.offer[choice.offer] as string;
      const character = mustGet(indexOf(data).characters, slug, 'perso');
      const next = { ...state, phase: 'prep' as const, offer: null };

      const existing = team.findIndex((m) => m.slug === slug);
      if (existing >= 0) {
        // Fusion : le perso déjà présent gagne un niveau (l'offre ne propose jamais un perso au niveau max).
        if (choice.replace !== undefined) return fail('replace_not_allowed', 'une fusion ne remplace personne');
        const member = team[existing] as TeamMember;
        member.level += 1;
        return {
          ok: true,
          state: { ...next, team },
          events: [{ type: 'recruited', slug, index: existing, level: member.level, fused: true, replaced: null }],
        };
      }

      if (team.length < rules.team.max) {
        if (choice.replace !== undefined) return fail('replace_not_allowed', 'l\'équipe n\'est pas pleine : aucun remplacement');
        team.push({ slug, level: 1, row: defaultRow(character, team, data) });
        return {
          ok: true,
          state: { ...next, team },
          events: [{ type: 'recruited', slug, index: team.length - 1, level: 1, fused: false, replaced: null }],
        };
      }

      if (choice.replace === undefined) return fail('team_full', 'équipe pleine : indique le perso à remplacer');
      if (!isIndex(choice.replace, team.length)) return fail('bad_index', 'perso à remplacer inexistant');
      const replaced = (team[choice.replace] as TeamMember).slug;
      const others = team.filter((_, i) => i !== choice.replace);
      team[choice.replace] = { slug, level: 1, row: defaultRow(character, others, data) };
      return {
        ok: true,
        state: { ...next, team },
        events: [{ type: 'recruited', slug, index: choice.replace, level: 1, fused: false, replaced }],
      };
    }

    default:
      return fail('bad_choice', 'type de choix inconnu');
  }
}

export type ReplayResult =
  | { ok: true; state: RunState }
  | { ok: false; index: number; error: ChoiceError; state: RunState };

/** Rejoue une partie depuis sa seed et ses choix : même état final et même score que la partie jouée. */
export function replay(seed: number, data: GameData, choices: readonly Choice[]): ReplayResult {
  let { state } = createRun(seed, data);
  for (let index = 0; index < choices.length; index++) {
    const result = applyChoice(state, choices[index] as Choice, data);
    if (!result.ok) return { ok: false, index, error: result.error, state };
    state = result.state;
  }
  return { ok: true, state };
}
