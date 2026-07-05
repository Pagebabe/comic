# Ricco Reference Candidate Flow v0.1

Last updated: 2026-07-05

## Route

```text
#/ricco-reference-candidates
```

## Purpose

Collect all assets marked as:

```text
reference_candidate
```

and turn them into prepared character/location/style reference material.

## Updated image type

```text
src/types/riccoReview.ts
```

`RiccoPanelImage` now supports:

```text
referenceCandidateType
referenceCandidateSubjectId
referenceCandidateNotes
referenceCandidateUpdatedAt
```

## New domain module

```text
src/domain/assets/riccoReferenceCandidates.ts
```

It owns:

- reference candidate item construction
- target list generation from Ricco characters and locations
- style target
- candidate target label resolution
- candidate summary
- target metadata updates
- allowed candidate resolution statuses
- candidate brief generation
- candidate report generation

## New page

```text
src/pages/RiccoReferenceCandidates.tsx
```

The page reads:

- review images from `RICCO_IMAGES_STORAGE_KEY`
- generation jobs from `readLocalGenerationJobs()`

It shows:

- preview image
- panel number and title
- source/final/job/rating/continuity
- target selector for character/location/style
- candidate notes
- job metadata when linked
- candidate brief copy button
- resolution actions

## Target types

```text
character
location
style
```

Targets are built from:

```text
riccoCharacters
riccoLocations
style_master_rih
```

## Resolution statuses

A reference candidate can be resolved as:

```text
approved_reference
dataset_candidate
rejected
raw
```

Other statuses are intentionally blocked by the domain helper for this flow.

## Sidebar / route

The sidebar now includes:

```text
Reference Candidates
```

near Reference Packs and Asset Library.

## New tests

```text
tests/domain/referenceCandidates.spec.ts
```

Covers:

- target generation for character/location/style
- only `reference_candidate` assets enter the flow
- job-linked candidate items
- target metadata updates
- candidate summaries
- candidate brief generation
- report generation
- allowed resolution statuses
- blocked invalid resolution statuses

## Why this matters

This creates the bridge from generated panel images to reusable production references:

```text
Asset Library marks reference_candidate
→ Reference Candidates assigns character/location/style target
→ brief copied into Reference Packs workflow
→ candidate becomes approved_reference / dataset_candidate / rejected / raw
```

This is a prerequisite for better style consistency and later LoRA dataset curation.
