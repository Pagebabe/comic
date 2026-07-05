# Professional Studio Workspace Plan

Last updated: 2026-07-05
Project: `Ricco im Haus / Comic Factory`

## Intent

The goal is not just a small comic generator. The goal is a professional production workspace for building recurring animated/comic IP with repeatable quality, continuity and review control.

Reference standard: a high-discipline animation/comic studio workflow. Do not copy any studio's proprietary tools, designs, brands or IP. Build our own lean version of a professional production pipeline.

## Product target

```text
One creator can operate it alone.
A small team can join later without rebuilding the whole system.
Every asset has a source, version, owner, status and approval trail.
Every episode can be restored, audited, revised and exported again.
```

## Current MVP reality

The current app is a Vite/React/TypeScript Comic Factory MVP.

It already has:

- Control Room
- Story/character/location seed data
- Prompt workbench
- Prompt queue
- Generation queue
- ComfyUI manual render plan
- Reference pack planner
- Reference review state
- Asset import
- Bulk upload
- Image review
- Storage manager
- QA gate
- Export readiness gate
- Lettering preview
- Package export/restore
- CI/Build checks

It does not yet have:

- true multi-project workspace
- real database-backed asset library
- user accounts/roles
- shot/asset version graph
- real render farm integration
- automated ComfyUI workflow mapping
- production-grade review assignments
- real PDF/PNG/video export pipeline
- migration-tested package versions
- full test suite

## Studio workspace modules

### 1. Workspace Home

Purpose: one central overview across all productions.

Needs:

- active projects
- current episode/shot status
- blockers
- render queue status
- assets waiting for review
- references waiting for approval
- storage health
- export readiness
- next recommended action

MVP route today:

```text
#/ricco-control
```

Future route:

```text
#/workspace
```

### 2. Project Library

Purpose: manage multiple shows/series/projects.

Entities:

- project
- series
- season
- episode
- sequence
- scene
- shot/panel

Needed fields:

- id
- title
- status
- owner
- createdAt
- updatedAt
- version
- notes
- tags

### 3. Story Department

Purpose: story bible, episode outlines, scripts, panel boards.

Needs:

- series bible
- character arcs
- world rules
- episode list
- beat board
- panel board
- dialogue drafts
- continuity notes
- story approval gate

Current MVP coverage:

- `riccoStudio.ts`
- Ricco Studio
- Prompt Queue
- Episode 1 panel board

Missing:

- editable story data
- versioned scripts
- story approval state
- draft comparison

### 4. Art Department

Purpose: visual identity before production rendering.

Needs:

- character reference packs
- location reference packs
- prop sheets
- style sheets
- negative example sheets
- approved/rejected variants
- art director review
- dataset eligibility

Current MVP coverage:

- Reference Packs v0.2
- local reference review state
- package/restore support for reference review

Missing:

- visual thumbnails for reference assets
- reference images as first-class assets
- approval history
- batch reference generation
- LoRA dataset export

### 5. Asset Library

Purpose: one searchable, versioned place for all images, prompts, refs and exports.

Asset types:

- reference image
- panel image
- prop
- location background
- model output
- final frame
- lettering export
- package backup
- LoRA dataset item
- LoRA model file metadata

Required fields:

- assetId
- fileName
- filePath
- thumbnailPath
- checksum
- type
- subjectType
- subjectId
- status
- sourceJobId
- promptId
- modelId
- seed
- workflowId
- version
- parentAssetId
- createdAt
- updatedAt
- reviewedAt
- reviewer
- decision
- notes

Current MVP coverage:

- `ProductionAsset` type exists
- local image review exists
- public asset import exists

Missing:

- real asset database
- checksums
- thumbnails
- version graph
- real file storage
- broken-file detection

### 6. Render Department

Purpose: controlled image/video generation with reproducibility.

Needs:

- render job queue
- job presets
- model registry
- LoRA registry
- workflow registry
- seed lock
- batch count
- retry failed jobs
- status polling
- ComfyUI history ingest
- output import
- error diagnosis

