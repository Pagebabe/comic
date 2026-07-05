# Comic Factory Production Status

Last updated: 2026-07-05
Branch: `backend-adapters`
Repo: `Pagebabe/comic`

## Current truth

The project is now a focused **Ricco im Haus / Comic Factory** MVP, not an AI influencer dashboard.

The active development branch is `backend-adapters`. The branch contains the current Comic Factory production workflow, backend adapter preparation, local generation queue, ComfyUI manual render plan, reference pack planner with local review state, public asset import, image review, QA, export readiness, lettering preview, package backup/restore including reference review state, a central Control Room and planning docs.

Git is the project memory. Chat is the workbench.

## Git state

- `main` is the default branch.
- `backend-adapters` contains the current Comic Factory production improvements.
- PR #1 is open as a draft and is mergeable.
- Branch is ahead of `main` and not behind.
- GitHub CI and Build Check passed after Control Room v0.2 / Reference Pack status integration.
- Package v0.3 / Restore v0.3 reference review backup has been committed and still needs latest CI/Build confirmation.
- Vercel status may still show failure because of build-rate-limit/account state, not confirmed code failure.

## Main routes

```text
#/ricco-control
#/ricco-studio
#/ricco-prompt-queue
#/ricco-generation-queue
#/ricco-comfy-m1
#/ricco-reference-packs
#/ricco-asset-import
#/ricco-bulk-upload
#/ricco-image-review
#/ricco-storage
#/ricco-qa
#/ricco-export
#/ricco-lettering
#/ricco-package
#/ricco-restore
```

## Core production loop

```text
Ricco Control
→ Ricco Studio
→ Prompt Queue
→ Generation Queue
→ ComfyUI M1 manual render plan
→ Reference Packs
→ Local SDXL Generation
→ Asset Import / Bulk Upload
→ Image Review
→ Storage Manager
→ QA Gate
→ Export Gate
→ Lettering Preview
→ Production Package
→ Restore
```

## Story seed

- Series: `Ricco im Haus`
- Pilot episode: `Episode 1: Das Zimmer`
- Format target: `1 story → 8 stable panels → generated variants → human approval → lettering/export`
- Core conflict: Ricco rents an overpriced illegal room that is sold to him as a non-capitalist, solidaric arrangement.

## Core cast

- Ricco — chaotic musician and main character
- Basti Prenzl — illegal landlord, ex-squatter, Prenzlauer Berg hypocrite
- Jule — house activist and plenum power center
- Don Miau — boss of the cat gang

## Core locations

- Hausfassade
- Riccos Zimmer
- Flur / Treppenhaus
- Gemeinschaftsküche

## Episode 1 panel board

The pilot currently has 8 scripted panels:

1. Ankunft
2. Basti erscheint
3. Solidarische Nutzungsgebühr
4. Das Zimmer
5. Mama ruft an
6. Hausregeln
7. Die Küche
8. Mietrealität

Each panel has location, characters, action, camera, mood, important visual details, dialogue overlay and prompt-ready status.

## Hard image rule

Generated images are clean comic frames.

```text
No speech bubbles.
No readable dialogue inside the image.
No fake lettering.
No random text artifacts.
```

Text belongs to the later overlay/lettering layer.

## Control Room v0.2

`#/ricco-control` is the central production screen.

It shows:

- final panel progress
- generation job count
- image variant count
- QA gate issue count
- browser storage size
- Reference Pack status summary
- approved reference count
- candidate reference count
- redraw/rejected reference counts
- next production step
- copyable runbook

Reference Pack status is part of the Control Room workflow. The first pilot stability target is:

```text
4 approved references minimum before serious pilot panel testing.
```

The Control Room reads the same local reference review state as `#/ricco-reference-packs` and includes it in storage estimation.

## Generation Queue

`#/ricco-generation-queue` converts Ricco panel prompts into traceable generation jobs.

Current queue functions:

- create missing jobs from prompt queue
- preserve existing jobs and their statuses
- dedupe jobs using episode/panel/prompt/workflow key
- read jobs from LocalStorage
- clear queue
- copy job text
- copy adapter payload
- update status manually
- export JSON
- download JSON
- check ComfyUI health if configured

Fixed:

```text
Creating jobs no longer blindly replaces the stored queue.
Existing completed/imported/failed jobs are preserved.
Only missing jobs are appended.
```

## Reference Packs v0.2

`#/ricco-reference-packs` provides:

- Character reference pack planner for Ricco, Basti Prenzl, Jule and Don Miau
- Location reference pack planner for Hausfassade, Riccos Zimmer, Flur/Treppenhaus and Gemeinschaftsküche
- Series style reference pack planner
- Folder naming for `public/references/...`
- Required asset filenames
- Copyable reference prompts
- Must-keep continuity rules
- Forbidden drift rules
- Local browser review state per reference asset
- Review statuses: `raw`, `candidate`, `approved_reference`, `needs_redraw`, `rejected`
- Actual image path field per reference asset
- Review notes per reference asset
- Copyable Reference Review Report
- Review rule: only `approved_reference` should move into datasets/LoRA later

