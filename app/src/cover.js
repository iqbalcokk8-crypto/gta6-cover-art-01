// Sunset Coast cover engine: draws a multi-panel GTA-style poster cover
// onto a 2D canvas. Everything is drawn in code — no image assets, no
// Rockstar artwork, no game fonts. Lettering is Anton (display) and
// Pacifico (script), both vendored under the SIL Open Font License.

export const SIZES = {
  square: { w: 1080, h: 1080, label: '1080 x 1080' },
  portrait: { w: 1080, h: 1350, label: '1080 x 1350' },
  wide: { w: 1920, h: 1080, label: '1920 x 1080' },
};

export const LAYOUTS = [
  { id: 'hero-trio', name: 'Hero + Trio', panels: 4 },
  { id: 'grid-four', name: 'Four Grid', panels: 4 },
  { id: 'full-bleed', name: 'Full Bleed', panels: 1 },
  { id: 'tilted-snaps', name: 'Tilted Snaps', panels: 3 },
  { id: 'mosaic-nine', name: 'Mosaic Nine', panels: 9 },
  { id: 'strip-duo', name: 'Strip Duo', panels: 3 },
];

export const GRADES = [
  { id: 'sunset', name: 'Sunset', top: '#ff9a5c', mid: '#ff4f9a', deep: '#2b0f4d' },
  { id: 'neon', name: 'Neon Night', top: '#ff2e88', mid: '#7b2fff', deep: '#04122e' },
  { id: 'golden', name: 'Golden Hour', top: '#ffd76a', mid: '#ff8a3d', deep: '#4d1a10' },
  { id: 'teal', name: 'Teal Coast', top: '#2ee6c8', mid: '#ff5c8a', deep: '#062a3a' },
  { id: 'noir', name: 'Noir', top: '#f2f2f2', mid: '#ff4f9a', deep: '#0a0a12' },
];

// Bundled cast: nine original fictional photographic portraits (generated
// with the media image tool, never real people). `fx`/`fy` is the focus
// point of each portrait (0..1, usually the face) used for face-safe
// cropping in drawPanelPhoto. `role` is the per-panel name tag.
export const CAST = [
  { name: 'The Lifeguard', role: 'THE LIFEGUARD', file: 'portrait-01-lifeguard.jpg', fx: 0.45, fy: 0.30 },
  { name: 'The DJ', role: 'THE DJ', file: 'portrait-02-dj.jpg', fx: 0.50, fy: 0.30 },
  { name: 'The Surfer', role: 'THE SURFER', file: 'portrait-03-surfer.jpg', fx: 0.55, fy: 0.28 },
  { name: 'The Photographer', role: 'THE PHOTOGRAPHER', file: 'portrait-04-photographer.jpg', fx: 0.45, fy: 0.32 },
  { name: 'The Bartender', role: 'THE BARTENDER', file: 'portrait-05-bartender.jpg', fx: 0.50, fy: 0.32 },
  { name: 'The Skater', role: 'THE SKATER', file: 'portrait-06-skater.jpg', fx: 0.55, fy: 0.30 },
  { name: 'The Sailor', role: 'THE SAILOR', file: 'portrait-07-sailor.jpg', fx: 0.45, fy: 0.35 },
  { name: 'The Dreamer', role: 'THE DREAMER', file: 'portrait-08-dreamer.jpg', fx: 0.55, fy: 0.30 },
  { name: 'The Sunset Club', role: 'THE SUNSET CLUB', file: 'portrait-09-sunset-club.jpg', fx: 0.50, fy: 0.35 },
];

// Title-band height as a fraction of the cover height.
const BAND_FRAC = 0.28;

/** Effective panel rects: mosaic-nine is lifted above the title band so the
    band never covers the bottom row; every other layout is unchanged. */
export function coverPanels(layout, w, h) {
  if (layout === 'mosaic-nine') return layoutPanels(layout, w, h - h * BAND_FRAC);
  return layoutPanels(layout, w, h);
}

