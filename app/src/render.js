// Ledger renderers. Every view is rebuilt from the dossier plus browser state; no remote content is ever inserted.

import { citationChips, sourceAnchor, escapeHtml } from './citations.js';
import { filterCounts, applyFilters, toggleEarned, setCount, selectTrophy } from './state.js';
import { countGrades, byRoadmapOrder } from './data.js';

const $ = (id) => document.getElementById(id);

/** The always-visible audit strip: counts of the evidence behind the guide. */
export function renderAuditStrip(dossier, stats, state) {
  const earned = Object.values(state.earned).filter(Boolean).length;
  const cells = [
    `<b>${stats.trophyCount}/${stats.trophyCount}</b> official name · description · grade`,
    `1P 2G 6S 46B`,
    `<b>${stats.hidden}</b> PSN-hidden`,
    `<b>${stats.claims}/${stats.claims}</b> claims cited`,
    `<b>${stats.trophyCount}/${stats.trophyCount}</b> guides cite sources`,
    `<b>${stats.backedByTwo}</b> backed by 2+ sources`,
    `<b>${stats.pages}</b> pages · <b>${stats.sourceCount}</b> sites read ${stats.reviewed}`,
    `<b>${stats.possiblyMissable}</b> possibly missable`,
    `<b>${stats.atRisk}</b> at risk`,
    `<b>${stats.disputes}</b> unconfirmed`,
    `<b>${stats.disputes}</b> disputes shown both ways`,
    `<b>${earned}/${stats.trophyCount}</b> in ledger`,
  ];
  $('audit-strip').innerHTML = cells.map((c, i) =>
    `<div class="audit-cell${i === 3 || i === 5 ? ' accent' : ''}">${c}</div>`).join('');
}

/** Masthead progress and grade distribution. */
export function renderProgress(list, state) {
  const earned = Object.values(state.earned).filter(Boolean).length;
  const g = countGrades(list);
  $('header-progress').textContent = `${earned}/${list.length}`;
  $('grade-counts').textContent = `${g.platinum}P · ${g.gold}G · ${g.silver}S · ${g.bronze}B`;
  const btn = $('spoiler-toggle');
  btn.textContent = `◈ SPOILER SHIELD: ${state.spoiler ? 'ON' : 'OFF'}`;
  btn.classList.toggle('on', state.spoiler);
}

/** Left rail: filter counts, grade chips, sorting and search. */
export function renderLeftRail(list, state, onStateChange) {
  const counts = filterCounts(list, state);
  const searchWasFocused = document.activeElement?.id === 'ledger-search';
  const caret = searchWasFocused ? document.activeElement.selectionStart : 0;
  const filters = [
    ['all', 'All'], ['story', 'Story'], ['missable', 'Missable'], ['collectible', 'Collectibles'],
    ['activity', 'Activities'], ['online', 'Online'], ['hidden', 'PSN-hidden'],
    ['disputed', 'Disputed'], ['notEarned', 'Not earned'],
  ];
  const grades = [['', 'ALL'], ['platinum', 'P'], ['gold', 'G'], ['silver', 'S'], ['bronze', 'B']];
  $('left-rail').innerHTML = `
    <h2>FILTERS / ${String(filters.length).padStart(2, '0')}</h2>
    <div class="rail-group">${filters.map(([key, label]) => `
      <button class="rail-item${state.filter === key ? ' active' : ''}" data-filter="${key}" type="button">
        <span>${label}</span><span class="num">${counts[key]}</span></button>`).join('')}</div>
    <div class="rail-group"><h2>GRADE</h2><div class="chip-grid">${grades.map(([key, label]) => `
      <button class="chip${state.grade === key ? ' active' : ''}" data-grade="${key}" type="button">${label}</button>`).join('')}</div></div>
    <div class="rail-group"><h2>SORT BY</h2>
      <button class="rail-item${state.sort === 'roadmap' ? ' active' : ''}" data-sort="roadmap" type="button">Roadmap order <span class="num">↕</span></button>
      <button class="rail-item${state.sort === 'name' ? ' active' : ''}" data-sort="name" type="button">Official name <span class="num">A–Z</span></button>
      <button class="rail-item${state.sort === 'grade' ? ' active' : ''}" data-sort="grade" type="button">Grade <span class="num">P→B</span></button>
    </div>
    <div class="rail-group"><h2>SEARCH</h2><input id="ledger-search" class="search" type="search" placeholder="name, step, source…" value="${escapeHtml(state.query)}"></div>
    <div class="rail-group"><div class="spoiler-note">Count chips track personal progress locally. Clearing browser data clears the ledger.</div></div>`;

  $('left-rail').querySelectorAll('[data-filter]').forEach((b) => b.onclick = () => {
    state.filter = b.dataset.filter; onStateChange();
  });
  $('left-rail').querySelectorAll('[data-grade]').forEach((b) => b.onclick = () => {
    state.grade = b.dataset.grade; onStateChange();
  });
  $('left-rail').querySelectorAll('[data-sort]').forEach((b) => b.onclick = () => {
    state.sort = b.dataset.sort; onStateChange();
  });
  $('ledger-search').oninput = (e) => { state.query = e.target.value; onStateChange(); };
  if (searchWasFocused) {
    const input = $('ledger-search');
    input.focus();
    input.setSelectionRange(caret ?? 0, caret ?? 0);
  }
}

