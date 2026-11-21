[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/mroisxyz/gta6-trophy-guide-v4/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/mroisxyz/gta6-trophy-guide-v4/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# Leonida Ledger — GTA VI Trophy Audit & Tracker

A dense, citation-first offline guide to all 55 PlayStation 5 trophies in Grand Theft Auto VI. Every trophy carries its official name, description and grade, a guide written for this entry, numbered source chips on each step, and a source register of 19 named sites read on 20 November 2026. Conflicting claims (the Chapter 1 meditation window, the bowling alley trigger, Ten Pin) are shown both ways instead of being silently resolved.

The tracker saves earned trophies, personal count chips and display settings in `localStorage`, and can export and import a JSON progress file. Filters cover story, missable, collectibles, activities, PSN-hidden, disputed and not-earned entries; a spoiler shield masks story names until they are earned. Five roadmap stages map the chapter boundaries, manual-save points and missable windows of a single playthrough. Demo URLs combine `?view=roadmap|missables|sources`, `?filter=missable`, `?trophy=<exact name>` and `?spoiler=1`.

The app is plain static files under `app/`. It fetches only its own local trophy dossier; source URLs are anchors that open only when a reader clicks them. No Rockstar artwork or remote assets are used.

## Run it

```
node serve.ts
```

Then open http://localhost:8080. To build the hand-in package locally: `MAKEFUN_OUTPUT_DIR=out node main.ts`.

[Enter the make.fun bounty](https://make.fun/bounty/gta6-trophy-guide-01?ref=jhbwqchj)
