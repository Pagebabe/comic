# M1 Render Runbook

## Ziel

Ein reproduzierbarer 4-Sekunden-Testclip beweist die kleinste vollständige Comic-Produktionskette:

1. gesperrtes Figurenmanifest,
2. gesperrtes Szenenmanifest,
3. lokale Arbeitsstimme,
4. kontrollierte 2D-Animation,
5. eingebrannter Untertitel,
6. H.264/AAC-MP4,
7. maschinenlesbarer Renderbericht,
8. öffentliche Vorschau im Dashboard.

Der Clip ist **kein finaler Stilbeweis**. Er ist ein technischer Produktionsbeweis. Die eSpeak-Stimme bleibt nur so lange, bis ein besserer Arbeitsstimmen-Test freigegeben wird.

## Eingaben

- `series/ricco-im-haus/characters/ricco/character.json`
- `series/ricco-im-haus/episodes/m1-life-sign/scene.json`
- `scripts/render_m1.py`

## Benötigte Programme

- Python 3.11 oder neuer
- Pillow 11.3.0
- FFmpeg mit `libx264`
- FFprobe
- eSpeak NG

## Lokaler Start auf macOS

### 1. Programme installieren

Über Homebrew:

```bash
brew install ffmpeg espeak-ng
python3 -m pip install pillow==11.3.0
```

### 2. Projekt prüfen

```bash
npm test
```

### 3. Clip rendern

```bash
python3 scripts/render_m1.py
```

### 4. Ergebnis öffnen

Im Finder:

1. Repository-Ordner öffnen.
2. `output` öffnen.
3. `m1` öffnen.
4. `ricco-life-sign.mp4` doppelklicken.

Erwartete Dateien:

```text
output/m1/ricco-life-sign.mp4
output/m1/ricco-life-sign-poster.png
output/m1/render-report.json
```

## Automatische GitHub-Prüfung

`Comic Factory CI` führt denselben Render auf Ubuntu aus. Der Workflow:

- installiert FFmpeg und eSpeak NG,
- installiert die festgesetzte Pillow-Version,
- führt alle bestehenden Tests aus,
- rendert den Clip,
- validiert Auflösung, Bildrate, Dauer, Video- und Audiostream,
- lädt MP4, Poster und Bericht als Workflow-Artefakt hoch.

Ein PR darf nicht gemergt werden, wenn der Render fehlschlägt.

## Online-Veröffentlichung

Nach Merge erzeugt `Deploy Comic Factory Dashboard` den Clip erneut. Erst danach werden Dashboard und Video gemeinsam als ein GitHub-Pages-Artefakt veröffentlicht.

Öffentliche Ziele:

```text
https://pagebabe.github.io/comic/
https://pagebabe.github.io/comic/media/m1/ricco-life-sign.mp4
https://pagebabe.github.io/comic/media/m1/render-report.json
```

Das bestehende `[DEPLOY PROOF]`-Issue wird nur nach erfolgreichem Medien- und Dashboard-Deployment aktualisiert.

## Technische Abnahme

Der Renderer bricht ab, wenn mindestens einer dieser Punkte falsch ist:

- kein H.264-Videostream,
- kein Audiostream,
- falsche Auflösung,
- falsche Bildrate,
- falsche Audio-Samplerate,
- Dauer außerhalb des M1-Fensters,
- Figuren- und Szenenmanifest passen nicht zusammen.

## Menschliche Abnahme

Nach technischem Bestehen werden diese Punkte mit Auge und Ohr geprüft:

- Ricco ist in jedem Frame dieselbe Figur.
- Schwarze Kopfhörer und ockerfarbene Jacke bleiben stabil.
- Blickbewegung wirkt beabsichtigt.
- Der Blinzler wirkt natürlich genug.
- Die Mundbewegung folgt grob dem Silbenrhythmus.
- Der Satz ist verständlich.
- Der Untertitel ist auf einem Telefon lesbar.
- Der Clip läuft vollständig durch.

## Stop-Regel

M1 gilt nicht automatisch als kreativ bestanden, nur weil FFprobe zufrieden ist. Maschinen sind leicht glücklich zu machen. Erst nach sichtbarer Prüfung wird entschieden:

- **M1 bestanden:** M2 darf geplant werden.
- **M1 reparieren:** Nur die konkret beanstandete Ebene ändern.
- **Methode verwerfen:** Nur bei einem dokumentierten Grund, nicht wegen allgemeiner Unruhe.

## Rückfalllösungen

1. eSpeak NG klingt zu künstlich: eigene Arbeitsaufnahme verwenden.
2. Mundbewegung wirkt hektisch: Frequenz im Muster reduzieren.
3. Untertitel ist zu klein: Schriftgröße erhöhen, maximal zwei Zeilen.
4. Render ist zu langsam: Auflösung nur für lokale Vorschau reduzieren, finalen Vertrag nicht ändern.
5. FFmpeg fehlt: Installation reparieren, nicht eine zweite Renderplattform einführen.
