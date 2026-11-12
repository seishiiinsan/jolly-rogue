import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createDb } from '@jolly-rogue/db';
import { exportsDir } from '../config.js';
import { buildCanonExport, serializeCanonExport } from '../export/canon-json.js';
import type { CommandContext } from './types.js';

export async function exportCommand({ databaseUrl }: CommandContext): Promise<void> {
  const { db, client } = createDb(databaseUrl, { max: 1, onnotice: () => {} });
  try {
    const data = await buildCanonExport(db);
    const target = path.join(exportsDir(), 'canon.json');
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, serializeCanonExport(data), 'utf8');
    console.log(
      `export : ${target} (${data.characters.length} personnages, ${data.crews.length} équipages, ` +
        `${data.devilFruits.length} fruits, ${data.locations.length} lieux, ${data.sagas.length} sagas, ${data.arcs.length} arcs)`,
    );
  } finally {
    await client.end();
  }
}
