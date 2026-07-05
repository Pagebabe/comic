# Ricco Comic Factory — 2-Day Build Log & Product Plan

Last updated: 2026-07-05

## One-line goal

Build a local AI comic production studio for **Ricco im Haus**: one creator can produce repeatable comic episodes with stable characters, stable locations, reviewed image panels, lettering, export, backups and later LoRA-ready datasets.

This is not an AI influencer dashboard.

## Product vision

The goal is a small local comic factory:

```text
Story
→ Panels
→ Prompts
→ Generation jobs
→ Render outputs
→ Asset import
→ Asset library
→ Fix queue
→ Reference candidates
→ Dataset candidates
→ Approved dataset
→ LoRA readiness
→ Image review
→ QA
→ Lettering
→ Export
→ Package / Restore
```

The project exists to make a repeatable serial workflow possible for the pilot series:

```text
Ricco im Haus
Episode 1: Das Zimmer
8 panels
Berlin house satire
Characters: Ricco, Basti, Jule, Don Miau
```

## Hard scope rules

Keep the app focused.

Do not turn it back into:

```text
AI influencer dashboard
DM automation
Fanvue funnel
Revenue tracker
Posting queue
20-account social system
n8n automation stack
Qdrant/RAG backend before local workflow works
Supabase-first rewrite
```

The working product is a local comic studio first.

---

# What was built in the last two days

## 1. Workspace / Control Room became the production cockpit

### Routes

```text
#/ricco-control
#/ricco-workspace
```

### What changed

The Control Room and Workspace Map are no longer simple navigation pages. They now show the full production state:

```text
pipeline progress
current stage
asset status counts
fix queue counts
reference candidates
dataset candidates
approved dataset readiness
LoRA target readiness
QA state
lettering state
package state
storage state
```

### Current Workspace Pipeline

The pipeline now has 14 stages:

```text
Story / Panels
Reference Packs
Generation Queue
Asset Import
Asset Library
Fix Queue
Reference Candidates
Dataset Candidates
Approved Dataset Export
LoRA Training Plan
Image Review
QA Gate
Lettering
Package / Restore
```

### Workspace Map UI v0.2

The Workspace Map is grouped into production areas:

```text
Story:
- Story / Panels
- Reference Packs

Render:
- Generation Queue
- Asset Import

Asset Workflow:
- Asset Library
- Fix Queue
- Reference Candidates
- Dataset Candidates

Training Prep:
- Approved Dataset Export
- LoRA Training Plan

Review:
- Image Review
- QA Gate
- Lettering

Archive:
- Package / Restore
```

This made the app feel more like a real studio workspace instead of a flat page list.

---

## 2. Asset workflow became a real production system

### Main route

```text
#/ricco-assets
```

### Asset status model

The image model now supports production asset statuses:

```text
raw
maybe
selected
rejected
reference_candidate
approved_reference
dataset_candidate
approved_dataset
needs_fix
fixed
approved_panel
```

### Why this matters

Before this, images were just variants or finals.

Now each image can be routed through a real production workflow:

```text
bad image → needs_fix → Fix Queue
good character/location/style sample → reference_candidate → approved_reference
good training image → dataset_candidate → approved_dataset
final comic panel → approved_panel
```

---

## 3. Fix Queue v0.1

### Route

```text
#/ricco-fix-queue
```

### Purpose

Collect every image marked:

```text
needs_fix
```

The page shows:

```text
image preview
panel context
fix reason
linked generation job
suggested action
resolve status
```

### Resolution statuses

```text
fixed
approved_panel
rejected
```

### Why it matters

Bad images no longer get lost inside a gallery. They become a repair queue.

---

## 4. Reference Candidate Flow v0.1

### Route

```text
#/ricco-reference-candidates
```

### Purpose

Collect assets that could become reusable references for:

```text
characters
locations
style
panels
```

This supports long-term visual consistency.

### Why it matters

For a serial comic, reference discipline matters more than random one-off generations.

The app now has a pathway from good panels to reusable art references.

---

## 5. Dataset Candidate Flow v0.1

### Route

```text
#/ricco-dataset-candidates
```

### Purpose

Prepare future LoRA training data from selected assets.

Dataset candidate metadata includes:

```text
target type
target id
trigger word
caption
notes
```

### Supported target types

```text
character_lora
location_lora
style_lora
```

### Why it matters

This separates normal image review from training-data preparation.

Not every good image should become training data.

---

## 6. Approved Dataset Export v0.1

### Route

```text
#/ricco-approved-dataset
```

### Purpose

Export only assets marked:

```text
approved_dataset
```

### Validation warnings

The export warns when an approved item still has:

```text
missing dataset target
missing trigger word
missing caption
missing image path
rating below 4
continuity below 4
```

### Manifest

```text
ricco-approved-dataset-manifest-v1
```

### Why it matters

This prevents unfinished dataset candidates from slipping into a future LoRA training set.

---

