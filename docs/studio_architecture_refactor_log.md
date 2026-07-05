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

### Pages after refactor

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

### Why

Before this refactor, `RiccoAssetImport.tsx` owned several production-critical functions directly inside the React page:

- public path normalization
- image extension validation
- panel id inference from filenames
- generation job status ranking
- generation job selection/matching
- import row note building
- import row creation
- relinking a row after manual panel change
- Ricco review image construction from import rows
- imported generation job id collection

That made the importer harder to test and riskier to change.

### What moved into domain

The new asset import domain module owns:

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

`src/pages/RiccoAssetImport.tsx` now:

- reads generation jobs
- manages selected override/fallback/input UI state
- calls domain helpers for row parsing, relinking and image creation
- writes imported review images to LocalStorage
- marks linked jobs as `imported_as_asset`
- renders import preview

### Why this matters

Asset import is now closer to a real Asset Intake module. Filename parsing, job matching and review image construction can later be covered by unit tests without rendering the UI.

## Current architecture direction

Next target folders:

```text
src/domain/generation/
src/domain/review/
src/domain/export/
```

## Next recommended refactors

### Refactor 004 — Generation Queue Domain Module

Move from `RiccoGenerationQueue.tsx` into domain:

- stable job key
- merge generated jobs
- status preference
- job export payload

Target:

```text
src/domain/generation/riccoGenerationQueue.ts
```

### Refactor 005 — Export / Lettering Domain Module

Move repeated final-image selection and panel export ordering logic out of export, QA and lettering pages.

Target:

```text
src/domain/export/riccoExportState.ts
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

Recommended future dependency:

```text
vitest
```

But do not add it until the first domain slices are stable.
