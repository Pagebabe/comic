# Studio Architecture Refactor Log

Last updated: 2026-07-05
Branch: `backend-adapters`

## Purpose

This log tracks refactors that move the Comic Factory from MVP pages toward a professional studio workspace architecture.

The standard is:

```text
Pages should render UI and call actions.
Domain modules should own production logic.
Storage modules should own persistence details.
Tests should target domain modules before UI.
```

## Refactor 001 — Production Package Domain Module

Status: done
CI/Build: green

### New module

```text
src/domain/package/riccoProductionPackage.ts
```

### What moved into domain

- `RICCO_PRODUCTION_PACKAGE_VERSION`
- `RiccoProductionPackage`
- `ParsedRiccoProductionPackage`
- `buildRiccoProductionPackage()`
- `buildRiccoPackageFileName()`
- `buildRiccoPackageNextSteps()`
- `parseRiccoProductionPackage()`
- `packageLooksLikeRiccoPackage()`
- `extractImagesFromRiccoPackage()`
- `extractGenerationJobsFromRiccoPackage()`
- `extractReferenceReviewStateFromRiccoPackage()`
- `isRiccoPanelImage()`
- `isRiccoGenerationJob()`

### Page after refactor

`src/pages/RiccoPackage.tsx` reads browser state, calls `buildRiccoProductionPackage()`, displays package summary and copies/downloads JSON.

`src/pages/RiccoImport.tsx` parses JSON through domain helper, extracts images/jobs/reference state through domain helpers, writes restored data to LocalStorage and displays restore status.

### Why this matters

This was the first real move from page-owned logic toward studio domain modules. It makes package/restore logic easier to test later without rendering React pages.

## Refactor 002 — Reference Packs Domain Module

Status: done
CI/Build: green

### New module

```text
src/domain/referencePacks/riccoReferencePacks.ts
```

### What moved into domain

- `ReferenceSubjectType`
- `ReferenceAsset`
- `ReferencePack`
- `REFERENCE_REVIEW_STATUS_OPTIONS`
- `slugifyReferenceName()`
- `isCatReferenceCharacter()`
- `buildRiccoCharacterReferencePacks()`
- `buildRiccoLocationReferencePacks()`
- `buildRiccoStyleReferencePack()`
- `buildRiccoReferencePacks()`
- `riccoReferencePacks`
- `packTypeLabel()`
- `assetStorageKey()`
- `expectedReferenceAssetPath()`
- `defaultReferenceAssetReview()`
- `getReferenceAssetReview()`
- `referenceStatusClass()`
- `buildPackCopyText()`
- `buildAllReferencePacksCopyText()`
- `buildReferenceReviewReport()`
- `filterReferencePacks()`
- `countReferenceAssets()`

### Page after refactor

`src/pages/RiccoReferencePacks.tsx` reads/writes reference review state, handles selected filter/pack UI state, calls domain helpers for pack content/copy/report/path logic and renders review controls.

### Why this matters

Reference Packs are now closer to a real Art Department module. The generated pack definitions, review report and copy/export text can later be tested without rendering the UI.

## Refactor 003 — Asset Import Domain Module

Status: done
CI/Build: green

### New module

```text
src/domain/assets/riccoAssetImport.ts
```

### What moved into domain

- `AssetJobMatch`
- `AssetImportRow`
- `RICCO_ASSET_IMPORT_EXAMPLE_INPUT`
- `RICCO_JOB_STATUS_PREFERENCE`
- `createAssetImportRowId()`
- `createRiccoImageId()`
- `normalizeAssetPath()`
- `isSupportedImagePath()`
- `inferPanelIdFromAssetPath()`
- `generationJobTimestamp()`
- `generationJobStatusRank()`
- `findBestGenerationJobForPanel()`
- `buildAssetImportRowNote()`
- `buildAssetImportRows()`
- `relinkAssetImportRow()`
- `buildRiccoImagesFromAssetRows()`
- `importedGenerationJobIds()`

### Page after refactor

