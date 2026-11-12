import {
  type Choice,
  type CombatEvent,
  ENGINE_VERSION,
  type RunState,
  applyChoice,
  createRun,
  isBossWave,
  isValidSeed,
  rarityChances,
  teamCombatants,
  teamSynergies,
} from '@jolly-rogue/engine';
import { cardBody, cardClass, characterCard, enemyCard } from './cards.js';
import { mountCombat } from './combat-view.js';
import { type ChestResult, COLLECTION_RULES, type Collection, craftCard, loadCollection, openChest, saveCollection } from './collection.js';
import { type Mood, sceneHtml, shipSvg, waveStyles } from './scene.js';
import { FAN_GAME_NOTICE, RARITY_LABEL, bonusText, canonSources, characterName, characterOf, esc, factionName, factionStyle, gameData } from './content.js';

type Screen = 'home' | 'game' | 'combat' | 'end' | 'about' | 'collection';

interface AppState {
  screen: Screen;
  /** Écran d'où l'on a ouvert « À propos ». */
  back: Screen;
  run: RunState | null;
  /** Tous les choix de la partie, dans l'ordre : avec la seed, ils suffisent à la rejouer. */
  choices: Choice[];
  /** Perso sélectionné pour un déplacement ou un échange. */
  selected: number | null;
  /** Offre choisie alors que l'équipe est pleine : en attente du perso à remplacer. */
  pendingOffer: number | null;
  combat: { wave: number; events: CombatEvent[] } | null;
  message: string | null;
  /** Champ de seed déplié sur l'accueil. */
  seedOpen: boolean;
  /** Coffre de la partie qui vient de finir. */
  chest: ChestResult | null;
}

/** Stockage local, s'il est disponible (il peut être bloqué en navigation privée). */
const storage = (): Storage | undefined => {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
};

/** Aléatoire des coffres : distinct de la partie, jamais le RNG du moteur (cadrage §8). */
const chestRand = (n: number): number => {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return Math.floor(((buffer[0] ?? 0) * n) / 0x100000000);
};

/** Seul aléatoire du front : la seed d'une nouvelle partie. */
const randomSeed = (): number => {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0] ?? 0;
};

