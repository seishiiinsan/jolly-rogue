import { bounties, characterAffiliations, characterFruits, characters, devilFruits } from '@jolly-rogue/db';
import { and, eq, inArray } from 'drizzle-orm';
import type { Executor } from '../db.js';
import { compareCodepoints } from '../export/canon-json.js';
import { API_ONEPIECE_SOURCE } from '../parse/api-onepiece.js';
import { FANDOM_SOURCE } from '../parse/fandom/api.js';
import { ENTITY_NAMES, MATCHED_ENTITIES, type MatchedEntity } from '../reconcile/config.js';
import type { ReconcileModel } from '../reconcile/model.js';
import { ENTITY_TABLES } from '../reconcile/read.js';
import { table } from './markdown.js';

const ENTITY_TITLES: Record<MatchedEntity, string> = {
  characters: 'Personnages',
  crews: 'Équipages',
  devil_fruits: 'Fruits du démon',
};

const ALONE_REASONS = {
  alias: 'alias `api-onepiece: null`',
  id: 'déjà créée (id connu)',
  none: 'aucun candidat api-onepiece',
} as const;

/** Page de l'équipage contrôlé par le rapport (docs/cadrage.md §9.7). */
export const STRAW_HAT_PAGE = 'Straw Hat Pirates';
export const STRAW_HAT_MEMBERS = 10;

/** Sections du rapport issues du modèle de réconciliation (docs/cadrage.md §9.4 et §9.7). */
export function reconcileSections(model: ReconcileModel): string[] {
  const out: string[] = [];
  const slugOf = (entity: MatchedEntity, source: string, id: string | number): string =>
    model.entities[entity].find((e) => e.key === `${entity}/${source}:${id}`)?.slug ?? '';

  out.push('## Rapprochement api-onepiece ↔ Fandom\n');
  out.push(
    'Ordre : alias (`overrides/aliases.yaml`), id déjà connu (`canon.external_ids`), nom normalisé (titre de page, puis tous les noms). ' +
      'Aucune fusion fuzzy : une page Fandom qui ressemble à une entité api-onepiece non rapprochée reste en attente (non créée). ' +
      '« Déjà connues » : rapprochement enregistré par une exécution précédente.\n',
  );
  out.push(
    table(
      ['Entité', 'Rapprochées (alias / déjà connues / par nom)', 'api-onepiece seule', 'Fandom seule (créées)', 'Fandom en attente'],
      MATCHED_ENTITIES.map((e) => {
        const m = model.matches[e];
        const by = (how: string) => m.pairs.filter((p) => p.how === how).length;
        return [e, `${m.pairs.length} (${by('alias')} / ${by('id')} / ${by('name')})`, m.apiOnly.length, m.fandomOnly.length, m.pending.length];
      }),
    ),
  );

  // Non rapprochées : toutes listées.
  const total = MATCHED_ENTITIES.reduce((n, e) => n + model.matches[e].apiOnly.length + model.matches[e].fandomOnly.length + model.matches[e].pending.length, 0);
  out.push(`## Entités non rapprochées (${total})\n`);
  out.push('Pour rapprocher deux entités (ou en séparer deux confondues) : `overrides/aliases.yaml`, voir le README du package.\n');
  for (const e of MATCHED_ENTITIES) {
    const m = model.matches[e];
    const labels = model.labels[e];
    out.push(`### ${ENTITY_TITLES[e]} : en attente, non créées (${m.pending.length})\n`);
    out.push(
      table(
        ['Page Fandom', 'Raison', 'Candidats api-onepiece (id : nom, score ou indice)'],
        m.pending.map((p) => [
          p.title,
          p.reason === 'ambiguous' ? 'nom ambigu' : 'candidats fuzzy',
          p.candidates.map((c) => `${c.apiId} : ${c.label} (${c.via === 'fruit' ? 'même fruit' : c.score})`).join(' ; '),
        ]),
      ),
    );
    out.push(`### ${ENTITY_TITLES[e]} : api-onepiece sans page Fandom (${m.apiOnly.length})\n`);
    out.push(table(['Slug', 'Id api-onepiece', 'Nom'], m.apiOnly.map((id) => [slugOf(e, API_ONEPIECE_SOURCE, id), id, labels.api.get(id)])));
    out.push(`### ${ENTITY_TITLES[e]} : Fandom sans équivalent api-onepiece, créées (${m.fandomOnly.length})\n`);
    out.push(
      table(
        ['Slug', 'Page Fandom', 'Raison'],
        m.fandomOnly.map((f) => [slugOf(e, FANDOM_SOURCE, f.pageId), labels.fandom.get(f.pageId), ALONE_REASONS[f.how]]),
      ),
    );
  }

  const fuzzy = MATCHED_ENTITIES.flatMap((e) =>
    model.matches[e].fuzzy.map((f) => [e, f.apiId, f.label, f.title, f.via === 'fruit' ? `${f.score} (même fruit)` : f.score]),
  );
  out.push(`## Candidats fuzzy (${fuzzy.length})\n`);
  out.push(
    `Paires approchantes (nom à score ≥ 0,8, ou même fruit du démon) entre une entité api-onepiece et une page Fandom, toutes deux non rapprochées. ` +
      'À valider à la main : un alias les rapproche, un alias `api-onepiece: null` crée la page seule.\n',
  );
  out.push(table(['Entité', 'Id api-onepiece', 'Nom api-onepiece', 'Page Fandom', 'Score'], fuzzy));

  // Conflits, regroupés par champ.
  out.push(`## Conflits entre sources (${model.conflicts.length})\n`);
  out.push('Valeur retenue selon `config/field-priority.yaml` ; une correction dans `overrides/corrections.yaml` clôt le conflit.\n');
  const groups = new Map<string, ReconcileModel['conflicts']>();
  for (const c of model.conflicts) {
    const k = `${c.entity}.${c.field}`;
    groups.set(k, [...(groups.get(k) ?? []), c]);
  }
  for (const [field, list] of [...groups].sort(([a], [b]) => compareCodepoints(a, b))) {
    out.push(`### ${field} (${list.length})\n`);
    out.push(
      table(
        ['Slug', 'Retenu', 'Autres sources'],
        [...list]
          .sort((a, b) => compareCodepoints(a.slug, b.slug))
          .map((c) => [c.slug, `${c.chosen.value} (${c.chosen.source})`, c.others.map((o) => `${o.value} (${o.source})`).join(' ; ')]),
      ),
    );
  }

  const occurrences = model.unresolved.reduce((n, u) => n + u.count, 0);
  out.push(`## Références Fandom non résolues (${model.unresolved.length} cibles, ${occurrences} occurrences)\n`);
  out.push(
    'Lien d\'infobox vers une page qui n\'est ni un équipage, ni un fruit, ni un personnage, ni un lieu connu ' +
      '(organisations sans Crew Box, mers, pages en attente) : la relation est ignorée.\n',
  );
  out.push(table(['Champ', 'Cible', 'Occurrences'], model.unresolved.map((u) => [u.field, u.target, u.count])));

  out.push(`## Anomalies de réconciliation (${model.issues.length})\n`);
  out.push(table(['Type', 'Entité', 'Nom', 'Détail'], model.issues.map((i) => [i.kind, i.entity, i.label, i.detail])));

  out.push(`## Corrections manuelles appliquées (${model.corrections.length})\n`);
  out.push(
    table(
      ['Entité', 'Slug', 'Champ', 'Avant', 'Après', 'Raison', 'Date'],
      model.corrections.map((c) => [c.entity, c.slug, c.field, JSON.stringify(c.previous), JSON.stringify(c.value), c.reason, c.date]),
    ),
  );
  return out;
}

