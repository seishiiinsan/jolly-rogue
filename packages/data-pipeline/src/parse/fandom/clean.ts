import { parseTemplate, sameTemplateName, splitTopLevel, stripNoise, topLevelTemplates } from './wikitext.js';

/**
 * Nettoyage des valeurs d'infobox : wikitext → texte brut, découpe des listes, qualificatifs.
 * Les règles viennent de l'exploration du wikitext réel (voir fixtures/fandom).
 */

/** Templates supprimés avec leur contenu : références, marqueurs, mise en forme. */
const DROPPED = ['Qref', 'Refn', 'Web ref', 'Ref', 'Cite', 'Status', 'Hide', 'B', 'Sic', 'Clarify', 'Citation needed'];

/** Rend un template en texte : seuls quelques templates « porteurs de texte » sont conservés. */
function renderTemplate(source: string): string {
  const t = parseTemplate(source);
  if (DROPPED.some((d) => sameTemplateName(d, t.name))) return '';
  // {{Nihongo|English|日本語|romaji|note}} → English
  if (sameTemplateName('Nihongo', t.name)) return t.positional[0] ?? '';
  // {{Ruby|D|ディー}} → D
  if (sameTemplateName('Ruby', t.name)) return t.positional[0] ?? '';
  // {{C|3}} (grade de prime des Marines) → ★★★
  if (sameTemplateName('C', t.name)) {
    const n = Number(t.positional[0]);
    return Number.isInteger(n) && n > 0 && n <= 10 ? '★'.repeat(n) : '';
  }
  // {{W|Page|Libellé}} → Libellé ou Page
  if (sameTemplateName('W', t.name)) return t.positional[1] ?? t.positional[0] ?? '';
  // Tout autre template (mise en forme, navigation…) est retiré.
  return '';
}

/** Remplace récursivement les templates par leur rendu texte. */
export function renderTemplates(text: string): string {
  let out = text;
  // Une passe par niveau d'imbrication ; borne de sécurité pour un wikitext pathologique.
  for (let pass = 0; pass < 10 && out.includes('{{'); pass++) {
    const templates = topLevelTemplates(out);
    if (templates.length === 0) break;
    let rebuilt = '';
    let cursor = 0;
    for (const t of templates) {
      const at = out.indexOf(t.source, cursor);
      rebuilt += out.slice(cursor, at) + renderTemplate(t.source);
      cursor = at + t.source.length;
    }
    out = rebuilt + out.slice(cursor);
  }
  return out;
}

/** `[[Cible|Libellé]]` → Libellé, `[[Cible]]` → Cible, `[[File:…]]` supprimé. */
export function renderLinks(text: string): string {
  return text
    .replace(/\[\[(?:File|Image|Category):[^\]]*\]\]/gi, '')
    .replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, '$2')
    .replace(/\[\[([^\]]*)\]\]/g, '$1');
}

/** Wikitext d'une valeur → texte brut sur une ligne. */
export function cleanText(raw: string): string {
  const text = renderLinks(renderTemplates(stripNoise(raw)))
    .replace(/'{2,}/g, '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?[a-z][^>]*>/gi, '')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
  return text;
}

/**
 * Découpe une valeur multi-éléments. Séparateurs observés : `<br />`, `;` de premier niveau,
 * puces `*` en début de ligne. Les éléments vides sont retirés, une virgule finale aussi.
 */
export function splitItems(raw: string): string[] {
  // Les entités HTML contiennent un `;` : on les remplace avant de découper.
  const text = stripNoise(raw).replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&');
  return splitTopLevel(text, /<br\s*\/?>|;|\n\s*\*|^\s*\*/i)
    .map((s) => s.replace(/^\s*\*/, '').replace(/,\s*$/, '').trim())
    .filter((s) => cleanText(s) !== '');
}

/** Valeurs séparées par `----` (Devil Fruit Box d'un fruit à plusieurs identités). */
export function splitForms(raw: string): string[] {
  return raw.split(/\n?\s*-{4,}\s*\n?/).map((s) => s.trim());
}

