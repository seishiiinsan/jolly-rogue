/**
 * Slug ASCII stable : minuscules, sans accents, mots séparés par des tirets.
 * « Monkey D Luffy » → « monkey-d-luffy », « Gōto-jima » → « goto-jima ».
 */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