LocalStorage key:

```text
ricco-reference-review-v1
```

Purpose:

```text
Solve visual consistency before LoRA, ControlNet, API batch rendering or serious episode production.
```

Known limitation:

The page stores approval state and paths, but generated reference images are not yet imported into the normal Ricco Image Review workflow as visual thumbnails.

## Production Package v0.3 / Restore v0.3

`#/ricco-package` now exports package version:

```text
ricco-production-package-v3
```

It includes:

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
- Reference-Pack-Review state
- Reference status summary
- next steps

Reference backup payload:

```text
referenceState.referenceReviewState
referenceState.referenceReviewSummary
referenceState.localStorageKey = ricco-reference-review-v1
referenceState.restoreSupported = true
```

`#/ricco-restore` can now restore:

- image variants
- final image selection
- ratings
- continuity scores
- review notes
- generation jobs
- Reference-Pack-Review state

Restore options:

- Alles wiederherstellen
- Nur Bilder
- Nur Generation Jobs
- Nur Reference Review
- Local Review löschen
- Local Jobs löschen
- Local References löschen

This closes the previous gap where approved references could be lost because they existed only in browser storage.

Known limitation:

Story/character/location/panel seed data still comes from code, not from restored package data.

## Asset Import v0.3

`#/ricco-asset-import` can:

- read public image paths from input
- normalize paths
- infer panel id from filename
- auto-link each image path to the best matching Generation Job for that panel
- preserve optional selected Generation Job as manual override
- show whether a link was `auto_panel_match`, `selected_job` or `none`
- store imported images in LocalStorage
- include job match details in review notes
- update linked generation job status to `imported_as_asset`

Recommended file naming:

```text
/generated/panel_001_v1.png
/generated/panel_001_v2.png
/generated/panel_002_v1.webp
/generated/p03_fix_face.jpg
/generated/04_variant.png
```

## Shared review image type

The review image data model is centralized in:

```text
src/types/riccoReview.ts
```

Used by Asset Import, Image Review, Package Export, Package Restore, QA Gate, Export Gate and Lettering Preview.

## Local browser backend

Implemented through LocalStorage:

```text
ricco-studio-images-v1
ricco-generation-jobs-v1
ricco-quality-reviews-v1
ricco-reference-review-v1
```

## Supabase state

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

## ComfyUI state

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

1. Visual consistency is not solved yet, but Reference Packs v0.2, Control Room status and Package backup now attack it directly.
2. Character reference images have not been generated/reviewed yet.
3. Location reference images have not been generated/reviewed yet.
4. Style reference image has not been generated/reviewed yet.
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
3. Create missing Generation Queue jobs.
4. Open `#/ricco-reference-packs`.
5. Copy Ricco front/side/back/expression prompts.
6. Render first Ricco reference images manually.
7. Save reference paths and mark good outputs as `approved_reference`.
8. Confirm Control Room shows approved reference count.
9. Export package and confirm Reference Review is inside JSON.
10. Restore package and confirm Reference Review count comes back.
11. Copy one panel job into ComfyUI manually.
12. Render at least one panel.
13. Put output into `public/generated/`.
14. Import via Asset Import v0.3 and confirm auto-link.
15. Review image.
16. Select final image.
17. Export package.
18. Restore package.
19. Confirm loop works.
20. Repeat for all 8 panels.

### Phase 2 — Reference packs

Build reference packs before LoRA.

Character order:

1. Ricco
2. Basti Prenzl
3. Jule
4. Don Miau

Location order:

1. Hausfassade
2. Riccos Zimmer
3. Flur / Treppenhaus
4. Gemeinschaftsküche

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

## Current next action

Run the local fire test.

```bash
git checkout backend-adapters
npm install
npm run dev
```

Then test:

```text
#/ricco-control
→ #/ricco-reference-packs
→ copy Ricco Front View prompt
→ generate reference manually
→ save reference under public/references/characters/ricco/
→ paste path into Actual Image Path
→ mark approved_reference if stable
→ return to #/ricco-control
→ confirm approved refs count changed
→ #/ricco-package
→ confirm referenceState exists in JSON
→ #/ricco-restore
→ restore package and confirm Reference Review count returns
→ generate panel 1 manually
→ save as /generated/panel_001_v1.png
→ Asset Import v0.3
→ confirm auto_panel_match
→ Image Review
→ final select
→ QA
→ Package
→ Restore
```

## Git maintenance rule

All meaningful project decisions should be committed into `docs/` or code, not left only in chat.

Current rule:

```text
Git is the project memory. Chat is only the workbench.
```
