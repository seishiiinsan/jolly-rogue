import {
  type RefIndex,
  citedChapter,
  cleanText,
  extractQualifiers,
  firstLinkTarget,
  isNonCanonItem,
  isTranslationVariant,
  splitItems,
} from './clean.js';
import { sameTemplateName, topLevelTemplates } from './wikitext.js';

/**
 * Normaliseurs des paramètres d'infobox Fandom. Même convention que ../normalize.ts :
 * `null` = absent, valeur = reconnu, `undefined` = format inconnu (la ligne est rejetée).
 */

const UNKNOWN_TEXT = /^(unknown|none|n\/a|\?+|-+|undetermined|unclear|unnamed)$/i;
const isBlank = (raw: string | undefined): raw is undefined => raw === undefined || cleanText(raw) === '';

// --- Statut, âge, taille ---------------------------------------------------

export type VitalStatus = 'alive' | 'deceased' | 'unknown';

/**
 * `status` de Char Box, rendu comme le `#switch` du template : 1/unknown → unknown,
 * 2/dead/deceased → deceased, tout le reste (absent, 3, alive, valeur inattendue) → alive.
 */
export function parseStatus(raw: string | undefined): VitalStatus {
  if (isBlank(raw)) return 'alive';
  const v = cleanText(raw).toLowerCase();
  if (v === '1' || v === 'unknown') return 'unknown';
  if (v === '2' || v === 'dead' || v === 'deceased') return 'deceased';
  return 'alive';
}

/**
 * Textes nettoyés des éléments d'une liste, sans qualificatifs finaux. Un élément réduit à une
 * parenthèse (« (biologically 28) ») garde son contenu.
 */
function itemTexts(raw: string): string[] {
  return splitItems(raw).map((item) => {
    const cleaned = cleanText(item);
    return extractQualifiers(cleaned).text || cleaned.replace(/[()]/g, '').trim();
  });
}

const maxOf = (values: number[]): number | null => (values.length === 0 ? null : Math.max(...values));

/**
 * Âge : **plus grande** valeur de la liste (« 7 (debut); 17 (pre-timeskip); 19 (post-timeskip) » → 19).
 * Le max plutôt que la dernière valeur : l'ordre des listes du wiki n'est pas toujours chronologique.
 * Sans nombre (« Even he does not know », « Multiple centuries ») : âge inconnu (`null`).
 */
export function parseMaxAge(raw: string | undefined): number | null | undefined {
  if (isBlank(raw)) return null;
  const values: number[] = [];
  for (const t of itemTexts(raw)) {
    const m = /(\d[\d,]*)/.exec(t);
    if (!m?.[1]) continue;
    const n = Number(m[1].replace(/,/g, ''));
    if (!Number.isSafeInteger(n)) return undefined;
    values.push(n);
  }
  return maxOf(values);
}

/**
 * Taille en cm : **plus grande** valeur de la liste (Ace : « 185 cm (age 20); 103 cm (age 10) » → 185).
 * Mètres et kilomètres convertis. Un élément non inconnu sans unité métrique rend la ligne invalide.
 */
export function parseMaxHeightCm(raw: string | undefined): number | null | undefined {
  if (isBlank(raw)) return null;
  const values: number[] = [];
  for (const t of itemTexts(raw)) {
    if (t === '' || UNKNOWN_TEXT.test(t)) continue;
    const m = /(\d[\d,]*(?:\.\d+)?)\s*(cm|m|km)\b/i.exec(t);
    if (!m?.[1] || !m[2]) return undefined;
    const value = Number(m[1].replace(/,/g, ''));
    const factor = { cm: 1, m: 100, km: 100_000 }[m[2].toLowerCase() as 'cm' | 'm' | 'km'];
    const cm = Math.round(value * factor);
    if (cm <= 0 || cm > 2_147_483_647) return undefined;
    values.push(cm);
  }
  return maxOf(values);
}

// --- Primes ------------------------------------------------------------------

export interface Bounty {
  /** Montant en berry ; `null` pour une prime connue seulement par son grade (Marines). */
  amount: number | null;
  /** « At least … », « Over … » : le montant est un minimum. */
  isMinimum: boolean;
  /** Non barrée sur le wiki. Toutes barrées = plus de prime active (personnage mort…). */
  isCurrent: boolean;
  /** Chapitre cité par la référence de la prime, si elle en donne un. */
  chapter: number | null;
  /** Grade en étoiles des Marines (`{{C|3}}`, `★★★★★`), sinon `null`. */
  starRank: number | null;
}

