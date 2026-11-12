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
  fandom,
  haki,
  locations,
  provenance,
  rejections,
  responses,
  sagas,
} from '@jolly-rogue/db';
import { count, isNull, sql } from 'drizzle-orm';
import { type PgTable, getTableConfig } from 'drizzle-orm/pg-core';
import type { Executor } from '../db.js';
import { compareCodepoints } from '../export/canon-json.js';
import { ENTITY_NAMES, type ReconcileConfig } from '../reconcile/config.js';
import type { ReconcileModel } from '../reconcile/model.js';
import { computeReconcileModel } from '../reconcile/read.js';
import { cell, table } from './markdown.js';
import { orphanSection, reconcileSections, strawHatSection } from './reconcile-sections.js';
import { type IssueKind, type PlanIssue, planApiOnepiece } from '../load/plan.js';
import { readApiOnepieceStaging } from '../load/read-staging.js';
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

async function countRows(db: Executor, t: PgTable): Promise<number> {
  const [row] = await db.select({ n: count() }).from(t);
  return row?.n ?? 0;
}

/**
 * Rapport Markdown (docs/cadrage.md §9.7) : comptes, lignes rejetées, anomalies de chargement,
 * rapprochement (non-rapprochés, candidats fuzzy), conflits entre sources, corrections, contrôle du
 * Chapeau de paille, slugs suffixés, complétude. Aucun horodatage : le fichier ne change que si les
 * données changent.
 */
export async function buildReport(db: Executor, config?: ReconcileConfig): Promise<string> {
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
    fandom,
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

  // Réconciliation api-onepiece ↔ Fandom
  // Le rapport doit sortir même si la réconciliation échoue (override invalide, source manquante).
  let model: ReconcileModel | undefined;
  try {
    model = (await computeReconcileModel(db, config)).model;
  } catch (error) {
    out.push('## Réconciliation impossible\n');
    out.push(`\`pipeline reconcile\` échouerait : ${cell(error instanceof Error ? error.message : error)}\n`);
  }
  if (model) {
    out.push(...reconcileSections(model));
    out.push(...(await strawHatSection(db, model)));
    out.push(...(await orphanSection(db, model)));

    // Slugs suffixés (collision à la création)
    const m = model;
    const collisions = ENTITY_NAMES.flatMap((entity) =>
      m.entities[entity].filter((e) => e.slug !== e.baseSlug).map((e) => [entity, e.label, e.baseSlug, e.slug]),
    );
    out.push(`## Slugs suffixés après collision (${collisions.length})\n`);
    out.push('Slug souhaité déjà pris par une autre entité. Un slug publié ne change jamais ; un doublon se règle par `overrides/aliases.yaml`.\n');
    out.push(table(['Entité', 'Nom', 'Slug souhaité', 'Slug attribué'], collisions));
  }

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
        await missing(characters, 'characters.name_jp', isNull(characters.nameJp)),
        await missing(characters, 'characters.age', isNull(characters.age)),
        await missing(characters, 'characters.debut_chapter', isNull(characters.debutChapter)),
        await missing(characters, 'characters.origin_location_id', isNull(characters.originLocationId)),
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