/** Contrôle de cohérence : membres actuels du Chapeau de paille, fruits et primes actuels. */
export async function strawHatSection(db: Executor, model: ReconcileModel): Promise<string[]> {
  const out = ['## Contrôle : équipage du Chapeau de paille\n'];
  const crew = model.entities.crews.find((c) => c.label === STRAW_HAT_PAGE);
  if (!crew || crew.canonId === null) {
    out.push(`**Équipage introuvable** (page Fandom « ${STRAW_HAT_PAGE} » absente ou non chargée).\n`);
    return out;
  }
  const members = await db
    .select({ id: characters.id, slug: characters.slug, status: characters.status, role: characterAffiliations.role })
    .from(characterAffiliations)
    .innerJoin(characters, eq(characters.id, characterAffiliations.characterId))
    .where(and(eq(characterAffiliations.crewId, crew.canonId), eq(characterAffiliations.isCurrent, true)));
  const ids = members.map((m) => m.id);
  const fruits = ids.length === 0 ? [] : await db
    .select({ characterId: characterFruits.characterId, slug: devilFruits.slug })
    .from(characterFruits)
    .innerJoin(devilFruits, eq(devilFruits.id, characterFruits.fruitId))
    .where(and(inArray(characterFruits.characterId, ids), eq(characterFruits.isCurrent, true)));
  const current = ids.length === 0 ? [] : await db
    .select({ characterId: bounties.characterId, amount: bounties.amountBerry })
    .from(bounties)
    .where(and(inArray(bounties.characterId, ids), eq(bounties.isCurrent, true)));

  const ok = members.length === STRAW_HAT_MEMBERS && members.every((m) => current.some((b) => b.characterId === m.id));
  out.push(
    `Équipage \`${crew.slug}\` : **${members.length} membres actuels** (attendu : ${STRAW_HAT_MEMBERS}), ` +
      `${fruits.length} fruits actuels, ${current.length} primes actuelles. ${ok ? 'Contrôle **OK**.' : '**À vérifier.**'}\n`,
  );
  out.push(
    table(
      ['Membre', 'Rôle', 'Statut', 'Fruit actuel', 'Prime actuelle (berry)'],
      [...members]
        .sort((a, b) => compareCodepoints(a.slug, b.slug))
        .map((m) => [
          m.slug,
          m.role,
          m.status,
          fruits.filter((f) => f.characterId === m.id).map((f) => f.slug).join(', '),
          current.find((b) => b.characterId === m.id)?.amount.toLocaleString('en-US') ?? '',
        ]),
    ),
  );
  return out;
}

/** Entités canon qu'aucune source ne porte plus (source disparue, alias tardif) : jamais supprimées. */
export async function orphanSection(db: Executor, model: ReconcileModel): Promise<string[]> {
  const rows: unknown[][] = [];
  for (const entity of ENTITY_NAMES) {
    const known = new Set(model.entities[entity].map((e) => e.canonId));
    const t = ENTITY_TABLES[entity];
    for (const r of await db.select({ id: t.id, slug: t.slug }).from(t)) if (!known.has(r.id)) rows.push([entity, r.slug]);
  }
  rows.sort((a, b) => compareCodepoints(String(a[0]), String(b[0])) || compareCodepoints(String(a[1]), String(b[1])));
  return [
    `## Entités canon sans source (${rows.length})\n`,
    'Plus portées par aucune source : conservées (slug publié), à traiter à la main.\n',
    table(['Entité', 'Slug'], rows),
  ];
}
