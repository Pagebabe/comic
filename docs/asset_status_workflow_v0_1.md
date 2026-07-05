# Ricco Asset Status Workflow v0.1

Last updated: 2026-07-05

## Purpose

Assets in the Ricco Asset Library can now be marked with a production status.

This turns the Asset Library from a passive gallery into the beginning of an asset workflow.

## Updated type

```text
src/types/riccoReview.ts
```

`RiccoPanelImage` now supports:

```text
assetStatus?: AssetStatus
assetStatusUpdatedAt?: string
```

The `AssetStatus` union already exists in:

```text
src/types/productionBackend.ts
```

## Supported statuses

```text
raw
maybe
selected
rejected
reference_candidate
approved_reference
dataset_candidate
approved_dataset
needs_fix
fixed
approved_panel
```

## Updated domain module

```text
src/domain/assets/riccoAssetLibrary.ts
```

New helpers:

```text
ASSET_STATUS_OPTIONS
AssetLibraryStatusFilter
statusForAsset()
statusClassForAsset()
updateAssetStatus()
```

Status rules:

- explicit `assetStatus` wins
- selected final images default to `approved_panel`
- non-final images default to `raw`

## Updated page

```text
src/pages/RiccoAssetLibrary.tsx
```

Now supports:

- asset status select per image
- status filter
- status counts in summary chips
- status class badge
- localStorage persistence back to `RICCO_IMAGES_STORAGE_KEY`

## Updated tests

```text
tests/domain/assetLibrary.spec.ts
```

Now covers:

- default status for final/variant images
- status summary counts
- filtering by status
- searching by status
- immutable status updates
- status class mapping
- report status lines

## Why this matters

This prepares the next production layers:

- reference candidates from generated panel images
- dataset candidates for LoRA training
- approved panel archive
- fix queue
- rejected asset cleanup
