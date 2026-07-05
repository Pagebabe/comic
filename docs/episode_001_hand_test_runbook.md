# Episode 001 Hand-Test Runbook

Last updated: 2026-07-05

## Hard rule

No new tooling feature until Episode 1 exists as a complete rough comic/video test.

Allowed before the hand-test is complete:

```text
bug fixes
broken build fixes
small storage safety fixes
```

Not allowed before the hand-test is complete:

```text
new workflow pages
new automation stack
new backend system
new LoRA training automation
new export architecture
new ComfyUI API automation
```

## Goal

Produce one complete rough version of:

```text
Ricco im Haus
Episode 1: Das Zimmer
8 panels
```

The output does not need to be perfect.

It must be complete.

## Definition of complete

A complete hand-test has:

```text
8 final panel images
lettering/dialogue visible
simple episode sequence
one exported shareable file or screen-recorded video
one saved production package
one short notes file about what broke
```

## Recommended route order

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

Do not start from dataset or LoRA pages for this run.

The hand-test is about finishing the episode, not training assets.

---

# Step-by-step production plan

## 1. Lock episode scope

Use only the current Episode 1 panels.

No new characters.
No new subplots.
No rewriting the whole episode.

Episode:

```text
Das Zimmer
```

Panels:

```text
1. Ankunft
2. Basti erscheint
3. Solidarische Nutzungsgebühr
4. Das Zimmer
5. Mama ruft an
6. Hausregeln
7. Die Küche
8. Mietrealität
```

## 2. Generate rough images

Target:

```text
minimum 2 variants per panel
better 4 variants per panel
```

Use the current prompt queue.

Do not chase perfection.

For each panel choose the version that best matches:

```text
readable scene
correct characters
clear composition
gritty adult cartoon mood
no speech bubbles
no random text
```

## 3. Import or upload outputs

Preferred for local fire-test:

```text
public/generated/panel_001/variant_001.png
public/generated/panel_001/variant_002.png
...
```

Alternative:

```text
use Ricco Image Review local upload
```

Storage rule:

```text
After local uploads, open #/ricco-storage and run split / IndexedDB migration check.
```

## 4. Review images

Route:

```text
#/ricco-image-review
```

For each panel:

```text
select exactly one final image
rating 4 or 5 if usable
continuity 4 or 5 if usable
write one short note
```

If a panel is ugly but understandable, keep it.

Only regenerate if:

```text
wrong character
unreadable scene
missing main action
broken face beyond use
wrong location entirely
```

## 5. QA pass

Route:

```text
#/ricco-qa
```

Accept warnings.

Only block for:

```text
missing final panel
image does not show the story action
scene order impossible to understand
```

## 6. Lettering pass

Route:

```text
#/ricco-lettering
```

Goal:

```text
speech/dialogue readable
rough bubble placement
not final graphic design
```

Do not polish every bubble for hours.

This test proves episode flow.

## 7. Export rough episode

MVP export options:

```text
browser print to PDF
screen recording of lettering page
manual screenshots panel by panel
simple video edit from exported screenshots
```

Best quick video option:

```text
1. screenshot each lettered panel
2. put panels into CapCut / DaVinci / iMovie
3. 4 to 6 seconds per panel
4. add slight zoom/pan if desired
5. export 1080p mp4
```

No voiceover required for first test.

Optional:

```text
text-to-speech for dialogue
simple room tone / Berlin street ambience
one short intro title card
```

## 8. Save package

Route:

```text
#/ricco-package
```

Save:

```text
production package JSON
rough exported PDF or video path
notes about problems
```

## 9. Write production notes

Create a short note with:

```text
which panels worked
which panels failed
which characters were unstable
which locations were unstable
which prompts were weak
which UI steps were annoying
which automation would actually save time
```

This note decides the next build work.

---

# Panel-to-video workflow

## Target length

```text
35 to 60 seconds
```

## Timing

```text
Panel 1: 5 sec
Panel 2: 6 sec
Panel 3: 6 sec
Panel 4: 6 sec
Panel 5: 6 sec
Panel 6: 5 sec
Panel 7: 7 sec
Panel 8: 8 sec
```

Total:

```text
49 seconds
```

## Suggested edit structure

```text
0:00 Title card: Ricco im Haus — Das Zimmer
0:03 Panel 1
0:08 Panel 2
0:14 Panel 3
0:20 Panel 4
0:26 Panel 5
0:32 Panel 6
0:37 Panel 7
0:44 Panel 8
0:52 End card / black
```

## Music / sound

Keep it simple:

```text
quiet gritty beat
low room tone
subtle city noise
no overproduction
```

## Dialogue options

Option A:

```text
speech bubbles only
```

Option B:

```text
basic AI voiceover
```

Option C:

```text
rough own voice temp track
```

Best for first test:

```text
speech bubbles only
```

Because the first test is about story clarity and image consistency.

---

# What to measure

After the rough episode exists, judge:

```text
Does the story read without explanation?
Does Ricco feel like the same person across panels?
Does Basti read as the same person?
Does Jule read as the same person?
Does Don Miau work visually?
Do locations feel like the same house?
Does the gritty adult cartoon style hold?
Are the jokes understandable?
Is the pacing too slow or too fast?
Which step was most painful?
```

## Success criteria

The hand-test is successful if:

```text
A viewer understands the basic situation.
At least 5 of 8 panels are usable.
The episode can be watched/read from start to finish.
The workflow exposes the next real bottleneck.
```

It does not need to be visually perfect.

## Failure criteria

The hand-test fails if:

```text
no complete episode is exported
more tooling is built instead of finishing panels
panel generation never gets past endless tweaking
```

---

# Post-hand-test decisions

Only after the episode exists, decide what to build next.

Possible next builds:

```text
proper export page
better lettering editor
ComfyUI graph mapping
reference image integration
prompt fixes
character LoRA dataset expansion
legacy route cleanup
README screenshots
merge to main / release tag
```

But not before the episode exists.
