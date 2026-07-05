# Ricco Fix Queue v0.1

Last updated: 2026-07-05

## Route

```text
#/ricco-fix-queue
```

## Purpose

Collect all assets marked as:

```text
needs_fix
```

and turn them into a focused repair queue.

## New domain module

```text
src/domain/assets/riccoFixQueue.ts
```

It owns:

- filtering needs-fix assets
- fix queue item shape
- fix queue summary
- fix queue report text
- allowed resolution statuses
- status resolution helper

## New page

```text
src/pages/RiccoFixQueue.tsx
```

The page reads:

- review images from `RICCO_IMAGES_STORAGE_KEY`
- generation jobs from `readLocalGenerationJobs()`

It shows:

- preview image
- panel number and title
- fix reason from review notes
- suggested action
- generation job id/status/workflow/seed when linked
- prompt details
- resolve status select

## Resolution statuses

A needs-fix item can be resolved as:

```text
fixed
approved_panel
rejected
```

Other asset statuses are intentionally blocked by the domain helper for this queue.

## Sidebar / route

The sidebar now includes:

```text
Fix Queue
```

near Asset Library and Image Review.

## New tests

```text
tests/domain/fixQueue.spec.ts
```

Covers:

- only `needs_fix` assets enter the queue
- job-linked fix items
- summary counts
- panel affected counts
- local/url image counts
- readable report generation
- allowed resolution statuses
- blocked invalid resolution statuses

## Why this matters

The app now has the beginning of a repair loop:

```text
Asset Library marks needs_fix
→ Fix Queue collects broken assets
→ Generation Queue / Review can create repair attempts
→ asset is resolved as fixed / approved_panel / rejected
```
