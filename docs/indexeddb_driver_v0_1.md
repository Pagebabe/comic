# IndexedDB Driver v0.1

Last updated: 2026-07-05

## Problem

Storage Adapter v0.1 can split local image Data-URLs into metadata and blob records, but those blob records were still only prepared for storage.

## Goal

Add a browser IndexedDB driver for Ricco image blob records without removing the existing localStorage fallback.

## New file

```text
src/lib/storage/riccoIndexedDbStorage.ts
```

## IndexedDB constants

```text
DB name: ricco-comic-factory-db
Version: 1
Object store: imageBlobs
Key path: imageId
```

## Exports

```text
isRiccoIndexedDbAvailable
summarizeRiccoIndexedDbBlobMigration
openRiccoIndexedDb
writeRiccoImageBlobsToIndexedDb
readRiccoImageBlobsFromIndexedDb
deleteRiccoImageBlobFromIndexedDb
clearRiccoImageBlobsFromIndexedDb
```

## Updated Storage Manager

Route:

```text
#/ricco-storage
```

Version:

```text
Ricco Storage Manager v0.5
```

New UI state:

```text
IndexedDB available / unavailable
IndexedDB blob count
IndexedDB payload bytes
```

New actions:

```text
Blobs nach IndexedDB
IndexedDB Blobs löschen
```

## Safety

This step does not delete the old localStorage review image list.

It only writes split blob records into IndexedDB and lets the user clear the IndexedDB blob store separately.

The app still keeps localStorage as fallback.

## Tests

```text
tests/domain/indexedDbStorage.spec.ts
```

Covers:

```text
stable constants
safe unavailable IndexedDB detection
unavailable migration summary
successful migration summary
partial migration summary
```

## Next step

Use IndexedDB as the preferred source for local image payloads after the metadata/blob split exists.

Then localStorage can keep only image metadata and no longer carry large Data-URL payloads.
