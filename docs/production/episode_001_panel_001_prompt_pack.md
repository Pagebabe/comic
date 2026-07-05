# Episode 001 / Panel 001 Prompt Pack — Ankunft

Last updated: 2026-07-05

## Purpose

This is a production prompt pack, not new tooling.

Goal:

```text
Generate 2-4 usable rough image variants for Panel 1 and move the episode toward final output.
```

## Panel

```text
Episode: Ricco im Haus — Das Zimmer
Panel: 001 — Ankunft
Status: GEN
```

## Story function

Introduce:

```text
Ricco
run-down Berlin house
Don Miau
arrival mood
```

The viewer must understand immediately:

```text
Ricco has arrived at a strange, dirty Berlin house and thinks this is his new beginning.
```

## Image target

```text
Ricco stands in front of an old run-down Berlin apartment house with moving bags, backpack, sports bag and cheap music gear. Don Miau watches from an upper window. The house feels dirty, political, lived-in and slightly threatening but funny.
```

## Required visual elements

```text
Ricco with bags
cheap microphone stand or music gear
old dirty Berlin facade
broken doorbell / stickers / graffiti / old posters
Don Miau in an upper window
arrival posture
no speech bubbles
no readable text
```

## Character continuity

### Ricco

```text
slim chaotic musician
late 20s to mid 30s
messy dark hair
tired eyes
light stubble
worn hoodie or old tracksuit jacket
backpack / plastic bags / sports bag
cheap microphone stand or small music gear
not rich
not polished
```

### Don Miau

```text
fat old cat
half-closed yellow eyes
scarred ear
heavy mafia-boss posture
sitting in window
not cute kitten
not fantasy cat
```

## Location continuity

```text
old Berlin Mietshaus facade
cracks in plaster
graffiti
political stickers
old flyers
broken doorbells
dirty windows
bicycle wrecks if possible
not luxury
not clean new building
```

## Master positive prompt

```text
gritty adult satirical cartoon panel, run-down Berlin squat house facade, bold black outlines, dirty muted urban colors, rough adult cartoon style, social satire mood, expressive grounded characters, cinematic comic panel composition, Ricco a slim chaotic tired musician standing on the sidewalk with moving bags, backpack, sports bag and a cheap microphone stand, messy dark hair, tired eyes, light stubble, worn hoodie, overwhelmed but hopeful posture, old cracked Berlin apartment facade behind him, graffiti, political stickers, broken doorbells, old posters, dirty windows, bicycle wrecks near the entrance, fat old dark cat Don Miau with half-closed yellow eyes watching from an upper window, funny but melancholic arrival mood, readable silhouettes, no speech bubbles, no dialogue text inside image
```

## Negative prompt

```text
photorealistic, realistic photo, glossy 3d, anime, manga, disney, pixar, children cartoon, cute mascot style, luxury building, clean modern apartment, corporate illustration, influencer aesthetic, beauty lighting, perfect faces, superhero, fantasy, medieval, sci-fi, readable text, speech bubbles, captions, letters, watermark, logo, signature, random signs with gibberish text, rich stylish Ricco, cute kitten, missing cat, clean facade
```

## Variant plan

Generate 4 variants max.

### Variant A — Wide establishing shot

```text
wide shot, full facade visible, Ricco small but readable in front of building, Don Miau visible in upper window, strong arrival composition
```

Use if:

```text
house identity is strongest
Don Miau is readable
Ricco is still visible
```

### Variant B — Medium character shot

```text
medium-wide shot, Ricco larger in frame with bags and microphone stand, dirty entrance and facade behind him, Don Miau in window above
```

Use if:

```text
Ricco character reads best
arrival emotion is clear
house still looks dirty
```

### Variant C — Low angle entrance shot

```text
slightly low angle from sidewalk, Ricco looking up at the building, bags around him, Don Miau above looking down like the real owner
```

Use if:

```text
Don Miau feels powerful
house feels intimidating
Ricco feels small but hopeful
```

### Variant D — Comic timing shot

```text
Ricco smiles tiredly with all his stuff, unaware of Don Miau staring from the window like a mafia boss, dirty absurd house details around him
```

Use if:

```text
humor reads best
Ricco and Don Miau contrast is strong
```

## Reject immediately if

```text
Don Miau missing
Ricco missing
house looks modern or clean
Ricco looks rich / influencer / model
image includes speech bubbles or text
composition unreadable
wrong location
cat looks like cute kitten or fantasy animal
```

## Accept rough if

```text
Ricco is readable
house facade is dirty and Berlin-like
Don Miau is visible
scene reads as arrival
style is gritty adult cartoon
```

## File naming

```text
public/generated/episode_001/panel_001/panel_001_variant_001.png
public/generated/episode_001/panel_001/panel_001_variant_002.png
public/generated/episode_001/panel_001/panel_001_variant_003.png
public/generated/episode_001/panel_001/panel_001_variant_004.png
```

## Review route

```text
#/ricco-image-review
```

After generation:

```text
import variants
select one final
rating >= 4 if usable
continuity >= 4 if usable
write one short note
```

## Lettering text later

Do not include this in the generated image.

```text
Ricco: Bruder, endlich was Eigenes.
```

## Done for this panel when

```text
2-4 variants exist
one final is selected in Image Review
final note is written
Panel 1 board status changes to FINAL
```
