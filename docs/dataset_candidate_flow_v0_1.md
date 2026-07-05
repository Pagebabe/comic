# Ricco Dataset Candidate Flow v0.1

Last updated: 2026-07-05

## Route

```text
#/ricco-dataset-candidates
```

## Purpose

Collect all assets marked as:

```text
dataset_candidate
```

and prepare them for future LoRA dataset curation.

This does not train LoRAs yet. It prepares clean metadata and a manifest.

## Updated image type

```text
src/types/riccoReview.ts
```

`RiccoPanelImage` now supports:

```text
datasetCandidateTargetType
datasetCandidateTargetId
datasetTriggerWord
datasetCaption
datasetNotes
datasetUpdatedAt
```

## New domain module

```text
src/domain/assets/riccoDatasetCandidates.ts
```

It owns:

- dataset candidate item construction
- LoRA target generation from Ricco characters and locations
- style LoRA target
- trigger word generation
- default caption generation
- candidate summary
- dataset metadata updates
- allowed candidate resolution statuses
- dataset manifest generation
- dataset report generation

## New page

```text
src/pages/RiccoDatasetCandidates.tsx
```

The page reads:

- review images from `RICCO_IMAGES_STORAGE_KEY`
- generation jobs from `readLocalGenerationJobs()`

It shows:

- preview image
- panel number and title
- source/final/job/rating/continuity
- dataset / LoRA target selector
- trigger word input
- caption textarea
- dataset notes textarea
- generation job metadata when linked
- manifest copy/download
- report copy
- resolution actions

## Target types

```text
character_lora
location_lora
style_lora
```

Targets are built from:

```text
riccoCharacters
riccoLocations
style_rih_gritty_cartoon
```

## Resolution statuses

A dataset candidate can be resolved as:

```text
approved_dataset
approved_reference
needs_fix
rejected
raw
```

Other statuses are intentionally blocked by the domain helper for this flow.

## Manifest

The manifest version is:

```text
ricco-dataset-manifest-v1
```

It includes:

- image id
- image path
- panel id and title
- target type
- target id
- target label
- trigger word
- caption
- source
- generation job id
- prompt id
- rating
- continuity score
- notes

## Sidebar / route

The sidebar now includes:

```text
Dataset Candidates
```

near Reference Candidates and Asset Library.

## New tests

```text
tests/domain/datasetCandidates.spec.ts
```

Covers:

- target generation for character/location/style LoRAs
- trigger word slugging
- only `dataset_candidate` assets enter the flow
- job-linked dataset items
- default caption generation
- metadata updates
- candidate summaries
- manifest generation
- report generation
- allowed resolution statuses
- blocked invalid resolution statuses

## Why this matters

This creates the bridge from selected production assets to later LoRA training:

```text
Asset Library marks dataset_candidate
→ Dataset Candidates assigns LoRA target
→ trigger word and caption are prepared
→ manifest is exported
→ candidate becomes approved_dataset / approved_reference / needs_fix / rejected / raw
```

This is the first serious dataset curation layer for consistent characters, locations and style.
