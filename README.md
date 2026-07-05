# Ricco im Haus / Comic Factory

A focused MVP for producing a recurring adult cartoon series from a stable story bible, character bible, location bible, panel board, prompt builder, human image review and export readiness gate.

This repo is intentionally **not** an AI influencer dashboard. No fan CRM, no DM automation, no posting queue, no revenue tracker, no warmup logic. It is a clean Comic Factory foundation.

## Current focus

The main workbench is:

```text
#/ricco-studio
```

The image review room is:

```text
#/ricco-image-review
```

The export readiness gate is:

```text
#/ricco-export
```

Current production loop for **Ricco im Haus**:

```text
Series Bible → Characters → Locations → Episode 1 → 8 Panels → Prompt Builder → External Image Generation → Ricco Image Review → Final Image Selection → Ricco Export Gate → Lettering/Export later
```

## Pilot episode

```text
Episode 1: Das Zimmer
```

Logline:

```text
Ricco zieht in sein neues günstiges Zimmer ein und merkt, dass er nicht in eine solidarische Wohnform geraten ist, sondern in eine sehr teure Absurdität mit politischem Anstrich.
```

Core conflict:

```text
Ricco glaubt, ein günstiges Zimmer gefunden zu haben. Basti verkauft ihm die überteuerte illegale Miete als solidarisches Nutzungsverhältnis.
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

Dialogue belongs to the later overlay layer:

```text
Dialogue Overlay → Speech bubbles / subtitles / voice / edit layer
```

## Stack

- Vite
- React
- TypeScript
- lucide-react
- local typed seed data
- localStorage for Ricco image review state
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

Default route:

```text
#/ricco-studio
```

## Fire test checklist

```text
1. npm install
2. npm run dev
3. Open http://localhost:3100/#/ricco-studio
4. Press "Alle Prompts erzeugen"
5. Open each panel and copy Positive / Negative Prompt
6. Generate images externally
7. Open http://localhost:3100/#/ricco-image-review
8. Add image URLs per panel
9. Rate image quality and continuity
10. Select exactly one final image per panel
11. Open http://localhost:3100/#/ricco-export
12. Check if all 8 panels are export-ready
```

## Current pages

| Route | Purpose |
| --- | --- |
| `#/ricco-studio` | Main Ricco Studio v0.1 prompt workbench |
| `#/ricco-image-review` | Store generated image URLs, rate variants and select final panel images |
| `#/ricco-export` | Check final image readiness and panel order before lettering/export |
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
src/pages/RiccoStudio.tsx
src/pages/RiccoImageReview.tsx
src/pages/RiccoExport.tsx
```

## Project rule

The realistic production target is:

```text
1 story → 8 stable panels → generated variants → human approval → lettering/export
```

## Hard limits

Keep it focused. Do not add social posting, 20 accounts, DM funnels, Baserow, Qdrant, n8n or a full automation stack until the local Comic Factory workflow is clean.