/** Retire les templates nommés (et leur contenu) du premier niveau. */
function withoutTemplates(raw: string, names: string[]): string {
  let out = raw;
  for (const t of topLevelTemplates(raw)) {
    if (names.some((n) => sameTemplateName(n, t.name))) out = out.replace(t.source, '');
  }
  return out;
}

function starRankOf(raw: string): number | null {
  for (const t of topLevelTemplates(raw)) {
    if (sameTemplateName('C', t.name)) {
      const n = Number(t.positional[0]);
      if (Number.isInteger(n) && n > 0) return n;
    }
  }
  const stars = raw.match(/★/g)?.length ?? 0;
  return stars > 0 ? stars : null;
}

/**
 * Historique des primes, de la plus récente à la plus ancienne comme sur le wiki.
 * Formes relevées : `{{B}}3,000,000,000`, `{{B}}<s>…</s>`, `<s>{{B}}…</s>`,
 * `At least {{B}}…`, `{{C|3}}<br />({{B|s}}3,000,000,000)`, `At least ★★★★★`.
 * Un grade seul est rattaché au montant de l'élément suivant (même prime, écrite sur deux lignes).
 */
export function parseBounties(raw: string | undefined, refs: RefIndex, withChapter = true): Bounty[] | undefined {
  if (isBlank(raw)) return [];
  // Primes par section (« '''Main Crew:''' … '''Organization:''' … ») : seule la première est lue.
  const sections = raw.split(/'{3}[^'\n]+:'{3}/);
  const body = sections.length > 1 ? (sections[1] ?? '') : raw;
  const out: Bounty[] = [];
  let pendingStars: { starRank: number; isMinimum: boolean; isCurrent: boolean } | null = null;

  for (const item of splitItems(body)) {
    if (isNonCanonItem(item)) continue;
    // Refn (détail des primes d'un équipage) : son contenu n'appartient pas à l'élément.
    const own = withoutTemplates(item, ['Refn']);
    const text = cleanText(own);
    const isCurrent = !/<s>/i.test(own);
    const isMinimum = /\b(at least|over|more than)\b/i.test(text);
    const starRank = starRankOf(own);
    const digits = /\d{1,3}(?:,\d{3})+|\d+/.exec(text.replace(/[★]/g, ''));

    if (!digits) {
      if (starRank !== null) {
        if (pendingStars) out.push({ amount: null, chapter: null, ...pendingStars });
        pendingStars = { starRank, isMinimum, isCurrent };
        continue;
      }
      if (UNKNOWN_TEXT.test(extractQualifiers(text).text)) continue;
      return undefined;
    }

    const amount = Number(digits[0].replace(/,/g, ''));
    if (!Number.isSafeInteger(amount)) return undefined;
    out.push({
      amount,
      isMinimum: isMinimum || (pendingStars?.isMinimum ?? false),
      isCurrent: isCurrent && (pendingStars?.isCurrent ?? true),
      chapter: withChapter ? citedChapter(own, refs) : null,
      starRank: starRank ?? pendingStars?.starRank ?? null,
    });
    pendingStars = null;
  }
  if (pendingStars) out.push({ amount: null, chapter: null, ...pendingStars });
  return out;
}

// --- Listes : affiliations, métiers, épithètes, alias ------------------------

export interface Membership {
  name: string;
  /** Page liée (cible du premier lien), clé de rapprochement avec les équipages. */
  page: string | null;
  qualifiers: string[];
  isCurrent: boolean;
}

const PAST = /\b(former(ly)?|disbanded|defected|dissolved|resigned|deserted|retired|fired|expelled|previously|ex|deceased|destroyed|revoked|demoted|pre-timeskip)\b/i;

/** Affiliations ou métiers : un élément par entrée, qualificatifs → `isCurrent`. */
export function parseMemberships(raw: string | undefined): Membership[] {
  if (isBlank(raw)) return [];
  const out: Membership[] = [];
  for (const item of splitItems(raw)) {
    if (isNonCanonItem(item)) continue;
    const { text, qualifiers } = extractQualifiers(cleanText(item));
    if (text === '') continue;
    out.push({ name: text, page: firstLinkTarget(item), qualifiers, isCurrent: !qualifiers.some((q) => PAST.test(q)) });
  }
  return out;
}

