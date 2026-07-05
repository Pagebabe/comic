# Ricco im Haus / Comic Factory

A focused MVP for producing a recurring adult cartoon series from a stable story bible, character bible, location bible, panel board, prompt builder, prompt queue, human image review, review gate, export readiness gate, first lettering preview, production package backup/restore and a central control room.

This repo is intentionally **not** an AI influencer dashboard. No fan CRM, no DM automation, no posting queue, no revenue tracker, no warmup logic. It is a clean Comic Factory foundation.

## Current focus

Default route:

```text
#/ricco-control
```

Main routes:

```text
#/ricco-control
#/ricco-studio
#/ricco-prompt-queue
#/ricco-image-review
#/ricco-qa
#/ricco-export
#/ricco-lettering
#/ricco-package
#/ricco-restore
```

Current production loop for **Ricco im Haus**:

```text
Ricco Control → Ricco Studio → Prompt Queue → External Image Generation → Ricco Image Review → Ricco Gate → Ricco Export Gate → Ricco Lettering Preview → Production Package JSON → Restore Package later
```

## Pilot episode

```text
Episode 1: Das Zimmer
```

Logline:

```text
Ricco zieht in sein neues günstiges Zimmer ein und merkt, dass er nicht in eine solidarische Wohnform geraten ist, sondern in eine sehr teure Absurdität mit politischem Anstrich.
```

## Core cast

```text
Ricco — chaotischer Musiker und Hauptfigur
Basti Prenzl — illegaler Vermieter, Ex-Hausbesetzer, Szene-Heuchler
Jule — Hausaktivistin und Plenum-Machtzentrum
Don Miau — Boss der Katzen-Gang
```

## Core locations

```text
Hausfassade
Riccos Zimmer
Flur / Treppenhaus
Gemeinschaftsküche
```

## Hard production rule

Generated images are **clean comic frames**.

```text
No speech bubbles.
No readable dialogue inside the image.
No fake lettering.
No random text artifacts.
```

Dialogue belongs to the overlay layer:

```text
Dialogue Overlay → Ricco Lettering Preview → speech bubbles / subtitles / voice / edit layer later
```

## Stack

- Vite
- React
- TypeScript
- lucide-react
- local typed seed data
- prompt queue export as JSON / TXT / CSV
- localStorage for Ricco image review state
- browser print for early PDF output
- JSON package export for backups / handoff
- JSON package restore for browser-state recovery
- review gate for continuity and final-image checks
- central control room for next-step navigation
- Port `3100`

## Run locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3100
```

## Fire test checklist

```text
1. npm install
2. npm run dev
3. Open http://localhost:3100/#/ricco-control
4. Open Ricco Studio and inspect the panel prompts
5. Open Ricco Prompt Queue
6. Copy or download prompts as JSON, TXT or CSV
7. Generate images externally
8. Open Ricco Image Review
9. Add image URLs per panel
10. Rate image quality and continuity
11. Select exactly one final image per panel
12. Open Ricco Gate
13. Fix blockers and warnings
14. Open Ricco Export
15. Check if all 8 panels are export-ready
16. Open Ricco Lettering
17. Copy dialogue script or use Browser Print / PDF
18. Open Ricco Package
19. Copy or download full production package JSON
20. Open Ricco Restore
21. Paste package JSON and restore browser review state
```

## Current pages

| Route | Purpose |
| --- | --- |
| `#/ricco-control` | Central production overview and next-step navigator |
| `#/ricco-studio` | Main Ricco Studio v0.1 prompt workbench |
| `#/ricco-prompt-queue` | Batch prompt export for external image generation |
| `#/ricco-image-review` | Store generated image URLs, rate variants and select final panel images |
| `#/ricco-qa` | Gate for missing finals, low ratings, low continuity and missing notes |
| `#/ricco-export` | Check final image readiness and panel order before lettering/export |
| `#/ricco-lettering` | First comic page preview with final images and dialogue overlays |
| `#/ricco-package` | Copy/download full production package JSON |
| `#/ricco-restore` | Restore image review state from a saved production package JSON |
| `#/dashboard` | Existing production dashboard |
| `#/story-bible` | Existing story bible view |
| `#/style-bible` | Existing visual rules view |
| `#/characters` | Existing character bible view |
| `#/locations` | Existing location bible view |
| `#/episodes` | Existing episode planning view |
| `#/panel-factory` | Existing panel prompt board |
| `#/review` | Existing human review room |
| `#/asset-gallery` | Existing asset preview gallery |

## Files added for Ricco Studio

```text
src/data/riccoStudio.ts
src/pages/RiccoControlRoom.tsx
src/pages/RiccoStudio.tsx
src/pages/RiccoPromptQueue.tsx
src/pages/RiccoImageReview.tsx
src/pages/RiccoQA.tsx
src/pages/RiccoExport.tsx
src/pages/RiccoLettering.tsx
src/pages/RiccoPackage.tsx
src/pages/RiccoImport.tsx
src/pages/RiccoRestore.tsx
src/ricco-lettering.css
```

## Project rule

The realistic production target is:

```text
1 story → 8 stable panels → generated variants → human approval → lettering/export
```

## Hard limits

Keep it focused. Do not add social posting, 20 accounts, DM funnels, Baserow, Qdrant, n8n or a full automation stack until the local Comic Factory workflow is clean.
