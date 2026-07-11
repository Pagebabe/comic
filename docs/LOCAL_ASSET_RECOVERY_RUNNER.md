# Comic Factory · Local Asset Recovery Runner

Der Runner inventarisiert vorhandene Comic-Bilder, Videos, Audio-, Dataset- und Modell-Dateien. Er verändert keine Quelldateien und erteilt keine Canon- oder Masterfreigabe.

## Vorprüfung

```bash
npm run recover:local-assets:dry-run
```

Der Dry-run zeigt:

- gefundene Scan-Roots,
- fehlende optionale Roots,
- geplantes Reportverzeichnis,
- geplanten ZIP-Pfad.

Er schreibt keine Reports.

## Vollständiger Lauf

```bash
npm run recover:local-assets
```

Standardausgabe:

```text
~/ComicFactoryRecovery/
├── reports/
│   └── run-<UTC>/
│       ├── asset-recovery-inventory.json
│       ├── asset-recovery-files.csv
│       ├── asset-recovery-summary.md
│       ├── asset-recovery-errors.log
│       └── analysis/
│           ├── visual-candidate-shortlist.json
│           ├── visual-candidate-review.csv
│           └── visual-candidate-review.md
└── archives/
    └── comic-local-asset-recovery-<UTC>.zip
```

Die Ausgabe liegt absichtlich außerhalb des gescannten Repositories. Dadurch kann ein späterer Lauf keine früheren Recovery-Reports erneut als vermeintliche Projektassets aufnehmen.

## Automatisch geprüfte Pfade

Der Runner berücksichtigt vorhandene Verzeichnisse unter:

- dem Comic-Repository,
- `~/ComfyUI/output`,
- `~/ComfyUI/input`,
- `~/ComfyUI/models/loras`,
- entsprechenden `~/AI/ComfyUI/...`-Pfaden,
- entsprechenden `~/Documents/ComfyUI/...`-Pfaden,
- Stable-Diffusion-WebUI-LoRA-Verzeichnissen,
- `~/Downloads`,
- `~/Pictures`.

Fehlende optionale Pfade sind kein Fehler und werden nur protokolliert.

## Zusätzliche Roots

```bash
bash scripts/run_local_asset_recovery.sh \
  --root "$HOME/mein-comic-archiv" \
  --root "/Volumes/ComicBackup"
```

Nur ausdrücklich angegebene Verzeichnisse werden ergänzt. Fremde Projekte dürfen nicht als Roots verwendet werden; der Scanner blockiert bekannte ausgeschlossene Projekte zusätzlich.

## Eigene Ausgabeorte

```bash
REPORT_BASE="$HOME/MeineComicRecovery" npm run recover:local-assets
```

Oder vollständig explizit:

```bash
REPORT_DIR="$HOME/MeineComicRecovery/run-001" \
ZIP_PATH="$HOME/MeineComicRecovery/run-001.zip" \
npm run recover:local-assets
```

Vorhandene Reportverzeichnisse und ZIP-Dateien werden nicht überschrieben.

## Verbindliche Grenzen

- keine Quelldatei verschieben, umbenennen oder löschen,
- keine Bildgenerierung,
- keine Modell- oder LoRA-Ausführung,
- kein Training,
- keine automatische Canon-Zuordnung,
- keine automatische Masterfreigabe,
- alle visuellen Kandidaten bleiben menschlich zu prüfen.

Der Terminalabschluss muss weiterhin zeigen:

```text
SOURCE_ASSETS_MODIFIED: false
AUTOMATIC_MASTER_APPROVALS: 0
```

Verknüpft mit Issues #123, #125 und #127.
