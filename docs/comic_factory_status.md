# Comic Factory Production Status

Last updated: 2026-07-05
Branch: `backend-adapters`
Repo: `Pagebabe/comic`

## Current truth

The project is now a focused **Ricco im Haus / Comic Factory** MVP, not an AI influencer dashboard.

The active development branch is `backend-adapters`. The branch is ahead of `main` and currently carries the useful backend/API-ready layer. The branch should stay as the working branch until the local production loop is manually tested.

## Git state

- `main` is the default branch.
- `backend-adapters` contains the current Comic Factory production improvements.
- PR #1 is open as a draft and is mergeable.
- GitHub CI / TypeScript / Vite build has passed on the branch.
- Vercel status may show failure because of build-rate-limit/account state, not confirmed code failure.

## What exists and is usable

### App shell

- Vite
- React
- TypeScript
- hash routes
- Comic Factory sidebar
- default route: `#/ricco-control`
- production port: `3100`

### Core Ricco workflow

```text
Ricco Control
→ Ricco Studio
→ Prompt Queue
→ Generation Queue
→ ComfyUI M1 manual render plan
→ Asset Import / Bulk Upload
→ Image Review
→ Storage Manager
→ QA Gate
→ Export Gate
→ Lettering Preview
→ Production Package
→ Restore
```

### Story seed

- Series: `Ricco im Haus`
- Pilot episode: `Episode 1: Das Zimmer`
- Format target: `1 story → 8 stable panels → generated variants → human approval → lettering/export`
- Core conflict: Ricco rents an overpriced illegal room that is sold to him as a non-capitalist, solidaric arrangement.

### Characters v1

- Ricco — chaotic musician and main character
- Basti Prenzl — illegal landlord, ex-squatter, Prenzlauer Berg hypocrite
- Jule — house activist and plenum power center
- Don Miau — boss of the cat gang

Each character currently has:

- role
- short description
- personality
- contradiction
- appearance
- outfit / visual identity
- speech style
- typical lines
- visual prompt block
- continuity rules
- negative prompt

### Locations v1

- Hausfassade
- Riccos Zimmer
- Flur / Treppenhaus
- Gemeinschaftsküche

Each location currently has:

- description
- atmosphere
- recurring objects
- visual prompt block
- continuity rules
- negative prompt

### Episode 1 panel board

The pilot currently has 8 scripted panels:

1. Ankunft
2. Basti erscheint
3. Solidarische Nutzungsgebühr
4. Das Zimmer
5. Mama ruft an
6. Hausregeln
7. Die Küche
8. Mietrealität

Each panel currently has:

- location
- characters
- action
- camera
- mood
- important visual details
- dialogue overlay
- prompt-ready status

### Prompt system

`buildRiccoPanelPrompt(panelId)` builds:

- positive prompt
- negative prompt
- continuity checklist
- dialogue overlay

Hard image rule:

```text
No speech bubbles.
No readable dialogue inside the image.
No fake lettering.
No random text artifacts.
```

Text belongs to the later overlay/lettering layer.

### Generation Queue

`#/ricco-generation-queue` converts all Ricco panel prompts into traceable generation jobs.

A generation job includes:

- job id
- prompt id
- panel id
- episode id
- workflow id
- workflow version
- positive prompt
- negative prompt
- model id
- lora ids placeholder
- seed
- sampler
- steps
- cfg
- resolution
- batch size/count
- output path
- status

Current queue functions:

- create jobs from prompt queue
- read jobs from LocalStorage
- clear queue
- copy job text
- copy adapter payload
- update status manually
- export JSON
- download JSON
- check ComfyUI health if configured

Important limitation:

Creating jobs currently replaces the stored queue. Later this should support append/dedupe or "only missing panels" mode.

### Asset Import

`#/ricco-asset-import` can:

- read public image paths from input
- normalize paths
- infer panel id from filename
- link imported images to a selected Generation Job
- store imported images in LocalStorage
- update linked generation job status to `imported_as_asset`

Recommended file naming:

```text
/generated/panel_001_v1.png
/generated/panel_001_v2.png
/generated/panel_002_v1.webp
```

Important limitation:

The current UI links all parsed paths to one selected Generation Job. Later it should infer and link the matching job per image path automatically.

### Image Review

`#/ricco-image-review` can:

- store manual image URLs
- store small local image files as Data URLs
- read public asset imports
- show source type
- show linked generation job / prompt id
- rate each image
- score continuity
- write notes
- choose exactly one final image per panel
- delete variants

Important limitation:

Review is human/manual. There is no automated visual consistency scoring yet.

### QA Gate

`#/ricco-qa` checks:

