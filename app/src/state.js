// Tracker state: progress, counters, spoiler shield and filters, persisted in this browser only.

const STORAGE_KEY = 'leonida-ledger-v4';

/** Default ledger state, before any local progress is read. */
export function defaultState() {
  return {
    earned: {}, counts: {}, spoiler: false, view: 'tracker',
    filter: 'all', grade: '', sort: 'roadmap', query: '', selected: 1,
  };
}

/** Read the saved state, tolerating an old or partial record. */
export function loadState() {
  const base = defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw);
    return {
      ...base, ...saved,
      earned: saved.earned && typeof saved.earned === 'object' ? saved.earned : {},
      counts: saved.counts && typeof saved.counts === 'object' ? saved.counts : {},
    };
  } catch {
    return base;
  }
}

/** Persist the whole state to localStorage. */
export function persistState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* private mode */ }
}

/** Mark one trophy earned or unearned and save. */
export function toggleEarned(state, id) {
  state.earned[id] = !state.earned[id];
  if (!state.earned[id]) delete state.earned[id];
  persistState(state);
  return state;
}

/** Adjust the interactive YOUR COUNT value for one trophy, clamped at zero. */
export function setCount(state, id, delta) {
  const next = Math.max(0, (state.counts[id] ?? 0) + delta);
  if (next === 0) delete state.counts[id]; else state.counts[id] = next;
  persistState(state);
  return state;
}

/** Flip the spoiler shield and save. */
export function toggleSpoilers(state) {
  state.spoiler = !state.spoiler;
  persistState(state);
  return state;
}

/** Select a view (Tracker, Roadmap, Missables, Sources). */
export function setView(state, view) {
  state.view = view;
  persistState(state);
  return state;
}

/** Select a trophy by id for the detail pane. */
export function selectTrophy(state, id) {
  state.selected = id;
  persistState(state);
  return state;
}

/** One filter predicate, used by the rail and by applyFilters. */
function matchesFilter(trophy, filter, state) {
  switch (filter) {
    case 'story': return trophy.kind === 'story';
    case 'missable': return Boolean(trophy.missable);
    case 'collectible': return trophy.kind === 'collectible';
    case 'activity': return trophy.kind === 'activity';
    case 'online': return trophy.kind === 'online';
    case 'hidden': return Boolean(trophy.hidden);
    case 'disputed': return Boolean(trophy.sourcesDiffer);
    case 'notEarned': return !state.earned[trophy.id];
    default: return true;
  }
}

/** Apply rail filters, grade chip, search text and sort to the trophy list. */
export function applyFilters(list, state) {
  const query = (state.query ?? '').trim().toLowerCase();
  const result = list.filter((t) => {
    if (!matchesFilter(t, state.filter, state)) return false;
    if (state.grade && t.grade !== state.grade) return false;
    if (!query) return true;
    const text = `${t.name} ${t.description} ${t.guide} ${(t.steps ?? []).map((s) => s.text).join(' ')}`;
    return text.toLowerCase().includes(query);
  });
  if (state.sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name));
  else if (state.sort === 'grade') result.sort((a, b) => a.grade.localeCompare(b.grade) || a.id - b.id);
  else result.sort((a, b) => a.roadmapStage - b.roadmapStage || a.id - b.id);
  return result;
}

/** Rail counts, computed from the live set including the earned flags. */
export function filterCounts(list, state) {
  return {
    all: list.length,
    story: list.filter((t) => t.kind === 'story').length,
    missable: list.filter((t) => t.missable).length,
    collectible: list.filter((t) => t.kind === 'collectible').length,
    activity: list.filter((t) => t.kind === 'activity').length,
    online: list.filter((t) => t.kind === 'online').length,
    hidden: list.filter((t) => t.hidden).length,
    disputed: list.filter((t) => t.sourcesDiffer).length,
    notEarned: list.filter((t) => !state.earned[t.id]).length,
  };
}

/** Download the progress record as JSON. */
export function exportProgress(state) {
  const payload = JSON.stringify({ app: 'leonida-ledger-v4', exported: new Date().toISOString(), ...state }, null, 2);
  const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leonida-ledger-progress.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Read a progress file back into the state and save it. */
export function importProgress(file, state, done) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(String(reader.result));
      state.earned = imported.earned && typeof imported.earned === 'object' ? imported.earned : {};
      state.counts = imported.counts && typeof imported.counts === 'object' ? imported.counts : {};
      if (typeof imported.spoiler === 'boolean') state.spoiler = imported.spoiler;
      persistState(state);
      done(true);
    } catch {
      done(false);
    }
  };
  reader.onerror = () => done(false);
  reader.readAsText(file);
}
