# Backend Adapter Plan — Ricco Comic Factory

## Purpose

This branch translates the larger Supabase / Generation Queue / ComfyUI plan into the existing Vite/React app without rewriting the app to Next.js.

## Active rule

```text
Keep the current local Comic Factory workflow working.
Add backend and API adapters as optional layers.
```

## What was added

```text
src/types/productionBackend.ts
src/lib/backend/localProductionStore.ts
src/lib/backend/supabaseRestStore.ts
src/lib/generation/createRiccoGenerationJobs.ts
src/lib/comfyui/comfyUiClient.ts
src/pages/RiccoGenerationQueue.tsx
.env.example
docs/supabase_master_v1.sql
```

## New route

```text
#/ricco-generation-queue
```

This route converts the existing panel prompts into traceable generation jobs.

## Current workflow

```text
Ricco Studio
→ Prompt Queue
→ Generation Queue
→ ComfyUI M1 / manual render
→ Asset Import or Bulk Upload
→ Image Review
→ QA Gate
→ Export / Lettering
```

## Local mode

Local mode uses browser storage:

```text
ricco-studio-images-v1
ricco-generation-jobs-v1
ricco-quality-reviews-v1
```

It does not require Supabase.

## Supabase mode

Supabase mode is optional and uses REST through:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

The SQL target lives in:

```text
docs/supabase_master_v1.sql
```

RLS policies still need to be configured before writes are reliable.

## ComfyUI mode

ComfyUI mode is optional and uses:

```text
VITE_COMFYUI_API_URL
VITE_COMFYUI_CLIENT_ID
```

Important: `src/lib/comfyui/comfyUiClient.ts` currently contains a safe adapter skeleton.

It can:

```text
check /system_stats
build an adapter payload from a GenerationJob
submit a real workflow payload if a workflow graph is supplied later
```

It does not yet transform jobs into a real ComfyUI node graph. That must wait for a stable exported ComfyUI API workflow and node mapping.

## Why no Next.js commit

The previous planning explored a possible Next.js/Supabase implementation. The active repo is already a Vite/React Comic Factory app with working routes and local production flow.

Therefore this branch keeps Vite and adds adapters instead of replacing the app.

## Next safe tasks

```text
1. Run npm install
2. Run npm run dev
3. Open #/ricco-generation-queue
4. Create jobs from prompt queue
5. Copy one job into ComfyUI manually
6. Import output through existing Asset Import or Bulk Upload
7. Review image
8. Only then wire real ComfyUI workflow mapping
```
