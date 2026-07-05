# Reference Pack Plan — Ricco Comic Factory

Last updated: 2026-07-05

## Purpose

The Comic Factory cannot become a real series until the visual identity is stable. Prompt text alone is not enough for repeatable characters, locations and style.

This document defines the next production layer before LoRA or full automation.

## Rule

```text
Reference packs before LoRA.
Manual quality before API automation.
One approved visual identity before batch rendering.
```

## Current source of truth

Character, location, episode and panel seed data currently live in:

```text
src/data/riccoStudio.ts
```

The first production target is:

```text
Episode 1: Das Zimmer
8 stable panels
4 core characters
4 core locations
```

## Character reference packs v1

### Output folder target

```text
public/references/characters/ricco/
public/references/characters/basti-prenzl/
public/references/characters/jule/
public/references/characters/don-miau/
```

### Required files per human character

Use consistent filenames:

```text
front_v1.png
side_v1.png
back_v1.png
expression_neutral_v1.png
expression_angry_v1.png
expression_confused_v1.png
expression_tired_v1.png
pose_neutral_v1.png
pose_stress_v1.png
outfit_lock_v1.png
negative_examples_v1.png
reference_contact_sheet_v1.png
```

### Required files for Don Miau

```text
front_sitting_v1.png
side_sitting_v1.png
walking_v1.png
face_neutral_v1.png
face_angry_v1.png
face_boss_v1.png
paw_on_object_v1.png
negative_examples_v1.png
reference_contact_sheet_v1.png
```

## Character pack: Ricco

### Must stay consistent

- late 20s to mid 30s
- slim / slightly lanky
- tired eyes
- light stubble
- messy dark hair
- worn hoodie or old tracksuit jacket
- loose jeans or dark joggers
- worn sneakers
- headphones around neck
- cheap backpack or music gear nearby
- confused but not stupid
- never rich-looking
- never polished

### Reference prompts to create

#### Ricco front

```text
Gritty adult satirical cartoon character reference sheet, full body front view of Ricco, chaotic young male musician, late 20s to mid 30s, slim slightly lanky body, tired eyes, light stubble, messy dark hair, worn hoodie or old tracksuit jacket, dark joggers or loose jeans, worn sneakers, headphones around his neck, cheap backpack, expressive confused face, bold black outlines, muted dirty Berlin color palette, plain neutral background, no text, no speech bubbles.
```

#### Ricco side

```text
Gritty adult satirical cartoon character reference sheet, full body side view of Ricco, same outfit and face as reference, slim slightly lanky musician, tired eyes, messy dark hair, light stubble, headphones around neck, cheap backpack, slightly overwhelmed posture, bold black outlines, muted dirty colors, plain neutral background, no text, no speech bubbles.
```

#### Ricco back

```text
Gritty adult satirical cartoon character reference sheet, full body back view of Ricco, same worn hoodie or old tracksuit jacket, dark joggers or loose jeans, worn sneakers, headphones visible around neck, cheap backpack straps, messy dark hair silhouette, bold black outlines, muted dirty colors, plain neutral background, no text, no speech bubbles.
```

### Negative prompt

```text
photorealistic, hyperrealistic, glossy 3D render, anime, manga, children cartoon, cute mascot, luxury fashion, influencer look, perfect skin, clean office outfit, superhero body, elegant businessman, rich lifestyle, watermark, signature, text, speech bubble, random letters
```

## Character pack: Basti Prenzl

### Must stay consistent

- mid 40s
- former left-wing squatter turned gentrified illegal landlord
- round glasses
- grey tied-back hair or receding hairline
- short neat beard
- expensive outdoor jacket
- clean sneakers
- tote bag with political slogan without readable text
- coffee-to-go cup or e-bike key detail
- soft moral smile
- cleaner than the house
- never aggressive gangster
- never CEO suit

### Reference prompts

#### Basti front

```text
Gritty adult satirical cartoon character reference sheet, full body front view of Basti Prenzl, middle-aged former left-wing squatter turned gentrified illegal landlord, mid 40s, round glasses, grey tied-back hair or receding hairline, short neat beard, expensive outdoor jacket, clean sneakers, tote bag with non-readable political graphic, coffee-to-go cup, soft moral smile, pseudo-empathic expression, bold black outlines, muted dirty urban palette, plain neutral background, no text, no speech bubbles.
```