/** Compact checklist rows with grade, official name, description, citation count and flags. */
export function renderTrophyChecklist(list, state, onStateChange) {
  const visible = applyFilters(list, state);
  const head = `<div class="list-head"><span>CHECKLIST · ${visible.length} OF ${list.length} SHOWN</span><span>${state.sort.toUpperCase()} / ${state.filter.toUpperCase()}</span></div>`;
  const rows = visible.map((t) => {
    const hiddenBySpoiler = state.spoiler && t.kind === 'story' && !state.earned[t.id];
    const name = hiddenBySpoiler ? '████ ██████ ████' : escapeHtml(t.name);
    const desc = hiddenBySpoiler ? 'Story name masked — earn this trophy to reveal it.' : escapeHtml(t.description);
    const citeCount = (t.sources ?? []).length;
    return `<div class="trophy-row${t.missable ? ' missable' : ''}${state.selected === t.id ? ' selected' : ''}${hiddenBySpoiler ? ' spoiled' : ''}" data-id="${t.id}" tabindex="0">
      <button class="tick${state.earned[t.id] ? ' done' : ''}" data-tick="${t.id}" type="button" title="Toggle earned">${state.earned[t.id] ? '✓' : ''}</button>
      <span class="grade-mark grade-${t.grade}">${t.grade[0].toUpperCase()}</span>
      <span><span class="t-name">${name}</span><span class="t-desc">${desc}</span>
        <span class="t-meta">
          <span class="tiny">#${String(t.id).padStart(2, '0')}</span>
          <span class="tiny">${escapeHtml(t.kind)}</span>
          ${t.hidden ? '<span class="tiny hidden-b">PSN-HIDDEN</span>' : ''}
          ${t.possiblyMissable ? '<span class="tiny warn">POSSIBLY MISSABLE</span>' : t.atRisk ? '<span class="tiny warn">AT RISK</span>' : ''}
          ${t.sourcesDiffer ? '<span class="tiny warn">SOURCES DIFFER</span>' : ''}
        </span></span>
      <span class="t-cites">${citeCount}<br>SRC</span>
    </div>`;
  }).join('');
  $('center-pane').innerHTML = head + (rows || '<div class="spoiler-note">No trophies match this filter.</div>');
  $('center-pane').querySelectorAll('[data-tick]').forEach((b) => b.onclick = (e) => {
    e.stopPropagation(); toggleAndSelect(Number(b.dataset.tick), state, onStateChange);
  });
  $('center-pane').querySelectorAll('.trophy-row').forEach((row) => {
    row.onclick = () => selectInList(Number(row.dataset.id), state, onStateChange);
    row.onkeydown = (e) => { if (e.key === 'Enter') selectInList(Number(row.dataset.id), state, onStateChange); };
  });
}

