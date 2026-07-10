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
- die spätere Kandidatenanalyse darf niemals automatisch einen Canon-Eintrag freigeben

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

## Schritt 1: Bestand scannen

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

## Erwartete Scanner-Ausgabe

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

## Schritt 2: Kandidaten automatisch vorsortieren

Nach einem erfolgreichen Scan:

```bash
python3 scripts/analyze_recovery_inventory.py \
  --inventory "$PWD/_recovery_reports/asset-recovery-inventory.json"
```

Der Analyzer nutzt ausschließlich Dateipfade, Kategorien und technische Metadaten. Er schaut keine Bildqualität an und darf niemals selbst eine Masterreferenz wählen.

Er sucht Kandidaten für:

- Ricco
- Basti Prenzl
- Jule
- Don Miau
- Hausfassade
- Riccos Zimmer
- Flur / Treppenhaus
- Gemeinschaftsküche

Er erkennt außerdem aktuelle Technikplatzhalter und stuft sie bewusst ab.

## Erwartete Analyzer-Ausgabe

```text
_recovery_reports/analysis/visual-candidate-shortlist.json
_recovery_reports/analysis/visual-candidate-review.csv
_recovery_reports/analysis/visual-candidate-review.md
```

Jeder Kandidat bleibt auf:

```text
REVIEW_REQUIRED
```

Kein Script darf `masterReference` setzen oder `CANON_APPROVED` behaupten.

## Was zurückgegeben wird

Für die weitere Projektarbeit werden nur diese Reportdateien benötigt. Große Bild-, Video- oder Modelldateien werden nicht blind in GitHub hochgeladen.

Am wichtigsten sind:

```text
_recovery_reports/asset-recovery-inventory.json
_recovery_reports/analysis/visual-candidate-shortlist.json
_recovery_reports/analysis/visual-candidate-review.md
```

Der Inventarbericht enthält:

- vollständige Pfade
- Dateigrößen
- Änderungszeitpunkte
- SHA-256-Hashes
- Kategorien
- wahrscheinliche Sheet-Kandidaten
- Duplikatgruppen
- Lesefehler

Die Shortlist enthält:

- Zielcharakter oder Zielset
- Rangwert
- Fundpfad
- Gründe für die Einstufung
- Platzhalterrisiko
- Status `REVIEW_REQUIRED`

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

Scanner oder Analyzer haben Chris Fact Radar oder ein anderes ausgeschlossenes Projekt erkannt und den Lauf sicher abgebrochen.

### `Inventory is not marked as a read-only source scan`

Der Analyzer akzeptiert nur Inventare des geprüften Scanners. Nicht manuell eine beliebige JSON-Datei unterschieben, auch wenn Menschen dies gern als pragmatische Abkürzung bezeichnen.

### `Permission denied`

Der Scanner konnte eine einzelne Datei nicht lesen. Der Lauf wird fortgesetzt und der Fehler in `asset-recovery-errors.log` protokolliert.

## Prüfung nach dem Lauf

```bash
git status --short
```

Erwartung: Nur `_recovery_reports/` ist neu. Dieser Ordner ist in `.gitignore` eingetragen und darf nicht versehentlich committed werden.

## Definition of Done

Der lokale Recovery-Schritt ist bestanden, wenn:

- Scanner und Analyzer erfolgreich enden
- `asset-recovery-inventory.json` vorhanden ist
- `visual-candidate-shortlist.json` vorhanden ist
- die Zusammenfassung Dateizahlen und Kandidaten nennt
- Chris Fact Radar weder im Inventar noch in der Shortlist auftaucht
- Quelldateien unverändert geblieben sind
- jeder Kandidat weiterhin `REVIEW_REQUIRED` ist
- die Reports für die zentrale visuelle Prüfung bereitstehen
