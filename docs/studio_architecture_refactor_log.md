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

`src/pages/RiccoPackage.tsx` now:

- reads browser state
- calls `buildRiccoProductionPackage()`
- displays package summary
- copies/downloads JSON

`src/pages/RiccoImport.tsx` now:

- parses JSON through domain helper
- extracts images/jobs/reference state through domain helpers
- writes restored data to LocalStorage
- displays restore status

### Why this matters

This was the first real move from page-owned logic toward studio domain modules. It makes package/restore logic easier to test later without rendering React pages.

## Refactor 002 — Reference Packs Domain Module

Status: done
CI/Build: green

### New module

```text
src/domain/referencePacks/riccoReferencePacks.ts
```

### Why

Before this refactor, `RiccoReferencePacks.tsx` owned a large amount of production logic directly inside the React page:

- character reference pack construction
- location reference pack construction
- style reference pack construction
- asset templates
- prompt builders
- slug creation
- pack labels
- asset storage keys
- expected reference paths
- default reference review state
- review status classes
- copy text generation
- full pack export text
- reference review report generation
- asset counting/filtering

That made the page too large and too hard to test.

### What moved into domain

The new reference pack domain module owns:

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

`src/pages/RiccoReferencePacks.tsx` now:

- reads reference review state
- writes reference review state
- handles selected filter/pack UI state
- calls domain helpers for pack content, copy text, reports and paths
- renders review controls

### Why this matters

Reference Packs are now closer to a real Art Department module. The generated pack definitions, review report and copy/export text can later be tested without rendering the UI.

## Current architecture direction

Next target folders:

```text
src/domain/assets/
src/domain/generation/
src/domain/review/
src/domain/export/
```

## Next recommended refactors

### Refactor 003 — Asset Import Domain Module

Move from `RiccoAssetImport.tsx` into domain:

- path normalization
- file extension validation
- panel id inference
- generation job matching
- row note building
- import row creation

Target:

```text
src/domain/assets/riccoAssetImport.ts
```

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
- generation job merge/dedupe

Recommended future dependency:

```text
vitest
```

But do not add it until the first domain slices are stable.