/** Tick a row: flip earned status, focus the row in the detail pane and redraw. */
function toggleAndSelect(id, state, onChange) {
  toggleEarned(state, id);
  state.selected = id;
  onChange();
}

/** Select a row for reading without changing earned status. */
function selectInList(id, state, onChange) {
  selectTrophy(state, id);
  onChange();
}

/** Right detail pane: official text, badges, personal counter, dispute, steps and sources. */
export function renderTrophyDetail(trophy, state, onStateChange) {
  if (!trophy) { $('detail-pane').innerHTML = '<h2>DETAIL</h2>'; return; }
  const max = trophy.count ?? 18;
  const mine = state.counts[trophy.id] ?? 0;
  const badges = [
    `<span class="badge">GRADE · ${trophy.grade.toUpperCase()}</span>`,
    trophy.hidden ? '<span class="badge info">PSN-HIDDEN</span>' : '',
    trophy.count ? `<span class="badge">OFFICIAL COUNT · ${trophy.count}</span>` : '',
    trophy.possiblyMissable ? '<span class="badge warn">POSSIBLY MISSABLE</span>' : '',
    trophy.atRisk ? '<span class="badge warn">AT RISK</span>' : '',
    trophy.sourcesDiffer ? '<span class="badge warn">SOURCES DIFFER</span>' : '',
  ].filter(Boolean).join('');
  const missable = trophy.missable ? `
    <div class="callout"><span class="label">MISSABLE WINDOW</span>${escapeHtml(trophy.guide)}
    Keep a manual save before the window opens; ${escapeHtml((trophy.steps[2] ?? trophy.steps[0]).text)}</div>` : '';
  const disputes = (trophy.disputes ?? []).map((d) => `
    <div class="dispute"><span class="label">SOURCES DIFFER — ${escapeHtml(d.question)}</span>
      <p><span class="pos">POSITION A</span> ${escapeHtml(d.positionA)}</p>
      <p><span class="pos">POSITION B</span> ${escapeHtml(d.positionB)}</p>
      <p class="pos">CROSS-REFERENCE ${citationChips(d.cites)}</p></div>`).join('');
  const steps = (trophy.steps ?? []).map((s, i) => `
    <div class="step"><span class="step-n">${String(i + 1).padStart(2, '0')}</span>
      <span>${escapeHtml(s.text)} ${citationChips(s.cite)}</span></div>`).join('');
  const sourceLines = (trophy.sources ?? []).map((s, i) => `
    <div class="src-line">[${i + 1}] ${sourceAnchor(s)} — ${escapeHtml(s.url)}</div>`).join('');

  $('detail-pane').innerHTML = `
    <div class="detail-head"><div><div class="detail-id">ENTRY ${String(trophy.id).padStart(2, '0')} / 55 · ${escapeHtml(trophy.kind.toUpperCase())} · ${escapeHtml(trophy.stageLabel)}</div>
      <h2 class="detail-name">${escapeHtml(trophy.name)}</h2></div>
      <span class="grade-mark grade-${trophy.grade}">${trophy.grade[0].toUpperCase()}</span></div>
    <div class="official">“${escapeHtml(trophy.description)}” <span class="cite">[6]</span></div>
    <div class="badges">${badges}</div>
    <div class="counter-box"><span class="counter-label">YOUR COUNT — ${trophy.id === 28 ? 'meditations' : 'tracked progress'}</span>
      <span class="counter-num">${mine}/${max}</span>
      <span class="counter-btns"><button data-count="-1" type="button">−</button><button data-count="1" type="button">+</button></span></div>
    ${missable}${disputes}
    <div class="section-title">HOW TO EARN IT — ${(trophy.steps ?? []).length} CITED STEPS</div>
    ${steps}
    <div class="section-title">SOURCES FOR THIS GUIDE — ${(trophy.sources ?? []).length}</div>
    ${sourceLines}`;

  $('detail-pane').querySelectorAll('[data-count]').forEach((b) => b.onclick = () => {
    setCount(state, trophy.id, Number(b.dataset.count));
    onStateChange();
  });
}

