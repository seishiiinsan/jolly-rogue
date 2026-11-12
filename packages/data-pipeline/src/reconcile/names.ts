/**
 * Normalisation des noms pour le rapprochement (docs/cadrage.md §9.4) : minuscules, sans accents
 * ni ponctuation, mots séparés par une espace. « Monkey D. Luffy » et « Monkey D Luffy » donnent
 * « monkey d luffy », « Tony-Tony Chopper » et « Tony Tony Chopper » donnent « tony tony chopper ».
 */
export function normalizeName(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Titre sans la précision entre parenthèses finale : « Kuro (Kuro Pirates) » → « Kuro ». */
const withoutDisambiguation = (name: string): string => name.replace(/\s*\([^()]*\)\s*$/, '');

/** Clés de rapprochement distinctes (vides exclues), avec et sans précision entre parenthèses. */
export function nameKeys(names: readonly (string | null | undefined)[]): string[] {
  const keys = new Set<string>();
  for (const name of names) {
    if (!name) continue;
    for (const variant of [name, withoutDisambiguation(name)]) {
      const key = normalizeName(variant);
      if (key !== '') keys.add(key);
    }
  }
  return [...keys].sort();
}

/** Distance d'édition (insertion, suppression, substitution), en O(n·m) mémoire O(m). */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min((previous[j] ?? 0) + 1, (current[j - 1] ?? 0) + 1, (previous[j - 1] ?? 0) + cost);
    }
    previous = current;
  }
  return previous[b.length] ?? 0;
}

/** Mots trop génériques pour qu'un nom court « contenu » dans un nom long soit un indice. */
const GENERIC_TOKENS = new Set([
  'the', 'of', 'and', 'de', 'du', 'des', 'la', 'le', 'les', 'no', 'mi', 'd',
  'fruit', 'model', 'version', 'smile', 'crew', 'pirates', 'pirate', 'equipage', 'kaizokudan',
]);
const contentTokens = (key: string): string[] => key.split(' ').filter((t) => t !== '' && !GENERIC_TOKENS.has(t));

/** Score de ressemblance entre deux clés normalisées, de 0 à 1. */
export function similarity(a: string, b: string): number {
  if (a === b) return 1;
  const edit = 1 - levenshtein(a, b) / Math.max(a.length, b.length);
  // Nom court contenu dans le nom complet : « garp » / « monkey d garp » (mots génériques ignorés).
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  const shortTokens = contentTokens(short);
  const longTokens = new Set(contentTokens(long));
  const contained =
    shortTokens.join('').length >= 4 && shortTokens.every((t) => longTokens.has(t)) ? 0.9 : 0;
  return Math.max(edit, contained);
}

/** Meilleur score entre deux ensembles de clés. */
export function bestSimilarity(a: readonly string[], b: readonly string[]): number {
  let best = 0;
  for (const x of a) for (const y of b) best = Math.max(best, similarity(x, y));
  return best;
}
