/**
 * Normaliseurs des valeurs texte d'api-onepiece.com. Chaque fonction renvoie :
 * - `null` pour une valeur absente (null, "", "-", "?") ;
 * - la valeur normalisée si le format est reconnu ;
 * - `undefined` si le format est inconnu (le schéma Zod rejette alors la ligne).
 */

const EMPTY = new Set(['', '-', '?', '"']);

export function isEmptyValue(value: string | null | undefined): value is null | undefined {
  return value === null || value === undefined || EMPTY.has(value.trim());
}

/** Supprime espaces (y compris insécables), points et virgules utilisés comme séparateurs de milliers. */
const stripThousands = (s: string): string => s.replace(/[\s.,\u00A0\u202F]/g, '');

/** « 3.000.000.000 » → 3000000000. */
export function parseBounty(value: string | null | undefined): number | null | undefined {
  if (isEmptyValue(value)) return null;
  const digits = stripThousands(value);
  if (!/^\d+$/.test(digits)) return undefined;
  const amount = Number(digits);
  return Number.isSafeInteger(amount) ? amount : undefined;
}

/** « 19 ans », « 1 000 ans », « 65 » → nombre d'années. */
export function parseAge(value: string | null | undefined): number | null | undefined {
  if (isEmptyValue(value)) return null;
  const match = /^([\d\s.\u00A0\u202F]+?)\s*(ans?|years?(?: old)?)?$/i.exec(value.trim());
  if (!match?.[1]) return undefined;
  const digits = stripThousands(match[1]);
  return /^\d+$/.test(digits) ? Number(digits) : undefined;
}

/** « 174cm », « 1 187cm », « 2,5m », « 35km » → centimètres. */
export function parseHeightCm(value: string | null | undefined): number | null | undefined {
  if (isEmptyValue(value)) return null;
  const trimmed = value.trim();
  const cm = /^([\d\s\u00A0\u202F]+)\s*cm$/i.exec(trimmed);
  if (cm?.[1]) {
    const n = Number(stripThousands(cm[1]));
    return n > 0 ? n : undefined;
  }
  const metric = /^(\d+(?:[.,]\d+)?)\s*(k?m)$/i.exec(trimmed);
  if (metric?.[1] && metric[2]) {
    const factor = metric[2].toLowerCase() === 'km' ? 100_000 : 100;
    const n = Math.round(Number(metric[1].replace(',', '.')) * factor);
    return n > 0 && n <= 2_147_483_647 ? n : undefined;
  }
  return undefined;
}

export type VitalStatus = 'alive' | 'deceased' | 'unknown';

const STATUS: Record<string, VitalStatus> = {
  alive: 'alive',
  living: 'alive',
  vivant: 'alive',
  vivante: 'alive',
  dead: 'deceased',
  deceased: 'deceased',
  mort: 'deceased',
  morte: 'deceased',
  'décédé': 'deceased',
  'décédée': 'deceased',
  unknown: 'unknown',
  inconnu: 'unknown',
  inconnue: 'unknown',
};

/** Statut vital EN ou FR ; absent → `unknown`. */
export function parseVitalStatus(value: string | null | undefined): VitalStatus | undefined {
  if (isEmptyValue(value)) return 'unknown';
  return STATUS[value.trim().toLowerCase()];
}

export type FruitType = 'paramecia' | 'zoan' | 'logia';
export interface FruitClassification {
  /** `null` pour un clone : le type est celui du fruit original, résolu au chargement. */
  type: FruitType | null;
  subtype: 'ancient' | 'mythical' | 'smile' | 'clone' | null;
}

const FRUIT_TYPES: Record<string, FruitClassification> = {
  paramecia: { type: 'paramecia', subtype: null },
  logia: { type: 'logia', subtype: null },
  zoan: { type: 'zoan', subtype: null },
  'zoan antique': { type: 'zoan', subtype: 'ancient' },
  'ancient zoan': { type: 'zoan', subtype: 'ancient' },
  'zoan mythique': { type: 'zoan', subtype: 'mythical' },
  'mythical zoan': { type: 'zoan', subtype: 'mythical' },
  // Les SMILE sont des Zoan artificiels.
  smile: { type: 'zoan', subtype: 'smile' },
  clone: { type: null, subtype: 'clone' },
};

export function parseFruitType(value: string | null | undefined): FruitClassification | undefined {
  if (isEmptyValue(value)) return undefined;
  return FRUIT_TYPES[value.trim().toLowerCase()];
}

/** « 1 à 100 » → [1, 100] ; « 802 à ? » → [802, null] ; « - » → [null, null]. */
export function parseChapterRange(
  value: string | null | undefined,
): { start: number | null; end: number | null } | undefined {
  if (isEmptyValue(value)) return { start: null, end: null };
  const match = /^(\d+)\s*(?:à|a|to|-)\s*(\d+|\?)?$/i.exec(value.trim());
  if (!match?.[1]) return undefined;
  const start = Number(match[1]);
  const end = match[2] === undefined || match[2] === '?' ? null : Number(match[2]);
  if (end !== null && end < start) return undefined;
  return { start, end };
}

/** Texte nettoyé ; vide → null. */
export function cleanText(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.replace(/\s+/g, ' ').trim();
  return trimmed === '' ? null : trimmed;
}
