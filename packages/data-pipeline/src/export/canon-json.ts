import {
  type CanonExport,
  CANON_EXPORT_SCHEMA_VERSION,
  arcs,
  bounties,
  canonExportSchema,
  characterAffiliations,
  characterFruits,
  characters,
  crews,
  devilFruits,
  haki,
  locations,
  provenance,
  sagas,
} from '@jolly-rogue/db';
import type { Executor } from '../db.js';
import { SOURCES } from '../sources/registry.js';

/** Comparaison par points de code : indépendante de la locale, donc stable d'une machine à l'autre. */
export const compareCodepoints = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
const bySlug = <T extends { slug: string }>(a: T, b: T): number => compareCodepoints(a.slug, b.slug);

function slugOf(map: Map<number, string>, id: number, what: string): string {
  const slug = map.get(id);
  if (slug === undefined) throw new Error(`export : ${what} ${id} introuvable`);
  return slug;
}

/** Construit l'export canon depuis la base, validé par le schéma Zod partagé. Aucun horodatage. */
export async function buildCanonExport(db: Executor): Promise<CanonExport> {
  const [locs, sgs, ars, fruits, crws, chars, affs, cfs, bts, hks, srcs] = await Promise.all([
    db.select().from(locations),
    db.select().from(sagas),
    db.select().from(arcs),
    db.select().from(devilFruits),
    db.select().from(crews),
    db.select().from(characters),
    db.select().from(characterAffiliations),
    db.select().from(characterFruits),
    db.select().from(bounties),
    db.select().from(haki),
    db.selectDistinct({ source: provenance.source }).from(provenance),
  ]);

  const locationSlugs = new Map(locs.map((r) => [r.id, r.slug]));
  const sagaSlugs = new Map(sgs.map((r) => [r.id, r.slug]));
  const fruitSlugs = new Map(fruits.map((r) => [r.id, r.slug]));
  const crewSlugs = new Map(crws.map((r) => [r.id, r.slug]));
  const characterSlugs = new Map(chars.map((r) => [r.id, r.slug]));

  const groupBy = <T extends { characterId: number }>(rows: T[]): Map<number, T[]> => {
    const map = new Map<number, T[]>();
    for (const r of rows) map.set(r.characterId, [...(map.get(r.characterId) ?? []), r]);
    return map;
  };
  const affsBy = groupBy(affs);
  const fruitsBy = groupBy(cfs);
  const bountiesBy = groupBy(bts);
  const hakiBy = groupBy(hks);

  const data: CanonExport = {
    schemaVersion: CANON_EXPORT_SCHEMA_VERSION,
    sources: srcs
      .map(({ source }) => ({ name: source, url: SOURCES[source]?.url ?? '', license: SOURCES[source]?.license ?? null }))
      .sort((a, b) => compareCodepoints(a.name, b.name)),
    locations: locs
      .map((r) => ({ slug: r.slug, nameEn: r.nameEn, nameFr: r.nameFr, sea: r.sea, kind: r.kind }))
      .sort(bySlug),
    sagas: sgs
      .map((r) => ({
        slug: r.slug,
        nameEn: r.nameEn,
        nameFr: r.nameFr,
        chapterStart: r.chapterStart,
        chapterEnd: r.chapterEnd,
        sortOrder: r.sortOrder,
      }))
      .sort(bySlug),
    arcs: ars
      .map((r) => ({
        slug: r.slug,
        nameEn: r.nameEn,
        nameFr: r.nameFr,
        saga: slugOf(sagaSlugs, r.sagaId, 'saga'),
        chapterStart: r.chapterStart,
        chapterEnd: r.chapterEnd,
        sortOrder: r.sortOrder,
      }))
      .sort(bySlug),
    devilFruits: fruits
      .map((r) => ({
        slug: r.slug,
        nameRomaji: r.nameRomaji,
        nameEn: r.nameEn,
        nameFr: r.nameFr,
        type: r.type,
        subtype: r.subtype,
      }))
      .sort(bySlug),
    crews: crws
      .map((r) => ({
        slug: r.slug,
        nameEn: r.nameEn,
        nameFr: r.nameFr,
        kind: r.kind,
        captain: r.captainId === null ? null : slugOf(characterSlugs, r.captainId, 'personnage'),
        isYonko: r.isYonko,
      }))
      .sort(bySlug),
    characters: chars
      .map((r) => ({
        slug: r.slug,
        nameEn: r.nameEn,
        nameFr: r.nameFr,
        nameJp: r.nameJp,
        epithet: r.epithet,
        status: r.status,
        age: r.age,
        heightCm: r.heightCm,
        originLocation: r.originLocationId === null ? null : slugOf(locationSlugs, r.originLocationId, 'lieu'),
        debutChapter: r.debutChapter,
        affiliations: (affsBy.get(r.id) ?? [])
          .map((a) => ({ crew: slugOf(crewSlugs, a.crewId, 'équipage'), role: a.role, isCurrent: a.isCurrent }))
          .sort((a, b) => compareCodepoints(a.crew, b.crew) || compareCodepoints(a.role ?? '', b.role ?? '')),
        devilFruits: (fruitsBy.get(r.id) ?? [])
          .map((f) => ({ fruit: slugOf(fruitSlugs, f.fruitId, 'fruit'), isCurrent: f.isCurrent }))
          .sort((a, b) => compareCodepoints(a.fruit, b.fruit)),
        bounties: (bountiesBy.get(r.id) ?? [])
          .map((b) => ({ amountBerry: b.amountBerry, asOfChapter: b.asOfChapter, isCurrent: b.isCurrent }))
          .sort((a, b) => a.amountBerry - b.amountBerry),
        haki: (hakiBy.get(r.id) ?? []).map((h) => h.kind).sort(compareCodepoints),
      }))
      .sort(bySlug),
  };

  return canonExportSchema.parse(data);
}

export const serializeCanonExport = (data: CanonExport): string => `${JSON.stringify(data, null, 2)}\n`;
