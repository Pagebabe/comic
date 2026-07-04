# Comic Video Machine Orchestrator

This document defines the future backend/worker layer for the Rico gegen Berlin Comic Video Machine.

The frontend currently runs on mock JSON data. The orchestrator should later replace button-only actions with real jobs.

## Core principle

The system does not try to create one perfect video in one step.

```text
reference sheets → panel variants → human approval → voice/subtitles → assembly → export
```

Human approval is the quality gate.

## Job types

| Job | Input | Output |
| --- | --- | --- |
| `generate_character_refs` | `characterProductionSheets.json` | character reference images |
| `generate_location_refs` | `locationProductionSheets.json` | reusable set images |
| `generate_panel_variants` | `shots.json`, style, approved refs | 4-20 image variants per panel |
| `prepare_voice_script` | dialogue lines from shots | character separated voice script |
| `generate_voice_tracks` | voice script and voice direction | audio files per line or panel |
| `prepare_subtitles` | dialogue, timing, panel durations | SRT/VTT subtitle file |
| `review_lock` | approved variants | canonical panel list |
| `assemble_video` | approved panels, audio, subtitles | 1080x1920 MP4 |
| `export_pack` | canonical episode assets | panel pack, voice script, subtitles, production notes |

## Suggested API routes

```text
POST /api/jobs/character-refs
POST /api/jobs/location-refs
POST /api/jobs/panel-variants
POST /api/jobs/voice-script
POST /api/jobs/subtitles
POST /api/jobs/assemble
GET  /api/jobs/:id
GET  /api/episodes/:id/export-pack
```

## ComfyUI worker contract

Panel generation worker receives:

```json
{
  "episode_id": "ep001",
  "panel_id": "ep001_shot003",
  "positive_prompt": "...",
  "negative_prompt": "...",
  "width": 1080,
  "height": 1920,
  "variants": 8,
  "seed": 2003
}
```

Worker returns:

```json
{
  "panel_id": "ep001_shot003",
  "variants": [
    {
      "variant_id": "ep001_shot003_v01",
      "image_url": "/outputs/ep001/ep001_shot003_v01.png",
      "status": "generated",
      "auto_score": 0
    }
  ]
}
```

## Review gate

A panel is ready only when:

```text
character consistency accepted
location consistency accepted
style match accepted
no image text artifacts
subtitle safe area is usable
one visual joke is readable
```

## FFmpeg assembly plan

For MVP assembly:

```text
1. take approved 1080x1920 image per panel
2. apply small zoom/pan per panel duration
3. place voice audio on timeline
4. place subtitles in bottom safe area
5. add room tone and simple sound cues
6. export MP4 H.264, 1080x1920, 30 fps
```

Example future command pattern:

```bash
ffmpeg -y -i panel_%03d.png -i voice.wav -vf "scale=1080:1920" -r 30 output.mp4
```

The exact production command will depend on generated assets, timings and subtitle format.

## Storage structure

```text
outputs/
  ep001/
    panels/
    approved/
    voice/
    subtitles/
    exports/
```

## Do not add yet

```text
social posting
multi-account scheduling
DM automation
revenue dashboards
fan CRM
```

Keep the machine focused on repeatable comic video production first.
