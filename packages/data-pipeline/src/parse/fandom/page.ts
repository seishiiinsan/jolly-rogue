import { buildRefIndex } from './clean.js';
import { FANDOM_KINDS, type FandomKind, type FandomRecordMap, INFOBOX_TEMPLATES, fandomSchemas } from './schemas.js';
import { type Template, allTemplates, sameTemplateName, stripNoise, topLevelTemplates } from './wikitext.js';

/** Page telle que renvoyée par `prop=revisions` (wikitext de la dernière révision). */
export interface WikiPage {
  pageId: number;
  title: string;
  revId: number;
  wikitext: string;
  categories: string[];
}

export interface FandomRecord<K extends FandomKind = FandomKind> {
  kind: K;
  data: FandomRecordMap[K];
  /** Page qui contient réellement l'infobox (l'article, ou son `Template:… Tabs Top`). */
  infoboxPage: { title: string; revId: number };
}

export interface FandomRejection {
  /** Kind de l'infobox, ou `page` quand aucune infobox n'a pu être lue. */
  kind: FandomKind | 'page';
  errors: { path: string; message: string }[];
}

export type PageParse =
  | { status: 'parsed'; records: FandomRecord[]; rejections: FandomRejection[] }
  /** L'infobox est dans un template d'onglets (persos et équipages majeurs) : le récupérer puis reparser. */
  | { status: 'needs-template'; template: string };

const TABS_TOP = /\sTabs Top$/i;

function findBoxes(wikitext: string): { kind: FandomKind; template: Template }[] {
  const out: { kind: FandomKind; template: Template }[] = [];
  for (const t of allTemplates(stripNoise(wikitext))) {
    const kind = FANDOM_KINDS.find((k) => sameTemplateName(INFOBOX_TEMPLATES[k], t.name));
    if (kind) out.push({ kind, template: t });
  }
  return out;
}

/** `{{Monkey D. Luffy Tabs Top}}` → `Template:Monkey D. Luffy Tabs Top`. */
export function tabsTopTemplate(wikitext: string): string | null {
  const t = topLevelTemplates(stripNoise(wikitext)).find((x) => TABS_TOP.test(x.name) && !x.name.includes(':'));
  return t ? `Template:${t.name}` : null;
}

/**
 * Lit les infobox d'une page. Sans infobox dans l'article mais avec un `{{… Tabs Top}}`, renvoie
 * `needs-template` ; l'appelant récupère le template et rappelle la fonction avec `template`.
 */
export function parseFandomPage(page: WikiPage, template?: WikiPage): PageParse {
  let source = page;
  let boxes = findBoxes(page.wikitext);
  if (boxes.length === 0) {
    const tabs = tabsTopTemplate(page.wikitext);
    if (tabs && !template) return { status: 'needs-template', template: tabs };
    if (template) {
      source = template;
      boxes = findBoxes(template.wikitext);
    }
  }
  if (boxes.length === 0) {
    const where = template ? ` ni dans ${template.title}` : '';
    return {
      status: 'parsed',
      records: [],
      rejections: [{ kind: 'page', errors: [{ path: 'infobox', message: `aucune infobox dans la page${where}` }] }],
    };
  }

  const refs = buildRefIndex(page.wikitext, template?.wikitext ?? '');
  const records: FandomRecord[] = [];
  const rejections: FandomRejection[] = [];
  for (const kind of FANDOM_KINDS) {
    const ofKind = boxes.filter((b) => b.kind === kind);
    if (ofKind.length === 0) continue;
    if (ofKind.length > 1) {
      rejections.push({
        kind,
        errors: [{ path: 'infobox', message: `${ofKind.length} infobox ${INFOBOX_TEMPLATES[kind]} dans la page (page multi-personnages)` }],
      });
      continue;
    }
    const box = ofKind[0];
    if (!box) continue;
    const result = fandomSchemas[kind].safeParse({
      title: page.title,
      params: Object.fromEntries(box.template.named),
      categories: page.categories,
      refs,
    });
    if (result.success) {
      records.push({ kind, data: result.data, infoboxPage: { title: source.title, revId: source.revId } });
    } else {
      rejections.push({
        kind,
        errors: result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
      });
    }
  }
  return { status: 'parsed', records, rejections };
}
