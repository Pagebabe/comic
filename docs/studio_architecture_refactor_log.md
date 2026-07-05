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

### Why

Before this refactor, `RiccoPackage.tsx` and `RiccoImport.tsx` each owned important business logic directly inside React pages:

- package schema version
- package JSON build
- package filename
- restore parser
- panel image guards
- generation job guards
- image extraction
- generation job extraction
- reference review extraction
- package validity check

That is acceptable for MVP, but not for a studio-grade workspace.

### What moved into domain

The new package domain module owns:

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

This is the first real move from:

```text
page-owned logic
```

toward:

```text
studio domain modules
```

It makes package/restore logic easier to test later without rendering React pages.

## Current architecture direction

Next target folders:

```text
src/domain/referencePacks/
src/domain/assets/
src/domain/generation/
src/domain/review/
src/domain/export/
```

## Next recommended refactors

### Refactor 002 — Reference Packs Domain Module

Move from `RiccoReferencePacks.tsx` into domain:

- reference pack generation
- asset storage keys
- default review state
- review status options
- copy text/report builders
- pack summary

Target:

```text
src/domain/referencePacks/riccoReferencePacks.ts
```

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
- reference review summary
- asset filename parser
- generation job merge/dedupe

Recommended future dependency:

```text
vitest
```

But do not add it until the first domain slices are stable.
