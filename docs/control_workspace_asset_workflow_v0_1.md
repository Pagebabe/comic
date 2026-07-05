# Control Room / Workspace Asset Workflow v0.1

Last updated: 2026-07-05

## Purpose

Make asset workflow state visible in the main studio control surfaces.

Before this change, Asset Library, Fix Queue, Reference Candidates and Dataset Candidates existed as separate pages. Now their status is visible in:

```text
#/ricco-control
#/ricco-workspace
```

## Updated pipeline domain

```text
src/domain/workspace/riccoPipelineMap.ts
```

The pipeline now includes 12 stages:

```text
Story / Panels
Reference Packs
Generation Queue
Asset Import
Asset Library
Fix Queue
Reference Candidates
Dataset Candidates
Image Review
QA Gate
Lettering
Package / Restore
```

## Asset workflow stage logic

### Asset Library

Done when assets exist.

Metric includes:

```text
total assets
approved_panel count
```

### Fix Queue

Warning when `needs_fix` assets exist.
Done when assets exist and no `needs_fix` is open.
Blocked before assets exist.

### Reference Candidates

Warning when candidates exist but target assignment is missing.
Active when candidates exist and are targeted.
Done when no candidates are open and assets exist.

### Dataset Candidates

Warning when candidates exist but dataset target assignment is missing.
Active when candidates exist and are captioned/targeted.
Done when no candidates are open and assets exist.

## Updated Control Room

```text
src/pages/RiccoControlRoom.tsx
```

Now shows:

- total assets
- needs_fix count
- reference candidate count
- dataset candidate count
- approved dataset count
- asset workflow issue count
- links to Asset Library, Fix Queue, Reference Candidates and Dataset Candidates

The Runbook now includes:

- asset totals
- needs_fix count
- reference candidate totals and missing targets
- dataset candidate totals and missing targets
- approved dataset count

## Updated tests

```text
tests/domain/workspacePipeline.spec.ts
tests/domain/package.spec.ts
```

Coverage now includes:

- 12-stage pipeline
- blocked asset workflow before assets exist
- clean asset workflow when all finals exist and no candidates/fixes are open
- warning states for needs_fix and untargeted reference/dataset candidates
- package snapshot expecting 12 pipeline stages

## Why this matters

The app now has a real studio-level asset overview. Problems and opportunities are visible without opening every individual workspace.

This makes the Comic Factory closer to a production dashboard:

```text
bad assets -> Fix Queue
useful assets -> Reference Candidates
training assets -> Dataset Candidates
clean finals -> QA / Lettering / Package
```
