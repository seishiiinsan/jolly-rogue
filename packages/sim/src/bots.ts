import {
  type Choice,
  Rng,
  type RunState,
  type TeamMember,
  applyChoice,
  seedRng,
  teamSynergies,
} from '@jolly-rogue/engine';
import type { Character, GameData, Rarity, Row } from '@jolly-rogue/game-data';

/**
 * Un bot choisit le prochain coup à partir de l'état public de la partie.
 * Il n'utilise que l'API publique du moteur et son propre RNG, seedé à part de celui de la partie.
 */
export interface Bot {
  name: string;
  description: string;
  next(state: RunState, data: GameData, rng: Rng): Choice;
}

/** Seed du bot, dérivée de celle de la partie mais distincte (constante arbitraire). */
export const botRng = (runSeed: number): Rng => new Rng(seedRng((runSeed ^ 0x5bd1e995) >>> 0));

const RARITY_RANK: Record<Rarity, number> = { commun: 0, rare: 1, legendaire: 2 };

const characterOf = (slug: string, data: GameData): Character => {
  const character = data.characters.find((c) => c.slug === slug);
  if (!character) throw new Error(`perso inconnu : ${slug}`);
  return character;
};

const isMelee = (c: Character, data: GameData): boolean => data.rules.archetypes[c.archetype]?.range === 'melee';

/** Valeur brute d'un membre : rareté d'abord, puis niveau. */
const memberValue = (m: TeamMember, data: GameData): number =>
  RARITY_RANK[characterOf(m.slug, data).rarity] * 10 + m.level;

/** Index du membre le moins précieux parmi ceux qui passent le filtre, ou -1. */
function weakest(team: readonly TeamMember[], data: GameData, keep: (m: TeamMember) => boolean = () => false): number {
  let best = -1;
  team.forEach((m, i) => {
    if (keep(m)) return;
    if (best < 0 || memberValue(m, data) < memberValue(team[best] as TeamMember, data)) best = i;
  });
  return best;
}

/** Recrute `offer` : fusion, ajout, ou remplacement de `replace` (-1 = passer si l'équipe est pleine). */
function recruit(state: RunState, data: GameData, offer: number, replace: () => number): Choice {
  const slug = (state.offer ?? [])[offer] as string;
  if (state.team.some((m) => m.slug === slug) || state.team.length < data.rules.team.max) {
    return { type: 'recruit', offer };
  }
  const index = replace();
  return index < 0 ? { type: 'skip' } : { type: 'recruit', offer, replace: index };
}

/** Meilleure offre selon une note (la plus haute gagne ; à égalité, la première). -1 si aucune n'est notée. */
function bestOffer(state: RunState, score: (slug: string) => number | null): number {
  let best = -1;
  let bestScore = -Infinity;
  (state.offer ?? []).forEach((slug, i) => {
    const s = score(slug);
    if (s !== null && s > bestScore) {
      best = i;
      bestScore = s;
    }
  });
  return best;
}

/** Note « rareté » : fusion d'abord à rareté égale. */
const rarityScore = (state: RunState, data: GameData) => (slug: string): number =>
  RARITY_RANK[characterOf(slug, data).rarity] * 2 + (state.team.some((m) => m.slug === slug) ? 1 : 0);

/** Recrue de meilleure rareté ; équipe pleine : remplace le plus faible s'il est strictement moins rare. */
function recruitByRarity(state: RunState, data: GameData): Choice {
  const offer = bestOffer(state, rarityScore(state, data));
  if (offer < 0) return { type: 'skip' };
  const rank = RARITY_RANK[characterOf((state.offer as string[])[offer] as string, data).rarity];
  return recruit(state, data, offer, () => {
    const index = weakest(state.team, data);
    return index >= 0 && RARITY_RANK[characterOf((state.team[index] as TeamMember).slug, data).rarity] < rank ? index : -1;
  });
}

const random: Bot = {
  name: 'random',
  description: 'Choix légaux au hasard (recrue, remplacement, déplacements).',
  next(state, data, rng) {
    if (state.phase === 'recruit') {
      const offer = state.offer ?? [];
      const pick = rng.int(offer.length + 1);
      if (pick === offer.length) return { type: 'skip' };
      return recruit(state, data, pick, () => rng.int(state.team.length));
    }
    // Une fois sur quatre, un déplacement légal au hasard ; sinon la vague est lancée.
    if (rng.int(4) === 0) {
      const index = rng.int(state.team.length);
      const row: Row = (state.team[index] as TeamMember).row === 'front' ? 'back' : 'front';
      if (state.team.filter((m) => m.row === row).length < data.rules.team.rowMax) return { type: 'move', index, row };
    }
    return { type: 'start' };
  },
};

const rarity: Bot = {
  name: 'rarity',
  description: 'Prend toujours la meilleure rareté ; ne touche pas au placement.',
  next: (state, data) => (state.phase === 'recruit' ? recruitByRarity(state, data) : { type: 'start' }),
};

