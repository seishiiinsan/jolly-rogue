import type { CombatEvent, CombatUnitInfo } from '@jolly-rogue/engine';
import { ARCHETYPE_LABEL, archetypeIcon, characterName, characterOf, enemyName, enemyOf, esc, factionStyle, skillOf } from './content.js';
import { portrait } from './portrait.js';
import { type Beat, type Fx, type UnitState, applyBeat, buildTimeline, describeBeat, finalStates, initialStates } from './timeline.js';

/** Durée d'un temps d'animation à vitesse ×1, en millisecondes. */
const BEAT_MS = 600;

const unitName = (u: CombatUnitInfo): string => (u.kind === 'character' ? characterName(u.ref) : enemyName(u.ref));

function unitHtml(u: CombatUnitInfo): string {
  const style = factionStyle(u.kind === 'character' ? characterOf(u.ref).faction : null);
  return `
    <div class="unit" data-id="${u.id}" style="--faction:${style.color}">
      <div class="unit-art">${portrait({ key: u.ref, name: unitName(u), archetype: u.archetype, color: style.color, boss: u.kind === 'enemy' && enemyOf(u.ref).boss === true })}
        <span class="unit-head"><span aria-hidden="true">${style.mark}</span> ${archetypeIcon(u.archetype)}<span class="sr-only">${ARCHETYPE_LABEL[u.archetype]}</span></span>
      </div>
      <div class="unit-name">${esc(unitName(u))}${u.level > 1 ? ` <span class="card-level">${'★'.repeat(u.level)}</span>` : ''}</div>
      <div class="bar" role="img" aria-label="Points de vie"><div class="bar-hp"></div><div class="bar-shield"></div></div>
      <div class="unit-hp"></div>
      <div class="unit-status" aria-live="off"></div>
    </div>`;
}

export interface CombatViewOptions {
  wave: number;
  events: readonly CombatEvent[];
  onContinue(): void;
}