- missing final image
- final image rating below 4
- final image continuity below 4
- missing review note

This is a practical MVP gate, not a computer-vision gate.

### Export Gate

`#/ricco-export` checks:

- final image count
- missing panels
- panel order
- dialogue overlay preview

Important limitation:

This is currently an export-readiness gate, not a real PNG/PDF exporter.

### Lettering Preview

`#/ricco-lettering` can:

- show final images in episode order
- display dialogue overlay text under/with each panel
- copy dialogue script
- use browser print / PDF

Important limitation:

This is not yet a real drag-and-drop speech bubble editor.

### Package / Restore

`#/ricco-package` exports a full production package JSON with:

- series bible
- episode data
- characters
- locations
- panels
- generated prompts
- generation jobs
- stored image variants
- selected final images
- ratings
- continuity scores
- review notes
- next steps

`#/ricco-restore` can restore:

- image variants
- final image selection
- ratings
- continuity scores
- review notes
- generation jobs

Important limitation:

Story/character/location/panel seed data still comes from code, not from restored package data.

## Backend state

### Local browser backend

Implemented through LocalStorage:

```text
ricco-studio-images-v1
ricco-generation-jobs-v1
ricco-quality-reviews-v1
```

### Supabase

Supabase is prepared but not production-ready.

Existing pieces:

- `docs/supabase_master_v1.sql`
- `src/lib/backend/supabaseRestStore.ts`
- env placeholders in `.env.example`

Missing before reliable use:

- RLS policies
- auth/write strategy
- real CRUD integration in UI
- migration strategy from LocalStorage

### ComfyUI

ComfyUI is prepared but not production-automated.

Existing pieces:

- `VITE_COMFYUI_API_URL`
- `VITE_COMFYUI_CLIENT_ID`
- health check via `/system_stats`
- raw workflow submit helper
- minimal adapter payload builder

Missing before real automation:

- exported stable ComfyUI workflow JSON
- node id mapping
- prompt node mapping
- negative prompt node mapping
- seed/sampler/steps/cfg/size mapping
- output path mapping
- LoRA node mapping later
- queue/history polling
- generated asset ingestion

## Biggest open production blockers

1. Visual consistency is not solved yet.
2. Character reference packs do not exist yet.
3. Location reference packs do not exist yet.
4. Style reference pack does not exist yet.
5. LoRA training is not started.
6. ComfyUI node graph mapping is not done.
7. PNG/PDF export is not real yet.
8. Lettering is not a real bubble editor yet.
9. `main` does not yet contain the current branch state.
10. The pilot has not been rendered and reviewed end-to-end yet.

## Next build order

Do not add new platform, social posting, CRM, n8n, Baserow, Qdrant, fan funnels, or extra automation yet.

### Phase 1 — Stabilize local MVP

1. Run branch locally.
2. Open `#/ricco-control`.
3. Create Generation Queue jobs.
4. Copy one job into ComfyUI manually.
5. Render at least one panel.
6. Put output into `public/generated/`.
7. Import via Asset Import.
8. Review image.
9. Select final image.
10. Export package.
11. Restore package.
12. Confirm loop works.
13. Repeat for all 8 panels.

### Phase 2 — Reference packs

Build reference packs before LoRA.

Character order:

1. Ricco
2. Basti Prenzl
3. Jule
4. Don Miau

For each character:

- front view
- side view
- back view
- 3 emotion faces
- neutral pose
- stress pose
- negative example sheet
- prompt block lock
- outfit lock
- forbidden variations

Location order:

1. Hausfassade
2. Riccos Zimmer
3. Flur / Treppenhaus
4. Gemeinschaftsküche

For each location:

- wide shot
- detail shot
- prop sheet
- lighting rule
- color rule
- forbidden look

### Phase 3 — ComfyUI mapping

Only after the manual loop produces acceptable panels:

1. Export stable ComfyUI workflow.
2. Map node ids.
3. Build job → workflow transformer.
4. Submit jobs through API.
5. Poll result/history.
6. Import outputs automatically or semi-automatically.

### Phase 4 — LoRA

Only after reference packs are stable:

1. Build datasets.
2. Caption consistently.
3. Train character LoRAs.
4. Evaluate against pilot panels.
5. Add LoRA ids/weights to Generation Jobs.
6. Document weaknesses.

## Git maintenance rule

All meaningful project decisions should be committed into `docs/` or code, not left only in chat.

Recommended status files:

```text
docs/comic_factory_status.md
docs/backend_adapter_plan.md
docs/reference_pack_plan.md
docs/comfyui_mapping_plan.md
docs/lora_training_plan.md
```

Current rule:

```text
Git is the project memory. Chat is only the workbench.
```
