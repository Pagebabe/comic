# Lokaler Asset-Recovery-Lauf

## Ziel

Vorhandene Character-Sheets, Location-Sheets, LoRA-Datasets, Panels, Keyframes, Audio-, Video-, Review- und Package-Dateien inventarisieren, ohne Quelldateien zu verändern.

**Source mode: read-only.** Der Scanner schreibt ausschließlich Berichte nach `_recovery_reports/`.

## Sicherheitsgarantien

- keine Quelldatei wird verändert
- keine Datei wird verschoben oder umbenannt
- keine Datei wird gelöscht
- Symlinks werden nicht verfolgt
- `.git`, `node_modules`, Builds und Caches werden übersprungen
- Chris Fact Radar, 100K Operator OS und Firmen-OS werden ausdrücklich ausgeschlossen
- große Dateien werden bis 2 GB gehasht; das Limit kann angepasst werden

## Vor dem Lauf

Öffne das Terminal in VS Code über **Terminal → New Terminal**.

Wechsle in das Comic-Repository:

```bash
cd ~/comic
```

Prüfe die Repository-Grenze:

```bash
pwd
git remote -v
git status --short
```

Der Remote muss zu `Pagebabe/comic` gehören. Sobald dort Chris Fact Radar oder ein anderes Projekt steht, nicht fortfahren.

## Einziger Standardbefehl

```bash
python3 scripts/recover_assets.py --root "$PWD"
```

Optional können bekannte alte Comic- oder ComfyUI-Ausgabeordner zusätzlich gelesen werden:

```bash
python3 scripts/recover_assets.py \
  --root "$PWD" \
  --root "$HOME/ComfyUI/output" \
  --root "$HOME/Downloads"
```

Es werden nur Dateien mit relevanten Medien-, Modell-, Manifest- und Dokumenterweiterungen inventarisiert.

## Erwartete Ausgabe

Das Terminal endet mit einer kompakten JSON-Zeile, beispielsweise:

```json
{"status":"ok","scannerVersion":"1.0.0","files":148,"likelyCandidates":62,"errors":0,"reportDirectory":"/Users/.../comic/_recovery_reports"}
```

Danach liegen diese vier Dateien vor:

```text
_recovery_reports/asset-recovery-inventory.json
_recovery_reports/asset-recovery-files.csv
_recovery_reports/asset-recovery-summary.md
_recovery_reports/asset-recovery-errors.log
```

## Was zurückgegeben wird

Für die weitere Projektarbeit werden nur diese Reportdateien benötigt. Große Bild-, Video- oder Modelldateien werden nicht blind in GitHub hochgeladen.

Am wichtigsten ist:

```text
_recovery_reports/asset-recovery-inventory.json
```

Dieser Bericht enthält:

- vollständige Pfade
- Dateigrößen
- Änderungszeitpunkte
- SHA-256-Hashes
- Kategorien
- wahrscheinliche Sheet-Kandidaten
- Duplikatgruppen
- Lesefehler

## Kategorien

- `CHARACTER_SHEET`
- `LOCATION_SHEET`
- `LORA_DATASET`
- `PANEL_OR_KEYFRAME`
- `REVIEW_OR_MANIFEST`
- `OTHER_MEDIA`
- `OTHER_MANIFEST`

Diese Kategorien sind Suchhilfen, keine automatische Canon-Freigabe. Eine Datei wird erst nach visueller Prüfung als Masterreferenz akzeptiert.

## Fehlerbehandlung

### `Scan root is not a directory`

Der angegebene Ordner existiert nicht. Den Pfad über Finder oder VS Code prüfen.

### `Forbidden unrelated project root`

Der Scanner hat Chris Fact Radar oder ein anderes ausgeschlossenes Projekt erkannt und den Lauf sicher abgebrochen.

### `Permission denied`

Der Scanner konnte eine einzelne Datei nicht lesen. Der Lauf wird fortgesetzt und der Fehler in `asset-recovery-errors.log` protokolliert.

## Prüfung nach dem Lauf

```bash
git status --short
```

Erwartung: Nur `_recovery_reports/` ist neu. Dieser Ordner ist in `.gitignore` eingetragen und darf nicht versehentlich committed werden.

## Definition of Done

Der lokale Recovery-Schritt ist bestanden, wenn:

- der Scanner erfolgreich endet
- `asset-recovery-inventory.json` vorhanden ist
- die Zusammenfassung Dateizahlen und Kandidaten nennt
- Chris Fact Radar nicht im Inventar auftaucht
- Quelldateien unverändert geblieben sind
- die Reports für die zentrale Prüfung bereitstehen
