# UI Phase 3 Image Review

Last updated: 2026-07-06

## Goal

Make image review easier for beginners.

## Page

```text
#/ricco-image-review
```

## Changed file

```text
src/pages/RiccoImageReview.tsx
```

## Beginner purpose

```text
Upload image variants.
Rate them roughly.
Check continuity.
Choose one final image per panel.
Continue to Add Text.
```

## Main flow

```text
Upload -> Rate -> Check continuity -> Choose final -> Add Text
```

## What changed

```text
current panel status
next step text
panel checklist
decision rule
rating helper text
continuity helper text
info help on variant cards
empty state with next action
final image CTA to Add Text
```

## Decision rule

```text
Choose the image that tells the scene clearly.
Do not chase perfect beauty.
Good enough is enough for the rough episode.
```

## Rule

The user should not need to understand storage, IndexedDB or payload splitting on this page.

Technical storage still works in the background.

## Next phase

Simplify Add Text.
