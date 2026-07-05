# Ricco im Haus / Comic Factory

A focused MVP for producing a recurring adult cartoon series from a stable story bible, character bible, location bible, panel board, prompt builder, prompt queue, local generation queue, M1 ComfyUI render plan, reference pack planner, public asset import, bulk image inbox, human image review with URL/local upload, browser storage manager, review gate, export readiness gate, first lettering preview, production package backup/restore and a central control room.

This repo is intentionally **not** an AI influencer dashboard. No fan CRM, no DM automation, no posting queue, no revenue tracker, no warmup logic. It is a clean Comic Factory foundation.

Long-term target: a professional studio workspace for repeatable comic/animation-style production. The goal is a disciplined workspace inspired by high-end animation studio workflows, without copying any studio's proprietary tools, brands, designs or IP.

## Project status

The current implementation and production truth live in:

```text
docs/comic_factory_status.md
```

Production planning docs:

```text
docs/backend_adapter_plan.md
docs/reference_pack_plan.md
docs/comfyui_mapping_plan.md
docs/lora_training_plan.md
docs/professional_studio_workspace_plan.md
docs/open_source_building_blocks.md
```

Use these documents as the running project memory before adding new features. Chat can drive the work, but Git should hold the durable status.

## Current focus

Default route:

```text
#/ricco-control
```

Main routes:

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

Current production loop for **Ricco im Haus**:

```text
Ricco Control → Ricco Studio → Prompt Queue → Generation Queue → ComfyUI M1 Renderplan → Reference Packs → Local SDXL Generation → Public Asset Import or Bulk Upload → Image Review → Ricco Storage Manager → Ricco Gate → Ricco Export Gate → Ricco Lettering Preview → Production Package JSON → Restore Package later
```

## Pilot episode

```text
Episode 1: Das Zimmer
```

Logline:

```text
Ricco zieht in sein neues günstiges Zimmer ein und merkt, dass er nicht in eine solidarische Wohnform geraten ist, sondern in eine sehr teure Absurdität mit politischem Anstrich.
```

## Core cast

```text
Ricco — chaotischer Musiker und Hauptfigur
Basti Prenzl — illegaler Vermieter, Ex-Hausbesetzer, Szene-Heuchler
Jule — Hausaktivistin und Plenum-Machtzentrum
Don Miau — Boss der Katzen-Gang
```

## Core locations

```text
Hausfassade
Riccos Zimmer
Flur / Treppenhaus
Gemeinschaftsküche
```

## Hard production rule

Generated images are **clean comic frames**.

```text
No speech bubbles.
No readable dialogue inside the image.
No fake lettering.
No random text artifacts.
```

Dialogue belongs to the overlay layer:

```text
Dialogue Overlay → Ricco Lettering Preview → speech bubbles / subtitles / voice / edit layer later
```

## Studio Workspace direction

The long-term workspace should cover:

```text
Workspace Home
Project Library
Story Department
Art Department
Asset Library
Render Department
Review Room
Continuity Department
Lettering / Editorial
Package / Archive
```

A version may only be called `Studio Workspace v1` when this full loop is proven:

```text
story idea
→ reference pack
→ approved references
→ panel jobs
→ rendered outputs
→ asset import
→ image review
→ final selection
→ lettering
→ package export
→ browser clear
→ package restore
→ continue production without losing state
```

## Stack

- Vite
- React
- TypeScript
- lucide-react
- local typed seed data
- prompt queue export as JSON / TXT / CSV
- local generation queue for traceable ComfyUI jobs
- reference pack planner for characters, locations and master style
- optional Supabase REST adapter target
- optional ComfyUI browser adapter skeleton
- M1/ComfyUI SDXL render presets and naming plan
- public asset import for `/public/generated` paths
- bulk upload inbox with filename-to-panel inference
- localStorage for Ricco image review state
- local image upload as Data URL for small files
- storage manager for local cleanup before LocalStorage fills up
- browser print for early PDF output
- JSON package export for backups / handoff
- JSON package restore for browser-state recovery
- review gate for continuity and final-image checks
- central control room for next-step navigation
- Port `3100`

## Optional env

The app works without backend credentials. Optional adapter settings live in `.env.example`:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_COMFYUI_API_URL=http://127.0.0.1:8188
VITE_COMFYUI_CLIENT_ID=ricco_factory_browser
```

## Run locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3100
```

## Fire test checklist

