# Storage Adapter v0.1

Last updated: 2026-07-05

## Problem

The app still uses browser localStorage for Ricco review images.

This is fragile for local uploads because Data-URL images can quickly exceed browser storage limits.

## Goal

Prepare the app for IndexedDB without breaking the current localStorage workflow.

This version does not remove localStorage yet.

## New storage port

```text
src/lib/storage/riccoStoragePort.ts
```

Exports:

```text
createRiccoStoragePort
createBrowserRiccoStoragePort
createMemoryStorageLike
splitRiccoImageStorage
hydrateRiccoImagesFromSplit
buildRiccoImageStorageReport
```

## New storage keys

```text
ricco-image-metadata-v1
ricco-image-blobs-v1
```

## What gets split

A review image with normal URL stays as metadata:

```text
/generated/panel_001.png
```

A review image with local Data-URL is split:

```text
metadata imageUrl -> ricco-image-blob:<imageId>
blob record -> original data:image/...;base64,... payload
```

## Updated local production store

```text
src/lib/backend/localProductionStore.ts
```

Now routes reads/writes through the storage port and adds:

```text
readRiccoReviewImages
writeRiccoReviewImages
buildRiccoImageStorageSplit
writeRiccoImageStorageSplit
readRiccoImagesFromStorageSplit
```

## Updated Storage Manager

```text
#/ricco-storage
```

Now shows:

```text
Data-URLs splittable
Blob payload size
URL/Public count
Blob-ref count
```

New actions:

```text
Split Report kopieren
Split-Daten schreiben
```

`Split-Daten schreiben` writes the new metadata/blob structure but does not delete the old review image list yet.

## Tests

```text
tests/domain/storagePort.spec.ts
```

Covers:

```text
storage port read/write/json/remove
memory driver
data-url detection
mime type extraction
metadata/blob split
hydration back to RiccoPanelImage
storage split report
```

## Next step

Add an IndexedDB driver behind the same port.

After that, local Data-URL payloads can move out of localStorage while the rest of the app keeps using stable image metadata.
