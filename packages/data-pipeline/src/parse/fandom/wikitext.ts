/**
 * Tokenizer minimal du wikitext MediaWiki, suffisant pour les infobox du One Piece Wiki.
 * Il ne rend pas le wikitext : il repère les templates `{{…}}` (imbriqués), découpe leurs
 * paramètres au premier niveau et ignore commentaires et balises `<ref>`.
 *
 * Choix : pas de dépendance (wtf_wikipedia & co. sont pensés pour Wikipédia et gèrent mal
 * les templates propres à ce wiki : Qref, Nihongo, Tabs Top…).
 */

export interface Template {
  /** Nom tel qu'écrit, espaces normalisés (« Char Box », « Monkey D. Luffy Tabs Top »). */
  name: string;
  /** Paramètres nommés (clé trimée), valeur brute non trimée de bout en bout puis trimée. */
  named: Map<string, string>;
  /** Paramètres positionnels (1-indexés dans MediaWiki, 0-indexés ici). */
  positional: string[];
  /** Source complète `{{…}}`. */
  source: string;
}

/** Supprime commentaires HTML, `<ref>…</ref>`, `<ref/>`, `<noinclude>…</noinclude>`. */
export function stripNoise(text: string): string {
  return text
    .replace(/<!--[\s\S]*?(?:-->|$)/g, '')
    .replace(/<ref\b[^>]*\/>/gi, '')
    .replace(/<ref\b[^>]*>[\s\S]*?<\/ref>/gi, '')
    .replace(/<noinclude>[\s\S]*?<\/noinclude>/gi, '');
}

/**
 * Templates de premier niveau de `text` (ceux qui ne sont contenus dans aucun autre).
 * Un `{{` non refermé est ignoré (le texte qui suit est quand même parcouru).
 */
export function topLevelTemplates(text: string): Template[] {
  const out: Template[] = [];
  let depth = 0;
  let start = 0;
  let i = 0;
  while (i < text.length) {
    if (text.startsWith('{{', i)) {
      if (depth === 0) start = i;
      depth++;
      i += 2;
    } else if (text.startsWith('}}', i) && depth > 0) {
      depth--;
      i += 2;
      if (depth === 0) out.push(parseTemplate(text.slice(start, i)));
    } else {
      i++;
    }
  }
  return out;
}

/** Tous les templates de `text`, y compris imbriqués (parcours en profondeur, ordre du texte). */
export function allTemplates(text: string): Template[] {
  const out: Template[] = [];
  for (const t of topLevelTemplates(text)) {
    out.push(t);
    out.push(...allTemplates(t.source.slice(2, -2)));
  }
  return out;
}

/** Découpe `s` sur `separator` uniquement hors `{{…}}` et `[[…]]`. */
export function splitTopLevel(s: string, separator: string | RegExp): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  let i = 0;
  while (i < s.length) {
    const two = s.slice(i, i + 2);
    if (two === '{{' || two === '[[') {
      depth++;
      current += two;
      i += 2;
      continue;
    }
    if ((two === '}}' || two === ']]') && depth > 0) {
      depth--;
      current += two;
      i += 2;
      continue;
    }
    if (depth === 0) {
      const match = matchAt(s, i, separator);
      if (match !== null) {
        parts.push(current);
        current = '';
        i += match;
        continue;
      }
    }
    current += s[i];
    i++;
  }
  parts.push(current);
  return parts;
}

/** Longueur du séparateur s'il commence à `i`, sinon `null`. */
function matchAt(s: string, i: number, separator: string | RegExp): number | null {
  if (typeof separator === 'string') return s.startsWith(separator, i) ? separator.length : null;
  const re = new RegExp(separator.source, separator.flags.replace('g', '').replace('y', '') + 'y');
  re.lastIndex = i;
  const m = re.exec(s);
  return m && m[0].length > 0 ? m[0].length : null;
}

/** `{{Nom|a|b=c}}` → { name, named, positional }. */
export function parseTemplate(source: string): Template {
  const inner = source.slice(2, -2);
  const [head = '', ...params] = splitTopLevel(inner, '|');
  const named = new Map<string, string>();
  const positional: string[] = [];
  for (const param of params) {
    const eq = indexOfTopLevel(param, '=');
    if (eq >= 0) named.set(param.slice(0, eq).trim(), param.slice(eq + 1).trim());
    else positional.push(param);
  }
  return { name: head.replace(/\s+/g, ' ').trim(), named, positional, source };
}

function indexOfTopLevel(s: string, ch: string): number {
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    const two = s.slice(i, i + 2);
    if (two === '{{' || two === '[[') {
      depth++;
      i++;
    } else if ((two === '}}' || two === ']]') && depth > 0) {
      depth--;
      i++;
    } else if (depth === 0 && s[i] === ch) {
      return i;
    }
  }
  return -1;
}

/** Comparaison de noms de templates façon MediaWiki : 1re lettre insensible à la casse, `_` = espace. */
export function sameTemplateName(a: string, b: string): boolean {
  const norm = (s: string): string => {
    const t = s.replace(/_/g, ' ').replace(/\s+/g, ' ').trim().replace(/^Template:/i, '');
    return t.charAt(0).toUpperCase() + t.slice(1);
  };
  return norm(a) === norm(b);
}
