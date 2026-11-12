import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Choice, replay } from '@jolly-rogue/engine';
import { type GameData, gameDataSchema } from '@jolly-rogue/game-data';
import { type Page, expect, test } from '@playwright/test';

const here = path.dirname(fileURLToPath(import.meta.url));
const data: GameData = gameDataSchema.parse(JSON.parse(readFileSync(path.resolve(here, '../../../data/exports/game.json'), 'utf8')));

const NOTICE = 'Fan game non officiel, non commercial, non affilié aux ayants droit.';
const SEED = 2026;

/**
 * Choix scriptés : toujours la première recrue (« Aucun » si l'équipe est pleine et que ce n'est
 * pas une fusion), un échange de places avant la vague 2, puis la vague est lancée.
 */
async function playScriptedRun(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByText(NOTICE)).toBeVisible();
  await page.getByTestId('toggle-seed').click();
  await page.getByTestId('seed-input').fill(String(SEED));
  await page.getByTestId('play-seed').click();

  let swapped = false;
  for (let guard = 0; guard < 400; guard++) {
    if (await page.getByTestId('end-score').isVisible()) return;
    await expect(page.getByText(NOTICE)).toBeVisible();

    if (await page.getByTestId('offer-0').isVisible()) {
      const fusion = (await page.getByTestId('offer-0').locator('.card-badge', { hasText: 'Fusion' }).count()) > 0;
      const full = (await page.locator('[data-testid^="member-"]').count()) >= data.rules.team.max;
      if (full && !fusion) await page.getByTestId('skip').click();
      else await page.getByTestId('offer-0').click();
      continue;
    }
    if (await page.getByTestId('start-wave').isVisible()) {
      if (!swapped && (await page.getByTestId('waves-cleared').textContent()) === '1') {
        await page.getByTestId('member-0').click();
        await page.getByTestId('member-1').click();
        swapped = true;
      }
      await page.getByTestId('start-wave').click();
      await page.getByTestId('combat-skip').click();
      await page.getByTestId('combat-continue').click();
    }
  }
  throw new Error('la partie ne se termine pas');
}

test('une partie complète sur une seed fixe : score identique au rejeu du moteur', async ({ page }) => {
  await playScriptedRun(page);

  await expect(page.getByRole('heading', { name: 'Fin de la traversée' })).toBeVisible();
  await expect(page.getByText(NOTICE)).toBeVisible();
  await expect(page.getByTestId('end-seed')).toHaveText(String(SEED));

  // La partie exportée (seed + choix) rejouée par le moteur donne le score affiché.
  const exported = JSON.parse(await page.getByTestId('export-json').inputValue()) as { seed: number; choices: Choice[] };
  expect(exported.seed).toBe(SEED);
  expect(exported.choices.some((c) => c.type === 'swap')).toBe(true);
  expect(exported.choices.some((c) => c.type === 'recruit')).toBe(true);
  const replayed = replay(exported.seed, data, exported.choices);
  expect(replayed.ok).toBe(true);
  expect(replayed.state.phase).toBe('over');
  await expect(page.getByTestId('end-score')).toHaveText(String(replayed.state.score));
  await expect(page.getByTestId('end-waves')).toHaveText(String(replayed.state.wavesCleared));
  expect(replayed.state.wavesCleared).toBeGreaterThanOrEqual(5);

  // Coffre de fin de partie : ses cartes rejoignent la collection, qui survit au rechargement.
  const chestCards = await page.getByTestId('chest').locator('.card').count();
  expect(chestCards).toBeGreaterThanOrEqual(1);
  const fresh = await page.getByTestId('chest').locator('.card-badge', { hasText: 'Nouvelle' }).count();
  expect(fresh).toBeGreaterThanOrEqual(1);
  await page.reload();
  await page.getByTestId('open-collection').click();
  await expect(page.locator('[data-owned="true"]')).toHaveCount(fresh);
  await expect(page.getByTestId('collection-count')).toHaveText(`${fresh} / ${data.characters.length}`);
  await expect(page.locator('[data-owned="false"]').first()).toContainText('???');
});

test('le combat se rejoue à l\'écran, avec vitesse ×2 et journal textuel', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('toggle-seed').click();
  await page.getByTestId('seed-input').fill('2');
  await page.getByTestId('play-seed').click();
  await page.getByTestId('start-wave').click();
  await page.getByRole('button', { name: '×2' }).click();
  await expect(page.getByTestId('combat-continue')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('Victoire !')).toBeVisible();
  await expect(page.locator('.log')).toContainText('Victoire en 3 tours.');
  await expect(page.locator('.unit.dead')).toHaveCount(2);
  await page.getByTestId('combat-continue').click();
  await expect(page.getByTestId('score')).toHaveText('1999');
  await expect(page.getByTestId('offer-0')).toContainText('Portgas D. Ace');
});

test('accueil : seed invalide refusée, page À propos avec sources et licences', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('toggle-seed').click();
  await page.getByTestId('seed-input').fill('pas-une-seed');
  await page.getByTestId('play-seed').click();
  await expect(page.getByRole('alert')).toContainText('Seed invalide');
  await page.getByRole('button', { name: 'À propos' }).first().click();
  await expect(page.getByRole('heading', { name: 'À propos' })).toBeVisible();
  await expect(page.getByText('CC BY-SA').first()).toBeVisible();
  await expect(page.getByText(NOTICE).first()).toBeVisible();
  await page.getByRole('button', { name: 'Retour' }).click();
  await expect(page.getByTestId('new-run')).toBeVisible();
});
