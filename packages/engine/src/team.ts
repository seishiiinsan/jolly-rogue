import type { GameData, Row, SynergyBonus } from '@jolly-rogue/game-data';
import type { CombatantInput } from './combat.js';
import { indexOf, mustGet } from './data.js';

/** Un membre de l'équipe du joueur. L'ordre du tableau est l'ordre des emplacements. */
export interface TeamMember {
  slug: string;
  /** Niveau de fusion, de 1 à `rules.fusion.maxLevel`. */
  level: number;
  row: Row;
}

export interface ActiveSynergy {
  faction: string;
  /** Nombre de membres de la faction dans l'équipe. */
  count: number;
  /** Seuil du palier actif, ou null si aucun palier n'est atteint. */
  activeTier: number | null;
  /** Seuil du palier suivant, ou null si le dernier est atteint. */
  nextTier: number | null;
  bonuses: SynergyBonus[];
}

/** Synergies de l'équipe : une entrée par faction présente, triée par slug de faction. */
export function teamSynergies(team: readonly TeamMember[], data: GameData): ActiveSynergy[] {
  const index = indexOf(data);
  const counts = new Map<string, number>();
  for (const member of team) {
    const faction = mustGet(index.characters, member.slug, 'perso').faction;
    counts.set(faction, (counts.get(faction) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([faction, count]) => {
      const tiers = index.synergies.get(faction)?.tiers ?? [];
      const active = tiers.filter((t) => t.count <= count).at(-1);
      const next = tiers.find((t) => t.count > count);
      return {
        faction,
        count,
        activeTier: active?.count ?? null,
        nextTier: next?.count ?? null,
        bonuses: active?.bonuses ?? [],
      };
    });
}

/**
 * Stats finales de l'équipe pour le combat (docs/regles-j1.md §5 et §8) :
 *   1. stat de base × multiplicateur de niveau (PV et ATK), arrondi à l'entier inférieur ;
 *   2. × (100 + bonus de synergie en %), arrondi à l'entier inférieur ; VIT + bonus fixe.
 */
export function teamCombatants(team: readonly TeamMember[], data: GameData): CombatantInput[] {
  const index = indexOf(data);
  const synergies = new Map(teamSynergies(team, data).map((s) => [s.faction, s.bonuses]));
  return team.map((member) => {
    const character = mustGet(index.characters, member.slug, 'perso');
    const levelPct = data.rules.fusion.levelMultiplierPct[member.level - 1];
    if (levelPct === undefined) throw new Error(`niveau invalide pour ${member.slug} : ${member.level}`);
    let hpPct = 0;
    let atkPct = 0;
    let spdFlat = 0;
    for (const bonus of synergies.get(character.faction) ?? []) {
      if (bonus.stat === 'hp_pct') hpPct += bonus.value;
      else if (bonus.stat === 'atk_pct') atkPct += bonus.value;
      else spdFlat += bonus.value;
    }
    return {
      ref: character.slug,
      kind: 'character',
      level: member.level,
      row: member.row,
      archetype: character.archetype,
      hp: Math.floor((Math.floor((character.hp * levelPct) / 100) * (100 + hpPct)) / 100),
      atk: Math.floor((Math.floor((character.atk * levelPct) / 100) * (100 + atkPct)) / 100),
      spd: character.spd + spdFlat,
      skill: mustGet(index.skills, character.skill, 'compétence'),
    };
  });
}
