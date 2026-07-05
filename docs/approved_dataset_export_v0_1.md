# Ricco Approved Dataset Export v0.1

Last updated: 2026-07-05

## Route

```text
#/ricco-approved-dataset
```

## Purpose

Export only assets that are already approved for training:

```text
approved_dataset
```

This is separate from `dataset_candidate`.

`dataset_candidate` means the asset is being prepared.
`approved_dataset` means it is ready for the final dataset manifest, assuming validation passes.

## New domain module

```text
src/domain/assets/riccoApprovedDatasetExport.ts
```

It owns:

- filtering only `approved_dataset` assets
- converting approved assets into dataset items
- validation warnings
- approved dataset summary
- final manifest generation
- caption file list generation
- report generation

## New page

```text
src/pages/RiccoApprovedDatasetExport.tsx
```

The page reads:

- review images from `RICCO_IMAGES_STORAGE_KEY`
- generation jobs from `readLocalGenerationJobs()`

It shows:

- preview image
- ready/warning badge
- target type
- trigger word
- rating
- continuity
- linked job status
- warnings
- caption
- caption file path
- final manifest JSON

## Manifest version

```text
ricco-approved-dataset-manifest-v1
```

The approved manifest extends the dataset manifest with:

```text
sourceManifestVersion
readyItems
warningItems
```

## Validation warnings

Approved dataset items warn on:

```text
missing dataset target
missing trigger word
missing caption
missing image path
rating below 4
continuity below 4
```

## Caption files

The export can generate caption file mappings:

```text
image.png -> image.txt
```

This prepares the dataset for later LoRA tooling without starting training yet.

## Sidebar / route

The sidebar now includes:

```text
Approved Dataset
```

near Dataset Candidates.

## New tests

```text
tests/domain/approvedDatasetExport.spec.ts
```

Covers:

- only `approved_dataset` assets enter the export
- ready item validation
- warning item validation
- summary counts
- manifest generation
- caption file mapping
- report generation

## Why this matters

The dataset pipeline now has clear stages:

```text
dataset_candidate
→ caption / target / trigger preparation
→ approved_dataset
→ final approved dataset manifest
```

This prevents unreviewed candidate images from accidentally entering LoRA training.