/** Far-right rail: the next unearned trophies in roadmap order. */
export function renderRightRail(list, state, onStateChange) {
  const upcoming = byRoadmapOrder(list).filter((t) => !state.earned[t.id]).slice(0, 11);
  $('right-rail').innerHTML = `<h2>NEXT UP · ROADMAP ORDER</h2>${upcoming.map((t) => `
    <button class="next-row" data-next="${t.id}" type="button">
      <span class="sb">${escapeHtml(t.stageLabel)} · ${t.grade.toUpperCase()}${t.missable ? ' · AT RISK' : ''}</span>
      <span class="nm">${state.spoiler && t.kind === 'story' ? '██████' : escapeHtml(t.name)}</span></button>`).join('') || '<div class="spoiler-note">Everything is earned.</div>'}`;
  $('right-rail').querySelectorAll('[data-next]').forEach((b) => b.onclick = () => {
    selectTrophy(state, Number(b.dataset.next));
    onStateChange();
  });
}

/** Roadmap tab: five stages with chapter boundaries, save advice and missable flags. */
export function renderRoadmap(dossier, state, onStateChange) {
  const list = dossier.trophies;
  const advice = [
    'Boundary: prologue ends with Gone Fishing. Take a manual save now; the Chapter 1 balcony meditation is the only possibly missable beat.',
    'Boundary: Chapter 2 into Chapter 3. Clear Cartel Heist and the Race Against Yago window before the chapter card closes.',
    'Boundary: Chapter 4. Child’s Play, Headliners and VCIA Takedown each carry their own trophy; finish all three plus the stranger strands.',
    'Boundary: Chapter 5 into the final mission. Operation Savage Glory, the gold finale and one last manual save belong here.',
    'Boundary: no story left. Sweep challenges, meditations, vaults, gang operations, vehicles and properties; no replay or NG+ is required.',
  ];
  $('center-pane').innerHTML = `<div class="list-head"><span>PLATINUM ROADMAP · ONE PLAYTHROUGH · ~200H</span><span>15 MANUAL SAVES · NO CHEATS</span></div>` +
    (dossier.stages ?? []).map((stage) => {
      const items = list.filter((t) => t.roadmapStage === stage.n);
      const risky = items.filter((t) => t.missable);
      return `<div class="stage-card"><div class="stage-title">${escapeHtml(stage.label)} <span class="cite">[1][5]</span></div>
        <div class="stage-meta">${items.length} TROPHIES · ${risky.length} MISSABLE-FLAGGED · MANUAL SAVE AT BOUNDARY [1]</div>
        <div class="stage-body">${escapeHtml(advice[stage.n - 1])}<br><b>ENTRIES:</b> ${items.map((t) => escapeHtml(t.name)).join(' · ')}</div></div>`;
    }).join('');
  $('detail-pane').innerHTML = `<h2>ROADMAP NOTES</h2>
    <div class="official">PowerPyx: 55 offline, 0 online, roughly 200 hours, 4/10 difficulty, one playthrough, no replay or NG+, cheats disable trophies, 15 manual saves. <span class="cite">[1]</span></div>
    <div class="callout"><span class="label">HARDEST TROPHY</span>A Long Road — 100% completion. Save the full collectible sweep for Stage V. <span class="cite">[1][3]</span></div>
    <div class="callout"><span class="label">CHAPTER MAP</span>Break the Bank = Cartel Heist (Ch3); Family Matters = Child’s Play, DWNFALL = Headliners, Hi-Jacked = VCIA Takedown (Ch4); Snow Storm = Operation Savage Glory (Ch5). <span class="cite">[3][10]</span></div>
    <div class="section-title">SAVE DISCIPLINE</div>
    <div class="step"><span class="step-n">01</span><span>Use the 15 manual saves as checkpoints at every chapter boundary and before each missable window. <span class="cite">[1]</span></span></div>
    <div class="step"><span class="step-n">02</span><span>Do side jobs as they appear, and scan WAiNK / cards / stunts while driving between objectives. <span class="cite">[5]</span></span></div>
    <div class="step"><span class="step-n">03</span><span>Leave UFO, tank, airliner and bowling-alley oddities for the final cleanup block. <span class="cite">[5][12]</span></span></div>`;
}