```text
1. npm install
2. npm run dev
3. Open http://localhost:3100/#/ricco-control
4. Open Ricco Studio and inspect the panel prompts
5. Open Ricco Prompt Queue
6. Copy or download prompts as JSON, TXT or CSV
7. Open Ricco Generation Queue
8. Create jobs from the prompt queue
9. Open Ricco Reference Packs and copy first Ricco reference prompts
10. Copy one panel job into ComfyUI manually
11. Open Ricco ComfyUI M1
12. Copy render checklist and file naming plan
13. Generate local SDXL images panel by panel
14. Name image files like panel_001_v1.png or p03_fix.webp
15. Recommended: copy images into public/generated/
16. Open Ricco Asset Import and import /generated/... paths
17. Alternative: use Ricco Bulk Upload for direct browser uploads
18. Open Ricco Image Review
19. Rate image quality and continuity
20. Select exactly one final image per panel
21. Open Ricco Storage if the browser feels heavy or uploads fail
22. Remove non-final variants only after Package backup if needed
23. Open Ricco Gate
24. Fix blockers and warnings
25. Open Ricco Export
26. Check if all 8 panels are export-ready
27. Open Ricco Lettering
28. Copy dialogue script or use Browser Print / PDF
29. Open Ricco Package
30. Copy or download full production package JSON
31. Open Ricco Restore
32. Paste package JSON and restore browser review state
```

## Current pages

| Route | Purpose |
| --- | --- |
| `#/ricco-control` | Central production overview and next-step navigator |
| `#/ricco-studio` | Main Ricco Studio v0.1 prompt workbench |
| `#/ricco-prompt-queue` | Batch prompt export for external image generation |
| `#/ricco-generation-queue` | Converts panel prompts into traceable local/API-ready generation jobs |
| `#/ricco-comfy-m1` | Local ComfyUI M1 render presets, checklist and file naming plan |
| `#/ricco-reference-packs` | Character, location and style reference pack planner with copyable prompts |
| `#/ricco-asset-import` | Import `/generated/...` image paths without storing Base64 images |
| `#/ricco-bulk-upload` | Upload many local generated images and map filenames to panels |
| `#/ricco-image-review` | Store generated image URLs or local files, rate variants and select final panel images |
| `#/ricco-storage` | Inspect browser storage and clean up non-final local variants |
| `#/ricco-qa` | Gate for missing finals, low ratings, low continuity and missing notes |
| `#/ricco-export` | Check final image readiness and panel order before lettering/export |
| `#/ricco-lettering` | First comic page preview with final images and dialogue overlays |
| `#/ricco-package` | Copy/download full production package JSON |
| `#/ricco-restore` | Restore image review state from a saved production package JSON |
| `#/dashboard` | Existing production dashboard |
| `#/story-bible` | Existing story bible view |
| `#/style-bible` | Existing visual rules view |
| `#/characters` | Existing character bible view |
| `#/locations` | Existing location bible view |
| `#/episodes` | Existing episode planning view |
| `#/panel-factory` | Existing panel prompt board |
| `#/review` | Existing human review room |
| `#/asset-gallery` | Existing asset preview gallery |

## Files added for Ricco Studio

```text
src/data/riccoStudio.ts
src/pages/RiccoControlRoom.tsx
src/pages/RiccoStudio.tsx
src/pages/RiccoPromptQueue.tsx
src/pages/RiccoGenerationQueue.tsx
src/pages/RiccoComfyM1.tsx
src/pages/RiccoReferencePacks.tsx
src/pages/RiccoAssetImport.tsx
src/pages/RiccoBulkUpload.tsx
src/pages/RiccoImageReview.tsx
src/pages/RiccoStorage.tsx
src/pages/RiccoQA.tsx
src/pages/RiccoExport.tsx
src/pages/RiccoLettering.tsx
src/pages/RiccoPackage.tsx
src/pages/RiccoImport.tsx
src/pages/RiccoRestore.tsx
src/lib/backend/localProductionStore.ts
src/lib/backend/supabaseRestStore.ts
src/lib/generation/createRiccoGenerationJobs.ts
src/lib/comfyui/comfyUiClient.ts
src/types/productionBackend.ts
src/types/riccoReferenceReview.ts
src/types/riccoReview.ts
src/ricco-lettering.css
```

## Project rule

The realistic production target is:

```text
1 story → 8 stable panels → generated variants → human approval → lettering/export
```

## Hard limits

Keep it focused. Do not add social posting, 20 accounts, DM funnels, Baserow, Qdrant, n8n or a full automation stack until the local Comic Factory workflow is clean.
