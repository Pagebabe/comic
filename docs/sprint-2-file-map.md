# Sprint 2 File Map

## Committed seed files

```text
src/types/comic.ts
src/data/characters.ts
src/data/locations.ts
src/data/episodes.ts
src/data/scenes.ts
src/data/panels.scene001.ts
src/data/panels.scene002.ts
src/data/panels.scene003.ts
src/data/panelsScene004.ts
src/data/panel017.ts
src/data/pilotPanels.ts
src/data/pilotData.ts
src/data/comicAssets.ts
src/utils/promptBuilder.ts
```

## Import entrypoint

Use this for the next UI sprint:

```ts
import { characters, locations, episodes, scenes, panels } from '../data/pilotData';
```

`comicAssets.ts` exists as a separate empty asset store. It is not exported by `pilotData.ts` because the connector blocked that barrel export during this session.

## Panel status

- Scene 1: detailed panels 001-005
- Scene 2: detailed panels 006-010
- Scene 3: detailed panels 011-015
- Scene 4: panel 016 plus panel 017 are seeded
- Panels 018-030: generated placeholders in `pilotPanels.ts`

Before render production, replace placeholders with final visual beats.