const fusion: Bot = {
  name: 'fusion',
  description: 'Fusionne dès que possible, sinon meilleure rareté.',
  next(state, data) {
    if (state.phase !== 'recruit') return { type: 'start' };
    const dup = bestOffer(state, (slug) =>
      state.team.some((m) => m.slug === slug) ? RARITY_RANK[characterOf(slug, data).rarity] : null,
    );
    return dup >= 0 ? { type: 'recruit', offer: dup } : recruitByRarity(state, data);
  },
};

const synergy: Bot = {
  name: 'synergy',
  description: 'Vise la faction la plus représentée de son équipe et la complète.',
  next(state, data) {
    if (state.phase !== 'recruit') return { type: 'start' };
    const synergies = teamSynergies(state.team, data);
    const target = synergies.reduce((best, s) => (s.count > best.count ? s : best), synergies[0] as (typeof synergies)[0]).faction;
    const inFaction = bestOffer(state, (slug) =>
      characterOf(slug, data).faction === target ? rarityScore(state, data)(slug) : null,
    );
    if (inFaction >= 0) {
      // Équipe pleine : sort le membre le plus faible qui n'est pas de la faction visée.
      return recruit(state, data, inFaction, () =>
        weakest(state.team, data, (m) => characterOf(m.slug, data).faction === target),
      );
    }
    // Rien de la faction : complète l'équipe tant qu'il reste de la place, sinon passe.
    return state.team.length < data.rules.team.max ? recruitByRarity(state, data) : { type: 'skip' };
  },
};

const frontline: Bot = {
  name: 'frontline',
  description: 'Privilégie les persos de mêlée et remplit la ligne avant avec les plus résistants.',
  next(state, data) {
    if (state.phase === 'recruit') {
      const offer = bestOffer(state, (slug) => {
        const c = characterOf(slug, data);
        return (isMelee(c, data) ? 1000 : 0) + c.hp;
      });
      if (offer < 0) return { type: 'skip' };
      const slug = (state.offer as string[])[offer] as string;
      const melee = isMelee(characterOf(slug, data), data);
      return recruit(state, data, offer, () =>
        // Ne remplace qu'un perso à distance par un perso de mêlée.
        melee ? weakest(state.team, data, (m) => isMelee(characterOf(m.slug, data), data)) : -1,
      );
    }
    // Placement : les persos de mêlée à l'arrière passent devant s'il reste de la place.
    const frontCount = state.team.filter((m) => m.row === 'front').length;
    if (frontCount < data.rules.team.rowMax) {
      const index = state.team.findIndex((m) => m.row === 'back' && isMelee(characterOf(m.slug, data), data));
      if (index >= 0) return { type: 'move', index, row: 'front' };
    }
    return { type: 'start' };
  },
};

/** Issue de la prochaine vague si on joue `choices` puis qu'on lance : (victoire, PV restants en ‰). */
function outlook(state: RunState, data: GameData, choices: Choice[]): number {
  let current = state;
  for (const choice of [...choices, { type: 'start' } as const]) {
    const result = applyChoice(current, choice, data);
    if (!result.ok) return -1;
    current = result.state;
  }
  if (current.phase === 'over') return 0;
  return 1_000_000 + (current.hpPermilleSum - state.hpPermilleSum);
}

const lookahead: Bot = {
  name: 'lookahead',
  description:
    'Joueur appliqué : essaie chaque recrue (et chaque remplacement) en simulant la vague suivante, garde la meilleure issue ; à issue égale, préfère fusion et rareté.',
  next(state, data) {
    if (state.phase !== 'recruit') return { type: 'start' };
    const offer = state.offer ?? [];
    const candidates: { choice: Choice; bias: number }[] = [{ choice: { type: 'skip' }, bias: 0 }];
    offer.forEach((slug, i) => {
      const bias = 1 + rarityScore(state, data)(slug);
      if (state.team.some((m) => m.slug === slug) || state.team.length < data.rules.team.max) {
        candidates.push({ choice: { type: 'recruit', offer: i }, bias });
      } else {
        state.team.forEach((_, replace) => candidates.push({ choice: { type: 'recruit', offer: i, replace }, bias }));
      }
    });
    let best = candidates[0] as (typeof candidates)[0];
    let bestScore = -Infinity;
    for (const candidate of candidates) {
      // La note de la vague suivante prime ; le biais (fusion, rareté) départage et pèse un peu.
      const score = outlook(state, data, [candidate.choice]) + candidate.bias * 40;
      if (score > bestScore) {
        best = candidate;
        bestScore = score;
      }
    }
    return best.choice;
  },
};

export const BOTS: readonly Bot[] = [random, rarity, fusion, synergy, frontline, lookahead];

export const botByName = (name: string): Bot | undefined => BOTS.find((b) => b.name === name);
