// Leonida Ledger boot: load the local dossier, apply demo URL params, wire controls and redraw every view.

import { loadTrophies, computeClaimStats } from './src/data.js';
import {
  loadState, persistState, toggleSpoilers, setView, selectTrophy,
  exportProgress, importProgress,
} from './src/state.js';
import {
  renderAuditStrip, renderProgress, renderLeftRail, renderTrophyChecklist,
  renderTrophyDetail, renderRoadmap, renderMissables, renderSources, renderRightRail,
} from './src/render.js';

const params = new URLSearchParams(location.search);

/** Apply combinable demo URL params: view, filter, trophy (exact name), spoiler. */
export function applyDemoParams(state, dossier, search) {
  const view = search.get('view');
  if (['tracker', 'roadmap', 'missables', 'sources'].includes(view)) state.view = view;
  const filter = search.get('filter');
  if (filter) { state.filter = filter; if (!view) state.view = 'tracker'; }
  if (search.get('spoiler') === '1') state.spoiler = true;
  const exact = search.get('trophy');
  if (exact) {
    const found = dossier.trophies.find((t) => t.name === exact)
      ?? dossier.trophies.find((t) => t.name.toLowerCase() === exact.toLowerCase());
    if (found) { state.selected = found.id; if (!view) state.view = 'tracker'; }
  }
  return state;
}

/** Wire the static controls once; view-specific controls are wired by their renderers. */
function wireShell(state, dossier, stats, redraw) {
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.onclick = () => { setView(state, tab.dataset.view); redraw(); };
  });
  document.getElementById('spoiler-toggle').onclick = () => {
    toggleSpoilers(state); redraw();
  };
  document.getElementById('export-btn').onclick = () => exportProgress(state);
  document.getElementById('import-btn').onclick = () => document.getElementById('import-file').click();
  document.getElementById('import-file').onchange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    importProgress(file, state, (ok) => {
      if (!ok) alert('This ledger file could not be read.');
      redraw();
    });
    e.target.value = '';
  };
}

/** Render all five regions of the ledger from the current state. */
function makeRedraw(state, dossier, stats) {
  return function redraw() {
    renderProgress(dossier.trophies, state);
    renderAuditStrip(dossier, stats, state);
    renderLeftRail(dossier.trophies, state, redraw);
    renderRightRail(dossier.trophies, state, redraw);
    document.querySelectorAll('.tab').forEach((tab) =>
      tab.classList.toggle('active', tab.dataset.view === state.view));
    if (state.view === 'roadmap') renderRoadmap(dossier, state, redraw);
    else if (state.view === 'missables') renderMissables(dossier, state, redraw);
    else if (state.view === 'sources') renderSources(dossier, state, redraw);
    else {
      renderTrophyChecklist(dossier.trophies, state, redraw);
      const trophy = dossier.trophies.find((t) => t.id === state.selected) ?? dossier.trophies[0];
      renderTrophyDetail(trophy, state, redraw);
    }
  };
}

/** Boot the offline ledger. */
async function boot() {
  const dossier = await loadTrophies();
  const stats = computeClaimStats(dossier);
  const state = loadState();
  applyDemoParams(state, dossier, params);
  persistState(state);
  const redraw = makeRedraw(state, dossier, stats);
  wireShell(state, dossier, stats, redraw);
  redraw();
}

boot().catch((err) => {
  document.getElementById('center-pane').innerHTML =
    `<div class="spoiler-note">Local dossier could not be read: ${String(err.message ?? err)}</div>`;
});
