// Sunset Coast Cover Studio — wires the editor: photos, layout, grade,
// caption, per-panel crop/position (sliders, drag, wheel), undo/redo and
// PNG export in the three common post sizes. Photos are read on this
// machine only (FileReader / object URLs); nothing is uploaded.
// A `?shot=` query sets up a fixed scene for a screenshot instead (shots.js).

import { SIZES, LAYOUTS, GRADES, CAST, defaultState, drawCover, panelAt } from './cover.js';
import { runShot } from './shots.js';

// Bundled cast (see CAST in cover.js): nine original fictional portraits.
const SAMPLES = CAST;

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
let state = defaultState();
let photos = []; // { img, name } — samples first, then uploads
let selectedPanel = 0;
let pickedPhoto = 0;
let undoStack = [];
let redoStack = [];
let drag = null;

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function loadSamples() {
  for (const s of SAMPLES) {
    try {
      const img = await loadImage(`samples/${s.file}`);
      photos.push({ img, name: s.name, role: s.role, fx: s.fx, fy: s.fy });
    } catch { /* a missing sample just leaves that slot empty */ }
  }
}

function snapshot() {
  return JSON.stringify(state);
}
function pushUndo() {
  undoStack.push(snapshot());
  if (undoStack.length > 60) undoStack.shift();
  redoStack = [];
  refreshUndoButtons();
}
function restore(json) {
  state = JSON.parse(json);
  syncControls();
  redraw();
}
function refreshUndoButtons() {
  document.getElementById('undo').disabled = undoStack.length === 0;
  document.getElementById('redo').disabled = redoStack.length === 0;
}

function panelCount() {
  return LAYOUTS.find((l) => l.id === state.layout).panels;
}

function redraw() {
  const size = SIZES[state.size];
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w;
    canvas.height = size.h;
  }
  const imgs = state.panels.map((p) => (photos[p.photo] ? photos[p.photo].img : null));
  drawCover(canvas, state, imgs);
  const n = panelCount();
  if (selectedPanel >= n) selectedPanel = 0;
  document.getElementById('panelLabel').textContent =
    `Panel ${selectedPanel + 1} of ${n} — click any panel in the preview.`;
}

function syncControls() {
  document.getElementById('title').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;
  document.getElementById('badge').value = state.badge;
  document.getElementById('heat').value = state.heat;
  document.getElementById('heatValue').textContent = `${state.heat} / 5`;
  document.getElementById('size').value = state.size;
  document.getElementById('grain').checked = state.grain;
  document.getElementById('frame').checked = state.frame;
  for (const b of document.querySelectorAll('#layouts button')) {
    b.setAttribute('aria-pressed', String(b.dataset.id === state.layout));
  }
  for (const b of document.querySelectorAll('#grades button')) {
    b.setAttribute('aria-pressed', String(b.dataset.id === state.grade));
  }
  for (const b of document.querySelectorAll('#samples button')) {
    b.setAttribute('aria-pressed', String(Number(b.dataset.i) === pickedPhoto));
  }
  const sel = document.getElementById('panelPhoto');
  sel.innerHTML = '';
  photos.forEach((p, i) => {
    const o = document.createElement('option');
    o.value = String(i);
    o.textContent = `${i + 1}. ${p.name}`;
    sel.appendChild(o);
  });
  const cfg = state.panels[selectedPanel];
  if (cfg) {
    sel.value = String(cfg.photo);
    document.getElementById('panelZoom').value = String(cfg.zoom);
    document.getElementById('panelOx').value = String(cfg.ox);
    document.getElementById('panelOy').value = String(cfg.oy);
    document.getElementById('panelTag').value = cfg.tag || '';
    document.getElementById('panelTag').placeholder = (CAST[cfg.photo] && CAST[cfg.photo].role) || 'Role for this panel';
  }
}

function mutate(fn) {
  pushUndo();
  fn();
  syncControls();
  redraw();
}

function buildChips() {
  const lay = document.getElementById('layouts');
  for (const l of LAYOUTS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = l.name;
    b.dataset.id = l.id;
    b.addEventListener('click', () => mutate(() => { state.layout = l.id; }));
    lay.appendChild(b);
  }
  const gr = document.getElementById('grades');
  for (const g of GRADES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = g.name;
    b.dataset.id = g.id;
    b.style.background = `linear-gradient(135deg, ${g.top}, ${g.mid} 55%, ${g.deep})`;
    b.addEventListener('click', () => mutate(() => { state.grade = g.id; }));
    gr.appendChild(b);
  }
  const sam = document.getElementById('samples');
  SAMPLES.forEach((s, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.i = String(i);
    b.title = s.name;
    const img = document.createElement('img');
    img.src = `samples/${s.file}`;
    img.alt = s.name;
    b.appendChild(img);
    b.addEventListener('click', () => {
      pickedPhoto = i;
      mutate(() => { state.panels[selectedPanel].photo = i; });
    });
    sam.appendChild(b);
  });
}

