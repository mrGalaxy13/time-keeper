// Color Theory Palette — based on research into attention, positivity, and energy
// Inspired by Instagram blues, Spotify greens, Duolingo yellows, Calm app purples
// All colors: high saturation, medium-high lightness for vibrancy without harshness

const TASK_COLORS = [
  { name: 'coral',    bg: '#FF6B6B', glow: 'rgba(255,107,107,0.4)',  text: '#fff', fade: '#FF6B6B' },
  { name: 'sky',      bg: '#4ECDC4', glow: 'rgba(78,205,196,0.4)',   text: '#fff', fade: '#4ECDC4' },
  { name: 'amber',    bg: '#FFD93D', glow: 'rgba(255,217,61,0.4)',   text: '#1a1a1a', fade: '#FFD93D' },
  { name: 'violet',   bg: '#A78BFA', glow: 'rgba(167,139,250,0.4)',  text: '#fff', fade: '#A78BFA' },
  { name: 'lime',     bg: '#6EE7B7', glow: 'rgba(110,231,183,0.4)',  text: '#1a1a1a', fade: '#6EE7B7' },
  { name: 'rose',     bg: '#F9A8D4', glow: 'rgba(249,168,212,0.4)',  text: '#1a1a1a', fade: '#F9A8D4' },
  { name: 'blue',     bg: '#60A5FA', glow: 'rgba(96,165,250,0.4)',   text: '#fff', fade: '#60A5FA' },
  { name: 'orange',   bg: '#FB923C', glow: 'rgba(251,146,60,0.4)',   text: '#fff', fade: '#FB923C' },
  { name: 'emerald',  bg: '#34D399', glow: 'rgba(52,211,153,0.4)',   text: '#1a1a1a', fade: '#34D399' },
  { name: 'fuchsia',  bg: '#E879F9', glow: 'rgba(232,121,249,0.4)',  text: '#fff', fade: '#E879F9' },
  { name: 'yellow',   bg: '#FACC15', glow: 'rgba(250,204,21,0.4)',   text: '#1a1a1a', fade: '#FACC15' },
  { name: 'indigo',   bg: '#818CF8', glow: 'rgba(129,140,248,0.4)',  text: '#fff', fade: '#818CF8' },
];

function getColor(index) {
  return TASK_COLORS[index % TASK_COLORS.length];
}

// Interpolate from full color to dark/muted as time is spent
function getFadedColor(hexColor, pctRemaining) {
  // pctRemaining: 1 = full, 0 = exhausted
  const r = parseInt(hexColor.slice(1,3), 16);
  const g = parseInt(hexColor.slice(3,5), 16);
  const b = parseInt(hexColor.slice(5,7), 16);

  // Fade toward a dark slate: #1e1e2e
  const tr = 30, tg = 30, tb = 46;
  const nr = Math.round(tr + (r - tr) * pctRemaining);
  const ng = Math.round(tg + (g - tg) * pctRemaining);
  const nb = Math.round(tb + (b - tb) * pctRemaining);
  return `rgb(${nr},${ng},${nb})`;
}
