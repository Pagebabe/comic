# Refactor 006 — Review Domain Module

Last updated: 2026-07-05
Branch: `backend-adapters`
Status: done
CI/Build: green

## New module

```text
src/domain/review/riccoReviewState.ts
```

## Purpose

Move review and storage business logic out of React pages and into a testable domain module.

## Moved into domain

- review image id creation
- manual URL review image construction
- local file review image construction
- selected panel image sorting
- review summary
- unique final image selection per panel
- review image update helper
- review image delete helper
- local Data URL detection
- storage byte formatting
- storage level thresholds
- storage report construction
- safe cleanup helpers
- storage report text generation

## Updated pages

```text
src/pages/RiccoImageReview.tsx
src/pages/RiccoStorage.tsx
```

## Page responsibilities after refactor

`RiccoImageReview.tsx` now handles UI state, browser storage writes and form events while using the review domain module for image creation, summary, update, final selection and delete.

`RiccoStorage.tsx` now handles UI state and destructive confirmations while using the review domain module for storage reports, byte formatting and cleanup calculations.

## Why this matters

The app now has a real Review Room domain. Final image selection and safe cleanup rules are no longer buried inside UI pages and can later be tested with unit tests.

## Next step

Add a unit test runner and start testing the domain modules.

Recommended next dependency:

```text
vitest
```
