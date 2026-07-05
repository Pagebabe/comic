# GitHub Commit Status — Ricco im Haus / Comic Factory

## Repository

```text
Pagebabe/comic
```

This is the active Comic Factory repository. It is not the old AI influencer dashboard.

## Current architecture

The current app is a focused Vite/React production surface on port `3100`.

```text
npm install
npm run dev
```

Open:

```text
http://localhost:3100/#/ricco-control
```

## Important correction

Do not commit Comic Factory work into:

```text
Pagebabe/ai-influencer-dashboard
```

That repository is the old pre-conversion AI influencer project.

## Active Comic Factory routes

```text
#/ricco-control
#/ricco-studio
#/ricco-prompt-queue
#/ricco-comfy-m1
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

## Existing production loop

```text
Ricco Control
→ Ricco Studio
→ Prompt Queue
→ ComfyUI M1 Renderplan
→ Local SDXL / ComfyUI generation
→ Public Asset Import or Bulk Upload
→ Image Review
→ Storage Manager
→ QA Gate
→ Export Gate
→ Lettering Preview
→ Production Package Backup
→ Restore Package
```

## What has now been committed

### 1. Supabase backend target SQL

File:

```text
docs/supabase_master_v1.sql
```

Purpose:

```text
Prepare the future backend stage for characters, locations, styles, prompts, generation jobs, assets, quality reviews, panels, dialogues, exports, LoRAs, models, workflows, issues and decisions.
```

This SQL is aligned with the current Vite/React app entities:

```text
char_ricco
char_basti
char_jule
char_don_miau
loc_haus_fassade
loc_riccos_zimmer
loc_flur
loc_kueche
ep_001
style_ricco_v1
```

## Do not blindly paste the earlier Next.js plan into this repo

The earlier planning documents described a possible Next.js/Supabase architecture. The actual active repo is already a Vite/React app with a working local production flow.

Therefore the correct path is:

```text
keep Vite app
harden current Ricco workflow
add Supabase gradually
add ComfyUI API only after local workflow is stable
```

## Correct next technical steps

### Step 1 — Preserve current working app

Do not replace `src/App.tsx` or the existing Ricco routes.

### Step 2 — Add backend adapter layer later

Recommended future files:

```text
src/lib/backend/types.ts
src/lib/backend/localRiccoStore.ts
src/lib/backend/supabaseRiccoStore.ts
src/lib/backend/riccoStore.ts
```

Goal:

```text
Current browser/localStorage workflow keeps working.
Supabase becomes an optional backend target.
```

### Step 3 — Add ComfyUI API as optional connector

Recommended future files:

```text
src/lib/comfyui/config.ts
src/lib/comfyui/client.ts
src/lib/comfyui/workflowMapping.ts
src/lib/comfyui/submitGenerationJob.ts
```

Goal:

```text
Do not break manual ComfyUI workflow.
Add API submit after manual workflow is proven stable.
```

### Step 4 — Keep the product focused

Do not add:

```text
AI influencer funnel
DM automation
Fan CRM
posting queue
revenue tracker
shadowban logic
20-account social system
```

This repo is only for:

```text
Characters
Locations
Story Bible
Style Bible
Episodes
Panels
Prompts
Generated frames
Image review
Continuity QA
Lettering/export
Production packages
```

## Current safest commit order from here

```text
1. docs: document Supabase backend target
2. docs: document current GitHub status and active repo
3. feat: add backend adapter interfaces
4. feat: add optional Supabase adapter skeleton
5. feat: add optional ComfyUI API adapter skeleton
6. feat: add generation job state view only if it matches current Vite app
```

## Hard rule

The current app is already valuable because it is focused and working.

Do not rewrite it into a large Next.js dashboard unless there is a specific reason.

The correct principle:

```text
stabilize current Comic Factory → add backend → add API automation → only then expand
```
