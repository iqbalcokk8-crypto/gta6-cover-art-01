// Fixed scenes for screenshots: ?shot=editor shows the page with a sample
// photo loaded; ?shot=cover shows the exported cover alone, drawn by the
// app itself at the requested post size; ?shot=export-test proves the PNG
// export path (offscreen canvas -> toBlob) and reports its byte size.
// Query params: layout, grade, size (square|portrait|wide), title,
// subtitle, badge, heat, photo (sample index). window.__shotReady is set
// once the scene is painted.
import { SIZES, defaultState } from './cover.js';

function applyQuery(state, query) {
  if (query.get('layout')) state.layout = query.get('layout');
  if (query.get('grade')) state.grade = query.get('grade');
  if (query.get('size') && SIZES[query.get('size')]) state.size = query.get('size');
  if (query.get('title')) state.title = query.get('title');
  if (query.get('subtitle')) state.subtitle = query.get('subtitle');
  if (query.get('badge')) state.badge = query.get('badge');
  if (query.get('heat')) state.heat = Number(query.get('heat'));
  if (query.get('photo') !== null) {
    const i = Number(query.get('photo'));
    for (const p of state.panels) p.photo = i;
    state.panels[0].photo = i;
  }
  return state;
}

function ready() {
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}

export async function runShot(shot, query, api) {
  await api.loadSamples();
  try {
    await Promise.all([document.fonts.load('100px Anton'), document.fonts.load('40px Pacifico')]);
  } catch { /* fall back to system fonts */ }
  const state = applyQuery(defaultState(), query);
  api.state = state;
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    document.getElementById('cover').style.width = '100vw';
    document.getElementById('cover').style.height = '100vh';
  }
  api.syncControls();
  api.redraw();
  if (shot === 'export-test') {
    const size = SIZES[state.size];
    const off = document.createElement('canvas');
    off.width = size.w;
    off.height = size.h;
    const { drawCover } = await import('./cover.js');
    const imgs = state.panels.map((p) => (api.photos[p.photo] ? api.photos[p.photo].img : null));
    drawCover(off, state, imgs);
    off.toBlob((blob) => {
      const out = document.getElementById('shotOutput');
      out.hidden = false;
      out.textContent = `export ${size.w}x${size.h} bytes=${blob ? blob.size : 0}`;
      document.title = out.textContent;
      ready();
    }, 'image/png');
    return;
  }
  ready();
}
