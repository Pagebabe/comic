# Workspace Map UI v0.2

Last updated: 2026-07-05

## Route

```text
#/ricco-workspace
```

## Summary

The Workspace Map no longer renders all pipeline stages as one flat list.

It now groups the pipeline into six production areas:

```text
Story
Render
Asset Workflow
Training Prep
Review
Archive
```

## New domain helper

```text
buildRiccoPipelineGroups(stages)
```

Defined in:

```text
src/domain/workspace/riccoPipelineMap.ts
```

## Group layout

```text
Story:
- Story / Panels
- Reference Packs

Render:
- Generation Queue
- Asset Import

Asset Workflow:
- Asset Library
- Fix Queue
- Reference Candidates
- Dataset Candidates

Training Prep:
- Approved Dataset Export
- LoRA Training Plan

Review:
- Image Review
- QA Gate
- Lettering

Archive:
- Package / Restore
```

## Updated page

```text
src/pages/RiccoWorkspaceMap.tsx
```

The page now shows:

- group title
- group description
- done count
- warning count
- blocked count
- stage cards inside each group

## Tests

```text
tests/domain/workspacePipeline.spec.ts
```

Now checks:

- six groups
- correct group order
- correct stage IDs per group
- all 14 stages are represented exactly once