function exportPng(sizeKey) {
  const size = SIZES[sizeKey];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  const imgs = state.panels.map((p) => (photos[p.photo] ? photos[p.photo].img : null));
  const keep = { ...state, size: sizeKey };
  drawCover(off, keep, imgs);
  return new Promise((resolve) => {
    off.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `sunset-coast-cover-${size.w}x${size.h}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      resolve(blob ? blob.size : 0);
    }, 'image/png');
  });
}

function bind() {
  document.getElementById('photos').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    if (!files.length) return;
    for (const f of files) {
      try {
        const img = await loadImage(URL.createObjectURL(f));
        photos.push({ img, name: f.name.replace(/\.[^.]+$/, '').slice(0, 24) || 'Photo' });
      } catch { /* skip unreadable files */ }
    }
    pickedPhoto = photos.length - 1;
    mutate(() => { state.panels[selectedPanel].photo = pickedPhoto; });
    statusEl.textContent = `${files.length} photo${files.length > 1 ? 's' : ''} loaded — kept on this machine.`;
  });
  const text = (id, key) => document.getElementById(id).addEventListener('input', (e) => {
    state[key] = e.target.value;
    redraw();
  });
  text('title', 'title');
  text('subtitle', 'subtitle');
  text('badge', 'badge');
  document.getElementById('title').addEventListener('change', () => mutate(() => {}));
  document.getElementById('heat').addEventListener('input', (e) => {
    state.heat = Number(e.target.value);
    document.getElementById('heatValue').textContent = `${state.heat} / 5`;
    redraw();
  });
  document.getElementById('heat').addEventListener('change', () => mutate(() => {}));
  document.getElementById('size').addEventListener('change', (e) => mutate(() => { state.size = e.target.value; }));
  document.getElementById('grain').addEventListener('change', (e) => mutate(() => { state.grain = e.target.checked; }));
  document.getElementById('frame').addEventListener('change', (e) => mutate(() => { state.frame = e.target.checked; }));
  document.getElementById('panelPhoto').addEventListener('change', (e) => {
    mutate(() => { state.panels[selectedPanel].photo = Number(e.target.value); });
  });
  document.getElementById('panelTag').addEventListener('input', (e) => {
    state.panels[selectedPanel].tag = e.target.value;
    redraw();
  });
  document.getElementById('panelTag').addEventListener('change', () => mutate(() => {}));
  const slider = (id, key) => document.getElementById(id).addEventListener('input', (e) => {
    state.panels[selectedPanel][key] = Number(e.target.value);
    redraw();
  });
  slider('panelZoom', 'zoom');
  slider('panelOx', 'ox');
  slider('panelOy', 'oy');
  for (const id of ['panelZoom', 'panelOx', 'panelOy']) {
    document.getElementById(id).addEventListener('change', () => mutate(() => {}));
  }
  document.getElementById('fillAll').addEventListener('click', () => {
    const photo = state.panels[selectedPanel].photo;
    mutate(() => { for (const p of state.panels) p.photo = photo; });
  });
  document.getElementById('shuffle').addEventListener('click', () => {
    mutate(() => {
      for (const p of state.panels) p.photo = Math.floor(Math.random() * photos.length);
    });
  });
  document.getElementById('export').addEventListener('click', async () => {
    const bytes = await exportPng(state.size);
    statusEl.textContent = `Saved sunset-coast-cover-${SIZES[state.size].w}x${SIZES[state.size].h}.png (${Math.round(bytes / 1024)} KB).`;
  });
  document.getElementById('exportAll').addEventListener('click', async () => {
    for (const key of Object.keys(SIZES)) await exportPng(key);
    statusEl.textContent = 'Saved all 3 sizes: 1080x1080, 1080x1350, 1920x1080.';
  });
  document.getElementById('undo').addEventListener('click', () => {
    if (!undoStack.length) return;
    redoStack.push(snapshot());
    restore(undoStack.pop());
    refreshUndoButtons();
  });
  document.getElementById('redo').addEventListener('click', () => {
    if (!redoStack.length) return;
    undoStack.push(snapshot());
    restore(redoStack.pop());
    refreshUndoButtons();
  });
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault();
      document.getElementById('undo').click();
    } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
      e.preventDefault();
      document.getElementById('redo').click();
    }
  });
  // Click a panel to select it; drag to pan its photo; wheel to zoom it.
  canvas.addEventListener('pointerdown', (e) => {
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * canvas.width;
    const y = ((e.clientY - r.top) / r.height) * canvas.height;
    const hit = panelAt(canvas, state, x, y);
    if (hit < 0) return;
    pushUndo();
    selectedPanel = hit;
    pickedPhoto = state.panels[hit].photo;
    drag = { x: e.clientX, y: e.clientY, ox: state.panels[hit].ox, oy: state.panels[hit].oy };
    canvas.setPointerCapture(e.pointerId);
    syncControls();
    redraw();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const r = canvas.getBoundingClientRect();
    const cfg = state.panels[selectedPanel];
    cfg.ox = Math.max(-1, Math.min(1, drag.ox + ((e.clientX - drag.x) / r.width) * 2));
    cfg.oy = Math.max(-1, Math.min(1, drag.oy + ((e.clientY - drag.y) / r.height) * 2));
    syncControls();
    redraw();
  });
  canvas.addEventListener('pointerup', () => { drag = null; });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const cfg = state.panels[selectedPanel];
    pushUndo();
    cfg.zoom = Math.max(1, Math.min(3, cfg.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
    syncControls();
    redraw();
  }, { passive: false });
}

export const appApi = {
  get state() { return state; },
  set state(s) { state = s; },
  get photos() { return photos; },
  get selectedPanel() { return selectedPanel; },
  set selectedPanel(i) { selectedPanel = i; },
  loadSamples,
  redraw,
  syncControls,
  exportPng,
  defaultState,
};

buildChips();
bind();
refreshUndoButtons();

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, appApi);
} else {
  await loadSamples();
  try {
    await Promise.all([document.fonts.load('100px Anton'), document.fonts.load('40px Pacifico')]);
  } catch { /* fall back to system fonts */ }
  syncControls();
  redraw();
}
