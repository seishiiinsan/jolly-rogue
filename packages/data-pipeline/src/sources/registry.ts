/** Sources connues du pipeline (nom utilisé dans raw, staging, external_ids et provenance). */
export const SOURCES: Record<string, { url: string; license: string | null }> = {
  'api-onepiece': { url: 'https://api.api-onepiece.com', license: null },
  // Licence déclarée par l'API du wiki (rightsinfo), détail : https://www.fandom.com/licensing
  fandom: { url: 'https://onepiece.fandom.com', license: 'CC-BY-SA' },
};