/** Missables tab: every flagged trophy with the window stated in its guide. */
export function renderMissables(dossier) {
  const flagged = dossier.trophies.filter((t) => t.missable);
  $('center-pane').innerHTML = `<div class="list-head"><span>MISSABLE AUDIT · ${flagged.length} FLAGGED</span><span>1 POSSIBLY · ${flagged.length - 1} AT RISK</span></div>` +
    flagged.map((t) => `<div class="miss-card"><div class="n">${escapeHtml(t.name)} <span class="cite">[${(t.steps[0]?.cite ?? [1])[0]}]</span> <span class="tiny">${escapeHtml(t.stageLabel)}</span></div>
      <div class="w">${escapeHtml(t.guide)}</div>
      <div class="w">WINDOW: ${escapeHtml((t.steps.find((s) => /before|during|chapter|window|early/i.test(s.text)) ?? t.steps[0]).text)} ${citationChips((t.steps[0]?.cite ?? [1]))}</div></div>`).join('');
  $('detail-pane').innerHTML = `<h2>MISSABLE POLICY</h2>
    <div class="callout"><span class="label">POSSIBLY MISSABLE — POSITIVE MENTAL ATTITUDE</span>PowerPyx and Output Lag point at a Chapter 1 balcony meditation; other guides treat meditations as free roam. Do it in Chapter 1 and keep the save. <span class="cite">[1][2][3][10]</span></div>
    <div class="callout"><span class="label">CHAPTER-TRAPPED STRANDS</span>BestGTA6 flags Race Against Yago in Chapter 3; gta.guide maps eight stranger strands across Chapters 2–4. <span class="cite">[4][3]</span></div>
    <div class="section-title">RULE OF THUMB</div>
    <div class="step"><span class="step-n">01</span><span>One playthrough is enough, but only if each window is closed before its chapter card. <span class="cite">[1][5]</span></span></div>
    <div class="step"><span class="step-n">02</span><span>Cheats switch trophies off; do not use them to shortcut a missable beat. <span class="cite">[1][12]</span></span></div>`;
}

/** Sources tab: all 19 named sites and the trophies each one supports. */
export function renderSources(dossier) {
  const cards = (dossier.sources ?? []).map((s) => {
    const supported = dossier.trophies.filter((t) => (t.sources ?? []).some((x) => x.id === s.id));
    return `<div class="src-card"><div class="sn">[${s.id}] ${escapeHtml(s.name)} <span class="tiny">${supported.length} TROPHIES</span></div>
      <div class="su">${escapeHtml(s.url)}</div>
      <div class="st">SUPPORTS: ${supported.slice(0, 14).map((t) => escapeHtml(t.name)).join(' · ')}${supported.length > 14 ? ` · +${supported.length - 14} more` : ''}</div></div>`;
  }).join('');
  $('center-pane').innerHTML = `<div class="list-head"><span>SOURCE REGISTER · ${dossier.sources.length} SITES</span><span>READ 20 NOV 2026 · ANCHORS ONLY</span></div>${cards}`;
  $('detail-pane').innerHTML = `<h2>HOW WE CITE</h2>
    <div class="official">Numbers in square brackets are source ids. Each step in a trophy guide carries its own chips; the official description carries [6] for the PSN data mirror. <span class="cite">[6]</span></div>
    <div class="section-title">CONFLICT POLICY</div>
    <div class="step"><span class="step-n">01</span><span>Where guides disagree, both positions are printed in the trophy detail and the official description wins. <span class="cite">[6][10]</span></span></div>
    <div class="step"><span class="step-n">02</span><span>Counts quoted by secondary guides are cross-checked against the official trophy text. <span class="cite">[4][6][7]</span></span></div>
    <div class="section-title">OFFLINE PROMISE</div>
    <div class="step"><span class="step-n">03</span><span>URLs are anchors only: the app never requests them at runtime. <span class="cite">[13]</span></span></div>`;
}