#### Basti side

```text
Gritty adult satirical cartoon character reference sheet, full body side view of Basti Prenzl, same face and outfit, round glasses, grey tied-back hair, neat beard, expensive outdoor jacket, clean sneakers, tote bag, coffee cup, e-bike key detail, soft manipulative posture, bold black outlines, muted dirty colors, plain neutral background, no text, no speech bubbles.
```

#### Basti back

```text
Gritty adult satirical cartoon character reference sheet, full body back view of Basti Prenzl, same expensive outdoor jacket, clean sneakers, tote bag, grey tied-back hair silhouette, slightly hunched pseudo-friendly posture, bold black outlines, muted dirty colors, plain neutral background, no text, no speech bubbles.
```

### Negative prompt

```text
criminal gangster, CEO suit, aggressive villain, homeless punk, military clothes, luxury apartment render, photorealistic portrait, anime, superhero body, horror monster, readable text, speech bubble, watermark, signature
```

## Character pack: Jule

### Must stay consistent

- late 20s to early 30s
- sharp critical eyes
- messy bob haircut or short bangs
- nose ring
- oversized sweater
- worker pants
- heavy boots
- patches and buttons without readable text
- marker and tape nearby
- controlling activist body language
- never glamour model
- never anime girl

### Reference prompts

#### Jule front

```text
Gritty adult satirical cartoon character reference sheet, full body front view of Jule, young Berlin house activist, late 20s to early 30s, sharp critical eyes, messy bob haircut or short bangs, nose ring, oversized sweater, worker pants, heavy boots, patches and buttons without readable text, holding marker and tape, arms crossed, controlling activist body language, bold black outlines, muted dirty urban colors, plain neutral background, no text, no speech bubbles.
```

#### Jule side

```text
Gritty adult satirical cartoon character reference sheet, full body side view of Jule, same activist outfit and face, sharp critical eyes, messy bob or short bangs, nose ring, oversized sweater, worker pants, heavy boots, marker and tape, tense controlling posture, bold black outlines, muted dirty colors, plain neutral background, no text, no speech bubbles.
```

#### Jule back

```text
Gritty adult satirical cartoon character reference sheet, full body back view of Jule, same oversized sweater, worker pants, heavy boots, messy bob haircut silhouette, patches without readable text, marker or tape visible, bold black outlines, muted dirty colors, plain neutral background, no text, no speech bubbles.
```

### Negative prompt

```text
glamour influencer, elegant office woman, fantasy warrior, cute girl, anime schoolgirl, luxury fashion model, corporate portrait, photorealistic photo, clean modern apartment, readable text, speech bubble, watermark, signature
```

## Character pack: Don Miau

### Must stay consistent

- large old cat
- fat heavy body
- broad face
- half-closed yellow eyes
- small scar on one ear
- scruffy dark grey tabby fur
- sits like a mafia boss
- paw resting on important object
- intimidating but funny
- never cute kitten
- never magical fantasy cat
- never talking mouth

### Reference prompts

#### Don Miau sitting front

```text
Gritty adult satirical cartoon animal character reference sheet, front sitting view of Don Miau, large old gangster-like cat, fat heavy body, broad face, half-closed yellow eyes, small scar on one ear, scruffy dark grey tabby fur, sitting elevated like a mafia boss, calm dominant expression, one paw resting on an object, intimidating but funny, bold black outlines, muted dirty urban palette, plain neutral background, no text, no speech bubbles.
```

#### Don Miau side

```text
Gritty adult satirical cartoon animal character reference sheet, side sitting view of Don Miau, same large old fat cat, broad head, half-closed yellow eyes, scarred ear, scruffy dark grey tabby fur, heavy posture, boss-like stillness, bold black outlines, muted dirty colors, plain neutral background, no text, no speech bubbles.
```

#### Don Miau face boss expression

```text
Gritty adult satirical cartoon animal close-up reference, Don Miau face, broad old cat head, half-closed yellow eyes, small scar on one ear, scruffy dark grey tabby fur, calm mafia boss expression, intimidating but funny, bold black outlines, muted dirty colors, plain neutral background, no text, no speech bubbles.
```

### Negative prompt