Current MVP coverage:

- Generation Queue
- manual ComfyUI settings
- ComfyUI health check
- raw workflow submit helper

Missing:

- real ComfyUI node graph mapping
- job-to-workflow transformer
- queue polling
- output import
- retry strategy
- batch rendering UI

### 7. Review Room

Purpose: human approval with clear gates.

Review types:

- story review
- character review
- location review
- style review
- panel review
- continuity review
- final export review

Review decisions:

- raw
- candidate
- approved_reference
- needs_redraw
- rejected
- approved_panel
- approved_export

Current MVP coverage:

- Image Review
- QA Gate
- Reference Review

Missing:

- assigned reviewers
- review history
- side-by-side compare
- visual overlays
- annotation tools
- audit trail

### 8. Continuity Department

Purpose: keep characters, locations and props stable across episodes.

Needs:

- character locked traits
- outfit locks
- location layout locks
- recurring prop locks
- style drift warnings
- approved references per subject
- continuity checklist per panel

Current MVP coverage:

- continuity rules in `riccoStudio.ts`
- panel prompt continuity checklist
- manual continuity score

Missing:

- automated checks
- panel vs reference comparison
- locked outfit/version selector
- style drift reports

### 9. Lettering / Editorial

Purpose: turn clean frames into readable comic pages.

Needs:

- dialogue layer
- bubble placement
- caption placement
- font styles
- panel crops
- page layouts
- export presets
- print/export QA

Current MVP coverage:

- Lettering Preview
- browser print workaround

Missing:

- real bubble editor
- drag/drop text layer
- PDF/PNG export engine
- page templates
- subtitle/video export

### 10. Package / Archive

Purpose: restore any production state later.

Needs:

- package schema versions
- roundtrip tests
- migration functions
- checksums
- asset manifest
- project manifest
- export manifest

Current MVP coverage:

- Package v3
- Restore v3
- reference review backup
- generation job backup
- image review backup

Missing:

- package migration tests
- package validation UI
- schema docs
- asset file bundle export

## Professional data model direction

The long-term model should separate:

```text
Project
Series
Episode
Scene
Panel/Shot
Subject
ReferencePack
Asset
Prompt
GenerationJob
Review
Export
Package
```

Current TypeScript types should evolve into domain modules:

```text
src/domain/projects/
src/domain/story/
src/domain/referencePacks/
src/domain/assets/
src/domain/generation/
src/domain/review/
src/domain/package/
src/domain/export/
```

Pages should become thin UI shells. Business logic should move into domain/services.

## Professional folder target

```text
src/
  app/
    routes.tsx
    navigation.ts
  components/
    layout/
    workflow/
    review/
    prompts/
    assets/
  data/
    seeds/
  domain/
    story/
    referencePacks/
    assets/
    generation/
    review/
    package/
    export/
  services/
    storage/
    comfyui/
    supabase/
  tests/
    unit/
    smoke/
```

## Testing standard

Minimum before calling it a studio-grade tool:

- build check
- TypeScript strict check
- package/restore roundtrip test
- generation job dedupe test
- asset filename parser test
- reference review summary test
- local storage corruption test
- Playwright smoke test for every primary route
- end-to-end fire test with one real generated panel

## Current next engineering move

Do not add many new UI features first. Harden architecture.

Recommended order:

1. Create domain modules for reference review, package/restore and generation queue.
2. Move parsing, summary and package-building out of pages.
3. Add tests for those domain modules.
4. Keep pages as UI only.
5. Add real asset library model.
6. Add ComfyUI workflow mapping only after manual loop works.
7. Add Supabase only after local data model is stable.

## Definition of Studio Workspace v1

The product can be called `Studio Workspace v1` only when this is true:

```text
A user can start with a story idea,
create a character reference pack,
approve references,
create panel jobs,
render images,
import outputs,
review variants,
select finals,
letter the page,
export a package,
clear the browser,
restore the package,
and continue production without losing state.
```

And the above must be proven by test or documented manual fire test.
