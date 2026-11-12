import type { CombatUnitInfo } from '@jolly-rogue/engine';
import type { Archetype } from '@jolly-rogue/game-data';
import { Application, Assets, Container, Graphics, Sprite, Text, type Texture } from 'pixi.js';
import type { Beat, Fx } from './timeline.js';

/**
 * Scène de combat PixiJS : mer de nuit, ponts de navire, lanternes, cartes à cadre épais,
 * élans, impacts, particules, chiffres et tremblement de caméra. Pilotée uniquement par les temps
 * du journal (`Beat`) : elle ne calcule aucune règle, elle affiche les valeurs lues.
 */
const W = 1280;
const H = 720;
const CARD_W = 124;
const CARD_H = 124;
const ROW_Y = { enemy: { back: 86, front: 220 }, player: { front: 500, back: 634 } } as const;

const GOLD = 0xd9a441;
const INK = 0x0d0a08;
const PAPER = 0xf1e4c4;

export interface StageUnit {
  info: CombatUnitInfo;
  name: string;
  /** Couleur de faction (0xRRGGBB). */
  color: number;
  boss: boolean;
  /** Illustration locale de l'utilisateur, si elle existe. */
  image: string | undefined;
}

export interface StageOptions {
  storm: boolean;
  background: string | undefined;
  skillName(id: string): string;
}

export interface Stage {
  /** Joue un temps du journal ; `duration` en ms à la vitesse courante. */
  play(beat: Beat, duration: number): void;
  /** Affiche directement un état final (bouton « passer »). */
  finish(states: Record<string, { hp: number; shield: number; dead: boolean }>, victory: boolean): void;
  destroy(): void;
}

interface Tween {
  elapsed: number;
  duration: number;
  update(t: number): void;
  done?(): void;
}

