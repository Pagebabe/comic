# ComfyUI-PNG-Recovery

## Ergebnis des ersten Scans

Der breite read-only Scan hat 6.047 Dateien ohne Lesefehler inventarisiert. Der anschließende strenge Gegencheck hat jedoch **keine vertrauenswürdige Character- oder Location-Masterreferenz** bestätigt.

Die früher gemeldeten Kandidaten waren überwiegend:

- Android-/APK-Grafiken
- Telegram-Export-Icons
- fremde Downloads
- Projektdokumente statt Bilder
- technische SVG-Platzhalter

Diese Dateien dürfen nicht in den Canon gelangen.

## Noch prüfbarer Bestand

Im Inventar liegen 67 generisch benannte `ComfyUI_*.png`:

- 55 Dateien vom 5. Juni 2026
- 12 Dateien vom 1. Juli 2026

Aus ihren Dateinamen ist nicht erkennbar, ob sie zur Comic Factory gehören. ComfyUI speichert Prompt und Workflow häufig in PNG-Metadaten. Telegram oder andere Exporte können diese Metadaten allerdings entfernen.

## Einziger nächster Lauf

Im lokalen Comic-Repository:

```bash
cd ~/comic
git switch main
git pull --ff-only
```

Dann den vorhandenen Bericht erneut streng auswerten:

```bash
python3 scripts/analyze_recovery_inventory.py \
  --inventory "$PWD/_recovery_reports/asset-recovery-inventory.json"
```

Danach PNG-Metadaten prüfen und ein begrenztes Sichtprüfungs-Paket erstellen:

```bash
python3 scripts/inspect_comfy_png_metadata.py \
  --inventory "$PWD/_recovery_reports/asset-recovery-inventory.json" \
  --bundle-max-files 20 \
  --bundle-max-mb 100
```

## Erwartete Dateien

```text
_recovery_reports/analysis/comfy-png-metadata-report.json
_recovery_reports/analysis/comfy-png-metadata-report.md
_recovery_reports/analysis/comfy-png-metadata-errors.log
_recovery_reports/analysis/comic-visual-review-bundle.zip
```

Nur diese Datei muss anschließend zur visuellen Prüfung hochgeladen werden:

```text
_recovery_reports/analysis/comic-visual-review-bundle.zip
```

## Sicherheitsregeln

- Source-Dateien bleiben unverändert.
- Das Paket enthält höchstens 20 PNGs und maximal 100 MB.
- Metadaten-Treffer werden zuerst verpackt.
- Fehlen Metadaten, werden nur die neuesten generischen ComfyUI-PNGs als Fallback aufgenommen.
- Jede Datei bleibt `REVIEW_REQUIRED`.
- Keine Datei wird automatisch als Canon oder Masterreferenz markiert.
- Chris Fact Radar, Operator OS und Firmen OS bleiben ausgeschlossen.

## Abnahme

Der Recovery-Schritt ist erst abgeschlossen, wenn die Bilder aus `comic-visual-review-bundle.zip` tatsächlich angesehen und einem der folgenden Zustände zugeordnet wurden:

```text
CANON_CANDIDATE
LEGACY_REFERENCE
UNRELATED
REJECTED
```

`CANON_APPROVED` darf erst nach menschlicher Sichtprüfung und dokumentierter Freigabe gesetzt werden.
