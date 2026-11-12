import type { Archetype, Character, Enemy, GameData, Rarity, Skill, SkillTarget, SynergyBonus } from '@jolly-rogue/game-data';
import names from 'virtual:canon-names';
import gameJson from '../../../data/exports/game.json';

/** Données de jeu validées au build de `packages/game-data` (data/exports/game.json). */
export const gameData = gameJson as unknown as GameData;

export const FAN_GAME_NOTICE = 'Fan game non officiel, non commercial, non affilié aux ayants droit.';

export const esc = (text: string | number): string =>
  String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);

const characters = new Map(gameData.characters.map((c) => [c.slug, c]));
const enemies = new Map(gameData.enemies.map((e) => [e.id, e]));
const skills = new Map(gameData.skills.map((s) => [s.id, s]));

export const characterOf = (slug: string): Character => {
  const c = characters.get(slug);
  if (!c) throw new Error(`perso inconnu : ${slug}`);
  return c;
};
export const enemyOf = (id: string): Enemy => {
  const e = enemies.get(id);
  if (!e) throw new Error(`ennemi inconnu : ${id}`);
  return e;
};
export const skillOf = (id: string): Skill => {
  const s = skills.get(id);
  if (!s) throw new Error(`compétence inconnue : ${id}`);
  return s;
};

/** Noms affichés : résolus depuis canon.json pour les persos et les équipages. */
export const characterName = (slug: string): string => names.characters[slug] ?? slug;
export const factionName = (slug: string): string => names.crews[slug] ?? slug;
export const enemyName = (id: string): string => {
  const e = enemyOf(id);
  return e.canonSlug ? characterName(e.canonSlug) : (e.name ?? id);
};
export const canonSources = names.sources;

export const RARITY_LABEL: Record<Rarity, string> = { commun: 'Commun', rare: 'Rare', legendaire: 'Légendaire' };
export const ARCHETYPE_LABEL: Record<Archetype, string> = { sabre: 'Sabre', poing: 'Poing', tir: 'Tir', soutien: 'Soutien' };
export const ARCHETYPE_HINT: Record<Archetype, string> = {
  sabre: 'Mêlée : frappe l\'ennemi le plus faible de la ligne accessible. Moitié de dégâts depuis l\'arrière.',
  poing: 'Mêlée : frappe le premier ennemi de la ligne accessible. Moitié de dégâts depuis l\'arrière.',
  tir: 'Distance : vise la ligne arrière ennemie, le plus faible d\'abord.',
  soutien: 'Distance : frappe le premier ennemi de la ligne accessible.',
};

/** Couleur et motif par faction (le motif double la couleur pour le daltonisme). */
export const FACTION_STYLE: Record<string, { color: string; mark: string }> = {
  'mugiwara-no-ichimi': { color: '#b8323c', mark: '✦' },
  kaigun: { color: '#24689a', mark: '▲' },
  'shirohige-kaizokudan': { color: '#b07a12', mark: '◆' },
  'donkihote-kaizokudan': { color: '#7d4a9c', mark: '●' },
};
export const factionStyle = (slug: string | null): { color: string; mark: string } =>
  (slug !== null ? FACTION_STYLE[slug] : undefined) ?? { color: '#4a4a4a', mark: '✕' };

/** Icônes d'archétype dessinées pour le jeu (SVG maison, trait unique). */
const ICON_PATHS: Record<Archetype, string> = {
  sabre: '<path d="M5 19l2 0 0-2 9-11 3-1-1 3-11 9z"/><path d="M4 16l4 4"/>',
  poing: '<path d="M6 10V7.5a1.5 1.5 0 013 0V10m0-3.5a1.5 1.5 0 013 0V10m0-2.5a1.5 1.5 0 013 0V11m0-1a1.5 1.5 0 013 0v4a6 6 0 01-6 6h-1a5 5 0 01-5-5v-3a2 2 0 012-2z"/>',
  tir: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
  soutien: '<path d="M9 4h6v5h5v6h-5v5H9v-5H4V9h5z"/>',
};
export const archetypeIcon = (archetype: Archetype): string =>
  `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[archetype]}</svg>`;

const TARGET_TEXT: Record<SkillTarget, string> = {
  self: 'soi',
  target: 'la cible',
  target_row: 'la ligne de la cible',
  all_enemies: 'tous les ennemis',
  random_enemy: 'un ennemi au hasard',
  lowest_hp_ally: 'l\'allié le plus blessé',
  all_allies: 'tous les alliés',
};

/** Texte d'une compétence, généré depuis ses données (catalogue fermé). */
export function skillText(skill: Skill): string {
  const trigger =
    skill.trigger.type === 'combat_start'
      ? 'Début de combat'
      : skill.trigger.type === 'every_n_actions'
        ? `Toutes les ${skill.trigger.n} actions`
        : skill.trigger.type === 'on_kill'
          ? 'À chaque élimination'
          : 'À sa mort';
  const effects = skill.effects.map((e) => {
    const target = TARGET_TEXT[e.target];
    switch (e.type) {
      case 'damage':
        return `dégâts ${e.pct} % de l'ATK sur ${target}`;
      case 'heal':
        return `soin ${e.pct} % de l'ATK pour ${target}`;
      case 'shield':
        return `bouclier ${e.pct} % de ses PV max pour ${target}`;
      case 'stun':
        return `étourdit ${target} ${e.turns} tour${e.turns > 1 ? 's' : ''}`;
      case 'buff_atk':
        return `ATK +${e.pct} % pour ${target}`;
    }
  });
  return `${trigger} : ${effects.join(', puis ')}.`;
}

export const bonusText = (bonuses: readonly SynergyBonus[]): string =>
  bonuses
    .map((b) => (b.stat === 'hp_pct' ? `PV +${b.value} %` : b.stat === 'atk_pct' ? `ATK +${b.value} %` : `VIT +${b.value}`))
    .join(', ');
