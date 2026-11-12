/**
 * Décor du jeu, entièrement dessiné en SVG/CSS maison : ciel, soleil, nuages, îles, mer animée
 * et navire. Aucun asset tiers. L'ambiance (`data-mood` sur <body>) change la palette.
 */
export type Mood = 'day' | 'dusk' | 'storm' | 'night';

const wave = (color: string): string =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='60' viewBox='0 0 240 60'><path d='M0 22q30-22 60 0t60 0 60 0 60 0V60H0z' fill='${color}'/></svg>`,
  )}")`;

export const shipSvg = (): string => `
  <svg class="ship" viewBox="0 0 220 190" aria-hidden="true">
    <g class="ship-body">
      <path d="M108 20v118" stroke="#3a2a1c" stroke-width="5"/>
      <path d="M60 46v92" stroke="#3a2a1c" stroke-width="4"/>
      <path d="M156 56v82" stroke="#3a2a1c" stroke-width="4"/>
      <path d="M108 16l26 8-26 8z" fill="#8c2f2f"/>
      <path d="M112 34q46 30 2 92q20-46-2-92z" fill="#f4ecd8" stroke="#c9b98f"/>
      <path d="M104 34q-50 34-6 92q-18-48 6-92z" fill="#ece2c8" stroke="#c9b98f"/>
      <path d="M62 56q-32 24-4 70q-8-36 4-70z" fill="#f4ecd8" stroke="#c9b98f"/>
      <path d="M158 64q30 22 4 62q10-32-4-62z" fill="#ece2c8" stroke="#c9b98f"/>
      <path d="M14 132h192l-22 44H44z" fill="#5a3d26"/>
      <path d="M14 132h192l-5 10H21z" fill="#7a5636"/>
      <path d="M40 152h140M46 164h128" stroke="#3a2a1c" stroke-opacity="0.5" stroke-width="2"/>
      <g fill="#1d1712"><circle cx="70" cy="158" r="4"/><circle cx="100" cy="158" r="4"/><circle cx="130" cy="158" r="4"/><circle cx="160" cy="158" r="4"/></g>
    </g>
  </svg>`;

export function sceneHtml(): string {
  return `
    <div class="scene" aria-hidden="true">
      <div class="sky"></div>
      <div class="sun"></div>
      <div class="cloud c1"></div><div class="cloud c2"></div><div class="cloud c3"></div>
      <svg class="islands" viewBox="0 0 1200 120" preserveAspectRatio="none">
        <path d="M0 120V92q60-30 130-22 40-46 96-8 60-10 110 30v28z"/>
        <path d="M820 120V96q50-52 104-30 30-34 70-6 70-22 206 34v26z"/>
        <path d="M520 120v-14q30-26 58-10 22-12 46 24z" opacity="0.7"/>
      </svg>
      <div class="rain"></div>
      <div class="sea">
        <div class="wave w1"></div>
        <div class="wave w2"></div>
        <div class="wave w3"></div>
      </div>
    </div>`;
}

/** Tuiles de vagues par ambiance (les data-URI ne lisent pas les variables CSS). */
export function waveStyles(): string {
  const palettes: Record<Mood, [string, string, string]> = {
    day: ['#3f8fb5', '#2c779e', '#1d5f86'],
    dusk: ['#7a6a8c', '#5a4f78', '#3d3a62'],
    storm: ['#4d6672', '#3a515c', '#283b45'],
    night: ['#27456b', '#1c3454', '#12243f'],
  };
  return (Object.entries(palettes) as [Mood, [string, string, string]][])
    .map(
      ([mood, [a, b, c]]) => `
      body[data-mood='${mood}'] .w1 { background-image: ${wave(a)}; }
      body[data-mood='${mood}'] .w2 { background-image: ${wave(b)}; }
      body[data-mood='${mood}'] .w3 { background-image: ${wave(c)}; }
      body[data-mood='${mood}'] .sea { background-color: ${c}; }`,
    )
    .join('\n');
}
