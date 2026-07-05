# Ricco Comic Factory — Project Command Center

Last updated: 2026-07-05

## Current mission

Produce the first complete rough episode of **Ricco im Haus** before adding more tooling.

The project is a local AI comic production studio, not a generic dashboard.

## Core product sentence

```text
One creator can produce repeatable comic episodes with stable characters, stable locations, reviewed image panels, lettering, export and recoverable production packages.
```

## Pilot target

```text
Series: Ricco im Haus
Episode: 001 — Das Zimmer
Format: 8-panel rough comic / short panel video
Status target: complete hand-test
```

## Current hard rule

No new tool-heavy feature until Episode 001 exists as a complete rough output.

Allowed before Episode 001 is complete:

```text
bug fixes
broken build fixes
small storage safety fixes
production documentation
actual episode production work
```

Not allowed before Episode 001 is complete:

```text
new workflow pages
new automation system
new backend rewrite
new LoRA automation
new ComfyUI API automation
new export architecture
more dashboard polish
```

## Current production priority

```text
1. Produce Episode 001 hand-test.
2. Save package.
3. Write production notes.
4. Only then decide the next technical build.
```

## What counts as done

Episode 001 hand-test is done only when this exists:

```text
8 final panel images
readable lettering/dialogue
simple episode sequence
one exported PDF, image sequence or screen-recorded video
one production package JSON
one short production notes file
```

## Current app routes that matter

Use this order for the hand-test:

```text
#/ricco-control
#/ricco-studio
#/ricco-prompt-queue
#/ricco-generation-queue
#/ricco-comfy-m1
#/ricco-image-review
#/ricco-qa
#/ricco-lettering
#/ricco-package
#/ricco-storage
```

Avoid during the hand-test unless needed:

```text
#/ricco-dataset-candidates
#/ricco-approved-dataset
#/ricco-lora-training-plan
```

Those are useful later, but they are not needed to finish the first public rough episode.

## Current technical state

Strong:

```text
workflow routes exist
control room exists
workspace map exists
asset workflow exists
fix queue exists
reference candidate flow exists
dataset candidate flow exists
approved dataset export exists
LoRA readiness plan exists
package / restore exists
storage adapter exists
IndexedDB blob path exists
Image Review uses preferred image reads
CI/build have been kept green
```

Still weak:

```text
no completed episode yet
no real public demo media yet
no final export pipeline yet
no full ComfyUI graph automation yet
legacy routes still exist
branch has many commits ahead of main
README needs screenshots
no release tag yet
```

## Current biggest risk

The repo can keep improving while the comic itself remains unfinished.

This is the main failure mode:

```text
perfect factory
zero finished episodes
```

Avoid that now.

## Next concrete work block

Open:

```text
docs/episode_001_production_board.md
```

Then execute panel production.

No more architecture work until the board is completed.