/** Rejoue un combat à l'écran depuis son journal. Renvoie une fonction de nettoyage. */
export function mountCombat(root: HTMLElement, options: CombatViewOptions): () => void {
  const timeline = buildTimeline(options.events);
  const states = initialStates(timeline.units);
  const names = new Map(timeline.units.map((u) => [u.id, unitName(u)]));
  const labels = { unit: (id: string) => names.get(id) ?? id, skill: (id: string) => skillOf(id).name };
  const end = timeline.beats.at(-1);
  const victory = end?.kind === 'end' && end.outcome === 'victory';

  const row = (side: 'player' | 'enemy', r: 'front' | 'back'): string =>
    `<div class="battle-row" data-label="${r === 'front' ? 'Ligne avant' : 'Ligne arrière'}">${timeline.units
      .filter((u) => u.side === side && u.row === r)
      .map(unitHtml)
      .join('')}</div>`;

  root.innerHTML = `
    <section class="screen combat" aria-label="Combat">
      <header class="bar-top">
        <h1>Vague ${options.wave}</h1>
        <div class="combat-controls">
          <button type="button" data-speed="1" aria-pressed="true">×1</button>
          <button type="button" data-speed="2" aria-pressed="false">×2</button>
          <button type="button" data-testid="combat-skip" data-skip>Passer</button>
        </div>
      </header>
      <div class="combat-layout">
        <div class="battlefield">
          <div class="side side-enemy deck"><span class="deck-label">Pont ennemi</span>${row('enemy', 'back')}${row('enemy', 'front')}</div>
          <div class="banner" aria-live="polite"></div>
          <div class="side side-player deck"><span class="deck-label">Ton pont</span>${row('player', 'front')}${row('player', 'back')}</div>
        </div>
        <aside class="log" aria-label="Journal du combat"><ol></ol></aside>
      </div>
      <footer class="combat-result" hidden>
        <p class="result-text ${victory ? 'win' : 'lose'}">${victory ? 'Victoire !' : 'Défaite…'}</p>
        <button type="button" class="primary" data-testid="combat-continue" data-continue>${victory ? 'Recruter' : 'Voir le résultat'}</button>
      </footer>
    </section>`;

  const el = (id: string): HTMLElement | null => root.querySelector<HTMLElement>(`.unit[data-id="${id}"]`);
  const banner = root.querySelector<HTMLElement>('.banner');
  const log = root.querySelector<HTMLOListElement>('.log ol');
  const result = root.querySelector<HTMLElement>('.combat-result');

  const paint = (id: string, state: UnitState): void => {
    const node = el(id);
    if (!node) return;
    node.querySelector<HTMLElement>('.bar-hp')?.style.setProperty('width', `${(100 * state.hp) / Math.max(1, state.maxHp)}%`);
    node.querySelector<HTMLElement>('.bar-shield')?.style.setProperty('width', `${Math.min(100, (100 * state.shield) / Math.max(1, state.maxHp))}%`);
    const hp = node.querySelector<HTMLElement>('.unit-hp');
    if (hp) hp.textContent = `${state.hp} / ${state.maxHp}${state.shield > 0 ? ` (+${state.shield})` : ''}`;
    const status = node.querySelector<HTMLElement>('.unit-status');
    if (status) status.textContent = [state.stunned ? 'Étourdi' : '', state.buffPct > 0 ? `ATK +${state.buffPct} %` : ''].filter(Boolean).join(' · ');
    node.classList.toggle('dead', state.dead);
  };
  const paintAll = (all: Record<string, UnitState>): void => {
    for (const [id, state] of Object.entries(all)) paint(id, state);
  };
  paintAll(states);

  const appendLog = (beat: Beat): void => {
    if (!log) return;
    for (const line of describeBeat(beat, labels)) {
      const li = document.createElement('li');
      li.textContent = line;
      if (!line.startsWith('  ')) li.className = 'log-head';
      log.append(li);
    }
    log.parentElement?.scrollTo({ top: log.parentElement.scrollHeight });
  };

  const float = (fx: Fx): void => {
    const node = el(fx.unit);
    if (!node) return;
    const text =
      fx.type === 'damage'
        ? fx.amount > 0
          ? `−${fx.amount}`
          : `bouclier −${fx.absorbed}`
        : fx.type === 'heal'
          ? `+${fx.amount}`
          : fx.type === 'shield'
            ? `bouclier +${fx.amount}`
            : fx.type === 'stun'
              ? 'étourdi'
              : fx.type === 'buff'
                ? `ATK +${fx.pct} %`
                : '';
    if (!text) return;
    const span = document.createElement('span');
    span.className = `float float-${fx.type}`;
    span.textContent = text;
    node.append(span);
    span.addEventListener('animationend', () => span.remove());
    if (fx.type === 'damage') {
      node.classList.remove('hit');
      // Relance l'animation de secousse.
      void node.offsetWidth;
      node.classList.add('hit');
    }
  };

  let speed = 1;
  let index = 0;
  let timer: number | undefined;
  let finished = false;

  const finish = (): void => {
    finished = true;
    window.clearTimeout(timer);
    root.querySelectorAll('.acting').forEach((n) => n.classList.remove('acting'));
    if (banner) banner.textContent = '';
    if (result) result.hidden = false;
    root.querySelector<HTMLButtonElement>('[data-continue]')?.focus();
  };

  const step = (): void => {
    const beat = timeline.beats[index];
    if (!beat) {
      finish();
      return;
    }
    index += 1;
    root.querySelectorAll('.acting').forEach((n) => n.classList.remove('acting'));
    if (beat.kind === 'action' || beat.kind === 'trigger' || beat.kind === 'skip') el(beat.actor)?.classList.add('acting');
    if (banner) {
      banner.textContent =
        beat.kind === 'round'
          ? `Tour ${beat.round}`
          : (beat.kind === 'action' || beat.kind === 'trigger') && beat.skill
            ? `${labels.unit(beat.actor)} — ${labels.skill(beat.skill)}`
            : '';
    }
    applyBeat(states, beat);
    for (const fx of beat.fx) {
      float(fx);
      const state = states[fx.unit];
      if (state) paint(fx.unit, state);
    }
    if (beat.kind === 'skip') {
      const state = states[beat.actor];
      if (state) paint(beat.actor, state);
    }
    appendLog(beat);
    timer = window.setTimeout(step, (BEAT_MS * beat.ticks) / speed);
  };

  const skip = (): void => {
    if (finished) return;
    window.clearTimeout(timer);
    for (const beat of timeline.beats.slice(index)) appendLog(beat);
    index = timeline.beats.length;
    paintAll(finalStates(timeline));
    finish();
  };

  const onClick = (event: Event): void => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('button');
    if (!target) return;
    if (target.dataset['speed']) {
      speed = Number(target.dataset['speed']);
      root.style.setProperty('--speed', String(speed));
      root.querySelectorAll<HTMLElement>('[data-speed]').forEach((b) => b.setAttribute('aria-pressed', String(b === target)));
    } else if ('skip' in target.dataset) skip();
    else if ('continue' in target.dataset) options.onContinue();
  };
  root.addEventListener('click', onClick);
  timer = window.setTimeout(step, 300);

  return () => {
    window.clearTimeout(timer);
    root.removeEventListener('click', onClick);
    root.style.removeProperty('--speed');
  };
}
