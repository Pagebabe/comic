# IndexedDB Preferred Read v0.1

Last updated: 2026-07-05

## Goal

Prefer IndexedDB image records when hydrating split Ricco review images.

This keeps the old localStorage review list as fallback while preparing the app to move large local image payloads out of localStorage.

## New resolver

```text
src/lib/storage/riccoImageSourceResolver.ts
```

It resolves image payloads in this order:

```text
1. primary records
2. secondary records
3. legacy localStorage image data-url
4. unresolved blob ref
```

In the browser flow this means:

```text
1. IndexedDB imageBlobs
2. localStorage split blob records
3. old ricco-studio-images-v1 list
```

## Updated local production store

```text
src/lib/backend/localProductionStore.ts
```

New async function:

```text
readRiccoImagesPreferred()
```

It returns:

```text
images
source
metadataImageCount
indexedDbRecordCount
localSplitRecordCount
legacyImageCount
indexedDbHits
localSplitHits
legacyHits
missingRefs
```

## Updated Storage Manager

```text
#/ricco-storage
```

Version:

```text
Ricco Storage Manager v0.6
```

New action:

```text
Preferred Read prüfen
```

This action does not change data.

It reports whether images were hydrated from:

```text
IndexedDB
split localStorage records
legacy localStorage images
missing refs
```

## Tests

```text
tests/domain/imageSourceResolver.spec.ts
```

Covers:

```text
normal URL metadata stays untouched
primary records win
secondary records are fallback
legacy local data-url is fallback
missing blob refs are reported
```

## Next step

Replace selected page reads with `readRiccoImagesPreferred()` where async loading is acceptable.

Start with:

```text
RiccoImageReview
RiccoAssetLibrary
RiccoPackage
RiccoControlRoom
```

Do this gradually, because most pages currently expect synchronous reads.
