# M1R Visual Review · 2026-07-10

## Source

Uploaded bundle: `comic-visual-review-bundle.zip`

- 20 PNG files
- all sourced from generic `ComfyUI_*.png` files in Telegram/Downloads
- selected by the first metadata inspector because broad world/location terms matched

## Human visual review result

**Accepted Comic Factory assets: 0**

Classification for all 20 files:

```text
REJECTED_UNRELATED
```

Observed content:

- photorealistic social-media/influencer imagery
- one recurring young female persona
- bedrooms, parks, kitchens and lifestyle settings unrelated to `Ricco im Haus`
- several images contain nudity or sexualized content and are incompatible with the SFW Comic Factory line
- no cartoon characters
- no Ricco, Basti Prenzl, Jule or Don Miau
- no House No. 13, Ricco room, hallway/stairwell or shared-kitchen design
- no character sheet, turnaround, expression sheet, storyboard or usable series location reference

## Why the earlier filter failed

The first PNG inspector treated broad terms such as `bedroom`, `kitchen` and other world words as evidence. It also searched all embedded workflow text, including negative prompts. A negative prompt containing words such as `cartoon` or `illustration` must not count as positive Comic Factory evidence.

## Canon decision

- no file from this bundle may become a character or location master reference
- no file may be copied into series assets
- no visual canon field changes
- the four existing SVG files remain technical placeholders only
- M1R remains open with `0/4` visual character masters and `0/4` visual set masters

## Required recovery rule from now on

A PNG is eligible for visual review only when its **positive generation prompt** contains:

1. a project-specific or character-specific identity term, and
2. a comic/illustration/storyboard style term,

while excluding photorealistic, influencer, selfie and NSFW generation prompts.

Generic fallback bundles are disabled. Zero candidates is a valid and preferred result over unrelated material.

## Project isolation

The review changed no source asset and did not inspect or modify Chris Fact Radar.
