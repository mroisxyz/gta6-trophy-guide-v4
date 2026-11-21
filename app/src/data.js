// Ledger data access: the authored trophy dossier is a local JSON file, never a network resource.

/** Load the authored 55-trophy dossier from this app's own data directory. */
export async function loadTrophies() {
  const response = await fetch('./data/trophies.json');
  if (!response.ok) throw new Error(`local dossier missing: ${response.status}`);
  const dossier = await response.json();
  return dossier;
}

/** Derive the audit figures from the dossier rather than hard-coding them in the page. */
export function computeClaimStats(dossier) {
  const list = dossier.trophies ?? [];
  let claims = 0;
  let backedByTwo = 0;
  for (const trophy of list) {
    for (const step of trophy.steps ?? []) {
      claims++;
      if ((step.cite ?? []).length >= 2) backedByTwo++;
    }
  }
  return {
    claims,
    backedByTwo,
    sourceCount: (dossier.sources ?? []).length,
    trophyCount: list.length,
    pages: dossier.stats?.pages ?? 19,
    reviewed: dossier.stats?.reviewed ?? '20 Nov 2026',
    disputes: list.reduce((n, t) => n + (t.disputes?.length ?? 0), 0),
    atRisk: list.filter((t) => t.atRisk).length,
    possiblyMissable: list.filter((t) => t.possiblyMissable).length,
    hidden: list.filter((t) => t.hidden).length,
    guidesCited: list.filter((t) => (t.sources ?? []).length > 0).length,
  };
}

/** Grade distribution shown in the masthead. */
export function countGrades(list) {
  const out = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of list) if (Object.hasOwn(out, t.grade)) out[t.grade]++;
  return out;
}

/** Trophies ordered by the roadmap stage stored on each record. */
export function byRoadmapOrder(list) {
  return [...list].sort((a, b) => a.roadmapStage - b.roadmapStage || a.id - b.id);
}
