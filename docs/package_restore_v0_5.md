# Ricco Package / Restore v0.5

Last updated: 2026-07-05

## What changed

Production packages now explicitly include asset workflow and dataset curation state.

The image objects already carry most metadata, but v0.5 adds package-level summaries and a dataset manifest so the archive is easier to audit and restore.

## Package version

```text
ricco-production-package-v5
```

## New package sections

### assetWorkflowState

Contains:

```text
assetSummary
fixQueueSummary
referenceCandidateSummary
datasetCandidateSummary
statusMetadataImageCount
referenceMetadataImageCount
datasetMetadataImageCount
restoreSupported
```

This summarizes:

- Asset Library state
- Fix Queue state
- Reference Candidate state
- Dataset Candidate state
- how many images carry asset/status/candidate metadata

### datasetState

Contains:

```text
manifest
manifestVersion
totalItems
restoreSupported
```

The manifest version is:

```text
ricco-dataset-manifest-v1
```

## Updated package page

```text
src/pages/RiccoPackage.tsx
```

Now shows:

- total assets
- needs_fix count
- reference candidate count
- dataset candidate count
- dataset manifest item count
- status metadata count
- reference metadata count
- dataset metadata count

It also supports:

- copy full production package
- download full production package
- copy dataset manifest

## Restore note

Restore still restores asset workflow and dataset metadata through `reviewState.storedImages`, because `RiccoPanelImage` now carries:

```text
assetStatus
assetStatusUpdatedAt
referenceCandidateType
referenceCandidateSubjectId
referenceCandidateNotes
referenceCandidateUpdatedAt
datasetCandidateTargetType
datasetCandidateTargetId
datasetTriggerWord
datasetCaption
datasetNotes
datasetUpdatedAt
```

So no separate localStorage key is needed for asset workflow state yet.

## Updated tests

```text
tests/domain/package.spec.ts
tests/domain/packageNextSteps.spec.ts
```

Coverage now includes:

- package v5 shape
- asset workflow summary
- fix queue summary
- reference candidate summary
- dataset candidate summary
- status metadata counts
- reference metadata counts
- dataset metadata counts
- dataset manifest inside production package
- next-step routing to Dataset Candidates when dataset candidates exist

## Why this matters

The Production Package is now closer to a real studio archive.

It can preserve and audit:

```text
images
final selection
asset statuses
fix queue state
reference candidate metadata
dataset candidate metadata
dataset manifest
lettering layout
pipeline snapshot
```

This prevents LoRA/dataset preparation from being lost when the browser state is cleared or restored later.
