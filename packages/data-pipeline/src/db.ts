import type { Database } from '@jolly-rogue/db';

/** Base ou transaction en cours : les fonctions d'écriture acceptent les deux. */
export type Executor = Database | Parameters<Parameters<Database['transaction']>[0]>[0];
