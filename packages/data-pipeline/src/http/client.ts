import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

/** Réponse HTTP telle que servie par le client (réseau ou cache disque). */
export interface CachedResponse {
  url: string;
  status: number;
  body: string;
  /** Date ISO de la collecte réseau d'origine (conservée quand la réponse vient du cache). */
  fetchedAt: string;
}

export interface HttpResult extends CachedResponse {
  fromCache: boolean;
}

export interface HttpClientOptions {
  cacheDir: string;
  userAgent: string;
  /** Ne lit que le cache : une URL absente du cache lève une erreur. */
  offline?: boolean;
  /** Ignore le cache en lecture (il est réécrit après la requête). */
  refresh?: boolean;
  /** Intervalle minimal entre deux requêtes vers un même domaine. Défaut : 1 000 ms. */
  minIntervalMs?: number;
  /** Timeout d'une tentative. Défaut : 30 s. */
  timeoutMs?: number;
  /** Nombre de nouvelles tentatives sur 429, 5xx ou erreur réseau. Défaut : 4. */
  maxRetries?: number;
  /** Délai de base du backoff exponentiel. Défaut : 1 000 ms. */
  retryBaseMs?: number;
  fetch?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
  log?: (message: string) => void;
}

export class HttpError extends Error {
  constructor(
    message: string,
    readonly url: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export class OfflineCacheMissError extends Error {
  constructor(readonly url: string) {
    super(`--offline : réponse absente du cache pour ${url}`);
    this.name = 'OfflineCacheMissError';
  }
}

/** Nom du fichier de cache : sha256 de l'URL (clé = URL, docs/cadrage.md §9.3). */
export function cacheKey(url: string): string {
  return createHash('sha256').update(url).digest('hex');
}

const isRetryableStatus = (status: number): boolean => status === 429 || status >= 500;

/**
 * Client HTTP unique du pipeline : cache disque, 1 requête/s max par domaine,
 * User-Agent explicite, retry exponentiel sur 429/5xx, timeout, mode hors ligne.
 * Seules les réponses 2xx sont mises en cache.
 */
export class HttpClient {
  private readonly opts: Required<Omit<HttpClientOptions, 'log'>> & { log: (m: string) => void };
  /** Par domaine : file d'attente (sérialise les requêtes) et instant de la dernière requête. */
  private readonly hosts = new Map<string, { queue: Promise<void>; lastAt: number }>();

  constructor(options: HttpClientOptions) {
    this.opts = {
      offline: false,
      refresh: false,
      minIntervalMs: 1000,
      timeoutMs: 30_000,
      maxRetries: 4,
      retryBaseMs: 1000,
      fetch: globalThis.fetch.bind(globalThis),
      sleep: (ms) => delay(ms),
      now: () => Date.now(),
      log: () => {},
      ...options,
    };
  }

  async get(url: string): Promise<HttpResult> {
    if (!this.opts.refresh || this.opts.offline) {
      const cached = await this.readCache(url);
      if (cached) return { ...cached, fromCache: true };
      if (this.opts.offline) throw new OfflineCacheMissError(url);
    }
    const response = await this.withHostSlot(url, () => this.fetchWithRetry(url));
    await this.writeCache(response);
    return { ...response, fromCache: false };
  }

  private cachePath(url: string): string {
    return path.join(this.opts.cacheDir, `${cacheKey(url)}.json`);
  }

  private async readCache(url: string): Promise<CachedResponse | undefined> {
    let text: string;
    try {
      text = await readFile(this.cachePath(url), 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
      throw error;
    }
    const entry = JSON.parse(text) as CachedResponse;
    if (entry.url !== url) throw new Error(`Cache corrompu : ${this.cachePath(url)} ne correspond pas à ${url}`);
    return entry;
  }

  private async writeCache(entry: CachedResponse): Promise<void> {
    await mkdir(this.opts.cacheDir, { recursive: true });
    const target = this.cachePath(entry.url);
    // Écriture atomique : un fichier à moitié écrit ne doit jamais être lu comme une réponse valide.
    const tmp = `${target}.${process.pid}.tmp`;
    await writeFile(tmp, `${JSON.stringify(entry)}\n`, 'utf8');
    await rename(tmp, target);
  }

  /** Exécute `task` quand le domaine de `url` est disponible (une requête à la fois, espacées). */
  private async withHostSlot<T>(url: string, task: () => Promise<T>): Promise<T> {
    const host = new URL(url).host;
    const state = this.hosts.get(host) ?? { queue: Promise.resolve(), lastAt: Number.NEGATIVE_INFINITY };
    this.hosts.set(host, state);

    const run = state.queue.then(async () => {
      const wait = state.lastAt + this.opts.minIntervalMs - this.opts.now();
      if (wait > 0) await this.opts.sleep(wait);
      try {
        return await task();
      } finally {
        state.lastAt = this.opts.now();
      }
    });
    state.queue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  /** Chaque tentative (y compris les retries) respecte l'intervalle par domaine. */
  private async fetchWithRetry(url: string): Promise<CachedResponse> {
    const host = new URL(url).host;
    for (let attempt = 0; ; attempt++) {
      let retryAfterMs: number | undefined;
      let failure: string;
      try {
        const response = await this.opts.fetch(url, {
          headers: { 'User-Agent': this.opts.userAgent, Accept: 'application/json' },
          signal: AbortSignal.timeout(this.opts.timeoutMs),
        });
        const body = await response.text();
        if (response.ok) {
          return { url, status: response.status, body, fetchedAt: new Date(this.opts.now()).toISOString() };
        }
        if (!isRetryableStatus(response.status)) {
          throw new HttpError(`HTTP ${response.status} pour ${url}`, url, response.status);
        }
        retryAfterMs = parseRetryAfter(response.headers.get('retry-after'), this.opts.now());
        failure = `HTTP ${response.status}`;
        if (attempt >= this.opts.maxRetries) {
          throw new HttpError(`HTTP ${response.status} pour ${url} après ${attempt + 1} tentatives`, url, response.status);
        }
      } catch (error) {
        if (error instanceof HttpError) throw error;
        // Erreur réseau ou timeout : on réessaie.
        failure = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
        if (attempt >= this.opts.maxRetries) {
          throw new HttpError(`Échec réseau pour ${url} après ${attempt + 1} tentatives (${failure})`, url);
        }
      }
      const backoff = this.opts.retryBaseMs * 2 ** attempt;
      // Jitter ±25 % pour ne pas synchroniser les retries ; le pipeline n'a pas besoin d'être déterministe ici.
      const jittered = backoff * (0.75 + Math.random() * 0.5);
      const wait = Math.max(retryAfterMs ?? 0, jittered, this.opts.minIntervalMs);
      this.opts.log(`http: ${failure} sur ${host}, nouvelle tentative dans ${Math.round(wait)} ms`);
      await this.opts.sleep(wait);
    }
  }
}

/** `Retry-After` en secondes ou en date HTTP. */
export function parseRetryAfter(value: string | null, now: number): number | undefined {
  if (value === null) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(value);
  return Number.isNaN(date) ? undefined : Math.max(0, date - now);
}
