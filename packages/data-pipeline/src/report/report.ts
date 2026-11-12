import {
  apiOnepiece,
  arcs,
  bounties,
  characterAffiliations,
  characterAliases,
  characterFruits,
  characters,
  crews,
  devilFruits,
  externalIds,
  haki,
  locations,
  provenance,
  rejections,
  responses,
  sagas,
} from '@jolly-rogue/db';
import { count, eq, isNull, sql } from 'drizzle-orm';
import { type PgTable, getTableConfig } from 'drizzle-orm/pg-core';
import type { Executor } from '../db.js';
import { compareCodepoints } from '../export/canon-json.js';
import { type IssueKind, type PlanIssue, planApiOnepiece } from '../load/plan.js';
import { readApiOnepieceStaging } from '../load/read-staging.js';
import { API_ONEPIECE_SOURCE } from '../parse/api-onepiece.js';
import { SOURCES } from '../sources/registry.js';

const ISSUE_TITLES: Record<IssueKind, string> = {
  'missing-translation': 'Traductions FR manquantes',
  'orphan-translation': 'Entrées FR sans équivalent EN',
  'missing-reference': 'Références inconnues',
  'duplicate-sort-order': 'Ordres de tri en double',
  'crew-kind-default': 'Équipages de type `other` (non déductible du nom)',
  'captain-ambiguous': 'Capitaines ambigus',
  'fruit-clone-unresolved': 'Clones de fruit sans original',
  'fruit-romaji-fallback': 'Fruits sans nom romanisé',
  'fruit-multiple-holders': 'Fruits à plusieurs porteurs vivants (aucun marqué actuel)',
  'empty-slug': 'Slugs vides',
};

const cell = (value: unknown): string =>
  String(value ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');

function table(headers: string[], rows: unknown[][]): string {
  if (rows.length === 0) return '_Aucun._\n';
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((r) => `| ${r.map(cell).join(' | ')} |`),
  ].join('\n') + '\n';
}

async function countRows(db: Executor, t: PgTable): Promise<number> {
  const [row] = await db.select({ n: count() }).from(t);
  return row?.n ?? 0;
}

/**
 * Rapport Markdown (docs/cadrage.md §9.7) : comptes, lignes rejetées, anomalies de chargement,
 * slugs suffixés, complétude. Aucun horodatage : le fichier ne change que si les données changent.
 */
