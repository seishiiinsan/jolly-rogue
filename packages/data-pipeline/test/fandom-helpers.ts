import { readFileSync } from 'node:fs';
import { fandomApiUrl, parseApiBody, revisionsResponse, wikiPagesFromResponse } from '../src/parse/fandom/api.js';
import { type PageParse, type WikiPage, parseFandomPage } from '../src/parse/fandom/page.js';
import { revisionsParams, templatesToFetch } from '../src/sources/fandom.js';

export const FANDOM_FIXTURES_DIR = new URL('../fixtures/fandom/', import.meta.url);

/** Body d'une fixture, re-sérialisé comme le renverrait l'API (JSON compact). */
export function fandomFixtureBody(name: 'pages' | 'templates'): string {
  return JSON.stringify(JSON.parse(readFileSync(new URL(`${name}.json`, FANDOM_FIXTURES_DIR), 'utf8')));
}

function pagesOf(name: 'pages' | 'templates'): WikiPage[] {
  return wikiPagesFromResponse(parseApiBody(revisionsResponse, fandomFixtureBody(name), name));
}

export const fixturePages = (): WikiPage[] => pagesOf('pages');
export const fixtureTemplates = (): WikiPage[] => pagesOf('templates');

/** Titres présents dans la fixture `pages` (y compris pages manquantes), triés comme le pipeline. */
export function fixtureTitles(): string[] {
  const data = parseApiBody(revisionsResponse, fandomFixtureBody('pages'), 'pages');
  return (data.query?.pages ?? []).map((p) => p.title).sort();
}

/** Parse une page des fixtures, avec son Tabs Top si besoin, comme le fait le pipeline. */
export function parseFixture(title: string): Extract<PageParse, { status: 'parsed' }> {
  const page = fixturePages().find((p) => p.title === title);
  if (!page) throw new Error(`fixture absente : ${title}`);
  const first = parseFandomPage(page);
  if (first.status === 'parsed') return first;
  const template = fixtureTemplates().find((t) => t.title === first.template);
  const second = parseFandomPage(page, template);
  if (second.status !== 'parsed') throw new Error(`Tabs Top non résolu : ${title}`);
  return second;
}

/** URL des deux lots de fixtures, identiques à celles construites par le pipeline. */
export function fixtureUrls(): { pages: string; templates: string } {
  return {
    pages: fandomApiUrl(revisionsParams(fixtureTitles(), true)),
    templates: fandomApiUrl(revisionsParams(templatesToFetch(fixturePages()), false)),
  };
}
