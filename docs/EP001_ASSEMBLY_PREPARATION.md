# EP001 Assembly Preparation

## Zweck

Dieser Baustein erzeugt einen reproduzierbaren Assembly- und Handoff-Plan für `Das Zimmer`. Er verbindet später acht Panelbilder, sieben Audiostems und zehn Untertitelcues, führt aber selbst keinen Media-Render aus.

## Formatvertrag

```text
WIDTH=1080
HEIGHT=1920
ASPECT_RATIO=9:16
FPS=30
DURATION_SECONDS=45.5
VIDEO_CODEC_TARGET=H.264 High Profile
PIXEL_FORMAT_TARGET=yuv420p
AUDIO_CODEC_TARGET=AAC-LC
AUDIO_SAMPLE_RATE_HZ=48000
AUDIO_CHANNELS=2
LOUDNESS_TARGET=-16 LUFS ±1
TRUE_PEAK_MAXIMUM=-1 dBTP
```

## Media-Slots

Visuell:

```text
panel_001 ... panel_008
BOUND=0/8
```

Audio:

```text
DX_RICCO
DX_BASTI
DX_JULE
ROOMTONE
SFX
MUSIC_TEMP
MASTER
BOUND=0/7
```

Jeder Slot benötigt später:

- echten Pfad;
- SHA-256;
- Human-Review-Entscheidung;
- bei Audio einen Rechtebeleg;
- technische Metadaten;
- Statusänderung durch einen getrennten, autorisierten Auftrag.

## Preparation-Export

```bash
node scripts/export_ep001_assembly_package.mjs --output-dir output/ep001-assembly
```

Der Export erzeugt ausschließlich:

```text
ep001-assembly-manifest.json
ep001-subtitles.srt
ep001-render-plan.json
ep001-handoff-checklist.md
```

Der Renderplan enthält keine Shellkommandozeile und steht verbindlich auf:

```text
executable=false
mediaRenderAllowed=false
finalExportAllowed=false
publishingAllowed=false
```

## Spätere Deliverables

```text
ep001-master-clean.mp4
ep001-social-burnin.mp4
ep001-subtitles.srt
ep001-assembly-manifest.json
SHA256SUMS.txt
```

Clean Master und Social-Delivery sind getrennt. Untertitel werden nicht in Quellbilder generiert, sondern erst deterministisch in der Delivery-Fassung eingebrannt.

## Final-QA

Vor einem fertigen Episodenstatus sind zwingend:

1. 8/8 Panelbilder mit Hash und Visual Review;
2. 3/3 Voice-Master mit Rechtebeleg;
3. 7/7 Audiostems mit Hash und Audio Review;
4. zehn geprüfte Untertitelcues;
5. visuelle Kontinuitätsprüfung;
6. Audio-, SFX-, Musik- und Dialogprüfung;
7. 1080x1920, 30 fps und 45,5 Sekunden;
8. 48 kHz Stereo, -16 LUFS ±1 und maximal -1 dBTP;
9. Clean-Master-, Social-Delivery-, SRT- und Manifest-Hashes;
10. explizite menschliche Finalentscheidung.

## Harte Sperren

```text
MEDIA_RENDER_ALLOWED=false
FFMPEG_EXECUTION_ALLOWED=false
FINAL_EXPORT_ALLOWED=false
PUBLISHING_ALLOWED=false
VISUAL_SLOTS_BOUND=0/8
AUDIO_SLOTS_BOUND=0/7
VOICE_MASTERS=0/3
VIDEO_FILES_GENERATED=0
FINISHED_EPISODES=0
AUTOMATIC_FINAL_APPROVALS=0
```
