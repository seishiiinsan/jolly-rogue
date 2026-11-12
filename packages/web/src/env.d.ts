declare module 'virtual:canon-names' {
  const names: {
    /** Nom affiché par slug de perso (jouables et boss). */
    characters: Record<string, string>;
    /** Nom affiché par slug d'équipage. */
    crews: Record<string, string>;
    sources: { name: string; url: string; license: string | null }[];
  };
  export default names;
}
