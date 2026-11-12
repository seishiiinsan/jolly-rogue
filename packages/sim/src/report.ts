import type { GameData } from '@jolly-rogue/game-data';
import type { Bot } from './bots.js';
import type { RunSummary } from './simulate.js';

/** Hypothèses de durée à l'écran (vitesse x1), écrites dans le rapport. */
export const TIMING = {
  secondsPerAction: 0.6,
  secondsPerRecruit: 12,
  secondsPerPlacement: 5,
  targetMinMinutes: 10,
  targetMaxMinutes: 15,
} as const;

/** Seuils des signaux d'alerte. */
export const ALERTS = {
  /** Un perso (ou une synergie) dont la vague moyenne dépasse celle du bot de ce ratio. */
  dominanceRatio: 1.25,
  /** Échantillon minimal pour qu'un écart compte. */
  minSample: 30,
  /** Vague « mur » : plus de cette part des parties qui l'atteignent y meurent. */
  wallRate: 0.5,
  /** Vague « gratuite » : passé la vague 3, moins de cette part y meurt… */
  freeRate: 0.005,
} as const;

export interface BotResult {
  bot: Bot;
  runs: RunSummary[];
}

const fmt = (n: number, digits = 1): string => n.toFixed(digits);
const pct = (n: number): string => `${fmt(100 * n)} %`;
const mean = (values: number[]): number => (values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length);

/** Quantile par rang le plus proche, sur des valeurs triées. */
const quantile = (sorted: number[], q: number): number =>
  sorted.length === 0 ? 0 : (sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] as number);

const table = (headers: string[], rows: (string | number)[][]): string =>
  [`| ${headers.join(' | ')} |`, `| ${headers.map(() => '---').join(' | ')} |`, ...rows.map((r) => `| ${r.join(' | ')} |`)].join('\n');

export const runMinutes = (run: RunSummary): number =>
  (run.combatActions * TIMING.secondsPerAction +
    run.offers * TIMING.secondsPerRecruit +
    (run.wavesCleared + 1) * TIMING.secondsPerPlacement) /
  60;