/** Épithètes ou alias : variantes de traduction et éléments non canon exclus, guillemets retirés. */
export function parseNames(raw: string | undefined): string[] {
  if (isBlank(raw)) return [];
  const out: string[] = [];
  for (const item of splitItems(raw)) {
    if (isNonCanonItem(item)) continue;
    const { text, qualifiers } = extractQualifiers(cleanText(item));
    // Un Nihongo porte le nom original : ses notes (« "Heat Fist Trace" in the edited dub ») ne l'excluent pas.
    if (!/\{\{\s*Nihongo\s*\|/i.test(item) && isTranslationVariant(qualifiers)) continue;
    const name = text.replace(/["“”]/g, '').replace(/\s+/g, ' ').trim();
    if (name !== '' && !out.includes(name)) out.push(name);
  }
  return out;
}

/** Premier élément d'une liste, sans qualificatifs (« Portgas D. Ace (uncut dub); … » → Portgas D. Ace). */
export function firstName(raw: string | undefined): string | null {
  if (isBlank(raw)) return null;
  const first = splitItems(raw)[0];
  if (first === undefined) return null;
  const text = extractQualifiers(cleanText(first)).text.replace(/["“”]/g, '').trim();
  return text === '' || /^n\/a$/i.test(text) ? null : text;
}

/** Texte nettoyé ou `null`. */
export function text(raw: string | undefined): string | null {
  if (isBlank(raw)) return null;
  const t = cleanText(raw);
  return UNKNOWN_TEXT.test(t) ? null : t;
}

/** Références à des pages (porteurs d'un fruit, capitaines) : nom affiché et page liée. */
export function parsePageRefs(raw: string | undefined): { name: string; page: string | null }[] {
  return parseMemberships(raw).map(({ name, page }) => ({ name, page }));
}

// --- Fruits -----------------------------------------------------------------

export type FruitType = 'paramecia' | 'zoan' | 'logia';
export type FruitSubtype = 'ancient' | 'mythical' | 'artificial' | null;
export interface FruitClass {
  type: FruitType;
  subtype: FruitSubtype;
}

/**
 * Types listés dans l'ordre du wiki : « Paramecia <small>(Mythical Zoan)</small> » →
 * [{paramecia}, {zoan, mythical}]. Valeur « Unknown » → liste vide.
 */
export function parseFruitTypes(raw: string | undefined): FruitClass[] | undefined {
  if (isBlank(raw)) return [];
  const out: FruitClass[] = [];
  for (const item of splitItems(raw)) {
    const t = cleanText(item).toLowerCase();
    const type: FruitType | undefined = /logia/.test(t)
      ? 'logia'
      : /paramecia/.test(t)
        ? 'paramecia'
        : /zoan/.test(t)
          ? 'zoan'
          : undefined;
    if (type === undefined) {
      if (UNKNOWN_TEXT.test(extractQualifiers(t).text.replace(/[()]/g, '').trim())) continue;
      return undefined;
    }
    const subtype: FruitSubtype = /ancient/.test(t) ? 'ancient' : /mythical/.test(t) ? 'mythical' : /artificial|smile/.test(t) ? 'artificial' : null;
    if (!out.some((c) => c.type === type && c.subtype === subtype)) out.push({ type, subtype });
  }
  return out;
}

// --- Haki -------------------------------------------------------------------

export type HakiKind = 'observation' | 'armament' | 'conqueror';

/** Catégories du wiki → types de Haki (« Supreme King Haki » = Haki des rois). */
const HAKI_CATEGORIES: Record<string, HakiKind> = {
  'Category:Observation Haki Users': 'observation',
  'Category:Armament Haki Users': 'armament',
  'Category:Supreme King Haki Users': 'conqueror',
};
export const HAKI_CATEGORY_TITLES = Object.keys(HAKI_CATEGORIES);

export function hakiFromCategories(categories: readonly string[]): HakiKind[] {
  const kinds = new Set(categories.flatMap((c) => (HAKI_CATEGORIES[c] ? [HAKI_CATEGORIES[c]] : [])));
  return (['observation', 'armament', 'conqueror'] as const).filter((k) => kinds.has(k));
}
