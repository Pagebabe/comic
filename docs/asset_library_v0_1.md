# Ricco Asset Library v0.1

Last updated: 2026-07-05

## Route

```text
#/ricco-assets
```

## Purpose

Create a dedicated asset workspace for all Ricco panel images.

This sits between:

```text
Asset Import / Bulk Upload -> Asset Library -> Image Review / Storage / Export
```

## New domain module

```text
src/domain/assets/riccoAssetLibrary.ts
```

It owns:

- asset library item construction
- panel metadata lookup
- generation job lookup
- final/variant flags
- local-vs-url/public asset detection
- summary counts
- panel/source/final/job/query filters
- text report generation

## New page

```text
src/pages/RiccoAssetLibrary.tsx
```

The page reads:

- local review images from `RICCO_IMAGES_STORAGE_KEY`
- local generation jobs from `readLocalGenerationJobs()`

Then it displays:

- asset cards
- previews
- panel title/number
- final/variant state
- source
- local-vs-url/public state
- rating and continuity
- generation job metadata when linked
- review notes

## Filters

- panel
- final/variant/all
- job-linked/unlinked/all
- source
- free text search

## New tests

```text
tests/domain/assetLibrary.spec.ts
```

Covers:

- item construction
- panel metadata
- generation job metadata
- summary counts
- local/public classification
- filtering by panel
- filtering by final/variant
- filtering by job link
- filtering by source
- query search
- report generation

## Why this matters

The app now has a real Asset Library instead of assets only being visible inside Image Review or Storage.

This is the foundation for later features like:

- tag system
- asset status workflow
- reference candidates from panel images
- dataset candidates for LoRA training
- real file manager / thumbnail service