/** Rapport Markdown, sans horodatage : deux exécutions identiques donnent le même fichier. */
export function renderReport(results: BotResult[], data: GameData, runs: number, seedFrom: number): string {
  const out: string[] = [];
  const alerts: string[] = [];

  out.push('# Rapport du simulateur d\'équilibrage', '');
  out.push(
    `Généré par \`sim\` : ${runs} parties par bot, seeds ${seedFrom} à ${seedFrom + runs - 1}, données de jeu v${data.schemaVersion}. Fichier régénéré, ne pas éditer à la main.`,
    '',
  );

  out.push('## Bots', '');
  out.push(table(['Bot', 'Stratégie'], results.map((r) => [`\`${r.bot.name}\``, r.bot.description])), '');

  out.push('## Vagues gagnées par bot', '');
  out.push(
    table(
      ['Bot', 'Moyenne', 'D1', 'D2', 'D3', 'D4', 'Médiane', 'D6', 'D7', 'D8', 'D9', 'Max'],
      results.map((r) => {
        const sorted = r.runs.map((x) => x.wavesCleared).sort((a, b) => a - b);
        return [
          `\`${r.bot.name}\``,
          fmt(mean(sorted)),
          ...[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map((q) => quantile(sorted, q)),
          sorted.at(-1) ?? 0,
        ];
      }),
    ),
    '',
  );

  out.push('## Durée estimée d\'une partie', '');
  out.push(
    `Hypothèses (vitesse x1) : ${TIMING.secondsPerAction} s par action de combat, ${TIMING.secondsPerRecruit} s par choix de recrue, ${TIMING.secondsPerPlacement} s de placement par vague. Cible : ${TIMING.targetMinMinutes} à ${TIMING.targetMaxMinutes} minutes.`,
    '',
  );
  out.push(
    table(
      ['Bot', 'Moyenne (min)', 'Médiane (min)', 'D9 (min)', 'Dans la cible'],
      results.map((r) => {
        const minutes = r.runs.map(runMinutes).sort((a, b) => a - b);
        const inTarget = minutes.filter((m) => m >= TIMING.targetMinMinutes && m <= TIMING.targetMaxMinutes).length;
        return [`\`${r.bot.name}\``, fmt(mean(minutes)), fmt(quantile(minutes, 0.5)), fmt(quantile(minutes, 0.9)), pct(inTarget / minutes.length)];
      }),
    ),
    '',
  );

  out.push('## Mortalité par vague', '');
  out.push('Part des parties qui atteignent la vague et y sont éliminées (tous bots confondus, puis par bot).', '');
  const allRuns = results.flatMap((r) => r.runs);
  const maxWave = Math.min(40, Math.max(...allRuns.map((r) => r.wavesCleared)) + 1);
  const deathRate = (set: RunSummary[], wave: number): { reached: number; rate: number } => {
    const reached = set.filter((r) => r.wavesCleared >= wave - 1).length;
    const died = set.filter((r) => r.wavesCleared === wave - 1).length;
    return { reached, rate: reached === 0 ? 0 : died / reached };
  };
  const waveRows: (string | number)[][] = [];
  for (let wave = 1; wave <= maxWave; wave++) {
    const all = deathRate(allRuns, wave);
    waveRows.push([
      wave % data.waves.boss.every === 0 ? `**${wave} (boss)**` : wave,
      all.reached,
      pct(all.rate),
      ...results.map((r) => {
        const d = deathRate(r.runs, wave);
        return d.reached === 0 ? '–' : pct(d.rate);
      }),
    ]);
    if (all.reached >= ALERTS.minSample * results.length) {
      if (all.rate > ALERTS.wallRate) alerts.push(`Vague ${wave} : mur, ${pct(all.rate)} des parties qui l'atteignent y sont éliminées.`);
      if (wave > 3 && all.rate < ALERTS.freeRate) alerts.push(`Vague ${wave} : trop facile, ${pct(all.rate)} d'éliminations.`);
    }
  }
  out.push(table(['Vague', 'Parties', 'Tous', ...results.map((r) => `\`${r.bot.name}\``)], waveRows), '');

  for (const r of results) {
    const botMean = mean(r.runs.map((x) => x.wavesCleared));
    out.push(`## Bot \`${r.bot.name}\``, '');

    out.push('### Par perso', '');
    out.push('Taux de recrutement = fois recruté / fois proposé. Vague moyenne = vagues gagnées quand le perso est dans l\'équipe finale.', '');
    const characterRows = data.characters.map((c) => {
      const offered = r.runs.reduce((sum, x) => sum + (x.offered.get(c.slug) ?? 0), 0);
      const recruited = r.runs.reduce((sum, x) => sum + (x.recruited.get(c.slug) ?? 0), 0);
      const withIt = r.runs.filter((x) => x.finalTeam.some((m) => m.slug === c.slug));
      const avg = mean(withIt.map((x) => x.wavesCleared));
      if (withIt.length >= ALERTS.minSample && avg > botMean * ALERTS.dominanceRatio) {
        alerts.push(`Bot \`${r.bot.name}\` : \`${c.slug}\` dans l'équipe finale → ${fmt(avg)} vagues en moyenne contre ${fmt(botMean)} (×${fmt(avg / botMean, 2)}).`);
      }
      return [`\`${c.slug}\``, c.rarity, offered, offered === 0 ? '–' : pct(recruited / offered), withIt.length, withIt.length === 0 ? '–' : fmt(avg)];
    });
    out.push(table(['Perso', 'Rareté', 'Proposé', 'Taux de recrutement', 'Équipes finales', 'Vague moyenne'], characterRows), '');

    out.push('### Par faction et palier de synergie', '');
    const synergyRows: (string | number)[][] = [];
    for (const s of data.synergies) {
      for (const tier of [0, ...s.tiers.map((t) => t.count)]) {
        const withIt = r.runs.filter((x) => (x.finalSynergies.find((f) => f.faction === s.faction)?.tier ?? 0) === tier);
        const avg = mean(withIt.map((x) => x.wavesCleared));
        if (tier > 0 && withIt.length >= ALERTS.minSample && avg > botMean * ALERTS.dominanceRatio) {
          alerts.push(`Bot \`${r.bot.name}\` : synergie \`${s.faction}\` palier ${tier} → ${fmt(avg)} vagues en moyenne contre ${fmt(botMean)} (×${fmt(avg / botMean, 2)}).`);
        }
        synergyRows.push([`\`${s.faction}\``, tier === 0 ? 'aucun' : tier, withIt.length, withIt.length === 0 ? '–' : fmt(avg)]);
      }
    }
    out.push(table(['Faction', 'Palier atteint', 'Équipes finales', 'Vague moyenne'], synergyRows), '');
  }

  out.push('## Signaux d\'alerte', '');
  out.push(
    `Seuils : vague moyenne > ×${ALERTS.dominanceRatio} de celle du bot (échantillon ≥ ${ALERTS.minSample}), mur > ${pct(ALERTS.wallRate)} d'éliminations, vague trop facile < ${pct(ALERTS.freeRate)} après la vague 3. Une corrélation n'est pas une cause : un perso légendaire arrive tard, donc surtout dans les parties déjà longues.`,
    '',
  );
  out.push(alerts.length === 0 ? '_Aucun._' : alerts.map((a) => `- ${a}`).join('\n'), '');

  return out.join('\n');
}
