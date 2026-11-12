import { z } from 'zod';

/**
 * Format des données de jeu (docs/regles-j1.md §14) : fichiers YAML de `game/` et export
 * `data/exports/game.json` consommé par le moteur. Tous les nombres sont des entiers.
 * Toute rupture de format incrémente `GAME_DATA_SCHEMA_VERSION`.
 */
export const GAME_DATA_SCHEMA_VERSION = 1;

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug attendu (minuscules, chiffres, tirets)');
const posInt = z.number().int().positive();
const nonNegInt = z.number().int().nonnegative();

export const RARITIES = ['commun', 'rare', 'legendaire'] as const;
export const ARCHETYPES = ['sabre', 'poing', 'tir', 'soutien'] as const;
export const ROWS = ['front', 'back'] as const;

export const raritySchema = z.enum(RARITIES);
export const archetypeSchema = z.enum(ARCHETYPES);
export const rowSchema = z.enum(ROWS);

// --- Compétences : catalogue fermé ---------------------------------------------

export const skillTargetSchema = z.enum([
  'self',
  'target',
  'target_row',
  'all_enemies',
  'random_enemy',
  'lowest_hp_ally',
  'all_allies',
]);

export const skillEffectSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('damage'), target: skillTargetSchema, pct: posInt }),
  z.strictObject({ type: z.literal('heal'), target: skillTargetSchema, pct: posInt }),
  z.strictObject({ type: z.literal('shield'), target: skillTargetSchema, pct: posInt }),
  z.strictObject({ type: z.literal('stun'), target: skillTargetSchema, turns: posInt }),
  z.strictObject({ type: z.literal('buff_atk'), target: skillTargetSchema, pct: posInt }),
]);

export const skillTriggerSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('combat_start') }),
  z.strictObject({ type: z.literal('every_n_actions'), n: posInt }),
  z.strictObject({ type: z.literal('on_kill') }),
  z.strictObject({ type: z.literal('on_death') }),
]);

export const skillSchema = z.strictObject({
  id: slug,
  /** Nom affiché, inventé pour le jeu (pas un fait de lore). */
  name: z.string().min(1),
  trigger: skillTriggerSchema,
  effects: z.array(skillEffectSchema).min(1),
});

// --- Persos, ennemis --------------------------------------------------------------

export const characterSchema = z.strictObject({
  /** Slug du perso dans canon.json. */
  slug,
  /** Slug de l'équipage (crews.slug) dans canon.json. */
  faction: slug,
  rarity: raritySchema,
  archetype: archetypeSchema,
  hp: posInt,
  atk: posInt,
  spd: posInt,
  skill: slug,
});

export const enemySchema = z.strictObject({
  id: slug,
  /** Nom affiché d'un sbire générique. Interdit pour un boss : son nom vient du canon. */
  name: z.string().min(1).optional(),
  /** Slug du perso dans canon.json (obligatoire pour un boss). */
  canonSlug: slug.optional(),
  boss: z.boolean().optional(),
  archetype: archetypeSchema,
  row: rowSchema,
  hp: posInt,
  atk: posInt,
  spd: posInt,
  /** Première vague où le sbire peut apparaître (sbires uniquement). */
  minWave: posInt.optional(),
  skill: slug.optional(),
});

// --- Vagues, synergies, règles ---------------------------------------------------

export const wavesSchema = z.strictObject({
  count: z.strictObject({ base: posInt, step: posInt, max: posInt }),
  scaling: z.strictObject({ base: posInt, linear: nonNegInt, quadratic: nonNegInt }),
  boss: z.strictObject({
    every: posInt,
    order: z.array(slug).min(1),
    escorts: z.strictObject({ base: nonNegInt, max: nonNegInt }),
  }),
});

export const synergyBonusSchema = z.strictObject({
  stat: z.enum(['hp_pct', 'atk_pct', 'spd_flat']),
  value: posInt,
});

export const synergySchema = z.strictObject({
  faction: slug,
  tiers: z
    .array(z.strictObject({ count: posInt, bonuses: z.array(synergyBonusSchema).min(1) }))
    .min(1),
});

const rarityCurveSchema = z.strictObject({ base: nonNegInt, perStep: nonNegInt, step: posInt, cap: nonNegInt });

export const rulesSchema = z.strictObject({
  team: z.strictObject({ max: posInt, rowMax: posInt, startingCount: posInt, startingRarity: raritySchema }),
  fusion: z.strictObject({ maxLevel: posInt, levelMultiplierPct: z.array(posInt).min(1) }),
  combat: z.strictObject({ roundLimit: posInt, meleeBackRowPct: posInt }),
  offer: z.strictObject({ size: posInt, legendaire: rarityCurveSchema, rare: rarityCurveSchema }),
  score: z.strictObject({ perWave: posInt, bonusCap: nonNegInt }),
  budget: z.strictObject({
    atk: posInt,
    spd: posInt,
    tolerance: nonNegInt,
    commun: posInt,
    rare: posInt,
    legendaire: posInt,
  }),
  archetypes: z.record(
    archetypeSchema,
    z.strictObject({
      range: z.enum(['melee', 'ranged']),
      targeting: z.enum(['first', 'lowest_hp', 'back_first']),
    }),
  ),
});

export const gameDataSchema = z.strictObject({
  schemaVersion: z.literal(GAME_DATA_SCHEMA_VERSION),
  rules: rulesSchema,
  characters: z.array(characterSchema),
  skills: z.array(skillSchema),
  enemies: z.array(enemySchema),
  waves: wavesSchema,
  synergies: z.array(synergySchema),
});

export type Rarity = z.infer<typeof raritySchema>;
export type Archetype = z.infer<typeof archetypeSchema>;
export type Row = z.infer<typeof rowSchema>;
export type SkillTarget = z.infer<typeof skillTargetSchema>;
export type SkillEffect = z.infer<typeof skillEffectSchema>;
export type SkillTrigger = z.infer<typeof skillTriggerSchema>;
export type Skill = z.infer<typeof skillSchema>;
export type Character = z.infer<typeof characterSchema>;
export type Enemy = z.infer<typeof enemySchema>;
export type Waves = z.infer<typeof wavesSchema>;
export type SynergyBonus = z.infer<typeof synergyBonusSchema>;
export type Synergy = z.infer<typeof synergySchema>;
export type Rules = z.infer<typeof rulesSchema>;
export type GameData = z.infer<typeof gameDataSchema>;
