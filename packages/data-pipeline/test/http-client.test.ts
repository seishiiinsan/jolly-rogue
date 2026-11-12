import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { HttpClient, type HttpClientOptions, HttpError, OfflineCacheMissError, parseRetryAfter } from '../src/http/client.js';

/** Horloge virtuelle : `sleep` avance le temps sans attendre. */
function fakeClock() {
  let now = 1_000_000;
  const sleeps: number[] = [];
  return {
    now: () => now,
    sleep: async (ms: number) => {
      sleeps.push(ms);
      now += ms;
    },
    sleeps,
  };
}

type Reply = { status: number; body?: string; headers?: Record<string, string> } | Error;

function fakeFetch(replies: Reply[]) {
  const calls: { url: string; userAgent: string | null }[] = [];
  const fn = (async (input: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(input), userAgent: new Headers(init?.headers).get('user-agent') });
    const reply = replies.shift();
    if (!reply) throw new Error('aucune réponse prévue');
    if (reply instanceof Error) throw reply;
    return new Response(reply.body ?? '', { status: reply.status, headers: reply.headers });
  }) as typeof fetch;
  return { fn, calls };
}

describe('HttpClient', () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'http-client-'));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const client = (fetchFn: typeof fetch, clock: ReturnType<typeof fakeClock>, extra: Partial<HttpClientOptions> = {}) =>
    new HttpClient({ cacheDir: dir, userAgent: 'test-agent/1.0', fetch: fetchFn, now: clock.now, sleep: clock.sleep, ...extra });

  it('met en cache (clé = URL) et envoie le User-Agent', async () => {
    const clock = fakeClock();
    const { fn, calls } = fakeFetch([{ status: 200, body: '[1]' }]);
    const http = client(fn, clock);
    const first = await http.get('https://a.test/x');
    const second = await http.get('https://a.test/x');
    expect(first).toMatchObject({ status: 200, body: '[1]', fromCache: false });
    expect(second).toMatchObject({ status: 200, body: '[1]', fromCache: true, fetchedAt: first.fetchedAt });
    expect(calls).toEqual([{ url: 'https://a.test/x', userAgent: 'test-agent/1.0' }]);
  });

  it('--offline : lit le cache, erreur si absent, aucune requête', async () => {
    const clock = fakeClock();
    await client(fakeFetch([{ status: 200, body: 'ok' }]).fn, clock).get('https://a.test/x');
    const { fn, calls } = fakeFetch([]);
    const offline = client(fn, clock, { offline: true });
    expect((await offline.get('https://a.test/x')).body).toBe('ok');
    await expect(offline.get('https://a.test/y')).rejects.toBeInstanceOf(OfflineCacheMissError);
    expect(calls).toEqual([]);
  });

  it('--refresh : ignore le cache en lecture', async () => {
    const clock = fakeClock();
    await client(fakeFetch([{ status: 200, body: 'v1' }]).fn, clock).get('https://a.test/x');
    const refreshed = await client(fakeFetch([{ status: 200, body: 'v2' }]).fn, clock, { refresh: true }).get('https://a.test/x');
    expect(refreshed).toMatchObject({ body: 'v2', fromCache: false });
    expect((await client(fakeFetch([]).fn, clock, { offline: true }).get('https://a.test/x')).body).toBe('v2');
  });

  it('1 requête/s max par domaine, domaines indépendants', async () => {
    const clock = fakeClock();
    const { fn } = fakeFetch([
      { status: 200, body: '1' },
      { status: 200, body: '2' },
      { status: 200, body: '3' },
      { status: 200, body: '4' },
    ]);
    const http = client(fn, clock);
    await Promise.all([http.get('https://a.test/1'), http.get('https://a.test/2'), http.get('https://a.test/3')]);
    expect(clock.sleeps).toEqual([1000, 1000]);
    await http.get('https://b.test/1');
    expect(clock.sleeps).toEqual([1000, 1000]);
  });

  it('retry exponentiel sur 429 (Retry-After respecté) et 503, puis succès', async () => {
    const clock = fakeClock();
    const { fn, calls } = fakeFetch([
      { status: 429, headers: { 'retry-after': '5' } },
      { status: 503 },
      { status: 200, body: 'ok' },
    ]);
    const result = await client(fn, clock, { retryBaseMs: 1000 }).get('https://a.test/x');
    expect(result.body).toBe('ok');
    expect(calls).toHaveLength(3);
    expect(clock.sleeps[0]).toBe(5000);
    // 2e tentative : 2 000 ms ±25 %.
    expect(clock.sleeps[1]).toBeGreaterThanOrEqual(1500);
    expect(clock.sleeps[1]).toBeLessThanOrEqual(2500);
  });

  it('retry sur erreur réseau, abandon après maxRetries', async () => {
    const clock = fakeClock();
    const { fn, calls } = fakeFetch([new TypeError('fetch failed'), { status: 500 }, { status: 500 }]);
    await expect(client(fn, clock, { maxRetries: 2 }).get('https://a.test/x')).rejects.toThrow(/HTTP 500.*3 tentatives/);
    expect(calls).toHaveLength(3);
  });

  it('pas de retry ni de cache sur 404', async () => {
    const clock = fakeClock();
    const { fn, calls } = fakeFetch([{ status: 404 }]);
    const http = client(fn, clock);
    await expect(http.get('https://a.test/x')).rejects.toBeInstanceOf(HttpError);
    expect(calls).toHaveLength(1);
    await expect(client(fakeFetch([]).fn, clock, { offline: true }).get('https://a.test/x')).rejects.toBeInstanceOf(
      OfflineCacheMissError,
    );
  });

  it('parseRetryAfter : secondes ou date HTTP', () => {
    expect(parseRetryAfter('3', 0)).toBe(3000);
    expect(parseRetryAfter(new Date(10_000).toUTCString(), 4000)).toBe(6000);
    expect(parseRetryAfter(null, 0)).toBeUndefined();
  });
});
