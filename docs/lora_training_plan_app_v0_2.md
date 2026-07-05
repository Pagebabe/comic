# Ricco LoRA Training Plan App v0.2

Last updated: 2026-07-05

## Route

```text
#/ricco-lora-training-plan
```

## Purpose

Create a real app page for LoRA training readiness.

This page does **not** start training.

It only checks whether `approved_dataset` assets are ready enough for future LoRA training.

## New domain module

```text
src/domain/training/riccoLoraTrainingPlan.ts
```

It owns:

- grouping approved dataset items by LoRA target
- minimum and recommended image requirements
- readiness state per target
- metadata warning detection
- dataset folder path generation
- caption file listing
- target checklist generation
- full readiness report generation

## Readiness states

```text
ready
needs_more_images
needs_metadata
empty
```

## Default image requirements

```text
character_lora: minimum 20, recommended 40
location_lora: minimum 12, recommended 30
style_lora: minimum 40, recommended 80
```

These are planning thresholds only. They can be tuned later after real training tests.

## Checks per target

A target warns when:

```text
missing LoRA target
missing trigger word
inconsistent trigger words
approved dataset items still have warnings
not enough ready images
```

## New page

```text
src/pages/RiccoLoraTrainingPlan.tsx
```

The page reads:

- review images from `RICCO_IMAGES_STORAGE_KEY`
- generation jobs from `readLocalGenerationJobs()`

It shows:

- approved item count
- ready approved item count
- warning approved item count
- ready target count
- targets needing work
- target cards
- readiness badge
- target dataset folder
- warnings
- caption file list
- copyable target checklist
- copyable full report
- copyable raw JSON plan

## Sidebar / route

The sidebar now includes:

```text
LoRA Training Plan
```

near Approved Dataset.

## New tests

```text
tests/domain/loraTrainingPlan.spec.ts
```

Covers:

- requirement lookup
- training path slugging
- approved dataset grouping by target
- ready target state
- needs_more_images state
- needs_metadata state
- inconsistent trigger warning
- item warning detection
- checklist generation

## Why this matters

The dataset pipeline now ends in a safe planning gate before any training:

```text
dataset_candidate
→ approved_dataset
→ approved dataset export
→ LoRA training readiness plan
```

This keeps LoRA training from starting too early with weak data, missing captions or inconsistent trigger words.
