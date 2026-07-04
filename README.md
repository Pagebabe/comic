# Rico gegen Berlin / Comic Video Machine

A focused MVP for producing small vertical cartoon comics as videos: clean frames, voice/TTS, subtitles, review and export.

This repo is intentionally **not** an AI influencer dashboard. No fan CRM, no DM automation, no posting queue, no revenue tracker, no warmup logic. It is a clean Comic Factory foundation for a recurring adult cartoon series.

## Goal

Build a workflow for the **Rico gegen Berlin** pilot:

```text
Story Bible → Character Bible → Location Bible → Episode → Storyboard → Panel Factory → Generator → Voice/Subtitles → Review → Assembly → Export
```

The MVP runs fully on mock data. No API keys. No ComfyUI dependency. No Baserow dependency.

## Hard production rule

Generated images are **clean comic frames**.

```text
No speech bubbles.
No readable dialogue inside the image.
No fake lettering.
```

Dialogue belongs to:

```text
Voice/TTS → subtitles → edit layer → final MP4
```

## Stack

- Vite
- React
- TypeScript
- lucide-react
- JSON mock data
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
3. Open http://localhost:3100
4. Check Story Bible, Characters, Locations, Episodes
5. Check Panel Factory, Generator, Voice/Subtitles
6. Check Review, Assembly, Export
7. Press Reset Local State on Review if old localStorage conflicts
```

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Production overview |
| `/story-bible` | Series premise and world rules |
| `/characters` | Character Bible and production sheets |
| `/locations` | Location Bible and set prompts |
| `/style-bible` | Visual rules |
| `/episodes` | Episode planning |
| `/storyboard` | Small comic video panels |
| `/panel-factory` | Panel prompt composition |
| `/generator` | Clean frame prompt cards |
| `/voice-subtitles` | Dialogue and subtitle source |
| `/review` | Human continuity review |
| `/assembly` | Runtime and video assembly plan |
| `/export` | Output formats and readiness checklist |

## Current MVP content

Pilot episode: **Zimmer frei**

Season roadmap:

```text
EP001 Zimmer frei
EP002 Heute nicht dein Vibe
EP003 Vier Tonnen
EP004 Kokstaxi
```

Core cast:

```text
Rico Bassmann
Falk Reuter
Sami
Madame Rita
Kira
Olli
DJ Krätze
DJ Nebel
Sven Null
Mutti
Kralle
Möpse
Flitz
```

Core locations:

```text
Ricos Kinderzimmer
Haus Nebenwirkung
Ricos Zimmer
Späti unten
Innenhof / Mülltonnen
Keller / altes DJ-Pult
Club Nein
Falks Prenzlauer-Berg-Wohnung
Görlitzer Park / Görli
```

## Project rule

The realistic production target is:

```text
1 script → many generated variants → human approval → automated assembly
```

## Hard limits

Keep it focused. Do not add social posting, 20 accounts, DM funnels, Baserow, Qdrant or n8n until the local Comic Video Machine workflow is clean.
