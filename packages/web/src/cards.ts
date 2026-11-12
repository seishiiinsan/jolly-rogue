import type { Archetype, Rarity } from '@jolly-rogue/game-data';
import { portrait } from './portrait.js';
import {
  ARCHETYPE_HINT,
  ARCHETYPE_LABEL,
  RARITY_LABEL,
  archetypeIcon,
  characterName,
  characterOf,
  enemyName,
  enemyOf,
  esc,
  factionName,
  factionStyle,
  skillOf,
  skillText,
} from './content.js';

export interface CardModel {
  /** Slug du perso ou id de l'ennemi : clé stable du portrait. */
  key: string;
  name: string;
  /** Faction (slug du canon) ou null pour un ennemi. */
  faction: string | null;
  rarity: Rarity | 'ennemi' | 'boss';
  archetype: Archetype;
  level: number;
  hp: number;
  atk: number;
  spd: number;
  skill: string | null;
}

export function characterCard(slug: string, level: number, stats: { hp: number; atk: number; spd: number }): CardModel {
  const c = characterOf(slug);
  return { key: slug, name: characterName(slug), faction: c.faction, rarity: c.rarity, archetype: c.archetype, level, ...stats, skill: c.skill };
}

export function enemyCard(id: string, stats: { hp: number; atk: number; spd: number }): CardModel {
  const e = enemyOf(id);
  return { key: id, name: enemyName(id), faction: null, rarity: e.boss ? 'boss' : 'ennemi', archetype: e.archetype, level: 1, ...stats, skill: e.skill ?? null };
}

const RARITY_TEXT: Record<CardModel['rarity'], string> = { ...RARITY_LABEL, ennemi: 'Ennemi', boss: 'Boss' };

/** Contenu d'une carte typographique : aucun visuel officiel, uniquement du texte et des formes maison. */
export function cardBody(card: CardModel, options: { compact?: boolean; badge?: string; locked?: boolean } = {}): string {
  if (options.locked) {
    return `
      <span class="card-art">${portrait({ key: card.key, name: card.name, archetype: card.archetype, color: '#5b5348', locked: true })}</span>
      <span class="card-name">???</span>
      <span class="card-rarity">${RARITY_TEXT[card.rarity]} · non découverte</span>
      ${options.badge ? `<span class="card-badge">${esc(options.badge)}</span>` : ''}`;
  }
  const style = factionStyle(card.faction);
  const skill = card.skill ? skillOf(card.skill) : null;
  const stars = card.level > 1 ? `<span class="card-level" title="Niveau de fusion ${card.level}">${'★'.repeat(card.level)}</span>` : '';
  return `
    <span class="card-top" style="--faction:${style.color}">
      <span class="card-mark" aria-hidden="true">${style.mark}</span>
      <span class="card-faction">${esc(card.faction ? factionName(card.faction) : RARITY_TEXT[card.rarity])}</span>
      <span class="card-archetype" title="${esc(ARCHETYPE_HINT[card.archetype])}">${archetypeIcon(card.archetype)}<span class="sr-only">${ARCHETYPE_LABEL[card.archetype]}</span></span>
    </span>
    <span class="card-art">${portrait({ key: card.key, name: card.name, archetype: card.archetype, color: style.color, boss: card.rarity === 'boss' })}</span>
    <span class="card-name">${esc(card.name)} ${stars}</span>
    <span class="card-rarity">${RARITY_TEXT[card.rarity]} · ${ARCHETYPE_LABEL[card.archetype]}${card.level > 1 ? ` · niv. ${card.level}` : ''}</span>
    <span class="card-stats">
      <span title="Points de vie"><b>PV</b> ${card.hp}</span>
      <span title="Attaque"><b>ATK</b> ${card.atk}</span>
      <span title="Vitesse : ordre d'action"><b>VIT</b> ${card.spd}</span>
    </span>
    ${skill && !options.compact ? `<span class="card-skill"><b>${esc(skill.name)}</b> ${esc(skillText(skill))}</span>` : ''}
    ${skill && options.compact ? `<span class="card-skill card-skill-compact" title="${esc(skillText(skill))}"><b>${esc(skill.name)}</b></span>` : ''}
    ${options.badge ? `<span class="card-badge">${esc(options.badge)}</span>` : ''}
  `;
}

export const cardClass = (card: CardModel): string => `card rarity-${card.rarity}`;