## 7. LoRA Training Plan v0.2

### Route

```text
#/ricco-lora-training-plan
```

### Purpose

Plan LoRA readiness without starting training.

It groups approved dataset images by LoRA target and checks:

```text
minimum image count
recommended image count
trigger consistency
caption completeness
item warnings
dataset folder
caption files
```

### Readiness states

```text
ready
needs_more_images
needs_metadata
empty
```

### Current planning thresholds

```text
character_lora: minimum 20, recommended 40
location_lora: minimum 12, recommended 30
style_lora: minimum 40, recommended 80
```

### Why it matters

This is the bridge between the comic app and future character/location/style consistency training.

It still does not train. It only tells whether training data is strong enough.

---

## 8. Package v0.6

### Route

```text
#/ricco-package
```

### Current package version

```text
ricco-production-package-v6
```

### Package now contains

```text
story seed
characters
locations
panels
prompts
generation jobs
reference review state
stored images
final image selection
asset workflow summary
fix queue summary
reference candidate summary
dataset candidate summary
dataset manifest
LoRA training plan snapshot
lettering layout
pipeline snapshot
next steps
```

### New section

```text
loraPlanState
```

It contains:

```text
snapshot
readyTargets
needsWorkTargets
totalApprovedItems
restoreSupported
```

### Why it matters

A package is now a real production archive, not just a JSON dump.

It captures the state of the episode and the future training-prep state.

---

## 9. Restore v0.6

### Route

```text
#/ricco-restore
```

### Purpose

Restore production state and clearly show what is inside the package before import.

### Restore preview now shows

```text
package version
image count
final image count
generation job count
reference review count
approved reference count
lettering layout count
pipeline progress
current stage
asset metadata count
reference candidate metadata count
dataset metadata count
dataset_candidate count
approved_dataset count
needs_fix count
LoRA snapshot present
LoRA ready targets
LoRA targets needing work
```

### Why it matters

Restore is no longer blind.

The user can see whether asset metadata, dataset metadata and LoRA readiness state exist before restoring.

---

## 10. Storage Adapter v0.1

### Main files

```text
src/lib/storage/riccoStoragePort.ts
src/lib/backend/localProductionStore.ts
```

### Problem solved

The biggest technical weakness was localStorage.

Large local image uploads as Data-URLs can quickly break browser storage limits.

### New idea

Split image metadata from image payload:

```text
metadata imageUrl = ricco-image-blob:<imageId>
blob record = original data:image/...base64 payload
```

### New keys

```text
ricco-image-metadata-v1
ricco-image-blobs-v1
```

### Why it matters

This creates the bridge to IndexedDB without breaking the old localStorage workflow.

---

## 11. IndexedDB Driver v0.1

### Main file

```text
src/lib/storage/riccoIndexedDbStorage.ts
```

### IndexedDB setup

```text
DB name: ricco-comic-factory-db
Version: 1
Object store: imageBlobs
Key path: imageId
```

### Functions

```text
isRiccoIndexedDbAvailable
openRiccoIndexedDb
writeRiccoImageBlobsToIndexedDb
readRiccoImageBlobsFromIndexedDb
deleteRiccoImageBlobFromIndexedDb
clearRiccoImageBlobsFromIndexedDb
```

### Storage page controls

```text
Blobs nach IndexedDB
IndexedDB Blobs löschen
```

### Why it matters

The app now has a real browser database path for local image payloads.

localStorage remains fallback.

---

## 12. IndexedDB Preferred Read v0.1

### Main files

```text
src/lib/storage/riccoImageSourceResolver.ts
src/lib/backend/localProductionStore.ts
src/pages/RiccoStorage.tsx
```

### Read order

```text
1. IndexedDB image records
2. localStorage split blob records
3. old legacy localStorage image list
4. unresolved blob ref
```

### New store API

```text
readRiccoImagesPreferred()
```

### Storage page action

```text
Preferred Read prüfen
```

### Why it matters

This proves the app can begin reading images from IndexedDB without forcing every page to migrate immediately.

---

# Current technical status

## Strong parts

```text
Clear product scope
Strong typed seed data
Workflow is coherent
Routes are purposeful
Asset state machine exists
Package/Restore is serious
Dataset/LoRA preparation is structured
CI and build are green after each block
Unit tests cover domain logic
Storage migration path now exists
```

## Weak parts / risks

```text
Many pages still read legacy localStorage synchronously
IndexedDB is not yet the default app-wide image source
No real ComfyUI workflow graph yet
No real PNG/PDF export pipeline yet
No drag-and-drop lettering editor yet
No screenshot/visual README proof yet
No public release/tag yet
Legacy routes still exist beside Ricco routes
No LICENSE decision documented
```

## Biggest current risk

Storage is improving, but the app still has many synchronous page-level reads.

The next risk is partial migration confusion:

```text
some pages reading legacy localStorage
some reading split storage
some checking IndexedDB
```

