# M1R-002 · Lokalen Assetbestand schreibgeschützt inventarisieren

## Ziel

Alle vorhandenen Comic-Factory-Medien, Character-/Location-Sheets, LoRA-Dateien, Panels, Keyframes, Review-Manifeste und Backups erfassen, ohne Quelldateien zu verändern.

## Voraussetzung

- Repository ist `Pagebabe/comic`
- `scripts/recover_assets.py` ist vorhanden
- aktives Gate ist `M1R`
- Chris Fact Radar bleibt vollständig außerhalb des Scans

## Erlaubter Scope

- Comic-Repository
- ausdrücklich benannte alte Comicordner
- ausdrücklich benannte ComfyUI-Ausgabeordner
- Downloads nur als zusätzlicher Read-only-Root
- Schreiben ausschließlich nach `_recovery_reports/`

## Verbotener Scope

- Chris Fact Radar
- 100K Operator OS
- Firmen OS
- Verschieben, Löschen oder Umbenennen von Dateien
- Generierung neuer Bilder
- automatische Canon-Freigabe
- Hochladen großer Medienordner nach GitHub

## Ausführung

```bash
cd ~/comic
python3 scripts/recover_assets.py --root "$PWD"
```

Zusätzliche Roots nur, wenn deren Pfad bekannt ist:

```bash
python3 scripts/recover_assets.py \
  --root "$PWD" \
  --root "$HOME/ComfyUI/output" \
  --root "$HOME/Downloads"
```

## Erwartete Dateien

```text
_recovery_reports/asset-recovery-inventory.json
_recovery_reports/asset-recovery-files.csv
_recovery_reports/asset-recovery-summary.md
_recovery_reports/asset-recovery-errors.log
```

## Prüfungen

- Scanner endet mit `status: ok`
- Inventar enthält absolute und relative Pfade
- SHA-256-Hashes sind für Dateien bis zum Größenlimit vorhanden
- Duplikate werden gruppiert
- verbotene Projekte tauchen nicht im Inventar auf
- `git status --short` zeigt keine veränderten Quelldateien

## Rückgabeformat

```text
M1R-002 RESULT
Status:
Gescannten Roots:
Dateien insgesamt:
Wahrscheinliche Kandidaten:
Duplikatgruppen:
Fehler:
Reportpfad:
Git-Status:
```

## Definition of Done

- Reports liegen vor
- keine Quelldatei wurde verändert
- Reportdateien können zentral geprüft werden
- nächster Schritt ist die visuelle Kandidatenklassifizierung, nicht neue Generierung
