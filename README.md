# Comic Factory / AI Comic Studio

A focused MVP for producing a short vertical cartoon episode from script to shots, prompts, review and export.

This repo is intentionally **not** an AI influencer dashboard. No fan CRM, no DM automation, no posting queue, no revenue tracker, no warmup logic. It is a clean Comic Factory foundation.

## Goal

Build a workflow for the Dompe pilot:

```text
Script → Character Bible → Style Bible → Episode → Storyboard → Prompt Generator → Review → Export
```

The MVP runs fully on mock data. No API keys. No ComfyUI dependency. No Baserow dependency.

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

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Production overview |
| `/characters` | Character Bible |
| `/style-bible` | Visual rules |
| `/episodes` | Episode planning |
| `/storyboard` | Scenes and shots |
| `/generator` | Prompt cards |
| `/review` | Human-in-the-loop continuity review |
| `/export` | Output formats |

## Current MVP content

Pilot episode: **Die Maske des Erfolgs**

Dompe gets a pathetic backstage chance with superstar DJ VØID while his two cartel cats, Tariq and Hassan, use the situation to take over club territory.

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

1. Add local persistence for edited prompts and approval states.
2. Add a backend/orchestrator endpoint for `generate/shots`.
3. Connect ComfyUI API for batch image generation.
4. Add a review dashboard with real image previews.
5. Add TTS and subtitles.
6. Add FFmpeg assembly for final 9:16 MP4 export.

## Hard limits

Keep it focused. Do not add social posting, 20 accounts, DM funnels, Baserow, Qdrant or n8n until the local Comic Factory workflow is clean.
