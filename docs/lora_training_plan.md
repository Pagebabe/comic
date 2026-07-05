# LoRA Training Plan — Ricco Comic Factory

Last updated: 2026-07-05

## Purpose

LoRAs are not the next immediate step. They become useful only after the visual reference packs are stable and approved.

This document defines how LoRA work should be prepared without poisoning the project with unstable visuals.

## Rule

```text
No LoRA before approved reference packs.
No dataset from random bad generations.
No training until character identity is locked.
```

## Current state

Prepared in code/schema:

- `GenerationJob.loraIds`
- `ProductionSubjectType` includes `lora`
- Supabase schema includes `loras`

Not yet done:

- no datasets
- no captions
- no trigger words finalized
- no trained LoRA files
- no evaluation reports
- no ComfyUI LoRA node mapping

## LoRA order

Do not train everything at once.

Recommended order:

```text
1. Ricco character LoRA
2. Basti Prenzl character LoRA
3. Jule character LoRA
4. Don Miau character LoRA, only if needed
5. Style LoRA, only after panel style is proven
6. Location LoRAs, only if prompts/reference are not enough
```

## Why Ricco first

Ricco appears in nearly every pilot panel. If Ricco is unstable, the series fails even if everything else works.

## Dataset folder structure

```text
datasets/lora/characters/ricco/v1/images/
datasets/lora/characters/ricco/v1/captions/
datasets/lora/characters/ricco/v1/rejected/
datasets/lora/characters/ricco/v1/eval/

models/loras/characters/ricco/
models/loras/characters/basti-prenzl/
models/loras/characters/jule/
models/loras/characters/don-miau/
```

Do not commit large image datasets or model files to the normal Git repo unless Git LFS or external storage is configured.

## Dataset quality rule

Only use images that pass reference review.

Minimum for Ricco v1:

```text
12 approved images minimum
20–40 approved images preferred
front / side / back
multiple expressions
same outfit lock
same hair/stubble/headphones identity
neutral background references
at least 4 pilot-like scene images
```

Reject images with:

```text
wrong age
wrong hairstyle
missing headphones
no stubble
too handsome/influencer
too realistic
anime/Pixar/glossy style
bad anatomy
random text
speech bubbles
watermark
wrong outfit
```

## Caption format

Use one `.txt` caption per image.

Example Ricco caption:

```text
ricco_rih, gritty adult cartoon man, chaotic young musician, messy dark hair, light stubble, tired eyes, worn hoodie, headphones around neck, slim lanky body, Berlin squat comic style, bold black outlines, muted dirty colors
```

Avoid over-captioning the same identity differently every time.

## Trigger words

Proposed trigger tokens:

```text
ricco_rih
basti_prenzl_rih
jule_rih
don_miau_rih
rih_gritty_cartoon
```

Final trigger words should be documented after actual tests.

## Training settings placeholder

These are placeholders, not final training advice:

```text
base model: SDXL comic-compatible checkpoint
resolution: 1024 or bucketed SDXL
network dim: 16–64 test range
network alpha: usually same or lower than dim
optimizer: AdamW8bit or Prodigy depending setup
caption dropout: low or none for identity lock tests
repeats: depends dataset size
steps: test short first, then scale
```

Do not lock final settings until the actual base model and dataset are selected.

## Evaluation matrix

Every LoRA test must be evaluated against the pilot.

Test prompts:

```text
Panel 1: Ricco outside the house
Panel 3: Ricco reading the 780 note
Panel 4: Ricco in the tiny room
Panel 5: Ricco ignoring mother call
Panel 8: Ricco alone on pallet mattress
```

Score each output:

```text
face consistency: 1–5
outfit consistency: 1–5
body/shape consistency: 1–5
style match: 1–5
prompt obedience: 1–5
panel usefulness: 1–5
```

Pass threshold:

```text
average 4+
no fatal identity drift
no major style drift
no text artifacts
```

## Evaluation report format

Save as:

```text
docs/lora/evaluations/ricco_lora_v1_eval.md
```

Report should include:

```text
training date
base model
dataset count
caption style
trigger word
training settings
recommended weight range
strengths
weaknesses
best use cases
bad use cases
example prompts
panel test scores
final decision
```

## ComfyUI integration later

Generation Jobs already contain `loraIds`, but no real LoRA mapping exists yet.

Later mapping should add:

```text
lora id
lora file path
weight model
weight clip
trigger word injection rule
```

Example future job extension:

```json
{
  "loraIds": ["lora_ricco_v1"],
  "loraWeights": {
    "lora_ricco_v1": 0.75
  }
}
```

Do not add this to code until actual LoRA tests exist.

## Supabase lora record target

The `loras` table should eventually store:

```text
id
name
slug
type
subject_id
trigger_word
base_model_id
file_path
dataset_path
training_notes_path
evaluation_report_path
recommended_weight_min
recommended_weight_max
status
known_strengths
known_weaknesses
notes
```

## Done criteria for Ricco LoRA v1

Ricco LoRA v1 is done only when:

- reference pack is approved
- dataset is curated
- captions are consistent
- model is trained
- evaluation report exists
- recommended weight range exists
- at least 5 pilot panel tests pass
- ComfyUI can load it manually
- Generation Queue can document its use

## Immediate action

Do not start training yet.

Immediate action is:

```text
Create and approve Ricco reference pack v1.
```
