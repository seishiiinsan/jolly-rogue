import type { Archetype } from '@jolly-rogue/game-data';
import { esc } from './content.js';

/**
 * Portraits procéduraux ORIGINAUX : une silhouette de pirate générique par archétype, teintée par
 * la faction, avec le monogramme du nom. Ce ne sont pas des représentations des personnages de
 * l'œuvre (aucun trait distinctif repris) : le cadrage interdit tout visuel officiel ou approchant.
 */
const hash = (text: string): number => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
};

/** Couvre-chef générique par archétype (forme de jeu, pas de lore). */
const HEADGEAR: Record<Archetype, string> = {
  // Bandana noué.
  sabre: '<path d="M43 33q17-12 34 0l-1 6q-16-8-32 0z"/><path d="M76 35l10 4-8 5z"/>',
  // Tête nue, col relevé.
  poing: '<path d="M38 62l10-10 4 10zM82 62l-10-10-4 10z"/>',
  // Tricorne.
  tir: '<path d="M34 34q26-20 52 0q-26-7-52 0z"/><path d="M46 30q14-14 28 0z"/>',
  // Capuche.
  soutien: '<path d="M40 44q-2-26 20-28q22 2 20 28q-4-18-20-18t-20 18z"/>',
};

export const monogram = (name: string): string =>
  name
    .split(/[\s/.-]+/)
    .filter((w) => w.length > 0)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

export interface PortraitOptions {
  /** Clé stable (slug ou id) : fixe le motif de fond. */
  key: string;
  name: string;
  archetype: Archetype;
  color: string;
  /** Carte non découverte dans la collection : silhouette seule. */
  locked?: boolean;
  boss?: boolean;
}

export function portrait(o: PortraitOptions): string {
  const h = hash(o.key);
  const rays = Array.from({ length: 9 }, (_, i) => {
    const angle = ((h >>> (i * 3)) % 40) + i * 40;
    const rad = (angle * Math.PI) / 180;
    return `<path d="M60 46L${(60 + 120 * Math.cos(rad)).toFixed(1)} ${(46 + 120 * Math.sin(rad)).toFixed(1)}" />`;
  }).join('');
  const head = 15 + (h % 4);
  const shoulders = 50 + ((h >>> 8) % 8);
  const scale = o.boss ? 'transform="translate(-9 -8) scale(1.15)"' : '';
  return `<svg class="portrait${o.locked ? ' locked' : ''}" viewBox="0 0 120 90" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="120" height="90" fill="${o.locked ? '#5b5348' : o.color}"/>
    <g stroke="#fff" stroke-opacity="0.16" stroke-width="7">${rays}</g>
    <circle cx="60" cy="46" r="34" fill="#fff" fill-opacity="0.14"/>
    <g fill="#1d1712" fill-opacity="${o.locked ? 0.9 : 0.82}" ${scale}>
      <circle cx="60" cy="40" r="${head}"/>
      <path d="M14 92Q60 ${shoulders} 106 92z"/>
      ${HEADGEAR[o.archetype]}
    </g>
    ${o.locked ? '<text x="60" y="52" text-anchor="middle" font-size="26" font-weight="700" fill="#fff" fill-opacity="0.85">?</text>' : `<text x="103" y="66" text-anchor="end" font-size="18" font-weight="700" fill="#fff" stroke="#1d1712" stroke-width="0.6">${esc(monogram(o.name))}</text>`}
  </svg>`;
}
