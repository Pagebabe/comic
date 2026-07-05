# Approved Dataset Control / Workspace Integration v0.1

Last updated: 2026-07-05

## Purpose

Make final approved training data visible in the main studio overview.

Before this change, `approved_dataset` assets had their own export page. Now the state is also visible in:

```text
#/ricco-control
#/ricco-workspace
```

## Updated pipeline domain

```text
src/domain/workspace/riccoPipelineMap.ts
```

The pipeline now includes 13 stages:

```text
Story / Panels
Reference Packs
Generation Queue
Asset Import
Asset Library
Fix Queue
Reference Candidates
Dataset Candidates
Approved Dataset Export
Image Review
QA Gate
Lettering
Package / Restore
```

## New pipeline stage

```text
Approved Dataset Export
```

Route:

```text
#/ricco-approved-dataset
```

Status rules:

```text
warning  -> approved_dataset items exist but validation warnings exist
done     -> approved_dataset items exist and all are ready
active   -> assets exist but no approved_dataset assets yet
blocked  -> no assets exist yet
```

Metric:

```text
ready/total ready · warnings warnings
```

## Updated Control Room

```text
src/pages/RiccoControlRoom.tsx
```

Now shows:

- approved_dataset count
- approved dataset ready count
- approved dataset warning count
- quicklink to Approved Dataset Export
- Runbook fields for ready/warning approved datasets

The Asset Workflow card now includes:

- approved dataset ready
- approved dataset warnings
- link to `#/ricco-approved-dataset`

## Updated tests

```text
tests/domain/workspacePipeline.spec.ts
tests/domain/package.spec.ts
```

Coverage now includes:

- 13-stage pipeline
- approved dataset stage blocked before assets exist
- approved dataset stage active when assets exist but no approved dataset is ready
- approved dataset stage done when approved_dataset items are valid
- approved dataset stage warning when approved_dataset items have validation problems
- package pipeline snapshot includes the approved dataset stage

## Why this matters

The studio now separates three dataset levels clearly:

```text
dataset_candidate          -> preparation queue
approved_dataset           -> manually approved training asset
approved dataset export    -> final manifest quality gate
```

This makes accidental LoRA training on unfinished candidates less likely.