export function startApp(root: HTMLElement): void {
  const state: AppState = { screen: 'home', back: 'home', run: null, choices: [], selected: null, pendingOffer: null, combat: null, message: null, seedOpen: false, chest: null };
  let collection: Collection = loadCollection(storage());
  let unmountCombat: (() => void) | null = null;

  const style = document.createElement('style');
  style.textContent = waveStyles();
  document.head.append(style);
  root.insertAdjacentHTML('beforeend', sceneHtml());
  const view = document.createElement('main');
  const footer = document.createElement('footer');
  footer.className = 'notice';
  footer.innerHTML = `<span>${esc(FAN_GAME_NOTICE)}</span> <button type="button" class="link" data-action="about">À propos</button>`;
  root.append(view, footer);

  // --- Actions -----------------------------------------------------------------

  const newRun = (seed: number): void => {
    state.run = createRun(seed, gameData).state;
    state.choices = [];
    state.selected = null;
    state.pendingOffer = null;
    state.combat = null;
    state.message = null;
    state.chest = null;
    state.screen = 'game';
  };

  /** Fin de partie : ouvre le coffre (une seule fois) et sauvegarde la collection. */
  const finishRun = (run: RunState): void => {
    if (state.chest) return;
    state.chest = openChest(collection, run.wavesCleared, run.score, gameData, chestRand);
    collection = state.chest.collection;
    saveCollection(storage(), collection);
  };

  /** Envoie un choix au moteur ; le front n'applique aucune règle lui-même. */
  const choose = (choice: Choice): void => {
    if (!state.run) return;
    const result = applyChoice(state.run, choice, gameData);
    if (!result.ok) {
      state.message = result.error.message;
      return;
    }
    state.run = result.state;
    state.choices.push(choice);
    state.selected = null;
    state.pendingOffer = null;
    state.message = null;
    for (const event of result.events) {
      if (event.type === 'combat') {
        state.combat = { wave: event.wave, events: event.events };
        state.screen = 'combat';
      }
    }
  };

  const exportJson = (): string =>
    JSON.stringify({ seed: state.run?.seed, engineVersion: ENGINE_VERSION, gameDataVersion: gameData.schemaVersion, choices: state.choices });

  const onAction = (action: string, data: DOMStringMap, target: HTMLElement): void => {
    const run = state.run;
    switch (action) {
      case 'new-run':
        newRun(randomSeed());
        break;
      case 'play-seed': {
        const input = root.querySelector<HTMLInputElement>('#seed');
        const seed = Number(input?.value.trim());
        if (input?.value.trim() === '' || !isValidSeed(seed)) state.message = 'Seed invalide : un entier entre 0 et 4294967295.';
        else newRun(seed);
        break;
      }
      case 'home':
        state.screen = 'home';
        state.message = null;
        state.seedOpen = false;
        break;
      case 'toggle-seed':
        state.seedOpen = !state.seedOpen;
        state.message = null;
        break;
      case 'collection':
        state.screen = 'collection';
        break;
      case 'craft': {
        const crafted = craftCard(collection, data['slug'] ?? '', gameData);
        if (crafted) {
          collection = crafted;
          saveCollection(storage(), collection);
        }
        break;
      }
      case 'about':
        if (state.screen !== 'about') state.back = state.screen;
        state.screen = 'about';
        break;
      case 'back':
        state.screen = state.back;
        break;
      case 'start':
        choose({ type: 'start' });
        break;
      case 'skip':
        choose({ type: 'skip' });
        break;
      case 'offer': {
        if (!run?.offer) break;
        const offer = Number(data['index']);
        const slug = run.offer[offer];
        const needsReplace = slug !== undefined && !run.team.some((m) => m.slug === slug) && run.team.length >= gameData.rules.team.max;
        if (needsReplace) {
          state.pendingOffer = state.pendingOffer === offer ? null : offer;
          state.message = null;
        } else choose({ type: 'recruit', offer });
        break;
      }
      case 'member': {
        if (!run) break;
        const index = Number(data['index']);
        if (run.phase === 'recruit') {
          if (state.pendingOffer !== null) choose({ type: 'recruit', offer: state.pendingOffer, replace: index });
        } else if (state.selected === null) state.selected = index;
        else if (state.selected === index) state.selected = null;
        else choose({ type: 'swap', a: state.selected, b: index });
        break;
      }
      case 'move':
        if (run && state.selected !== null) {
          choose({ type: 'move', index: state.selected, row: run.team[state.selected]?.row === 'front' ? 'back' : 'front' });
        }
        break;
      case 'copy': {
        const json = exportJson();
        const done = (): void => {
          target.textContent = 'Copié !';
        };
        // Sans presse-papiers (contexte non sécurisé) : le JSON reste sélectionnable dans la zone de texte.
        if (navigator.clipboard) navigator.clipboard.writeText(json).then(done, () => undefined);
        root.querySelector<HTMLTextAreaElement>('#export')?.select();
        return;
      }
    }
    render();
  };

  root.addEventListener('click', (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (target?.dataset['action']) onAction(target.dataset['action'], target.dataset, target);
  });
  root.addEventListener('submit', (event) => {
    event.preventDefault();
    onAction('play-seed', {}, root);
  });

  // --- Écrans --------------------------------------------------------------------

  const home = (): string => `
    <section class="screen home">
      <div class="home-ship">${shipSvg()}</div>
      <div class="home-card">
        <p class="home-kicker">Auto-battler roguelike</p>
        <h1 class="title">Jolly Rogue</h1>
        <p class="tagline">Recrute un équipage, place-le sur deux lignes et survis au plus de vagues possible : les combats se jouent tout seuls.</p>
        <nav class="menu" aria-label="Menu principal">
          <button type="button" class="primary big" data-action="new-run" data-testid="new-run">Nouvelle traversée</button>
          <button type="button" class="big" data-action="toggle-seed" data-testid="toggle-seed" aria-expanded="${state.seedOpen}">Rejouer une seed</button>
          ${
            state.seedOpen
              ? `<form class="seed-form">
                  <label for="seed" class="sr-only">Seed</label>
                  <input id="seed" name="seed" inputmode="numeric" autocomplete="off" placeholder="ex. 2026" data-testid="seed-input" />
                  <button type="submit" data-testid="play-seed">Jouer</button>
                </form>`
              : ''
          }
          <button type="button" class="big" data-action="collection" data-testid="open-collection">Collection <small>${collection.owned.length} / ${gameData.characters.length}</small></button>
          <button type="button" class="big" data-action="about">À propos</button>
        </nav>
        ${state.message ? `<p class="message" role="alert">${esc(state.message)}</p>` : ''}
        <dl class="stats home-stats">
          <div><dt>Meilleur score</dt><dd>${collection.bestScore}</dd></div>
          <div><dt>Traversées</dt><dd>${collection.runs}</dd></div>
          <div><dt>Fragments</dt><dd>${collection.fragments}</dd></div>
        </dl>
      </div>
      <ul class="rules">
        <li><b>Recrute</b> 1 pirate parmi 3 après chaque victoire. Un pirate déjà à bord <b>fusionne</b>.</li>
        <li><b>Place</b> 5 pirates sur deux lignes : l'avant encaisse, l'arrière est protégé… sauf des tireurs.</li>
        <li><b>Réunis</b> un même équipage pour activer sa synergie. Boss toutes les 10 vagues.</li>
      </ul>
    </section>`;

  const collectionScreen = (): string => {
    const byRarity = (['legendaire', 'rare', 'commun'] as const).map((rarity) => ({
      rarity,
      characters: gameData.characters.filter((c) => c.rarity === rarity),
    }));
    return `
    <section class="screen collection">
      <header class="bar-top">
        <h1>Collection</h1>
        <dl class="stats">
          <div><dt>Cartes</dt><dd data-testid="collection-count">${collection.owned.length} / ${gameData.characters.length}</dd></div>
          <div><dt>Fragments</dt><dd data-testid="collection-fragments">${collection.fragments}</dd></div>
          <div><dt>Coffres ouverts</dt><dd>${collection.chestsOpened}</dd></div>
        </dl>
        <button type="button" data-action="home">Retour</button>
      </header>
      <p class="panel note">Chaque traversée gagnée d'au moins une vague donne un <b>coffre</b> : plus tu vas loin, plus il est gros et riche. Un doublon devient des <b>fragments</b>, échangeables contre la carte de ton choix. Une légendaire est garantie au ${COLLECTION_RULES.pityChests}ᵉ coffre sans en avoir eu (encore ${Math.max(1, COLLECTION_RULES.pityChests - collection.chestsSinceLegendary)}). La collection ne donne <b>aucun avantage en partie</b>.</p>
      ${byRarity
        .map(
          ({ rarity, characters }) => `
        <section class="panel">
          <h2>${RARITY_LABEL[rarity]} <small>${characters.filter((c) => collection.owned.includes(c.slug)).length} / ${characters.length} · carte au choix : ${COLLECTION_RULES.craft[rarity]} fragments</small></h2>
          <div class="cards">
            ${characters
              .map((c) => {
                const card = characterCard(c.slug, 1, c);
                const owned = collection.owned.includes(c.slug);
                const cost = COLLECTION_RULES.craft[c.rarity];
                return `<div class="collect">
                  <div class="${cardClass(card)}${owned ? '' : ' locked'}" data-testid="collect-${c.slug}" data-owned="${owned}">${cardBody(card, { locked: !owned })}</div>
                  ${owned ? '' : `<button type="button" data-action="craft" data-slug="${c.slug}" ${collection.fragments >= cost ? '' : 'disabled'}>Obtenir (${cost})</button>`}
                </div>`;
              })
              .join('')}
          </div>
        </section>`,
        )
        .join('')}
    </section>`;
  };

  const about = (): string => `
    <section class="screen about">
      <h1>À propos</h1>
      <p><b>${esc(FAN_GAME_NOTICE)}</b> Jolly Rogue est un projet de fan gratuit, sans publicité ni achat, inspiré de l'univers de One Piece (Eiichiro Oda / Shueisha). Si vous êtes ayant droit et souhaitez son retrait, il sera retiré.</p>
      <h2>Aucun contenu officiel</h2>
      <p>Le jeu n'utilise aucune image, musique, police, logo ni son officiel. Les cartes sont typographiques ; les icônes d'archétype sont dessinées pour le jeu ; les polices sont celles de votre système.</p>
      <h2>Sources des données</h2>
      <p>Les noms de personnages et d'équipages viennent de :</p>
      <ul>
        ${canonSources
          .map((s) => `<li><a href="${esc(s.url)}" rel="noreferrer">${esc(s.name)}</a>${s.license ? ` — contenu sous licence ${esc(s.license)}` : ''}</li>`)
          .join('')}
      </ul>
      <p>Les textes issus du One Piece Wiki (Fandom) sont sous licence <a href="https://creativecommons.org/licenses/by-sa/3.0/deed.fr" rel="noreferrer">CC BY-SA</a> ; leurs auteurs sont les contributeurs du wiki.</p>
      <p>Les statistiques, raretés, compétences et noms de compétences sont inventés pour le jeu.</p>
      <h2>Vie privée</h2>
      <p>Aucun compte, aucun traceur, aucune donnée envoyée : la partie se joue entièrement dans votre navigateur.</p>
      <button type="button" class="primary" data-action="back">Retour</button>
    </section>`;

  const enemiesPanel = (run: RunState): string => {
    const cards = (row: 'front' | 'back'): string =>
      run.enemies
        .filter((e) => e.row === row)
        .map((e) => {
          const card = enemyCard(e.enemyId, e);
          return `<div class="${cardClass(card)} small">${cardBody(card, { compact: true })}</div>`;
        })
        .join('') || '<span class="empty">—</span>';
    return `
      <section class="panel enemies" aria-label="Prochaine vague">
        <h2>Vague ${run.wave}${isBossWave(run.wave, gameData) ? ' — Boss' : ''}</h2>
        <div class="rows">
          <div class="row"><h3>Ligne arrière</h3><div class="cards">${cards('back')}</div></div>
          <div class="row"><h3>Ligne avant</h3><div class="cards">${cards('front')}</div></div>
        </div>
      </section>`;
  };

  const teamPanel = (run: RunState): string => {
    const stats = teamCombatants(run.team, gameData);
    const replacing = run.phase === 'recruit' && state.pendingOffer !== null;
    const clickable = run.phase === 'prep' || replacing;
    const cards = (row: 'front' | 'back'): string =>
      run.team
        .map((member, index) => ({ member, index }))
        .filter(({ member }) => member.row === row)
        .map(({ member, index }) => {
          const s = stats[index];
          const card = characterCard(member.slug, member.level, { hp: s?.hp ?? 0, atk: s?.atk ?? 0, spd: s?.spd ?? 0 });
          const selected = state.selected === index;
          return `<button type="button" class="${cardClass(card)}${selected ? ' selected' : ''}" data-action="member" data-index="${index}" data-testid="member-${index}" aria-pressed="${selected}" ${clickable ? '' : 'disabled'}>${cardBody(card, { compact: true })}</button>`;
        })
        .join('') || '<span class="empty">Personne</span>';
    const selected = state.selected !== null ? run.team[state.selected] : undefined;
    const hint = replacing
      ? 'Équipe pleine : clique sur le pirate à remplacer.'
      : run.phase === 'prep'
        ? selected
          ? `${characterName(selected.slug)} sélectionné : clique sur un autre pirate pour échanger leurs places.`
          : 'Clique sur un pirate pour le déplacer.'
        : '';
    return `
      <section class="panel team" aria-label="Ton équipage">
        <h2>Ton équipage <small>${run.team.length} / ${gameData.rules.team.max}</small></h2>
        <div class="rows">
          <div class="row"><h3>Ligne avant</h3><div class="cards">${cards('front')}</div></div>
          <div class="row"><h3>Ligne arrière</h3><div class="cards">${cards('back')}</div></div>
        </div>
        <p class="hint">${esc(hint)}
          ${selected && run.phase === 'prep' ? `<button type="button" data-action="move" data-testid="move">Passer en ligne ${selected.row === 'front' ? 'arrière' : 'avant'}</button>` : ''}
        </p>
      </section>`;
  };

  const synergiesPanel = (run: RunState): string => `
    <section class="panel synergies" aria-label="Synergies">
      <h2>Synergies</h2>
      <ul>
        ${teamSynergies(run.team, gameData)
          .map((s) => {
            const style = factionStyle(s.faction);
            const tiers = gameData.synergies.find((x) => x.faction === s.faction)?.tiers ?? [];
            return `<li class="${s.activeTier ? 'active' : ''}" style="--faction:${style.color}">
              <span class="syn-name"><span aria-hidden="true">${style.mark}</span> ${esc(factionName(s.faction))}</span>
              <span class="syn-count">${s.count}${s.nextTier ? ` / ${s.nextTier}` : ''}</span>
              <span class="syn-bonus">${s.activeTier ? esc(bonusText(s.bonuses)) : 'inactive'}</span>
              <span class="syn-tiers">${tiers.map((t) => `${t.count} : ${esc(bonusText(t.bonuses))}`).join(' · ')}</span>
            </li>`;
          })
          .join('')}
      </ul>
    </section>`;

  const offerPanel = (run: RunState): string => {
    const chances = rarityChances(run.wave - 1, gameData);
    return `
      <section class="panel offer" aria-label="Recrutement">
        <h2>Recrute un pirate <small>commun ${chances.commun} % · rare ${chances.rare} % · légendaire ${chances.legendaire} %</small></h2>
        <div class="cards">
          ${(run.offer ?? [])
            .map((slug, index) => {
              const c = characterOf(slug);
              const member = run.team.find((m) => m.slug === slug);
              const card = characterCard(slug, 1, c);
              const badge = member ? `Fusion → niveau ${member.level + 1}` : run.team.length >= gameData.rules.team.max ? 'Remplace un pirate' : undefined;
              const pending = state.pendingOffer === index;
              return `<button type="button" class="${cardClass(card)}${pending ? ' selected' : ''}" data-action="offer" data-index="${index}" data-testid="offer-${index}" aria-pressed="${pending}">${cardBody(card, badge ? { badge } : {})}</button>`;
            })
            .join('')}
        </div>
        <button type="button" data-action="skip" data-testid="skip">Aucun</button>
      </section>`;
  };

  const game = (run: RunState): string => `
    <section class="screen game" data-phase="${run.phase}">
      <header class="bar-top">
        <h1>Jolly Rogue</h1>
        <dl class="stats">
          <div><dt>Vagues gagnées</dt><dd data-testid="waves-cleared">${run.wavesCleared}</dd></div>
          <div><dt>Score</dt><dd data-testid="score">${run.score}</dd></div>
          <div><dt>Seed</dt><dd>${run.seed}</dd></div>
        </dl>
      </header>
      ${state.message ? `<p class="message" role="alert">${esc(state.message)}</p>` : ''}
      <div class="game-layout">
        <div class="col">
          ${enemiesPanel(run)}
          ${teamPanel(run)}
        </div>
        <div class="col">
          ${run.phase === 'recruit' ? offerPanel(run) : ''}
          ${synergiesPanel(run)}
          ${run.phase === 'prep' ? `<button type="button" class="primary big" data-action="start" data-testid="start-wave">Lancer la vague ${run.wave}</button>` : ''}
        </div>
      </div>
    </section>`;

  const chestPanel = (): string => {
    const chest = state.chest;
    if (!chest || chest.cards.length === 0) {
      return '<section class="panel chest"><h2>Pas de coffre</h2><p>Gagne au moins une vague pour ouvrir un coffre.</p></section>';
    }
    return `
      <section class="panel chest" data-testid="chest">
        <h2>Coffre <small>${chest.cards.length} carte${chest.cards.length > 1 ? 's' : ''}${chest.pity ? ' · légendaire garantie !' : ''}</small></h2>
        <div class="cards">
          ${chest.cards
            .map((c, i) => {
              const card = characterCard(c.slug, 1, characterOf(c.slug));
              return `<div class="${cardClass(card)} small reveal" style="--i:${i}">${cardBody(card, { compact: true, badge: c.isNew ? 'Nouvelle !' : `Doublon : +${c.fragments} fragment${c.fragments > 1 ? 's' : ''}` })}</div>`;
            })
            .join('')}
        </div>
        <p><button type="button" data-action="collection">Voir la collection (${collection.owned.length} / ${gameData.characters.length})</button></p>
      </section>`;
  };

  const end = (run: RunState): string => `
    <section class="screen end">
      <h1>Fin de la traversée</h1>
      <p class="tagline">Ton équipage est tombé à la vague ${run.wave}.</p>
      <dl class="stats big">
        <div><dt>Vagues gagnées</dt><dd data-testid="end-waves">${run.wavesCleared}</dd></div>
        <div><dt>Score</dt><dd data-testid="end-score">${run.score}</dd></div>
        <div><dt>Seed</dt><dd data-testid="end-seed">${run.seed}</dd></div>
      </dl>
      ${chestPanel()}
      <h2 class="end-sub">Ton équipage</h2>
      <div class="cards final-team">
        ${run.team
          .map((member, index) => {
            const s = teamCombatants(run.team, gameData)[index];
            const card = characterCard(member.slug, member.level, { hp: s?.hp ?? 0, atk: s?.atk ?? 0, spd: s?.spd ?? 0 });
            return `<div class="${cardClass(card)} small">${cardBody(card, { compact: true })}</div>`;
          })
          .join('')}
      </div>
      <p>
        <button type="button" data-action="copy" data-testid="copy-run">Copier la partie</button>
        <button type="button" class="primary" data-action="new-run">Nouvelle traversée</button>
        <button type="button" data-action="home" data-testid="go-home">Accueil</button>
      </p>
      <label for="export">Partie (seed + choix) à joindre à tes retours :</label>
      <textarea id="export" readonly rows="4" data-testid="export-json">${esc(exportJson())}</textarea>
    </section>`;

  function render(): void {
    unmountCombat?.();
    unmountCombat = null;
    const run = state.run;
    if (state.screen === 'combat' && state.combat && run) {
      unmountCombat = mountCombat(view, {
        wave: state.combat.wave,
        events: state.combat.events,
        onContinue: () => {
          state.screen = run.phase === 'over' ? 'end' : 'game';
          render();
        },
      });
    } else if (state.screen === 'game' && run) view.innerHTML = game(run);
    else if (state.screen === 'end' && run) {
      finishRun(run);
      view.innerHTML = end(run);
    } else if (state.screen === 'collection') view.innerHTML = collectionScreen();
    else if (state.screen === 'about') view.innerHTML = about();
    else view.innerHTML = home();
    // Ambiance du décor : tempête sur les vagues de boss, crépuscule puis nuit en s'enfonçant.
    const wave = state.screen === 'combat' ? (state.combat?.wave ?? 1) : (run?.wave ?? 1);
    const inRun = (state.screen === 'game' || state.screen === 'combat') && run !== null;
    const mood: Mood = !inRun ? (state.screen === 'end' ? 'dusk' : 'day') : isBossWave(wave, gameData) ? 'storm' : wave > 20 ? 'night' : wave > 10 ? 'dusk' : 'day';
    document.body.dataset['mood'] = mood;
    document.body.dataset['screen'] = state.screen;
    document.title = state.screen === 'about' ? 'À propos — Jolly Rogue' : 'Jolly Rogue';
  }

  render();
}