export async function buildReport(db: Executor): Promise<string> {
  const out: string[] = ['# Rapport du pipeline de données\n', 'Généré par `pipeline report`. Ne pas éditer à la main.\n'];

  // Sources
  out.push('## Sources\n');
  out.push(
    table(
      ['Source', 'URL', 'Licence'],
      Object.entries(SOURCES).map(([name, s]) => [name, s.url, s.license ?? '**inconnue** (aucune licence déclarée)']),
    ),
  );

  // Comptes
  out.push('## Comptes par table\n');
  const tables: PgTable[] = [
    responses,
    apiOnepiece,
    rejections,
    characters,
    characterAliases,
    characterAffiliations,
    characterFruits,
    bounties,
    haki,
    crews,
    devilFruits,
    locations,
    sagas,
    arcs,
    externalIds,
    provenance,
  ];
  const counts: unknown[][] = [];
  for (const t of tables) {
    const { schema, name } = getTableConfig(t);
    counts.push([`${schema ?? 'public'}.${name}`, await countRows(db, t)]);
  }
  out.push(table(['Table', 'Lignes'], counts));

  // Rejets Zod
  const rejected = await db.select().from(rejections);
  rejected.sort(
    (a, b) =>
      compareCodepoints(a.source, b.source) ||
      compareCodepoints(a.resource, b.resource) ||
      compareCodepoints(a.lang, b.lang) ||
      Number(a.externalId) - Number(b.externalId) ||
      compareCodepoints(a.externalId, b.externalId),
  );
  out.push(`## Lignes rejetées par Zod (${rejected.length})\n`);
  out.push(
    table(
      ['Source', 'Ressource', 'Langue', 'Id', 'Erreurs'],
      rejected.map((r) => [
        r.source,
        r.resource,
        r.lang,
        r.externalId,
        (r.errors as { path: string; message: string }[]).map((e) => `${e.path}: ${e.message}`).join(' ; '),
      ]),
    ),
  );

  // Anomalies du plan api-onepiece
  const plan = planApiOnepiece(await readApiOnepieceStaging(db));
  out.push(`## Anomalies de chargement api-onepiece (${plan.issues.length})\n`);
  const byKind = new Map<IssueKind, PlanIssue[]>();
  for (const issue of plan.issues) byKind.set(issue.kind, [...(byKind.get(issue.kind) ?? []), issue]);
  for (const kind of Object.keys(ISSUE_TITLES) as IssueKind[]) {
    const issues = byKind.get(kind);
    if (!issues) continue;
    out.push(`### ${ISSUE_TITLES[kind]} (${issues.length})\n`);
    out.push(table(['Entité', 'Id', 'Nom', 'Détail'], issues.map((i) => [i.entity, i.externalId, i.label, i.detail])));
  }

  // Slugs suffixés (collision à la création)
  const ext = await db.select().from(externalIds).where(eq(externalIds.source, API_ONEPIECE_SOURCE));
  const slugTables: Record<string, PgTable & { id: typeof characters.id; slug: typeof characters.slug }> = {
    locations,
    sagas,
    arcs,
    devil_fruits: devilFruits,
    crews,
    characters,
  } as never;
  const planned = new Map<string, string>();
  for (const [entity, list] of Object.entries({
    locations: plan.locations,
    sagas: plan.sagas,
    arcs: plan.arcs,
    devil_fruits: plan.devilFruits,
    crews: plan.crews,
    characters: plan.characters,
  })) {
    for (const p of list) planned.set(`${entity}|${p.externalId}`, p.baseSlug);
  }
  const slugById = new Map<string, string>();
  for (const [entity, t] of Object.entries(slugTables)) {
    for (const r of await db.select({ id: t.id, slug: t.slug }).from(t)) slugById.set(`${entity}|${r.id}`, r.slug);
  }
  const collisions = ext
    .map((e) => ({ e, slug: slugById.get(`${e.entity}|${e.entityId}`), base: planned.get(`${e.entity}|${e.externalId}`) }))
    .filter((x) => x.slug !== undefined && x.base !== undefined && x.slug !== x.base)
    .sort((a, b) => compareCodepoints(a.e.entity, b.e.entity) || compareCodepoints(a.slug ?? '', b.slug ?? ''));
  out.push(`## Slugs suffixés après collision (${collisions.length})\n`);
  out.push('Slug souhaité déjà pris par une autre entité : à trancher via `overrides/aliases.yaml` (tâche 4).\n');
  out.push(table(['Entité', 'Id source', 'Slug souhaité', 'Slug attribué'], collisions.map((x) => [x.e.entity, x.e.externalId, x.base, x.slug])));

  // Complétude
  out.push('## Complétude (valeurs manquantes)\n');
  const missing = async (t: PgTable, label: string, condition: ReturnType<typeof isNull>) => {
    const [row] = await db.select({ n: count() }).from(t).where(condition);
    return [label, row?.n ?? 0];
  };
  out.push(
    table(
      ['Champ', 'Lignes sans valeur'],
      [
        await missing(characters, 'characters.name_fr', isNull(characters.nameFr)),
        await missing(characters, 'characters.age', isNull(characters.age)),
        await missing(characters, 'characters.height_cm', isNull(characters.heightCm)),
        await missing(characters, "characters.status = 'unknown'", sql`${characters.status} = 'unknown'`),
        await missing(
          characters,
          'characters sans affiliation',
          sql`not exists (select 1 from ${characterAffiliations} a where a.character_id = ${characters.id})`,
        ),
        await missing(crews, 'crews.name_fr', isNull(crews.nameFr)),
        await missing(crews, 'crews.captain_id', isNull(crews.captainId)),
        await missing(devilFruits, 'devil_fruits.type', isNull(devilFruits.type)),
        await missing(devilFruits, 'devil_fruits.name_fr', isNull(devilFruits.nameFr)),
        await missing(locations, 'locations.sea', isNull(locations.sea)),
        await missing(arcs, 'arcs.chapter_start', isNull(arcs.chapterStart)),
      ],
    ),
  );

  return out.join('\n');
}