export function defaultState() {
  return {
    layout: 'hero-trio',
    grade: 'sunset',
    size: 'square',
    title: 'SUNSET HEIST',
    subtitle: 'a Sunset Coast story',
    badge: 'EST. 2026',
    heat: 4,
    grain: true,
    frame: true,
    panels: [
      { photo: 0, zoom: 1.05, ox: 0, oy: 0 },
      { photo: 1, zoom: 1.05, ox: 0, oy: 0 },
      { photo: 2, zoom: 1.0, ox: 0, oy: 0 },
      { photo: 3, zoom: 1.05, ox: 0, oy: 0 },
      { photo: 4, zoom: 1.05, ox: 0, oy: 0 },
      { photo: 5, zoom: 1.0, ox: 0, oy: 0 },
      { photo: 6, zoom: 1.05, ox: 0, oy: 0 },
      { photo: 7, zoom: 1.05, ox: 0, oy: 0 },
      { photo: 8, zoom: 1.0, ox: 0, oy: 0 },
    ],
  };
}

/** Panel rectangles for a layout, in 0..1 cover coordinates. */
export function layoutPanels(layout, w, h) {
  const g = 0.012; // white gutter, relative to the short side
  const gw = g * Math.min(w, h);
  const gh = g * Math.min(w, h);
  const R = (x, y, pw, ph, tilt = 0) => ({ x: x * w, y: y * h, w: pw * w, h: ph * h, tilt });
  switch (layout) {
    case 'grid-four':
      return [
        R(0, 0, 0.5, 0.5), R(0.5, 0, 0.5, 0.5),
        R(0, 0.5, 0.5, 0.5), R(0.5, 0.5, 0.5, 0.5),
      ];
    case 'full-bleed':
      return [R(0, 0, 1, 1)];
    case 'tilted-snaps':
      return [
        R(0.06, 0.07, 0.52, 0.52, -0.06),
        R(0.44, 0.12, 0.50, 0.50, 0.05),
        R(0.24, 0.44, 0.54, 0.42, -0.02),
      ];
    case 'mosaic-nine': {
      const out = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) out.push(R(c / 3, r / 3, 1 / 3, 1 / 3));
      return out;
    }
    case 'strip-duo':
      return [R(0, 0, 1, 0.60), R(0, 0.60, 0.5, 0.40), R(0.5, 0.60, 0.5, 0.40)];
    case 'hero-trio':
    default: {
      const third = 1 / 3;
      return [
        R(0, 0, 0.62, 1),
        R(0.62, 0, 0.38, third), R(0.62, third, 0.38, third), R(0.62, 2 * third, 0.38, third),
      ];
    }
  }
}

