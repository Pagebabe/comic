# Rico gegen Berlin / Comic Video Machine

A focused MVP for producing small vertical cartoon comics as videos: clean frames, voice/TTS, subtitles, review and export.

This repo is intentionally **not** an AI influencer dashboard. No fan CRM, no DM automation, no posting queue, no revenue tracker, no warmup logic. It is a clean Comic Factory foundation for a recurring adult cartoon series.

## Goal

Build a workflow for the **Rico gegen Berlin** pilot:

```text
Story Bible → Character Bible → Location Bible → Episode → Panels → Prompt Generator → Review → Export
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
4. Check sidebar shows Rico gegen Berlin / Comic Video Machine
5. Open Story Bible
6. Open Characters and confirm production sheet count
7. Open Locations and confirm Club Nein exists
8. Open Storyboard and confirm it talks about small comic videos
9. Open Generator and confirm clean frame rule
10. Open Review and approve/reject panels
11. Open Export and confirm Final Comic Video target
```

If local review states look wrong after pulling new mock data, clear browser localStorage for this app or press **Reset Local State** on the Review page.

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Production overview |
| `/story-bible` | Series premise, world rules and no-speech-bubble rule |
| `/characters` | Character Bible and production sheets |
| `/locations` | Location Bible / recurring sets |
| `/style-bible` | Visual rules |
| `/episodes` | Episode planning |
| `/storyboard` | Small comic video panels |
| `/generator` | Clean frame prompt cards |
| `/review` | Human-in-the-loop continuity review |
| `/export` | Video, voice, subtitle and production exports |

## Current MVP content

Pilot episode: **Zimmer frei**

Rico Bassmann, a sheltered boy from the countryside, moves straight from his mother's house to Berlin. He is immediately scammed by Falk Reuter, an ex-hardcore leftist who now lives comfortably in Prenzlauer Berg and illegally overcharges Rico for a room in the chaotic **Haus Nebenwirkung**.

The visual target is **Free-for-All Berlin Absurd Cartoon**: exaggerated adult comedy, dirty bright colors, thick outlines, Berlin housing chaos, Späti culture, Graffiti, Falk's leftist-capitalist double morality and the Görli-Clan cats who talk like tiny Kiez gangsters.

## Core cast

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

## Core locations

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

The correct automation target is not:

```text
1 script → perfect finished reel
```

The realistic production target is:

```text
1 script → many generated variants → human approval → automated assembly
```

That is the whole point of this MVP.

## Next build steps

1. Add local persistence for edited prompts, not just review states.
2. Add character sheet generator actions.
3. Add location sheet generator actions.
4. Add a backend/orchestrator endpoint for `generate/panels`.
5. Connect ComfyUI API for batch image generation.
6. Add real image previews in Review.
7. Add TTS and subtitle timing.
8. Add FFmpeg assembly for final 9:16 MP4 export.

## Hard limits

Keep it focused. Do not add social posting, 20 accounts, DM funnels, Baserow, Qdrant or n8n until the local Comic Video Machine workflow is clean.