export interface Qualified {
  text: string;
  /** Contenu des parenthèses finales, découpé sur les virgules, en minuscules. */
  qualifiers: string[];
}

/**
 * « Baratie (temporary, former) » → { text: 'Baratie', qualifiers: ['temporary', 'former'] }.
 * Parenthèses imbriquées gérées : « Big Mom (Funimation subs (formerly): Big Mam) » → 'Big Mom'.
 */
export function extractQualifiers(text: string): Qualified {
  let rest = text.trim();
  const qualifiers: string[] = [];
  while (rest.endsWith(')')) {
    let depth = 0;
    let open = -1;
    for (let i = rest.length - 1; i >= 0; i--) {
      if (rest[i] === ')') depth++;
      else if (rest[i] === '(' && --depth === 0) {
        open = i;
        break;
      }
    }
    if (open <= 0) break; // parenthèse non appariée, ou texte entièrement entre parenthèses
    qualifiers.unshift(
      ...rest
        .slice(open + 1, -1)
        .split(',')
        .map((q) => q.trim().toLowerCase())
        .filter(Boolean),
    );
    rest = rest.slice(0, open).trim();
  }
  return { text: rest, qualifiers };
}

/** Cible du premier lien interne (`[[Cible|…]]` → Cible, sans ancre ni espaces superflus). */
export function firstLinkTarget(raw: string): string | null {
  const m = /\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/.exec(stripNoise(raw).replace(/\{\{(?:Qref|Refn)[\s\S]*?\}\}/gi, ''));
  const target = m?.[1]?.replace(/_/g, ' ').trim();
  return target ? target : null;
}

/** Premier numéro de chapitre lié (`[[Chapter 1]]`, `[[Chapter 41|Ch.41]]`). */
export function firstChapter(raw: string): number | null {
  const m = /\[\[Chapter (\d+)/i.exec(stripNoise(raw));
  return m?.[1] ? Number(m[1]) : null;
}

/** Vrai si l'élément est marqué non canon en ligne (`{{Status|noncanon}}`). */
export const isNonCanonItem = (raw: string): boolean => /\{\{\s*Status\s*\|\s*non-?canon/i.test(raw);

/** Variante de traduction (VIZ, 4Kids, Funimation, dub…) : pas un nom canon. */
export const isTranslationVariant = (qualifiers: string[]): boolean =>
  qualifiers.some((q) => /\b(viz|4kids|funi(mation)?|odex|dub|subs?|edited|uncut|english versions?)\b/i.test(q));

/**
 * Index des références nommées d'une page : `{{Qref|name=c1058|chap=1058|…}}` permet de
 * retrouver le chapitre d'un `{{Qref|name=c1058}}` réutilisé plus loin.
 */
export type RefIndex = Map<string, number>;

export function buildRefIndex(...texts: string[]): RefIndex {
  const index: RefIndex = new Map();
  for (const text of texts) {
    for (const m of text.matchAll(/\{\{\s*[Qq]ref\s*\|[^{}]*\}\}/g)) {
      const t = parseTemplate(m[0]);
      const name = t.named.get('name');
      const chap = Number(t.named.get('chap'));
      if (name && Number.isInteger(chap) && chap > 0 && !index.has(name)) index.set(name, chap);
    }
  }
  return index;
}

/** Chapitre cité par la première `Qref` de l'élément (directement ou via son nom). */
export function citedChapter(raw: string, refs: RefIndex): number | null {
  for (const m of raw.matchAll(/\{\{\s*[Qq]ref\s*\|[^{}]*\}\}/g)) {
    const t = parseTemplate(m[0]);
    const chap = Number(t.named.get('chap'));
    if (Number.isInteger(chap) && chap > 0) return chap;
    const name = t.named.get('name');
    const fromIndex = name ? refs.get(name) : undefined;
    if (fromIndex) return fromIndex;
  }
  return null;
}