`src/pages/RiccoAssetImport.tsx` reads generation jobs, manages selected override/fallback/input UI state, calls domain helpers for row parsing/relinking/image creation, writes imported review images to LocalStorage, marks linked jobs as `imported_as_asset` and renders import preview.

### Why this matters

Asset import is now closer to a real Asset Intake module. Filename parsing, job matching and review image construction can later be covered by unit tests without rendering the UI.

## Refactor 004 — Generation Queue Domain Module

Status: done
CI/Build: green

### New module

```text
src/domain/generation/riccoGenerationQueue.ts
```

### What moved into domain

- `GenerationQueueReport`
- `GenerationQueueMergeResult`
- `generationJobStatusClass()`
- `buildGenerationJobCopyText()`
- `generationJobStableKey()`
- `mergeGeneratedJobs()`
- `createMissingRiccoGenerationJobs()`
- `summarizeGenerationQueue()`
- `buildGenerationQueueJson()`

### Page after refactor

`src/pages/RiccoGenerationQueue.tsx` reads/writes local generation jobs, calls domain helpers for job creation, merge, summary, copy text and JSON export, controls ComfyUI health check and renders queue UI/status buttons.

### Why this matters

Generation Queue is now closer to a real Render Department module. Stable job keys, merge/dedupe and queue reports can later be covered by tests without rendering the UI.

## Refactor 005 — Export / QA / Lettering Domain Module

Status: done
CI/Build: green

### New module

```text
src/domain/export/riccoExportState.ts
```

### Why

Before this refactor, `RiccoExport.tsx`, `RiccoQA.tsx` and `RiccoLettering.tsx` each rebuilt similar final-image and episode-ordering logic directly inside React pages.

That created duplicated rules for:

- selected final images per panel
- export readiness
- final panel count
- missing panel count
- progress percentage
- dialogue script generation
- QA severity rules
- QA report text

### What moved into domain

The new export domain module owns:

- `QASeverity`
- `QAItem`
- `RiccoExportPanelState`
- `RiccoExportReadiness`
- `MIN_RATING`
- `MIN_CONTINUITY`
- `buildFinalImagesByPanelId()`
- `buildRiccoExportReadiness()`
- `buildRiccoDialogueScript()`
- `buildRiccoQAReportItems()`
- `summarizeRiccoQAItems()`
- `qaSeverityLabel()`
- `qaSeverityClass()`
- `buildRiccoQAReportText()`

### Pages after refactor

`src/pages/RiccoExport.tsx` now reads image state, calls `buildRiccoExportReadiness()` and renders the export readiness gate.

`src/pages/RiccoQA.tsx` now reads image state, calls `buildRiccoQAReportItems()`, `summarizeRiccoQAItems()` and `buildRiccoQAReportText()`, then renders QA.

`src/pages/RiccoLettering.tsx` now reads image state, calls `buildRiccoExportReadiness()` and `buildRiccoDialogueScript()`, then renders the preview/print page.

### Why this matters

Export, QA and Lettering now share one production truth for final images and episode order. This is closer to a real Editorial/Export Department module and can later be tested without rendering UI.

## Current architecture direction

Next target folders:

```text
src/domain/review/
```

## Next recommended refactors

### Refactor 006 — Review Domain Module

Move shared image review reading, final image grouping and local review statistics into domain.

Target:

```text
src/domain/review/riccoReviewState.ts
```

### Refactor 007 — Add Unit Test Runner

Now that package, reference packs, asset import, generation and export are in domain modules, add a lightweight unit test setup.

Recommended dependency:

```text
vitest
```

## Testing target

No unit test runner is installed yet. Current validation is TypeScript + Vite build.

Before adding more UI complexity, add a lightweight unit test setup and cover:

- package build shape
- package parse failures
- package image extraction dedupe
- package generation job extraction dedupe
- reference pack generation
- reference review report generation
- reference review summary
- asset filename parser
- asset path normalization
- asset import job matching
- asset import image construction
- generation job merge/dedupe
- generation queue summary
- export/final image grouping
- QA report generation
- dialogue script generation
