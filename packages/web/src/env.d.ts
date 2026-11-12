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

declare module 'virtual:art' {
  const art: {
    /** Portrait local par slug de perso ou id d'ennemi (URL relative). */
    portraits: Record<string, string>;
    /** Décors locaux : `home`, `combat`. */
    backgrounds: Record<string, string>;
  };
  export default art;
}
