# Ricco Workspace Pipeline Map v0.1

Last updated: 2026-07-05

## Route

```text
#/ricco-workspace
```

## Purpose

Give the Comic Factory a professional studio overview for the current episode.

The map shows the production flow:

```text
Story / Panels
Reference Packs
Generation Queue
Asset Import
Image Review
QA Gate
Lettering
Package / Restore
```

## New domain module

```text
src/domain/workspace/riccoPipelineMap.ts
```

It owns:

- pipeline stage status types
- status labels
- status CSS class mapping
- edited lettering panel count
- pipeline stage calculation
- current stage selection
- overall progress calculation

## New page

```text
src/pages/RiccoWorkspaceMap.tsx
```

The page reads:

- local review images
- local generation jobs
- reference review state
- lettering layout state

Then it builds a pipeline map and renders every production stage as a clickable card.

## Sidebar

The sidebar now includes:

```text
Workspace Map
```

near the top of the Ricco workflow.

## New tests

```text
tests/domain/workspacePipeline.spec.ts
```

Covers:

- initial pipeline state
- stage count
- current stage selection
- blocked render flow before references/jobs
- completed render/review/QA flow when jobs and finals exist
- edited lettering panel detection
- lettering stage completion

## Why this matters

The app now has a real production overview. This is the beginning of the professional workspace layer that can later evolve into a React Flow / node graph view.

For now it stays dependency-free and testable.
