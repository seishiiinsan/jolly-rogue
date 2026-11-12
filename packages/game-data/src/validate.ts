import type { CanonExport } from '@jolly-rogue/db';
import type { z } from 'zod';
import {
  GAME_DATA_SCHEMA_VERSION,
  type GameData,
  type Skill,
  characterSchema,
  enemySchema,
  gameDataSchema,
  rulesSchema,
  skillSchema,
  synergySchema,
  wavesSchema,
} from './schema.js';

/** Contenu brut des fichiers YAML de `game/`, avant validation. */
export interface RawGameFiles {
  rules: unknown;
  characters: unknown;
  skills: unknown;
  enemies: unknown;
  waves: unknown;
  synergies: unknown;
}

export interface ValidationIssue {
  /** Fichier concerné, ex. `characters.yaml`. */
  file: string;
  /** Entrée concernée, ex. `roronoa-zoro` ou `[3]`. */
  entry: string;
  /** Ce qui ne va pas et quoi corriger. */
  message: string;
}

export type ValidationResult = { ok: true; data: GameData } | { ok: false; issues: ValidationIssue[] };

export const formatIssue = (issue: ValidationIssue): string =>
  `${issue.file} › ${issue.entry} : ${issue.message}`;

const FILES = {
  rules: 'rules.yaml',
  characters: 'characters.yaml',
  skills: 'skills.yaml',
  enemies: 'enemies.yaml',
  waves: 'waves.yaml',
  synergies: 'synergies.yaml',
} as const;

/** Déclencheurs sans cible d'attaque : `target` et `target_row` n'y ont pas de sens. */
const TRIGGERS_WITHOUT_TARGET = new Set<Skill['trigger']['type']>(['combat_start', 'on_kill', 'on_death']);

function parseList<S extends z.ZodType>(
  schema: S,
  raw: unknown,
  file: string,
  keyOf: (entry: unknown, index: number) => string,
  issues: ValidationIssue[],
): z.infer<S>[] {
  if (!Array.isArray(raw)) {
    issues.push({ file, entry: '(racine)', message: 'une liste est attendue' });
    return [];
  }
  const out: z.infer<S>[] = [];
  raw.forEach((entry: unknown, index) => {
    const parsed = schema.safeParse(entry);
    if (parsed.success) out.push(parsed.data);
    else {
      for (const issue of parsed.error.issues) {
        const path = issue.path.length > 0 ? `${issue.path.join('.')} : ` : '';
        issues.push({ file, entry: keyOf(entry, index), message: `${path}${issue.message}` });
      }
    }
  });
  return out;
}

function parseObject<S extends z.ZodType>(
  schema: S,
  raw: unknown,
  file: string,
  issues: ValidationIssue[],
): z.infer<S> | undefined {
  const parsed = schema.safeParse(raw);
  if (parsed.success) return parsed.data;
  for (const issue of parsed.error.issues) {
    issues.push({ file, entry: issue.path.join('.') || '(racine)', message: issue.message });
  }
  return undefined;
}

const keyBy =
  (field: string) =>
  (entry: unknown, index: number): string => {
    const value = typeof entry === 'object' && entry !== null ? (entry as Record<string, unknown>)[field] : undefined;
    return typeof value === 'string' ? value : `[${index}]`;
  };

function duplicates(keys: string[]): string[] {
  const seen = new Set<string>();
  const dup = new Set<string>();
  for (const key of keys) (seen.has(key) ? dup : seen).add(key);
  return [...dup];
}

/**
 * Valide les données de jeu : schémas Zod, slugs présents dans le canon, références internes,
 * doublons et budgets de stats. Ne s'arrête pas à la première erreur : tout est listé.
 */