```text
cute kitten, fantasy cat, magical glowing cat, realistic wildlife photo, anime cat, fluffy adorable pet, cartoon mascot, clean luxury pet portrait, horror monster, talking mouth, readable text, speech bubble, watermark, signature
```

## Location reference packs v1

### Output folder target

```text
public/references/locations/hausfassade/
public/references/locations/riccos-zimmer/
public/references/locations/flur-treppenhaus/
public/references/locations/gemeinschaftskueche/
```

### Required files per location

```text
wide_v1.png
detail_v1.png
prop_sheet_v1.png
lighting_v1.png
negative_examples_v1.png
reference_contact_sheet_v1.png
```

## Location pack: Hausfassade

### Must stay consistent

- old Berlin apartment building
- cracked facade
- graffiti
- political stickers without readable text
- torn posters without readable text
- broken bicycles
- dirty windows
- chaotic doorbells
- lived-in urban decay
- never luxury building

### Prompt

```text
Gritty adult satirical cartoon location reference, wide shot of a run-down occupied Berlin apartment building facade, old cracked walls, graffiti, political stickers without readable text, torn posters without readable text, broken bicycles chained to railing, dirty windows, chaotic doorbells, lived-in urban decay, bold black outlines, muted dirty urban colors, no readable text, no speech bubbles, no watermark.
```

## Location pack: Riccos Zimmer

### Must stay consistent

- tiny overpriced room
- pallet mattress
- moldy corner
- broken window
- cheap chair
- laptop
- tangled cables
- cheap microphone
- small speakers
- dirty walls
- cramped musician bedroom
- never luxury loft
- never clean studio

### Prompt

```text
Gritty adult satirical cartoon location reference, wide interior shot of Ricco's tiny overpriced room inside a run-down Berlin squat house, mattress on wooden pallets, moldy corner, broken window, exposed outlet, cheap chair, laptop, tangled cables, cheap microphone, small speakers, dirty walls, cramped musician bedroom, urban loneliness, bold black outlines, muted dirty colors, no readable text, no speech bubbles, no watermark.
```

## Location pack: Flur / Treppenhaus

### Must stay consistent

- dirty narrow hallway
- cracked walls
- many handwritten notes without readable text
- political stickers without readable text
- old flyers without readable text
- shoes on floor
- crooked doors
- bad yellow stairwell light
- cramped social tension
- never hotel corridor

### Prompt

```text
Gritty adult satirical cartoon location reference, wide shot of a dirty narrow hallway and stairwell inside a run-down Berlin squat house, cracked walls, many handwritten house rules without readable text, political stickers without readable text, old flyers without readable text, shoes on the floor, crooked doors, bad yellowish stairwell light, cramped social tension, bold black outlines, muted dirty colors, no speech bubbles, no watermark.
```

## Location pack: Gemeinschaftsküche

### Must stay consistent

- chaotic communal kitchen
- dirty pans
- empty oat milk cartons without readable text
- overflowing trash
- labeled fridge shelves without readable text
- awareness notes without readable text
- Mate bottles without readable text
- cats on counter and sink
- open cupboards
- never clean designer kitchen

### Prompt

```text
Gritty adult satirical cartoon location reference, wide shot of a chaotic communal kitchen inside a Berlin squat house, dirty pans, empty oat milk cartons without readable text, overflowing trash, labeled fridge shelves without readable text, awareness notes on fridge without readable text, Mate bottles without readable text, cats on counter and sink, open cupboards, social conflict atmosphere, bold black outlines, muted dirty urban colors, no speech bubbles, no watermark.
```

## Review checklist for every reference image

A reference image can only be approved if:

- it matches the written seed data
- it has no readable text artifacts
- it has no speech bubbles
- it has no watermark/signature
- it has clear silhouette
- it has stable outfit/shape/face/location identity
- it fits the gritty adult cartoon style
- it does not drift into AI influencer, anime, Pixar, glossy 3D or child cartoon style

## Approval states

Use these simple states in notes or future UI:

```text
raw
candidate
approved_reference
rejected
needs_redraw
```

## Immediate next action

Start with Ricco only.

Do not create all packs blindly. Produce Ricco `front_v1`, `side_v1`, `back_v1`, one expression sheet and one contact sheet first. Review those before generating Basti, Jule, Don Miau.

## Why this order

The pilot will fail if Ricco is not stable. Ricco appears in nearly every panel and is the visual anchor of the series.
