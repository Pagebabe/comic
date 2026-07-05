# Refactor 007 — Unit Test Setup

Last updated: 2026-07-05
Branch: `backend-adapters`
Status: done
CI/Build: green

## Decision

Do not add Vitest yet.

Reason: the repo already has `@playwright/test` in the lockfile and CI uses `npm ci`. Adding Vitest without regenerating and committing the lockfile would risk breaking CI. Instead, use Playwright as the current Node-capable test runner for domain-level tests.

## New script

```text
npm run test:unit
```

Implementation:

```text
playwright test --config=playwright.unit.config.ts
```

## New config

```text
playwright.unit.config.ts
```

Purpose:

- test directory: `tests/domain`
- test files: `*.spec.ts`
- no browser/video/trace requirement
- fast domain tests against pure TypeScript modules

## Domain test files

```text
tests/domain/assetImport.spec.ts
tests/domain/comfyPayload.spec.ts
tests/domain/exportReview.spec.ts
tests/domain/generationQueue.spec.ts
tests/domain/package.spec.ts
tests/domain/packageNextSteps.spec.ts
tests/domain/referencePacks.spec.ts
tests/domain/storage.spec.ts
```

## Covered now

### Asset Import domain

- public path normalization
- panel id inference from file names
- auto-linking assets to best generation jobs
- review image creation from import rows

### Generation Queue domain

- stable generation job key
- merge/dedupe without overwriting existing completed jobs
- queue summary for completed/failed/active jobs

### Export + Review domains

- manual review image creation defaults
- one final image per panel
- review summary
- selected images sorted first
- image update/delete helpers
- export readiness
- QA summary

### Package domain

- production package v3 shape
- reference review summary inside packages
- final image state inside packages
- broken JSON parse handling
- image extraction dedupe
- generation job extraction dedupe
- reference review state extraction
- deterministic package file name
- next-step decision logic

### Reference Packs domain

- core reference pack generation
- character/location/style pack presence
- German slug generation
- type filters
- expected asset paths
- reference storage keys
- default review state
- copy text generation
- review report generation

### Storage / Review cleanup domain

- storage byte formatting
- warning/danger level classification
- storage report construction
- final image detection
- local Data URL detection
- imported job detection
- safe cleanup that keeps only finals
- local non-final cleanup that preserves final/local and URL variants correctly
- readable storage report text

### ComfyUI adapter

- minimal adapter payload identity fields
- warning that payload is not a full ComfyUI graph
- positive/negative prompt preservation
- render settings preservation

## CI change

CI now runs:

```text
npm ci
npm run test:unit
npm run build
```

This means a branch is not considered clean unless domain tests and TypeScript/Vite build pass.

## Why this matters

The project now has the beginning of a real studio-grade safety net.

Before this refactor, production logic was only checked indirectly by TypeScript/Vite build. Now the most important domain rules can fail fast in CI.

## Next test targets

Add tests for:

- reference review summary edge cases
- dialogue script generation details
- local production store normalization helpers
- ComfyUI config/submit behavior with mocked fetch

## Later

Vitest can still be adopted later when the lockfile is updated intentionally from a real install step.