interface Card {
  unit: StageUnit;
  root: Container;
  home: { x: number; y: number };
  bars: Graphics;
  hpText: Text;
  status: Text;
  flash: Graphics;
  hp: number;
  shield: number;
  dead: boolean;
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const mix = (a: number, b: number, t: number): number =>
  (Math.round(lerp((a >> 16) & 255, (b >> 16) & 255, t)) << 16) |
  (Math.round(lerp((a >> 8) & 255, (b >> 8) & 255, t)) << 8) |
  Math.round(lerp(a & 255, b & 255, t));
const easeOut = (t: number): number => 1 - (1 - t) * (1 - t);

/** Couvre-chef générique par archétype, dessiné en formes simples (aucun trait de personnage). */
function drawSilhouette(g: Graphics, archetype: Archetype, cx: number, top: number, boss: boolean): void {
  const s = boss ? 1.15 : 1;
  const headY = top + 26;
  g.circle(cx, headY, 13 * s).fill({ color: INK, alpha: 0.85 });
  g.ellipse(cx, top + 66, 40 * s, 24 * s).fill({ color: INK, alpha: 0.85 });
  if (archetype === 'sabre') {
    g.poly([cx - 14, headY - 6, cx + 14, headY - 6, cx + 14, headY - 1, cx - 14, headY - 1]).fill({ color: INK });
    g.poly([cx + 13, headY - 5, cx + 24, headY - 1, cx + 14, headY + 3]).fill({ color: INK });
  } else if (archetype === 'tir') {
    g.poly([cx - 24, headY - 8, cx, headY - 20, cx + 24, headY - 8, cx, headY - 11]).fill({ color: INK });
  } else if (archetype === 'soutien') {
    g.poly([cx - 16, headY + 4, cx - 15, headY - 14, cx, headY - 21, cx + 15, headY - 14, cx + 16, headY + 4, cx + 11, headY - 9, cx - 11, headY - 9]).fill({ color: INK });
  } else {
    g.poly([cx - 20, top + 50, cx - 10, top + 40, cx - 6, top + 50]).fill({ color: INK });
    g.poly([cx + 20, top + 50, cx + 10, top + 40, cx + 6, top + 50]).fill({ color: INK });
  }
}

export async function createStage(host: HTMLElement, units: StageUnit[], options: StageOptions): Promise<Stage> {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const app = new Application();
  await app.init({
    resizeTo: host,
    backgroundColor: 0x070b16,
    antialias: true,
    resolution: Math.min(2, window.devicePixelRatio || 1),
    autoDensity: true,
    preference: ['webgl', 'canvas'],
  });
  host.append(app.canvas);
  app.canvas.setAttribute('aria-hidden', 'true');

  // Illustrations locales : chargées avant de dessiner ; un fichier illisible retombe sur la silhouette.
  const textures = new Map<string, Texture>();
  const urls = [...new Set([...units.flatMap((u) => (u.image ? [u.image] : [])), ...(options.background ? [options.background] : [])])];
  await Promise.all(
    urls.map(async (url) => {
      try {
        textures.set(url, await Assets.load<Texture>(url));
      } catch {
        // Image absente ou invalide : on garde le rendu procédural.
      }
    }),
  );

  const world = new Container();
  app.stage.addChild(world);
  const backdrop = new Container();
  const decks = new Container();
  const cardsLayer = new Container();
  const fxLayer = new Container();
  const overlay = new Container();
  world.addChild(backdrop, decks, cardsLayer, fxLayer, overlay);

  const layout = (): void => {
    const scale = Math.min(app.screen.width / W, app.screen.height / H);
    world.scale.set(scale);
    world.position.set((app.screen.width - W * scale) / 2, (app.screen.height - H * scale) / 2);
  };
  layout();
  app.renderer.on('resize', layout);

  // --- Décor ---------------------------------------------------------------------
  const skyTop = options.storm ? 0x11161d : 0x050816;
  const skyBottom = options.storm ? 0x34414a : 0x1b2b55;
  const seaColors = options.storm ? [0x26343c, 0x1b272e, 0x121b21] : [0x15305a, 0x0f2447, 0x0a1934];
  const sky = new Graphics();
  for (let i = 0; i < 24; i++) sky.rect(-200, (i * H) / 24, W + 400, H / 24 + 1).fill(mix(skyTop, skyBottom, i / 23));
  backdrop.addChild(sky);

  const background = options.background ? textures.get(options.background) : undefined;
  const stars: { g: Graphics; phase: number }[] = [];
  const waves = [new Graphics(), new Graphics(), new Graphics()];
  if (background) {
    const sprite = new Sprite(background);
    const cover = Math.max(W / background.width, H / background.height);
    sprite.scale.set(cover);
    sprite.position.set((W - background.width * cover) / 2, (H - background.height * cover) / 2);
    backdrop.addChild(sprite, new Graphics().rect(0, 0, W, H).fill({ color: 0x000000, alpha: 0.35 }));
  } else {
    if (!options.storm) {
      for (let i = 0; i < 90; i++) {
        const g = new Graphics().circle(0, 0, 0.6 + ((i * 7) % 10) / 9).fill(0xffffff);
        g.position.set((i * 197) % W, ((i * 89) % 300) + 4);
        backdrop.addChild(g);
        stars.push({ g, phase: i * 1.7 });
      }
      const moon = new Graphics();
      for (let i = 4; i >= 1; i--) moon.circle(1080, 110, 34 + i * 20).fill({ color: 0xcfe0ff, alpha: 0.05 });
      moon.circle(1080, 110, 34).fill(0xeef3ff).circle(1068, 100, 7).fill({ color: 0xb9c6e6, alpha: 0.5 });
      backdrop.addChild(moon);
    }
    backdrop.addChild(...waves);
  }

  const drawWaves = (time: number): void => {
    waves.forEach((g, layer) => {
      const base = 250 + layer * 60;
      const amp = 7 + layer * 3;
      const len = 150 + layer * 50;
      g.clear().moveTo(-20, H + 20).lineTo(-20, base);
      for (let x = -20; x <= W + 20; x += 20) {
        g.lineTo(x, base + Math.sin(x / len + time * (0.9 + layer * 0.35) * (layer % 2 ? -1 : 1)) * amp);
      }
      g.lineTo(W + 20, H + 20).closePath().fill(seaColors[layer] ?? 0x0a1934);
    });
  };
  drawWaves(0);

  const lanterns: { g: Graphics; phase: number }[] = [];
  const drawDeck = (y: number, enemy: boolean): void => {
    const wood = enemy ? 0x2b1a1c : 0x3b2716;
    const woodLight = enemy ? 0x3a2326 : 0x4d3420;
    const g = new Graphics();
    g.roundRect(120, y + 10, W - 240, 276, 26).fill({ color: 0x000000, alpha: 0.45 });
    g.roundRect(110, y, W - 220, 272, 26).fill(wood).stroke({ width: 5, color: 0x120b07 });
    for (let x = 110 + 74; x < W - 110; x += 74) g.rect(x, y + 4, 2, 264).fill({ color: 0x000000, alpha: 0.35 });
    for (let row = 0; row < 4; row++) g.rect(114, y + 20 + row * 66, W - 228, 22).fill({ color: woodLight, alpha: 0.22 });
    g.roundRect(110, y, W - 220, 272, 26).stroke({ width: 2, color: GOLD, alpha: enemy ? 0.25 : 0.55 });
    decks.addChild(g);
    for (const x of [146, W - 146]) {
      const post = new Graphics().rect(x - 3, y + 14, 6, 34).fill(0x120b07).roundRect(x - 9, y + 6, 18, 20, 4).fill(0xffc45a).stroke({ width: 2, color: 0x120b07 });
      const glow = new Graphics();
      for (let i = 5; i >= 1; i--) glow.circle(x, y + 16, i * 22).fill({ color: enemy ? 0xff7a4a : 0xffc45a, alpha: 0.045 });
      glow.blendMode = 'add';
      decks.addChild(glow, post);
      lanterns.push({ g: glow, phase: x + y });
    }
  };
  drawDeck(14, true);
  drawDeck(428, false);

  const rain = new Graphics();
  const lightning = new Graphics().rect(-200, -200, W + 400, H + 400).fill(0xffffff);
  lightning.alpha = 0;
  if (options.storm) overlay.addChild(rain, lightning);

  // --- Cartes --------------------------------------------------------------------
  const cards = new Map<string, Card>();
  const text = (value: string, size: number, fill: number, bold = true): Text =>
    new Text({ text: value, style: { fontFamily: 'Georgia, "Times New Roman", serif', fontSize: size, fill, fontWeight: bold ? '700' : '400', align: 'center' } });

  const drawBars = (card: Card): void => {
    const max = Math.max(1, card.unit.info.maxHp);
    const w = CARD_W - 20;
    const x = -w / 2;
    const y = CARD_H / 2 - 30;
    card.bars.clear().roundRect(x, y, w, 9, 3).fill(0x1a120c);
    const ratio = card.hp / max;
    if (ratio > 0) card.bars.roundRect(x, y, w * ratio, 9, 3).fill(ratio > 0.5 ? 0x4fb26a : ratio > 0.25 ? 0xd9a441 : 0xd2493a);
    if (card.shield > 0) card.bars.roundRect(x, y - 4, w * Math.min(1, card.shield / max), 3, 1).fill(0x6fb7e8);
    card.bars.roundRect(x, y, w, 9, 3).stroke({ width: 1, color: 0x000000, alpha: 0.7 });
    card.hpText.text = `${card.hp}${card.shield > 0 ? ` +${card.shield}` : ''}`;
  };

  const rows = new Map<string, StageUnit[]>();
  for (const u of units) {
    const key = `${u.info.side}:${u.info.row}`;
    rows.set(key, [...(rows.get(key) ?? []), u]);
  }
  for (const [key, list] of rows) {
    const [side, row] = key.split(':') as ['player' | 'enemy', 'front' | 'back'];
    list.forEach((unit, i) => {
      const x = W / 2 + (i - (list.length - 1) / 2) * 152;
      const y = ROW_Y[side][row];
      const root = new Container();
      root.position.set(x, y);
      const frameColor = unit.boss ? 0xc23b3b : unit.info.kind === 'enemy' ? 0x7c7468 : GOLD;
      const frame = new Graphics()
        .roundRect(-CARD_W / 2 + 3, -CARD_H / 2 + 5, CARD_W, CARD_H, 9)
        .fill({ color: 0x000000, alpha: 0.5 })
        .roundRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 9)
        .fill(0x1c130d)
        .stroke({ width: 5, color: frameColor })
        .roundRect(-CARD_W / 2 + 5, -CARD_H / 2 + 5, CARD_W - 10, CARD_H - 10, 5)
        .stroke({ width: 1, color: 0x000000, alpha: 0.8 });
      const artW = CARD_W - 14;
      const artH = 62;
      const artX = -artW / 2;
      const artY = -CARD_H / 2 + 7;
      const mask = new Graphics().roundRect(artX, artY, artW, artH, 4).fill(0xffffff);
      const art = new Container();
      const texture = unit.image ? textures.get(unit.image) : undefined;
      if (texture) {
        const sprite = new Sprite(texture);
        const cover = Math.max(artW / texture.width, artH / texture.height);
        sprite.scale.set(cover);
        sprite.position.set(artX + (artW - texture.width * cover) / 2, artY + (artH - texture.height * cover) / 2);
        art.addChild(sprite);
      } else {
        const g = new Graphics().rect(artX, artY, artW, artH).fill(mix(unit.color, 0x000000, 0.25));
        g.circle(0, artY + 30, 36).fill({ color: 0xffffff, alpha: 0.12 });
        drawSilhouette(g, unit.info.archetype, 0, artY, unit.boss);
        art.addChild(g);
      }
      art.mask = mask;
      const name = text(unit.name.toUpperCase(), 10.5, PAPER);
      name.style.wordWrap = true;
      name.style.wordWrapWidth = CARD_W - 16;
      name.style.lineHeight = 11;
      name.anchor.set(0.5, 0);
      name.position.set(0, artY + artH + 2);
      const bars = new Graphics();
      const hpText = text('', 10, PAPER, false);
      hpText.anchor.set(0.5, 0);
      hpText.position.set(0, CARD_H / 2 - 20);
      const status = text('', 10, 0xffd27a);
      status.anchor.set(0.5, 1);
      status.position.set(0, -CARD_H / 2 - 3);
      const flash = new Graphics().roundRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 9).fill(0xffffff);
      flash.alpha = 0;
      const level = unit.info.level > 1 ? text('★'.repeat(unit.info.level), 12, GOLD) : null;
      if (level) {
        level.anchor.set(1, 0);
        level.position.set(artX + artW - 3, artY + 2);
      }
      root.addChild(frame, art, mask, name, bars, hpText, status, ...(level ? [level] : []), flash);
      cardsLayer.addChild(root);
      const card: Card = { unit, root, home: { x, y }, bars, hpText, status, flash, hp: unit.info.maxHp, shield: 0, dead: false };
      drawBars(card);
      cards.set(unit.info.id, card);
    });
  }

  const banner = text('', 34, 0xffe2a0);
  banner.anchor.set(0.5);
  banner.position.set(W / 2, 360);
  banner.style.stroke = { color: 0x000000, width: 6 };
  banner.alpha = 0;
  overlay.addChild(banner);

  // --- Animation -------------------------------------------------------------------
  const tweens: Tween[] = [];
  const tween = (duration: number, update: (t: number) => void, done?: () => void): void => {
    tweens.push({ elapsed: 0, duration: Math.max(1, duration), update, ...(done ? { done } : {}) });
  };
  let shake = 0;
  let time = 0;
  let nextLightning = 3;

  app.ticker.add((ticker) => {
    const dt = ticker.deltaMS;
    time += dt / 1000;
    if (!reduced) {
      if (!background) drawWaves(time);
      for (const s of stars) s.g.alpha = 0.45 + 0.55 * Math.abs(Math.sin(time * 0.8 + s.phase));
      for (const l of lanterns) l.g.alpha = 0.85 + 0.15 * Math.sin(time * 9 + l.phase) * Math.sin(time * 3.1 + l.phase);
      if (options.storm) {
        rain.clear();
        for (let i = 0; i < 70; i++) {
          const x = (i * 173 + time * 260) % (W + 200) - 100;
          const y = (i * 97 + time * 900) % (H + 80) - 40;
          rain.moveTo(x, y).lineTo(x - 8, y + 26);
        }
        rain.stroke({ width: 1.2, color: 0xcfe2f0, alpha: 0.35 });
        nextLightning -= dt / 1000;
        if (nextLightning <= 0) {
          nextLightning = 4 + ((time * 7) % 5);
          lightning.alpha = 0.5;
        }
        lightning.alpha = Math.max(0, lightning.alpha - dt / 260);
      }
    }
    for (let i = tweens.length - 1; i >= 0; i--) {
      const t = tweens[i] as Tween;
      t.elapsed += dt;
      const p = Math.min(1, t.elapsed / t.duration);
      t.update(p);
      if (p >= 1) {
        tweens.splice(i, 1);
        t.done?.();
      }
    }
    shake = Math.max(0, shake - dt / 28);
    const scale = world.scale.x;
    world.pivot.set(reduced ? 0 : (Math.sin(time * 71) * shake) / scale, reduced ? 0 : (Math.cos(time * 53) * shake) / scale);
  });

  const floatText = (card: Card, value: string, color: number, size = 22): void => {
    const label = text(value, size, color);
    label.style.stroke = { color: 0x000000, width: 4 };
    label.anchor.set(0.5);
    label.position.set(card.home.x + (Math.sin(time * 40) * 14), card.home.y - 34);
    fxLayer.addChild(label);
    tween(900, (t) => {
      label.y = card.home.y - 34 - 46 * easeOut(t);
      label.alpha = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
      label.scale.set(1 + 0.35 * Math.max(0, 1 - t * 4));
    }, () => label.destroy());
  };

  const burst = (card: Card, color: number, count: number, up = false): void => {
    if (reduced) return;
    for (let i = 0; i < count; i++) {
      const p = new Graphics().circle(0, 0, 2 + (i % 3)).fill(color);
      const angle = (i / count) * Math.PI * 2 + i;
      const speed = 50 + ((i * 37) % 60);
      const vx = Math.cos(angle) * speed;
      const vy = up ? -70 - ((i * 17) % 50) : Math.sin(angle) * speed;
      p.position.set(card.home.x + (up ? ((i * 23) % 80) - 40 : 0), card.home.y + (up ? 30 : 0));
      p.blendMode = 'add';
      fxLayer.addChild(p);
      const x0 = p.x;
      const y0 = p.y;
      tween(520 + (i % 4) * 60, (t) => {
        p.position.set(x0 + vx * t, y0 + vy * t + (up ? 0 : 70 * t * t));
        p.alpha = 1 - t;
      }, () => p.destroy());
    }
  };

  const showBanner = (value: string, duration: number, size = 34): void => {
    banner.text = value;
    banner.style.fontSize = size;
    tween(duration, (t) => {
      banner.alpha = t < 0.15 ? t / 0.15 : t > 0.75 ? Math.max(0, 1 - (t - 0.75) / 0.25) : 1;
      banner.scale.set(1 + 0.25 * Math.max(0, 1 - t * 5));
    });
  };

  const kill = (card: Card, instant = false): void => {
    if (card.dead) return;
    card.dead = true;
    card.status.text = '';
    const dir = card.unit.info.side === 'player' ? 1 : -1;
    const apply = (t: number): void => {
      card.root.alpha = 1 - 0.72 * t;
      card.root.rotation = -0.22 * dir * t;
      card.root.y = card.home.y + 14 * t;
      card.root.tint = mix(0xffffff, 0x555555, t);
    };
    if (instant || reduced) apply(1);
    else tween(450, (t) => apply(easeOut(t)));
  };

  const applyFx = (fx: Fx): void => {
    const card = cards.get(fx.unit);
    if (!card) return;
    switch (fx.type) {
      case 'damage': {
        card.hp = fx.hp;
        card.shield = fx.shield;
        const strength = Math.min(1, (fx.amount + fx.absorbed) / Math.max(1, card.unit.info.maxHp));
        if (fx.amount > 0) floatText(card, `−${fx.amount}`, 0xff6b5a, 20 + Math.round(16 * strength));
        else floatText(card, `bouclier −${fx.absorbed}`, 0x8fd0ff, 15);
        burst(card, fx.amount > 0 ? 0xffb347 : 0x8fd0ff, 6 + Math.round(10 * strength));
        shake = Math.max(shake, 3 + 14 * strength);
        tween(240, (t) => {
          card.flash.alpha = 0.75 * (1 - t);
          card.root.x = card.home.x + (reduced ? 0 : Math.sin(t * 28) * 6 * (1 - t));
        });
        break;
      }
      case 'heal':
        card.hp = fx.hp;
        if (fx.amount > 0) floatText(card, `+${fx.amount}`, 0x7fe08f);
        burst(card, 0x7fe08f, 8, true);
        break;
      case 'shield':
        card.shield = fx.shield;
        floatText(card, `bouclier +${fx.amount}`, 0x8fd0ff, 15);
        burst(card, 0x8fd0ff, 8, true);
        break;
      case 'stun':
        card.status.text = '✦ étourdi ✦';
        floatText(card, 'étourdi', 0xffd27a, 15);
        break;
      case 'buff':
        floatText(card, `ATK +${fx.pct} %`, 0xffd27a, 15);
        burst(card, GOLD, 8, true);
        break;
      case 'death':
        kill(card);
        break;
    }
    drawBars(card);
  };

  return {
    play(beat, duration) {
      if (beat.kind === 'round') {
        showBanner(`Tour ${beat.round}`, duration, 22);
        return;
      }
      if (beat.kind === 'end') {
        showBanner(beat.outcome === 'victory' ? 'Victoire !' : 'Défaite…', 4000, 54);
        for (const fx of beat.fx) applyFx(fx);
        return;
      }
      if (beat.kind === 'start') {
        for (const fx of beat.fx) applyFx(fx);
        return;
      }
      const actor = cards.get(beat.actor);
      if (beat.kind === 'skip') {
        if (actor) {
          actor.status.text = '';
          floatText(actor, 'passe son tour', 0xffd27a, 14);
          tween(duration * 0.8, (t) => {
            actor.root.rotation = reduced ? 0 : Math.sin(t * Math.PI * 4) * 0.08 * (1 - t);
          });
        }
        return;
      }
      const skill = beat.kind === 'trigger' || beat.skill ? options.skillName(beat.kind === 'trigger' ? beat.skill : (beat.skill ?? '')) : null;
      if (skill) showBanner(skill, duration * 0.95, 30);
      const target = beat.kind === 'action' ? cards.get(beat.target) : undefined;
      let applied = false;
      const impact = (): void => {
        if (applied) return;
        applied = true;
        for (const fx of beat.fx) applyFx(fx);
      };
      if (!actor || actor.dead || reduced) {
        impact();
        return;
      }
      cardsLayer.addChild(actor.root);
      if (target) {
        // Élan vers la cible, impact, retour.
        const dx = (target.home.x - actor.home.x) * 0.55;
        const dy = (target.home.y - actor.home.y) * 0.55;
        tween(duration * 0.8, (t) => {
          const k = t < 0.4 ? easeOut(t / 0.4) : 1 - easeOut((t - 0.4) / 0.6);
          actor.root.position.set(actor.home.x + dx * k, actor.home.y + dy * k);
          actor.root.scale.set(1 + (skill ? 0.22 : 0.1) * k);
          if (t >= 0.4) impact();
        }, () => {
          impact();
          if (!actor.dead) actor.root.position.set(actor.home.x, actor.home.y);
        });
      } else {
        tween(duration * 0.7, (t) => {
          actor.root.scale.set(1 + 0.18 * Math.sin(t * Math.PI));
          if (t >= 0.35) impact();
        }, impact);
      }
    },
    finish(states, victory) {
      tweens.length = 0;
      fxLayer.removeChildren().forEach((child) => child.destroy());
      for (const [id, state] of Object.entries(states)) {
        const card = cards.get(id);
        if (!card) continue;
        card.hp = state.hp;
        card.shield = state.shield;
        card.status.text = '';
        card.flash.alpha = 0;
        card.root.scale.set(1);
        card.root.position.set(card.home.x, card.home.y);
        if (state.dead) kill(card, true);
        drawBars(card);
      }
      banner.text = victory ? 'Victoire !' : 'Défaite…';
      banner.style.fontSize = 54;
      banner.alpha = 1;
      banner.scale.set(1);
    },
    destroy() {
      app.destroy(true, { children: true });
    },
  };
}
