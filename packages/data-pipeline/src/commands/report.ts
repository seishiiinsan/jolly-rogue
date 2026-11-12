import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createDb } from '@jolly-rogue/db';
import { exportsDir } from '../config.js';
import { buildReport } from '../report/report.js';
import type { CommandContext } from './types.js';

export async function reportCommand({ databaseUrl }: CommandContext): Promise<void> {
  const { db, client } = createDb(databaseUrl, { max: 1, onnotice: () => {} });
  try {
    const target = path.join(exportsDir(), 'report.md');
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, await buildReport(db), 'utf8');
    console.log(`report : ${target}`);
  } finally {
    await client.end();
  }
}
