# EP001 Audio Preparation

## Zweck

Dieses Paket bereitet Voice-Casting, Dialog-Timing, Audio-Stems und Audio-QA für den ausgewählten Pilot `Das Zimmer` vor. Es erzeugt keine Audiodateien und gibt keine Stimme frei.

## Verbindliche Wahrheit

```text
EPISODE=ep001
TITLE=Das Zimmer
TARGET_DURATION_SECONDS=45.5
PANELS=8
DIALOGUE_CUES=10
SPOKEN_SECONDS=22.95
SILENT_OR_REACTION_SECONDS=22.55
VOICE_MASTERS=0/3
```

Autorisierende Quellen:

- `project/ep001-animatic-blueprint.json`
- `project/merge-bibles/ricco.json`
- `project/merge-bibles/basti-prenzl.json`
- `project/merge-bibles/jule.json`
- `scripts/export_ep001_timing.mjs`

Alle fünf Quellen sind im Voice-Vertrag mit Git-Blob-SHA gepinnt.

## Sprecherverteilung

| Sprecher | Cues | Richtung |
|---|---:|---|
| Ricco | 4 | jung, freundlich, leicht nervös, bodenständig und warm |
| Basti Prenzl | 4 | ruhig, warm, gebildet, selbstzufrieden und niemals offen bedrohlich |
| Jule | 2 | klar, kontrolliert, intellektuell überlegen und nicht schrill |
| Don Miau | 0 | keine menschliche Stimme, kein innerer Monolog, kein verständlicher Sprachlaut |

Muttis Telefonpräsenz bleibt unverständlich und erzeugt keinen neuen sichtbaren oder hörbaren Nebencharakter-Master.

## Temporärer Readthrough

Ein neutraler Readthrough ist ausschließlich für Timing, Untertitel und Reaktionsräume vorbereitet.

```text
MAXIMUM_VARIANTS_PER_LINE=1
PUBLISHING_ALLOWED=false
MAY_BECOME_VOICE_MASTER=false
MAY_TRAIN_MODEL=false
AUTOMATIC_APPROVAL=false
```

Die eigentliche Aufnahme oder TTS-Erzeugung bleibt gesperrt, bis ein separater Auftrag Quelle, Rechte, Anbieter oder Sprecher, Modell, Voice-ID und Kandidatenzahl ausdrücklich festlegt.

## Technisches Ziel

```text
SAMPLE_RATE_HZ=48000
BIT_DEPTH=24
DIALOGUE_FORMAT=dry mono WAV
AMBIENCE_AND_MASTER=stereo WAV
INTEGRATED_LOUDNESS=-16 LUFS ±1
TRUE_PEAK_MAXIMUM=-1 dBTP
CLIPPING_ALLOWED=false
```

Diese Werte sind ein späterer Liefervertrag, keine Behauptung über bereits erzeugte Dateien.

## Stem-Plan

```text
DX_RICCO
DX_BASTI
DX_JULE
ROOMTONE
SFX
MUSIC_TEMP
MASTER
```

Alle Stems stehen auf `EMPTY_BLOCKED`.

## Ausführbare Prüfung

```bash
node --test --test-concurrency=1 tests/ep001-audio-preparation.test.mjs
node scripts/check_ep001_audio_preparation.mjs
```

Der Validator prüft:

- fünf unveränderte Source-Pins;
- exakt drei Sprecherverträge;
- Stimmeigenschaften gegen die Merge-Bibles;
- exakt zehn source-bound Dialog-Cues gegen den Blueprint;
- keine Cue-Überlappung;
- maximal 17 Zeichen pro Sekunde;
- 22,95 Sekunden Sprache und 22,55 Sekunden Reaktion/Raum;
- Sprecherverteilung 4/4/2;
- Don Miau dauerhaft ohne Sprache;
- keine TTS-, Clone-, Provider-, Voice-ID-, Finalmix- oder Auto-Freigabe;
- keine Audiodateien und keine Voice-Master.

## Menschliche Gates

Spätere Voice-Samples benötigen je Sprecher:

1. autorisierte Quelle oder Sprecheraufnahme;
2. dokumentierte Nutzungsrechte;
3. identische Vergleichszeilen;
4. maximal drei Auditions;
5. menschliche Hörprüfung;
6. SHA-256 und technische Metadaten;
7. getrennte Freigabeentscheidung.

Ein Audition-File, TTS-Output oder temporärer Readthrough wird niemals automatisch zum Voice-Master.

## Harte Grenzen

```text
AUDIO_GENERATION_ALLOWED=false
VOICE_CLONING_ALLOWED=false
FINAL_MIX_ALLOWED=false
PUBLISHING_ALLOWED=false
AUTOMATIC_VOICE_APPROVAL=false
AUTOMATIC_CANON_APPROVAL=false
VOICE_MASTERS=0/3
GENERATED_AUDIO_FILES=0
```
