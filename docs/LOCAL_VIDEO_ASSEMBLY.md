# Local Pilot Video Assembly

No CapCut. No manual editing timeline.

This project can assemble the pilot episode locally with FFmpeg.

## Required files

Put the four approved pilot panel images here:

```text
outputs/pilot/approved/panel_01.png
outputs/pilot/approved/panel_02.png
outputs/pilot/approved/panel_03.png
outputs/pilot/approved/panel_04.png
```

## Run

```bash
npm run assemble:pilot
```

## Output

The script creates:

```text
outputs/pilot/pilot.srt
outputs/pilot/exports/pilot_episode.mp4
```

## Timing

```text
Panel 1: 5 seconds
Panel 2: 6 seconds
Panel 3: 5 seconds
Panel 4: 6 seconds
Total: 22 seconds
```

## Subtitles

The script automatically writes the first pilot subtitle file:

```text
Falk: Kurzer Hausmoment.
Rico: Ist was kaputt?
Falk: Nur das System.
Falk: Das ist keine Miete.
Falk: Das ist eine Entkommerzialisierungsgebühr.
Rico: Aber ich bezahle sie mit Geld?
Rico: Und wofür ist die genau?
Kralle: Der nimmt sogar Mäusen Miete.
Rico: Ist das normal?
Sami: Willkommen in Berlin.
```

## Requirement

FFmpeg must be installed locally.

macOS with Homebrew:

```bash
brew install ffmpeg
```

Ubuntu/Debian:

```bash
sudo apt update
sudo apt install ffmpeg
```

## Current limitation

This script creates a clean still-panel motion prototype with burned subtitles.

Next upgrades:

```text
small zoom per panel
voice tracks
sound effects
music bed
subtitle style control
per-panel JSON timing
```