export function validateGameData(raw: RawGameFiles, canon: CanonExport): ValidationResult {
  const issues: ValidationIssue[] = [];

  const rules = parseObject(rulesSchema, raw.rules, FILES.rules, issues);
  const waves = parseObject(wavesSchema, raw.waves, FILES.waves, issues);
  const characters = parseList(characterSchema, raw.characters, FILES.characters, keyBy('slug'), issues);
  const skills = parseList(skillSchema, raw.skills, FILES.skills, keyBy('id'), issues);
  const enemies = parseList(enemySchema, raw.enemies, FILES.enemies, keyBy('id'), issues);
  const synergies = parseList(synergySchema, raw.synergies, FILES.synergies, keyBy('faction'), issues);

  const canonCharacters = new Map(canon.characters.map((c) => [c.slug, c]));
  const canonCrews = new Set(canon.crews.map((c) => c.slug));
  const skillIds = new Set(skills.map((s) => s.id));
  const enemyById = new Map(enemies.map((e) => [e.id, e]));

  // Doublons.
  for (const slug of duplicates(characters.map((c) => c.slug))) {
    issues.push({ file: FILES.characters, entry: slug, message: 'slug en double : garde une seule entrée' });
  }
  for (const id of duplicates(skills.map((s) => s.id))) {
    issues.push({ file: FILES.skills, entry: id, message: 'id en double : garde une seule entrée' });
  }
  for (const id of duplicates(enemies.map((e) => e.id))) {
    issues.push({ file: FILES.enemies, entry: id, message: 'id en double : garde une seule entrée' });
  }
  for (const faction of duplicates(synergies.map((s) => s.faction))) {
    issues.push({ file: FILES.synergies, entry: faction, message: 'faction en double : garde une seule entrée' });
  }

  // Persos : canon, compétence, budget.
  for (const c of characters) {
    const canonCharacter = canonCharacters.get(c.slug);
    if (!canonCharacter) {
      issues.push({
        file: FILES.characters,
        entry: c.slug,
        message: `slug absent de canon.json (characters) : corrige le slug ou ajoute le perso au canon via le pipeline`,
      });
    }
    if (!canonCrews.has(c.faction)) {
      issues.push({
        file: FILES.characters,
        entry: c.slug,
        message: `faction « ${c.faction} » absente de canon.json (crews) : utilise un slug d'équipage existant`,
      });
    } else if (canonCharacter && !canonCharacter.affiliations.some((a) => a.crew === c.faction)) {
      issues.push({
        file: FILES.characters,
        entry: c.slug,
        message: `le canon ne rattache pas ce perso à « ${c.faction} » : choisis une de ses affiliations (${
          canonCharacter.affiliations.map((a) => a.crew).join(', ') || 'aucune'
        })`,
      });
    }
    if (!skillIds.has(c.skill)) {
      issues.push({
        file: FILES.characters,
        entry: c.slug,
        message: `compétence « ${c.skill} » introuvable dans ${FILES.skills}`,
      });
    }
    if (rules) {
      const cost = c.hp + rules.budget.atk * c.atk + rules.budget.spd * c.spd;
      const budget = rules.budget[c.rarity];
      if (Math.abs(cost - budget) > rules.budget.tolerance) {
        issues.push({
          file: FILES.characters,
          entry: c.slug,
          message: `coût ${cost} (PV + ${rules.budget.atk}×ATK + ${rules.budget.spd}×VIT) hors du budget ${c.rarity} : ${budget} ± ${rules.budget.tolerance}`,
        });
      }
    }
  }

  // Compétences : cibles compatibles avec le déclencheur.
  for (const s of skills) {
    if (!TRIGGERS_WITHOUT_TARGET.has(s.trigger.type)) continue;
    for (const effect of s.effects) {
      if (effect.target === 'target' || effect.target === 'target_row') {
        issues.push({
          file: FILES.skills,
          entry: s.id,
          message: `la cible « ${effect.target} » n'existe pas pour le déclencheur « ${s.trigger.type} » : utilise self, all_enemies, random_enemy, lowest_hp_ally ou all_allies`,
        });
      }
    }
  }

  // Ennemis : compétence, boss ↔ canon, sbires.
  for (const e of enemies) {
    if (e.skill !== undefined && !skillIds.has(e.skill)) {
      issues.push({ file: FILES.enemies, entry: e.id, message: `compétence « ${e.skill} » introuvable dans ${FILES.skills}` });
    }
    if (e.canonSlug !== undefined && !canonCharacters.has(e.canonSlug)) {
      issues.push({ file: FILES.enemies, entry: e.id, message: `canonSlug « ${e.canonSlug} » absent de canon.json (characters)` });
    }
    if (e.boss === true) {
      if (e.canonSlug === undefined) {
        issues.push({ file: FILES.enemies, entry: e.id, message: 'un boss doit porter un canonSlug' });
      }
      if (e.name !== undefined) {
        issues.push({ file: FILES.enemies, entry: e.id, message: 'le nom d\'un boss vient du canon : retire « name »' });
      }
    } else {
      if (e.name === undefined) {
        issues.push({ file: FILES.enemies, entry: e.id, message: 'un sbire doit avoir un « name »' });
      }
      if (e.minWave === undefined) {
        issues.push({ file: FILES.enemies, entry: e.id, message: 'un sbire doit avoir un « minWave »' });
      }
    }
  }
  const minions = enemies.filter((e) => e.boss !== true);
  if (enemies.length > 0 && !minions.some((e) => e.minWave === 1 && e.row === 'front')) {
    issues.push({
      file: FILES.enemies,
      entry: '(liste)',
      message: 'il faut au moins un sbire de ligne avant disponible dès la vague 1 (minWave: 1, row: front)',
    });
  }

  // Vagues : boss référencés.
  if (waves) {
    for (const id of waves.boss.order) {
      const enemy = enemyById.get(id);
      if (!enemy) issues.push({ file: FILES.waves, entry: 'boss.order', message: `ennemi « ${id} » introuvable dans ${FILES.enemies}` });
      else if (enemy.boss !== true) issues.push({ file: FILES.waves, entry: 'boss.order', message: `« ${id} » n'est pas un boss (boss: true)` });
    }
    if (rules && waves.count.max > 2 * rules.team.rowMax) {
      issues.push({ file: FILES.waves, entry: 'count.max', message: `au plus ${2 * rules.team.rowMax} ennemis (2 lignes de ${rules.team.rowMax})` });
    }
    if (rules && waves.boss.escorts.max + 1 > 2 * rules.team.rowMax) {
      issues.push({ file: FILES.waves, entry: 'boss.escorts.max', message: `boss + escorte : au plus ${2 * rules.team.rowMax} ennemis` });
    }
  }

  // Synergies : faction du canon, utilisée, paliers croissants et atteignables.
  for (const s of synergies) {
    if (!canonCrews.has(s.faction)) {
      issues.push({ file: FILES.synergies, entry: s.faction, message: 'faction absente de canon.json (crews)' });
    }
    const members = characters.filter((c) => c.faction === s.faction).length;
    s.tiers.forEach((tier, i) => {
      const previous = s.tiers[i - 1];
      if (previous && tier.count <= previous.count) {
        issues.push({ file: FILES.synergies, entry: s.faction, message: 'les paliers doivent être en ordre croissant de « count »' });
      }
      if (tier.count > members) {
        issues.push({
          file: FILES.synergies,
          entry: s.faction,
          message: `palier ${tier.count} inatteignable : la faction n'a que ${members} perso(s) dans ${FILES.characters}`,
        });
      }
    });
  }

  // Règles : cohérences internes.
  if (rules) {
    if (rules.fusion.levelMultiplierPct.length !== rules.fusion.maxLevel) {
      issues.push({ file: FILES.rules, entry: 'fusion.levelMultiplierPct', message: `il faut exactement ${rules.fusion.maxLevel} valeurs (une par niveau)` });
    }
    if (rules.team.max > 2 * rules.team.rowMax) {
      issues.push({ file: FILES.rules, entry: 'team.max', message: 'l\'équipe ne tient pas sur deux lignes de rowMax places' });
    }
    if (rules.offer.legendaire.cap + rules.offer.rare.cap > 100) {
      issues.push({ file: FILES.rules, entry: 'offer', message: 'la somme des plafonds légendaire + rare dépasse 100 %' });
    }
    const starters = characters.filter((c) => c.rarity === rules.team.startingRarity).length;
    if (characters.length > 0 && starters < rules.team.startingCount) {
      issues.push({ file: FILES.rules, entry: 'team.startingCount', message: `seulement ${starters} perso(s) de rareté ${rules.team.startingRarity}` });
    }
    for (const archetype of ['sabre', 'poing', 'tir', 'soutien'] as const) {
      if (!rules.archetypes[archetype]) {
        issues.push({ file: FILES.rules, entry: 'archetypes', message: `archétype « ${archetype} » non défini` });
      }
    }
  }

  if (issues.length > 0 || !rules || !waves) return { ok: false, issues };

  // Tri stable : diffs Git lisibles, deux builds = fichier identique.
  const byKey = <T>(key: (item: T) => string) => (a: T, b: T) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0);
  const data: GameData = {
    schemaVersion: GAME_DATA_SCHEMA_VERSION,
    rules,
    characters: [...characters].sort(byKey((c) => c.slug)),
    skills: [...skills].sort(byKey((s) => s.id)),
    enemies: [...enemies].sort(byKey((e) => e.id)),
    waves,
    synergies: [...synergies].sort(byKey((s) => s.faction)),
  };
  // Garde-fou : l'objet assemblé respecte bien le schéma de l'export.
  return { ok: true, data: gameDataSchema.parse(data) };
}
