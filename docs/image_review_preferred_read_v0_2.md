# Image Review Preferred Read v0.2

Last updated: 2026-07-05

## Route

```text
#/ricco-image-review
```

## Summary

Ricco Image Review now uses the preferred image read path for previews.

The data model stays stable for writes, while local preview payloads can come from the storage migration path.

## What changed

```text
src/lib/storage/riccoBlobPayload.ts
src/lib/storage/riccoIndexedDbStorage.ts
src/lib/backend/localProductionStore.ts
src/pages/RiccoImageReview.tsx
```

## Blob payloads

IndexedDB image records now store browser `Blob` payloads instead of keeping the large string payload as the primary stored value.

This is important because local uploads should not stay as giant strings forever.

## Object URL preview path

The Image Review page now renders preview images through an object URL path when IndexedDB records are available.

The page keeps a list of generated object URLs and revokes them on reload / unmount.

## Write-through behavior

When the page has legacy review images, it writes:

```text
legacy review list
split image metadata
split image records
IndexedDB blob payloads
```

This means old image data can migrate forward while the old list remains as fallback.

## Safety

The old localStorage review list is not deleted.

The app still falls back to:

```text
legacy localStorage
split localStorage records
```

if IndexedDB is unavailable.

## Why this matters

This is the first real page-level adoption of the new storage path.

The review page is the most important first target because it displays many image variants and carries the largest local payload risk.

## Remaining caution

The Storage Manager still needs a small follow-up cleanup so its status check does not create long-lived preview object URLs when counting IndexedDB records.

The core Image Review page already owns and revokes its preview object URLs.

## Product rule after this

After this storage migration step, no new tool-heavy feature should be added before producing one complete hand-tested pilot episode.

The next product step is:

```text
Episode 1 hand-test production
```

not more automation.