/** Seeded RNG so grain is identical on every export. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawPalm(ctx, x, y, s, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  const topX = x + s * 0.10, topY = y - s;
  ctx.lineWidth = Math.max(3, s * 0.045);
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(topX, topY); ctx.stroke();
  ctx.lineWidth = Math.max(2, s * 0.022);
  for (let k = 0; k < 7; k++) {
    const ang = Math.PI * (0.12 + k / 6);
    const ex = topX + Math.cos(ang) * s * 0.5;
    const ey = topY + Math.sin(ang) * s * 0.28 + s * 0.28;
    const mx = topX + Math.cos(ang) * s * 0.28;
    const my = topY + Math.sin(ang) * s * 0.14 - s * 0.10;
    ctx.beginPath(); ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(mx, my, ex, ey); ctx.stroke();
  }
  ctx.restore();
}

function drawPanelPhoto(ctx, panel, photo, cfg, focus = { fx: 0.5, fy: 0.4 }) {
  if (!photo) return;
  const iw = photo.naturalWidth || photo.width;
  const ih = photo.naturalHeight || photo.height;
  const base = Math.max(panel.w / iw, panel.h / ih);
  const scale = base * cfg.zoom;
  const pw = iw * scale;
  const ph = ih * scale;
  // Focus-aware framing: put the sample's focus point (usually the face)
  // at the panel's anchor point — the centre of the part of the panel the
  // title band does not cover (`ay`, 0.5 = panel centre) — then apply the
  // user's pan offsets, clamped so the image still covers the whole panel.
  const fx = Math.min(1, Math.max(0, focus.fx ?? 0.5));
  const fy = Math.min(1, Math.max(0, focus.fy ?? 0.4));
  const ay = Math.min(0.5, Math.max(0.12, focus.ay ?? 0.5));
  let dx = panel.x + panel.w / 2 - fx * pw + cfg.ox * panel.w * 0.4;
  let dy = panel.y + panel.h * ay - fy * ph + cfg.oy * panel.h * 0.4;
  dx = Math.min(panel.x, Math.max(panel.x + panel.w - pw, dx));
  dy = Math.min(panel.y, Math.max(panel.y + panel.h - ph, dy));
  ctx.save();
  if (cfg.gradeId === 'noir') ctx.filter = 'grayscale(1) contrast(1.12) brightness(1.04)';
  ctx.drawImage(photo, dx, dy, pw, ph);
  ctx.restore();
}

function gradeOverlay(ctx, w, h, grade, titleBand) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, hexA(grade.top, 0.10));
  g.addColorStop(0.55, hexA(grade.mid, 0.16));
  g.addColorStop(1, hexA(grade.deep, 0.28));
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  // warm wash rising from the bottom, strongest behind the title band
  const wash = ctx.createLinearGradient(0, h * 0.45, 0, h);
  wash.addColorStop(0, 'rgba(255,110,80,0)');
  wash.addColorStop(1, hexA(grade.mid, 0.30));
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  void titleBand;
}

function hexA(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function fitFont(ctx, text, maxWidth, startPx, family, weight = '') {
  let size = startPx;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > 14 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

function drawBarcode(ctx, x, y, bw, bh) {
  // Deterministic decorative barcode (seeded, not a real product code).
  const rng = mulberry32(20261121);
  ctx.save();
  ctx.fillStyle = '#fff8f0';
  ctx.fillRect(x, y, bw, bh);
  ctx.fillStyle = '#14081f';
  let xx = x + 6;
  const top = y + 4;
  const bottom = y + bh - 4;
  while (xx < x + bw - 8) {
    const wBar = 2 + Math.floor(rng() * 3);
    if (rng() < 0.62) ctx.fillRect(xx, top, wBar, bottom - top);
    xx += wBar + 2 + Math.floor(rng() * 2);
  }
  ctx.restore();
}

function drawTitleBand(ctx, w, h, state, grade) {
  const bandH = h * BAND_FRAC;
  const bandY = h - bandH;
  // dark glass band, opaque enough at the top that the rule lines below sit
  // on the band itself, never on panel artwork
  const bg = ctx.createLinearGradient(0, bandY, 0, h);
  bg.addColorStop(0, 'rgba(12,6,24,0.80)');
  bg.addColorStop(0.35, 'rgba(12,6,24,0.88)');
  bg.addColorStop(1, 'rgba(12,6,24,0.94)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, bandY, w, bandH);
  const rng = mulberry32(7);
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  const step = Math.max(14, w * 0.014);
  for (let yy = bandY + step * 0.4; yy < h; yy += step) {
    for (let xx = step * 0.5; xx < w; xx += step) {
      if (rng() < 0.5) { ctx.beginPath(); ctx.arc(xx, yy, Math.max(1, step * 0.07), 0, Math.PI * 2); ctx.fill(); }
    }
  }
  // top rule: hot pink line with a cyan echo, confined to the band's own background
  ctx.fillStyle = '#ff2e88';
  ctx.fillRect(0, bandY, w, Math.max(3, h * 0.004));
  ctx.fillStyle = '#2ee6c8';
  ctx.fillRect(0, bandY + Math.max(3, h * 0.004), w, Math.max(2, h * 0.002));

  const pad = w * 0.045;
  const cx = pad;
  // Seal zone (bottom-right of the band): keep title/subtitle clear of it.
  const sealR = Math.min(w, h) * 0.055;
  const sealCx = w - pad - sealR;
  const lift = Math.max(30, h * 0.032); // matches drawFrame's lifted bottom edge
  const sealCy = h - pad - sealR - lift;
  const textW = w - pad * 2 - sealR * 2 - 32;
  // badge + heat row
  const badge = (state.badge || '').trim().toUpperCase();
  const stars = '★'.repeat(Math.max(0, Math.min(5, state.heat))) + '☆'.repeat(5 - Math.max(0, Math.min(5, state.heat)));
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  let y = bandY + bandH * 0.20;
  if (badge) {
    const bs = fitFont(ctx, badge, w * 0.5, bandH * 0.11, 'Anton, sans-serif');
    ctx.font = `${bs}px Anton, sans-serif`;
    ctx.fillStyle = '#ffd76a';
    ctx.fillText(badge, cx, y);
    const bw = ctx.measureText(badge).width;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#2ee6c8';
    ctx.font = `${bs}px sans-serif`;
    ctx.fillText(stars, w - pad, y);
    ctx.textAlign = 'left';
    void bw;
  }
  // title: big condensed Anton with a sunset gradient fill
  const title = (state.title || 'UNTITLED').trim().toUpperCase();
  const titleSize = fitFont(ctx, title, textW, bandH * 0.36, 'Anton, sans-serif');
  y = bandY + bandH * 0.52;
  const grad = ctx.createLinearGradient(0, y - titleSize, 0, y);
  grad.addColorStop(0, '#ffe9a3');
  grad.addColorStop(0.45, '#ff9a5c');
  grad.addColorStop(1, '#ff2e88');
  ctx.font = `${titleSize}px Anton, sans-serif`;
  ctx.lineWidth = Math.max(2, titleSize * 0.045);
  ctx.strokeStyle = 'rgba(20,4,32,0.85)';
  ctx.strokeText(title, cx, y);
  ctx.fillStyle = grad;
  ctx.fillText(title, cx, y);
  // script subtitle — baseline lifted inside the band so Pacifico's
  // descenders clear the frame stroke and the canvas edge at every size
  const sub = (state.subtitle || '').trim();
  if (sub) {
    const subSize = fitFont(ctx, sub, textW, bandH * 0.13, 'Pacifico, cursive');
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = subSize * 0.45;
    ctx.fillStyle = '#ffe3f1';
    ctx.fillText(sub, cx, bandY + bandH * 0.74);
    ctx.shadowBlur = 0;
  }
  // billing / credits, small caps, between the barcode (left) and the seal
  const billing = 'SUNSET COAST PRESENTS  ·  STARRING THE SUNSET CLUB  ·  MUSIC BY THE TIDE  ·  SHOT ON THE COAST';
  const billZoneX0 = pad + 140;
  const billZoneX1 = w - pad - sealR * 2 - 16;
  const billSize = fitFont(ctx, billing, billZoneX1 - billZoneX0, bandH * 0.05, 'Anton, sans-serif');
  ctx.font = `${billSize}px Anton, sans-serif`;
  ctx.fillStyle = 'rgba(255,235,220,0.85)';
  ctx.textAlign = 'center';
  ctx.fillText(billing, (billZoneX0 + billZoneX1) / 2, bandY + bandH * 0.88);
  ctx.textAlign = 'left';
  // deterministic barcode, bottom-left of the band, centred on the billing line
  drawBarcode(ctx, pad, bandY + bandH * 0.88 - 16, 120, 22);
  // circular SUNSET COAST seal, bottom-right of the band
  ctx.save();
  ctx.translate(sealCx, sealCy);
  ctx.fillStyle = 'rgba(12,6,24,0.72)';
  ctx.beginPath(); ctx.arc(0, 0, sealR, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#ffd76a';
  ctx.lineWidth = Math.max(2, sealR * 0.05);
  ctx.beginPath(); ctx.arc(0, 0, sealR - ctx.lineWidth, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,215,106,0.7)';
  ctx.lineWidth = Math.max(1, sealR * 0.02);
  ctx.beginPath(); ctx.arc(0, 0, sealR * 0.78, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#ffe9a3';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const sealFont = Math.max(10, sealR * 0.30);
  ctx.font = `${sealFont}px Anton, sans-serif`;
  ctx.fillText('SUNSET', 0, -sealR * 0.05);
  ctx.fillText('COAST', 0, sealR * 0.28);
  ctx.font = `${Math.max(9, sealR * 0.16)}px Anton, sans-serif`;
  ctx.fillStyle = '#2ee6c8';
  ctx.fillText('★ EST. 2026 ★', 0, sealR * 0.55);
  ctx.restore();
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
}

// Review quote + source + stars at the top of the cover, over a scrim that
// fades into the panels; volume tag as a small pill at the top-right.
function drawTopQuote(ctx, w, h) {
  const stripH = h * 0.085;
  const scrim = ctx.createLinearGradient(0, 0, 0, stripH);
  scrim.addColorStop(0, 'rgba(12,6,24,0.82)');
  scrim.addColorStop(1, 'rgba(12,6,24,0)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, w, stripH);
  const pad = w * 0.045;
  const size = fitFont(ctx, '“THE COAST HAS NEVER LOOKED THIS GOOD”  —  COASTLINE WEEKLY  ★★★★★', w * 0.70, Math.max(15, Math.min(w, h) * 0.024), 'Anton, sans-serif');
  ctx.font = `${size}px Anton, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe9a3';
  ctx.fillText('“THE COAST HAS NEVER LOOKED THIS GOOD”  —  COASTLINE WEEKLY  ★★★★★', w / 2, stripH * 0.42);
  // volume tag pill, top-right
  const vol = 'VOL. 1';
  const vs = Math.max(12, size * 0.8);
  ctx.font = `${vs}px Anton, sans-serif`;
  const vw = ctx.measureText(vol).width + vs * 1.2;
  const vh = vs * 1.7;
  const vx = w - pad - vw;
  const vy = stripH * 0.42 - vh / 2;
  ctx.beginPath();
  ctx.roundRect(vx, vy, vw, vh, Math.min(6, vh * 0.3));
  ctx.fillStyle = 'rgba(12,6,24,0.72)';
  ctx.fill();
  ctx.strokeStyle = '#ffd76a';
  ctx.lineWidth = Math.max(1.5, vs * 0.08);
  ctx.stroke();
  ctx.fillStyle = '#ffd76a';
  ctx.fillText(vol, vx + vw / 2, stripH * 0.42 + 1);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

// Per-panel name tag: a small dark pill with the panel's role, placed at the
// panel's bottom edge but never below the title band's top edge.
function drawNameTags(ctx, w, h, state, panels) {
  const bandY = h - h * BAND_FRAC;
  ctx.save();
  for (let i = 0; i < panels.length; i++) {
    const p = panels[i];
    const cfg = state.panels[i] || { photo: 0 };
    const tag = (cfg.tag || '').trim().toUpperCase() || (CAST[cfg.photo] ? CAST[cfg.photo].role : '');
    if (!tag) continue;
    const fs = Math.max(11, Math.min(20, Math.min(p.w, p.h) * 0.055));
    ctx.font = `${fs}px Anton, sans-serif`;
    const tw = ctx.measureText(tag).width;
    const padX = fs * 0.7;
    const padY = fs * 0.45;
    const tagW = tw + padX * 2;
    const tagH = fs + padY * 2;
    const tx = p.x + Math.max(8, Math.min(w, h) * 0.012);
    // Tilted cards overlap each other, so a bottom tag for an upper card
    // would land on the card below it: tag tilted cards at the top instead.
    let ty;
    if (state.layout === 'tilted-snaps') {
      ty = p.y + Math.max(14, Math.min(w, h) * 0.015);
    } else {
      const bottom = Math.min(p.y + p.h, bandY) - 10;
      ty = bottom - tagH;
    }
    if (ty < p.y + 4 || tx + tagW > p.x + p.w - 4) continue;
    ctx.fillStyle = 'rgba(12,6,24,0.78)';
    ctx.beginPath();
    ctx.roundRect(tx, ty, tagW, tagH, Math.min(6, tagH * 0.25));
    ctx.fill();
    ctx.fillStyle = '#ffe9a3';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(tag, tx + padX, ty + tagH / 2 + 1);
  }
  ctx.restore();
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
}

function drawFrame(ctx, w, h) {
  const t = Math.max(6, Math.min(w, h) * 0.012);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = t;
  ctx.strokeRect(t / 2, t / 2, w - t, h - t);
  // Inner pink rule: the bottom edge rides above the credits strip (billing
  // line + barcode) so the stroke never crosses the text zone.
  const inset = t * 1.9;
  const lift = Math.max(30, h * 0.032);
  ctx.strokeStyle = 'rgba(255,46,136,0.9)';
  ctx.lineWidth = Math.max(2, t * 0.22);
  ctx.beginPath();
  ctx.moveTo(inset, h - inset - lift);
  ctx.lineTo(inset, inset);
  ctx.lineTo(w - inset, inset);
  ctx.lineTo(w - inset, h - inset - lift);
  ctx.lineTo(inset, h - inset - lift);
  ctx.stroke();
}

function drawGrain(ctx, w, h, seed) {
  const rng = mulberry32(seed);
  const n = Math.floor((w * h) / 9000);
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < n; i++) {
    ctx.fillRect(rng() * w, rng() * h, 1.6, 1.6);
  }
  ctx.restore();
  const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(10,4,20,0.38)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);
}

/** Draws the whole cover. `photos` is an array of images (or nulls). */
export function drawCover(canvas, state, photos) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES.find((g) => g.id === state.grade) || GRADES[0];
  const gutter = Math.min(w, h) * 0.012;

  // backdrop: sunset sky gradient (visible in gutters + tilted layout)
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#2b0f4d');
  sky.addColorStop(0.45, '#c22a72');
  sky.addColorStop(0.75, '#ff7a4d');
  sky.addColorStop(1, '#ffc46b');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  if (state.layout === 'tilted-snaps') {
    const sunR = Math.min(w, h) * 0.16;
    ctx.fillStyle = '#ffe9a3';
    ctx.beginPath(); ctx.arc(w * 0.5, h * 0.30, sunR, 0, Math.PI * 2); ctx.fill();
    drawPalm(ctx, w * 0.08, h * 0.62, h * 0.20, 'rgba(20,6,34,0.85)');
    drawPalm(ctx, w * 0.94, h * 0.60, h * 0.16, 'rgba(20,6,34,0.85)');
  }

  const panels = coverPanels(state.layout, w, h);
  const count = panels.length;
  for (let i = 0; i < count; i++) {
    const p = panels[i];
    const cfg = state.panels[i] || { photo: 0, zoom: 1, ox: 0, oy: 0 };
    const photo = photos[cfg.photo] || null;
    ctx.save();
    if (p.tilt) {
      ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
      ctx.rotate(p.tilt);
      ctx.translate(-p.w / 2, -p.h / 2);
    } else {
      ctx.translate(p.x, p.y);
    }
    const pw = p.w - (state.layout === 'tilted-snaps' ? 0 : gutter);
    const ph = p.h - (state.layout === 'tilted-snaps' ? 0 : gutter);
    const local = { x: 0, y: 0, w: pw, h: ph };
    ctx.beginPath();
    const r = Math.min(pw, ph) * 0.02;
    ctx.roundRect(0, 0, pw, ph, r);
    ctx.clip();
    if (photo) {
      // Anchor the face in the visible part of the panel (above the title
      // band); panels fully above the band keep the plain centre anchor.
      const bandTop = h - h * BAND_FRAC;
      const visBottom = Math.min(p.y + p.h, bandTop);
      const ay = Math.min(0.5, Math.max(0.12, ((visBottom - p.y) / 2) / p.h));
      const focus = { ...(CAST[cfg.photo] || { fx: 0.5, fy: 0.4 }), ay };
      drawPanelPhoto(ctx, local, photo, { ...cfg, gradeId: grade.id }, focus);
    } else {
      ctx.fillStyle = '#3a1748';
      ctx.fillRect(0, 0, pw, ph);
    }
    // per-panel sunset wash so the panels read as one poster
    const wash = ctx.createLinearGradient(0, ph * 0.5, 0, ph);
    wash.addColorStop(0, 'rgba(255,120,80,0)');
    wash.addColorStop(1, hexA(grade.mid, 0.22));
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, pw, ph);
    ctx.restore();
    if (state.layout === 'tilted-snaps') {
      // white snapshot border around the tilted card
      ctx.save();
      ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
      ctx.rotate(p.tilt);
      ctx.strokeStyle = '#fff8f0';
      ctx.lineWidth = Math.max(4, Math.min(w, h) * 0.008);
      ctx.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.95)';
      ctx.lineWidth = Math.max(2, gutter * 0.5);
      ctx.strokeRect(p.x + 1, p.y + 1, pw - 2, ph - 2);
    }
  }

  gradeOverlay(ctx, w, h, grade);
  drawTitleBand(ctx, w, h, state, grade);
  drawTopQuote(ctx, w, h);
  drawNameTags(ctx, w, h, state, panels);
  if (state.grain) drawGrain(ctx, w, h, 20261120);
  if (state.frame) drawFrame(ctx, w, h);
  return panels;
}

/** Hit-test: which panel (index) contains cover point (x, y) in pixels. */
export function panelAt(canvas, state, x, y) {
  const panels = coverPanels(state.layout, canvas.width, canvas.height);
  for (let i = panels.length - 1; i >= 0; i--) {
    const p = panels[i];
    if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return i;
  }
  return -1;
}
