# Episode 001 / Panel 001 Status — Ankunft

Last updated: 2026-07-05

## Status

```text
GEN
```

## Linked production pack

```text
docs/production/episode_001_panel_001_prompt_pack.md
```

## What changed

Panel 1 is no longer just a board item.

It now has a concrete production prompt pack for generating 2-4 rough image variants.

## Next action

Generate image variants for Panel 1:

```text
public/generated/episode_001/panel_001/panel_001_variant_001.png
public/generated/episode_001/panel_001/panel_001_variant_002.png
public/generated/episode_001/panel_001/panel_001_variant_003.png
public/generated/episode_001/panel_001/panel_001_variant_004.png
```

Then open:

```text
#/ricco-image-review
```

and:

```text
import variants
select one final
rating >= 4 if usable
continuity >= 4 if usable
write one short note
```

## Acceptance

```text
Ricco readable
house facade readable
Don Miau visible
no speech bubbles in generated image
```

## Do not continue to Panel 2 until

```text
Panel 1 has at least 2 variants
or one obviously usable final image exists
```
