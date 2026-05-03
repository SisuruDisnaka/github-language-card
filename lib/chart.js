const { createCanvas } = require("@napi-rs/canvas");

// ─── Language color palette ───────────────────────────────────────────────────
const LANG_COLORS = {
  JavaScript: "#F7DF1E",
  TypeScript: "#3178C6",
  Python: "#3572A5",
  Java: "#B07219",
  "C++": "#F34B7D",
  C: "#555555",
  "C#": "#178600",
  Go: "#00ADD8",
  Rust: "#DEA584",
  Ruby: "#CC342D",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  Shell: "#89E051",
  HTML: "#E34C26",
  CSS: "#563D7C",
  Vue: "#41B883",
  Lua: "#000080",
  Scala: "#DC322F",
  Haskell: "#5E5086",
  Elixir: "#6E4A7E",
  Clojure: "#DB5855",
  R: "#276DC3",
  MATLAB: "#E16737",
  Perl: "#0298C3",
  Vim: "#199F4B",
  Dockerfile: "#384D54",
  Makefile: "#427819",
};

/** Returns a color for a language, generating a deterministic fallback if not in palette. */
function getLangColor(name) {
  if (LANG_COLORS[name]) return LANG_COLORS[name];
  // Deterministic hash-based color
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 65%, 55%)`;
}

// ─── Theme definitions ────────────────────────────────────────────────────────
const THEMES = {
  dark: {
    bg: "#0d1117",
    cardBg: "#161b22",
    border: "#30363d",
    title: "#e6edf3",
    text: "#c9d1d9",
    subtext: "#8b949e",
    barBg: "#21262d",
    glow: "rgba(88,166,255,0.08)",
  },
  light: {
    bg: "#f0f2f5",
    cardBg: "#ffffff",
    border: "#d0d7de",
    title: "#1f2328",
    text: "#24292f",
    subtext: "#57606a",
    barBg: "#eaeef2",
    glow: "rgba(9,105,218,0.06)",
  },
};

// ─── Layout constants ─────────────────────────────────────────────────────────
const WIDTH = 480;
const PADDING = 28;
const TITLE_H = 56;
const BAR_ROW_H = 36;
const FOOTER_H = 36;
const CORNER_R = 16;
const MAX_LANGS = 10; // Show top N languages

/**
 * Draws a rounded rectangle path.
 */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/**
 * Parse hex/hsl color string to rgba object.
 * Simplified — supports hex and passes hsl through.
 */
function hexToRgba(hex, alpha = 1) {
  if (hex.startsWith("hsl")) return hex; // Return as-is for canvas
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Generates the PNG buffer for the language card.
 *
 * @param {Array} langs - Sorted language stats [{ name, percentage }]
 * @param {object} options - { theme, layout, username }
 * @returns {Buffer} PNG image buffer
 */
function generateImage(langs, { theme = "dark", layout = "default", username = "" } = {}) {
  const colors = THEMES[theme] || THEMES.dark;
  const isCompact = layout === "compact";

  const topLangs = langs.slice(0, isCompact ? 6 : MAX_LANGS);
  const rowH = isCompact ? 28 : BAR_ROW_H;

  const HEIGHT =
    TITLE_H +
    PADDING +
    topLangs.length * rowH +
    PADDING * 0.5 +
    20 + // mini bar strip
    PADDING * 0.5 +
    FOOTER_H +
    PADDING;

  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");

  // ── Background ──────────────────────────────────────────────────────────────
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // ── Card ────────────────────────────────────────────────────────────────────
  roundRect(ctx, 1, 1, WIDTH - 2, HEIGHT - 2, CORNER_R);
  ctx.fillStyle = colors.cardBg;
  ctx.fill();

  // Subtle inner glow
  const glow = ctx.createRadialGradient(WIDTH / 2, 0, 0, WIDTH / 2, 0, HEIGHT * 0.6);
  glow.addColorStop(0, colors.glow);
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fill();

  // Border
  roundRect(ctx, 1, 1, WIDTH - 2, HEIGHT - 2, CORNER_R);
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 1;
  ctx.stroke();

  // ── Title ───────────────────────────────────────────────────────────────────
  ctx.fillStyle = colors.title;
  ctx.font = `bold ${isCompact ? 15 : 17}px 'DejaVu Sans', sans-serif`;
  ctx.fillText("Most Used Languages", PADDING, PADDING + (isCompact ? 14 : 18));

  if (username) {
    ctx.fillStyle = colors.subtext;
    ctx.font = `${isCompact ? 11 : 12}px 'DejaVu Sans', sans-serif`;
    ctx.fillText(`@${username}`, PADDING, PADDING + (isCompact ? 28 : 34));
  }

  // Decorative accent line under title
  const accentGrad = ctx.createLinearGradient(PADDING, 0, PADDING + 120, 0);
  accentGrad.addColorStop(0, "#58a6ff");
  accentGrad.addColorStop(1, "transparent");
  ctx.strokeStyle = accentGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PADDING, TITLE_H + 2);
  ctx.lineTo(PADDING + 120, TITLE_H + 2);
  ctx.stroke();

  // ── Language Rows ────────────────────────────────────────────────────────────
  const barAreaX = PADDING;
  const barAreaW = WIDTH - PADDING * 2;
  const labelW = isCompact ? 90 : 110;
  const pctW = isCompact ? 42 : 48;
  const trackX = barAreaX + labelW;
  const trackW = barAreaW - labelW - pctW - 8;
  const barH = isCompact ? 6 : 8;

  let y = TITLE_H + PADDING;

  topLangs.forEach((lang, i) => {
    const rowY = y + i * rowH;
    const midY = rowY + rowH / 2;
    const color = getLangColor(lang.name);

    // Language dot
    ctx.beginPath();
    ctx.arc(barAreaX + 5, midY - (isCompact ? 6 : 7), isCompact ? 4 : 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Language name
    ctx.fillStyle = colors.text;
    ctx.font = `${isCompact ? 11 : 12}px 'DejaVu Sans', sans-serif`;
    ctx.fillText(lang.name, barAreaX + 16, midY - (isCompact ? 2 : 3));

    // Track background
    const trackY = midY + (isCompact ? 1 : 2);
    roundRect(ctx, trackX, trackY - barH / 2, trackW, barH, barH / 2);
    ctx.fillStyle = colors.barBg;
    ctx.fill();

    // Filled bar
    const fillW = Math.max(4, (lang.percentage / 100) * trackW);
    const barGrad = ctx.createLinearGradient(trackX, 0, trackX + fillW, 0);
    barGrad.addColorStop(0, color);
    barGrad.addColorStop(1, hexToRgba(color.startsWith("#") ? color : "#58a6ff", 0.7));
    roundRect(ctx, trackX, trackY - barH / 2, fillW, barH, barH / 2);
    ctx.fillStyle = barGrad;
    ctx.fill();

    // Percentage
    ctx.fillStyle = colors.subtext;
    ctx.font = `${isCompact ? 10 : 11}px 'DejaVu Sans Mono', monospace`;
    const pctText = `${lang.percentage.toFixed(1)}%`;
    const pctX = trackX + trackW + 8;
    ctx.fillText(pctText, pctX, midY - (isCompact ? 2 : 3));
  });

  // ── Stacked Mini Bar (color strip) ──────────────────────────────────────────
  const stripY = TITLE_H + PADDING + topLangs.length * rowH + PADDING * 0.5;
  const stripH = isCompact ? 6 : 8;
  let stripX = PADDING;
  const stripW = WIDTH - PADDING * 2;

  // Background
  roundRect(ctx, PADDING, stripY, stripW, stripH, stripH / 2);
  ctx.fillStyle = colors.barBg;
  ctx.fill();

  // Draw each segment
  const totalPct = topLangs.reduce((s, l) => s + l.percentage, 0);
  let drawnW = 0;
  topLangs.forEach((lang, i) => {
    const segW = Math.round((lang.percentage / totalPct) * stripW);
    const isFirst = i === 0;
    const isLast = i === topLangs.length - 1;
    const r = stripH / 2;

    ctx.beginPath();
    ctx.moveTo(stripX + (isFirst ? r : 0), stripY);
    ctx.lineTo(stripX + segW - (isLast ? r : 0), stripY);
    if (isLast) ctx.arcTo(stripX + segW, stripY, stripX + segW, stripY + r, r);
    ctx.lineTo(stripX + segW, stripY + stripH - (isLast ? r : 0));
    if (isLast) ctx.arcTo(stripX + segW, stripY + stripH, stripX + segW - r, stripY + stripH, r);
    ctx.lineTo(stripX + (isFirst ? r : 0), stripY + stripH);
    if (isFirst) ctx.arcTo(stripX, stripY + stripH, stripX, stripY + stripH - r, r);
    ctx.lineTo(stripX, stripY + (isFirst ? r : 0));
    if (isFirst) ctx.arcTo(stripX, stripY, stripX + r, stripY, r);
    ctx.closePath();

    ctx.fillStyle = getLangColor(lang.name);
    ctx.fill();

    stripX += segW;
    drawnW += segW;
  });

  // ── Footer ───────────────────────────────────────────────────────────────────
  const footerY = HEIGHT - FOOTER_H;
  ctx.strokeStyle = colors.border;
  ctx.lineWidth = 1;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(PADDING, footerY);
  ctx.lineTo(WIDTH - PADDING, footerY);
  ctx.stroke();

  ctx.fillStyle = colors.subtext;
  ctx.font = `10px 'DejaVu Sans', sans-serif`;
  ctx.fillText(
    `Updated ${new Date().toUTCString().slice(0, 16)} · Top ${topLangs.length} of ${langs.length} languages`,
    PADDING,
    footerY + 20
  );

  return canvas.toBuffer("image/png");
}

module.exports = { generateImage };