This needs to be controlled by a clear migration plan.

---

# Proper next plan

## Phase 1 — Finish storage migration safely

### Goal

Make IndexedDB the preferred image payload source without breaking old packages.

### Steps

```text
1. Keep legacy localStorage as fallback.
2. Replace page-level readStoredImages helpers gradually.
3. Start with pages that already load in useEffect.
4. Use readRiccoImagesPreferred() there.
5. Keep writeRiccoReviewImages() legacy-compatible for now.
6. Add a migration button that writes split metadata + IndexedDB blobs.
7. Only later remove Data-URLs from legacy localStorage.
```

### First pages to migrate

```text
RiccoImageReview
RiccoAssetLibrary
RiccoPackage
RiccoControlRoom
RiccoWorkspaceMap
RiccoStorage
```

### Do not migrate first

Do not start with restore/package write logic. That must remain conservative until reads are proven.

---

## Phase 2 — Clean old routes and README

### Goal

Make the repo understandable from outside.

### Steps

```text
1. Mark old routes as legacy/deprecated.
2. Keep Ricco routes as the real workflow.
3. Add screenshots to README.
4. Add one architecture diagram.
5. Add a route map with current/legacy labels.
6. Add LICENSE decision.
7. Add first Git tag or release.
```

### Important README screenshots

```text
Ricco Control Room
Workspace Map grouped view
Asset Library
Image Review
Lettering Editor
Package page
Storage Manager
```

---

## Phase 3 — Real export path

### Goal

Move beyond browser print.

### Options

```text
SVG panel composition
Canvas export
html-to-image
pdf-lib
Playwright screenshot export
```

### Recommended first step

Build a deterministic HTML/SVG export page for the 8 panels.

Then add:

```text
PNG export per panel
PDF export for full episode
```

---

## Phase 4 — Real ComfyUI workflow mapping

### Goal

Turn generation jobs into real ComfyUI graph payloads.

### Steps

```text
1. Keep current GenerationJob model.
2. Add workflow template mapping.
3. Map prompt, negative prompt, seed, steps, cfg, resolution.
4. Add dry-run payload preview.
5. Only then submit to ComfyUI API.
```

### Do not do yet

Do not add full automation before manual loop produces good panels.

---

## Phase 5 — Real style/character consistency

### Goal

Use references and later LoRAs to stabilize Ricco, Basti, Jule, Don Miau and key locations.

### Steps

```text
1. Approve reference images.
2. Use reference candidates to lock faces/outfits/locations.
3. Prepare dataset candidates.
4. Approve dataset images.
5. Use LoRA Training Plan to identify missing images.
6. Train only after enough clean data exists.
```

---

# Recommended immediate next action

## Next feature

```text
Preferred Read adoption v0.2
```

### Definition

Migrate the first real page from legacy image reads to preferred storage reads.

### Start with

```text
RiccoImageReview
```

### Why

It is the page most affected by image payloads.

### Acceptance criteria

```text
RiccoImageReview loads images through readRiccoImagesPreferred()
Fallback to legacy localStorage still works
Storage Manager can show where images came from
Tests cover resolver behavior
Build and CI stay green
```

---

# Short video / talking script

Use this if explaining the build in a quick screen recording:

```text
In the last two days I turned the Ricco project from a simple comic MVP into a real local comic production workflow.

The goal is not an influencer dashboard. The goal is a local AI comic studio for Ricco im Haus, where one person can produce repeatable episodes with stable characters, stable locations, reviewed panels, lettering and export.

The main pipeline now has fourteen stages: story, references, generation queue, asset import, asset library, fix queue, reference candidates, dataset candidates, approved dataset export, LoRA training plan, image review, QA, lettering and package/restore.

The biggest product improvement is the asset workflow. Images are no longer just random variants. They can become final panels, fix tasks, references, dataset candidates or approved dataset items.

The second big improvement is the training preparation layer. We do not train yet, but we now know which images are clean enough, which trigger words and captions are missing, and which LoRA targets are ready or not ready.

The third big improvement is backup and restore. Production Package v6 now stores the whole episode state, including jobs, references, images, asset metadata, dataset manifest, LoRA readiness snapshot, lettering and pipeline state.

The fourth big improvement is storage. localStorage was the biggest weakness because Data-URL images can kill the browser quota. We added a storage adapter, split image metadata from image payloads, added an IndexedDB blob store and started a preferred read path.

The project is now much closer to a serious solo comic factory. The next technical move is to migrate real pages, starting with Image Review, to read from IndexedDB-preferred storage while keeping legacy localStorage as fallback.
```

---

# Quality bar

Before calling this production-ready, the app still needs:

```text
real local fire-test with images
real screenshot proof in README
first release tag
legacy route cleanup
IndexedDB preferred reads on core pages
proper export pipeline
real ComfyUI workflow mapping
manual pilot episode production test
```

The current build is a strong production-control MVP, but not yet a finished comic studio.
