# Episode 001 Production Board — Das Zimmer

Last updated: 2026-07-05

## Rule for this board

This board is for finishing the rough episode, not for improving the app.

When in doubt, choose the ugly finished panel over another tool feature.

## Output target

```text
One complete rough version of Episode 001.
```

Accepted output formats:

```text
PDF sequence
image sequence
screen-recorded video
simple edited MP4
```

Recommended first output:

```text
8 lettered screenshots → simple 35–60 sec MP4
```

## Status legend

```text
TODO      not started
GEN       prompt/rendering in progress
REVIEW    variants imported, final not chosen
FINAL     final image selected
LETTERED  dialogue placed
DONE      included in rough export
```

---

# Episode board

## Panel 1 — Ankunft

Status:

```text
TODO
```

Need:

```text
Ricco outside house with bags, cheap mic stand, Don Miau in window.
```

Dialogue:

```text
Ricco: Bruder, endlich was Eigenes.
```

Acceptance:

```text
Ricco readable
house facade readable
Don Miau visible
no speech bubbles in generated image
```

## Panel 2 — Basti erscheint

Status:

```text
TODO
```

Need:

```text
Basti arrives with e-bike outfit, coffee-to-go and tote bag.
```

Dialogue:

```text
Basti: Ricco, schön, dass du da bist. Wichtig: Das hier ist kein Mietverhältnis.
Ricco: Noch besser. Dann muss ich ja keine Miete zahlen.
```

Acceptance:

```text
Basti reads as clean hypocritical ex-squatter
Ricco visible
facade still feels like same house
```

## Panel 3 — Solidarische Nutzungsgebühr

Status:

```text
TODO
```

Need:

```text
Basti shows paper in hallway. Ricco reacts to 780 warm.
```

Dialogue:

```text
Ricco: 780? Für ein Zimmer?
Basti: Nicht Zimmer. Raum.
Ricco: Was ist der Unterschied?
Basti: Zimmer klingt bürgerlich.
```

Acceptance:

```text
paper / payment conflict visible
hallway location readable
Ricco confused
Basti smug but soft
```

## Panel 4 — Das Zimmer

Status:

```text
TODO
```

Need:

```text
Tiny overpriced room with pallet mattress, mold, broken window, cables, cheap music setup. Don Miau on mattress.
```

Dialogue:

```text
Ricco: Das ist ja kleiner als auf den Fotos.
Basti: Die Fotos waren symbolisch.
Ricco: Symbolisch wofür?
Basti: Wohnraumknappheit.
```

Acceptance:

```text
room feels tiny
music setup visible
Don Miau visible
mold or decay visible
```

## Panel 5 — Mama ruft an

Status:

```text
TODO
```

Need:

```text
Ricco ignores mother call. Basti gives pseudo-empathy. Don Miau scratches bag.
```

Dialogue:

```text
Basti: Familie ist wichtig.
Ricco: Ja, deswegen geh ich später ran.
Basti: Später ist oft ein kapitalistisches Konzept.
Ricco: Was?
```

Acceptance:

```text
phone/call visible
awkward room scene readable
Don Miau action visible if possible
```

## Panel 6 — Hausregeln

Status:

```text
TODO
```

Need:

```text
Wall full of contradictory house rules and passive-aggressive notes.
```

Dialogue:

```text
Ricco: Muss ich mir das alles merken?
Basti: Nein. Du musst es fühlen.
Ricco: Ich fühl grad Schimmel.
```

Acceptance:

```text
rules wall visible
hallway readable
Ricco overwhelmed
```

## Panel 7 — Die Küche

Status:

```text
TODO
```

Need:

```text
Chaotic shared kitchen. Jule sticks awareness note. Don Miau on counter.
```

Dialogue:

```text
Jule: Du bist der Neue? Wichtig: Alles hier ist gemeinschaftlich.
Ricco: Auch mein Essen?
Jule: Kommt auf deinen Klassenhintergrund an.
```

Acceptance:

```text
Jule readable
kitchen chaos visible
Don Miau visible
shared-house absurdity clear
```

## Panel 8 — Mietrealität

Status:

```text
TODO
```

Need:

```text
Ricco alone at night with rent paper and missed mother calls. Don Miau puts paw on paper. Basti leaves on e-bike outside/through window if possible.
```

Dialogue:

```text
Ricco: Okay. Nur Übergang.
Aus der Wand: Mach mal leiser, ich produzier grad!
Mama-Sprachnachricht: Ricco, ich wollte nur wissen, ob du gut angekommen bist.
```

Acceptance:

```text
melancholic ending
rent paper visible
Don Miau dominates scene
Ricco looks trapped
```

---

# Daily execution checklist

## Before generation

```text
open #/ricco-control
confirm episode scope
open #/ricco-prompt-queue
copy prompts for panels 1-8
```

## During generation

```text
generate 2-4 variants per panel
save files with panel number
avoid endless tweaking
```

## During review

```text
open #/ricco-image-review
import variants
select one final per panel
rating >= 4 if usable
continuity >= 4 if usable
write one note per final
```

## During lettering

```text
open #/ricco-lettering
place dialogue roughly
check readability
avoid perfect design polish
```

## During export

```text
screenshot or print panel sequence
make simple PDF or MP4
save package JSON
write production notes
```

---

# Production notes template

Create after the export:

```text
Episode 001 Production Notes

What worked:
-
-
-

What failed:
-
-
-

Worst panel:
-

Best panel:
-

Character consistency:
Ricco:
Basti:
Jule:
Don Miau:

Location consistency:
House facade:
Hallway:
Room:
Kitchen:

Most painful workflow step:
-

Next tool improvement that would actually save time:
-
```

## Completion checkbox

```text
[ ] 8 final images selected
[ ] 8 panels lettered
[ ] rough output exported
[ ] package JSON saved
[ ] production notes written
[ ] Issue #2 updated with result
```
