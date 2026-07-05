# Ricco Lettering Editor v0.3

Last updated: 2026-07-05

## What changed

`#/ricco-lettering` is no longer only a static preview. It now has a first real bubble-layout editor.

## New domain module

```text
src/domain/lettering/riccoLetteringLayout.ts
```

It owns:

- localStorage key for lettering layout
- bubble presets
- panel lettering layout type
- default layout generation from panel dialogue
- invalid layout normalization
- coordinate/width/font clamping
- panel layout updates
- panel layout reset
- script generation from edited layout text

## Updated page

```text
src/pages/RiccoLettering.tsx
```

Now supports:

- selecting a panel
- editing bubble text
- choosing a bubble preset
- editing X/Y position
- editing bubble width
- editing font size
- resetting one panel
- resetting all panels
- saving layout state in browser localStorage
- printing bubble overlay preview

## Updated CSS

```text
src/ricco-lettering.css
```

Adds:

- absolute bubble overlays
- speech-bubble styling
- caption styling
- print rules that hide the side copy and keep the overlay

## New tests

```text
tests/domain/lettering.spec.ts
```

Covers:

- default panel layout from dialogue
- invalid value normalization
- coordinate/width/font clamping
- full layout state normalization
- preset update behavior
- single-panel reset
- script generation from edited layout text

## Important limitation

This is not yet drag-and-drop. It is a controlled numeric bubble editor. That is intentional: it is testable, serializable and safe before adding a canvas dependency like React Konva or Fabric.js.
