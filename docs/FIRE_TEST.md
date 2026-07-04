# Fire Test Checklist

Use this checklist after pulling the latest version of the Comic Video Machine.

## Start

```bash
git pull
npm install
npm run dev
```

Open:

```text
http://localhost:3100
```

## Core UI check

Check these routes in order:

```text
/#/
/#/story-bible
/#/characters
/#/locations
/#/style-bible
/#/episodes
/#/storyboard
/#/panel-factory
/#/generator
/#/renderers
/#/voice-subtitles
/#/review
/#/jobs
/#/assembly
/#/export
```

## Must be visible

```text
Rico gegen Berlin branding
Comic Video Machine sidebar
Clean frame rule
No speech bubbles rule
Character production prompts
Location production prompts
Club Nein
DJ Nebel
Sven Null
Season roadmap with 4 episodes
Panel Factory prompt cards
Renderer options
Voice/Subtitles page
Jobs roadmap
Assembly plan
Export readiness checklist
```

## Review state reset

If the Review page shows weird old data, click:

```text
Review → Reset Local State
```

or clear browser localStorage for localhost:3100.

## Build check

GitHub Actions should run:

```text
npm install
npm run build
```

A green build means the TypeScript/Vite app compiles.

## Red flags

```text
blank page
sidebar missing
route opens dashboard instead of page
TypeScript error
JSON parse error
Review page crashes
Icon import error
```

## Current expected limitation

Buttons are still mock actions. This is normal.

The MVP is currently a production dashboard with mock data, not a connected image/video backend yet.

## Next backend step

Start with only one real backend route:

```text
POST /api/jobs/panel-variants
```

That route should take one Panel Factory prompt and return generated image variants from the selected renderer.
