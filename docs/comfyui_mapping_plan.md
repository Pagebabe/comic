# ComfyUI Workflow Mapping Plan — Ricco Comic Factory

Last updated: 2026-07-05

## Purpose

The current app can create Generation Jobs and can prepare a minimal adapter payload, but it does not yet transform a job into a real ComfyUI node graph.

This document defines the safe path from manual ComfyUI rendering to API-assisted batch rendering.

## Rule

```text
Do not automate unstable image generation.
Manual render first.
Reference packs second.
Workflow mapping third.
Batch rendering last.
```

## Current code state

Existing files:

```text
src/lib/comfyui/comfyUiClient.ts
src/lib/generation/createRiccoGenerationJobs.ts
src/pages/RiccoGenerationQueue.tsx
```

Current capabilities:

- reads `VITE_COMFYUI_API_URL`
- reads `VITE_COMFYUI_CLIENT_ID`
- checks `/system_stats`
- builds a minimal adapter payload from a Generation Job
- can submit a raw workflow payload to `/prompt`

Current limitation:

```text
A Generation Job is not yet mapped into a real ComfyUI workflow graph.
```

## Required ComfyUI base workflow

The first real workflow should be boring, stable and inspectable.

Target workflow:

```text
SDXL checkpoint
positive prompt
negative prompt
empty latent image
KSampler
VAE decode
save image
```

No LoRA at first. No ControlNet at first. No IPAdapter at first. No Face tools at first. No wild node soup.

## Required exported workflow file

Save the exported API workflow later as:

```text
docs/comfyui/workflows/ricco_sdxl_panel_v1_api.json
```

Also save a human-readable node map as:

```text
docs/comfyui/workflows/ricco_sdxl_panel_v1_node_map.md
```

## Node map requirements

The node map must identify:

```text
checkpoint loader node id
positive prompt node id
negative prompt node id
latent/image size node id
sampler node id
seed field
steps field
cfg field
sampler name field
scheduler field
batch size field
vae decode node id
save image node id
filename prefix field
```

## GenerationJob → workflow mapping

A Generation Job contains:

```text
positivePrompt
negativePrompt
seed
sampler
steps
cfg
resolutionWidth
resolutionHeight
batchSize
batchCount
outputPath
workflowId
modelId
loraIds
```

The first transformer should map only:

```text
positivePrompt → positive text node
negativePrompt → negative text node
seed → sampler seed
sampler → sampler name / scheduler mapping
steps → sampler steps
cfg → sampler cfg
resolutionWidth → latent width
resolutionHeight → latent height
batchSize → latent batch size
outputPath/panelId → save image filename prefix
```

Ignore `loraIds` until LoRA nodes exist.

## Proposed files to add later

```text
src/lib/comfyui/riccoSdxlPanelWorkflow.ts
src/lib/comfyui/submitRiccoGenerationJob.ts
src/lib/comfyui/comfyUiHistory.ts
src/lib/comfyui/comfyUiOutputImport.ts
```

## Proposed function design

```ts
export function buildRiccoSdxlPanelWorkflow(job: GenerationJob): Record<string, unknown>
```

Should:

- clone the workflow template
- replace prompt text
- replace negative text
- replace seed
- replace sampler settings
- replace dimensions
- replace filename prefix
- return a full ComfyUI API workflow JSON

```ts
export async function submitRiccoGenerationJob(job: GenerationJob): Promise<GenerationJob>
```

Should:

- build workflow
- submit to `/prompt`
- store returned `prompt_id`
- update job status to `api_queued`

```ts
export async function readComfyUiHistory(promptId: string): Promise<unknown>
```

Should:

- call `/history/{promptId}`
- detect output file names
- detect errors

## API submit flow

```text
Generation Queue
→ click API Submit
→ build real workflow graph
→ POST /prompt
→ store comfyUiPromptId
→ status api_queued
→ poll history manually or by button
→ status api_completed / api_failed
→ create public/generated path suggestions
→ import output into Image Review
```

## UI changes later

`#/ricco-generation-queue` should eventually add:

```text
API Submit selected job
API Submit all queued jobs
Check API status
Import completed outputs
Show ComfyUI prompt id
Show ComfyUI error message
```

Do not add these buttons until workflow mapping is tested manually with one job.

## Output naming rule

Recommended filename prefix:

```text
ricco_ep001_panel_001_seed_100001
```

Recommended final public path:

```text
/generated/panel_001/ricco_ep001_panel_001_seed_100001_00001.png
```

The current Asset Import can already infer panel ids from names like:

```text
panel_001_v1.png
p03_fix.webp
04_variant.png
```

Later the ComfyUI importer should output names in the clean `panel_001` format.

## ComfyUI local env

`.env` example:

```text
VITE_COMFYUI_API_URL=http://127.0.0.1:8188
VITE_COMFYUI_CLIENT_ID=ricco_factory_browser
```

Browser limitation:

If ComfyUI runs on another machine or port, CORS/network access can break browser calls. Keep manual workflow available.

## First safe test

1. Start app.
2. Start ComfyUI.
3. Open `#/ricco-generation-queue`.
4. Create jobs.
5. Use `ComfyUI Health`.
6. Copy one job manually.
7. Build the same prompt manually in ComfyUI.
8. Confirm output quality.
9. Export the exact API workflow.
10. Build transformer only after that.

## Do not do yet

Do not add LoRA nodes yet.
Do not add ControlNet yet.
Do not add IPAdapter yet.
Do not add face swap or fixer nodes yet.
Do not batch-submit all 8 panels until one panel works cleanly.

## Done criteria for mapping v1

Mapping v1 is done only when:

- one Generation Job can become a real ComfyUI API workflow
- ComfyUI accepts the workflow through `/prompt`
- returned prompt id is stored
- generated file can be found in history
- job status can move from `queued` to `api_completed`
- output path can be imported into Image Review
- manual fallback still works
