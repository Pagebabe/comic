# Restore v0.6 Visibility

Last updated: 2026-07-05

## Route

```text
#/ricco-restore
```

## Summary

Restore now shows whether important package metadata is present before and after import.

## New domain helper

```text
src/domain/package/riccoRestorePreview.ts
```

It builds a restore preview from a parsed package.

## Preview fields

```text
package version
image count
final image count
generation job count
reference review count
approved reference count
lettering layout count
pipeline progress
current pipeline stage
asset metadata image count
reference candidate metadata image count
dataset metadata image count
dataset_candidate image count
approved_dataset image count
needs_fix image count
LoRA snapshot present
LoRA ready targets
LoRA targets needing work
LoRA approved items
```

## Updated page

```text
src/pages/RiccoImport.tsx
```

The page now shows:

- package version
- asset metadata counts
- reference metadata counts
- dataset metadata counts
- dataset candidate count
- approved dataset count
- needs_fix count
- LoRA snapshot status
- LoRA ready / needs-work target counts
- links to Asset Library, Approved Dataset and LoRA Training Plan

## Restore behavior

The source of truth remains the image objects, generation jobs, reference review and lettering layout.

LoRA and pipeline views are recalculated after restore from restored data.

## Tests

```text
tests/domain/restorePreview.spec.ts
```

Covers:

- empty preview
- package v6 metadata detection
- asset / reference / dataset metadata counts
- approved dataset count
- needs_fix count
- LoRA snapshot detection
- readable restore status text
