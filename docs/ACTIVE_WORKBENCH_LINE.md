# Aktive Werkbanklinie

## Zweck

Diese Datei trennt den strategischen LR5.1-Vertrag von der aktuell ausführbaren operativen Aufgabe.

```text
Parent-Gate:              LR5 · Issue #82
Strategischer Vertrag:    LR5.1 · Issue #88
Abgeschlossener Scan:     Issue #123
Aktives Review-Gate:      Issue #153
Lokaler M1-Auftrag:       Issue #155
Review-Tooling:           Draft-PR #154
Operative Quelle:         project/active-line.json
```

## Nächste erlaubte Arbeit

1. Issue #155 auf dem lokalen M1 exakt ausführen.
2. Das Original `Ricco - Charakterdesign Übersicht.png` unverändert lokalisieren und hashen.
3. Reviewpaket und Contact Sheet erzeugen.
4. Figurenfamilien und LoRA-Trainingsbilder sauber trennen.
5. Das Contact Sheet sichtbar gegen den Ricco-Canon prüfen.
6. Die menschliche Entscheidung in Issue #153 dokumentieren.
7. Erst danach die nächste Produktionsaktion festlegen.

## Bewiesene Scanbasis

```text
FILES_SCANNED=6215
SCAN_ERRORS=0
DUPLICATE_GROUPS=249
CHARACTER_SHEET_ENTRIES=43
LORA_DATASET_ENTRIES=17
PANEL_OR_KEYFRAME_ENTRIES=24
REVIEW_OR_MANIFEST_ENTRIES=98
MODEL_FILES=0
MODEL_BYTES=0
```

`MODEL_FILES=0` bedeutet ausschließlich, dass in den gescannten Roots keine trainierten Gewichtsdateien gefunden wurden. Es bedeutet nicht, dass keine Character-Sheets, LoRA-Trainingsbilder oder visuellen Ricco-Referenzen existieren.

## Gesperrt

```text
IMAGE_GENERATION_ALLOWED=false
MODEL_DOWNLOAD_ALLOWED=false
LORA_TRAINING_ALLOWED=false
AUTOMATIC_MASTER_APPROVAL_ALLOWED=false
SOURCE_ASSET_MUTATION_ALLOWED=false
MAIN_MERGE_ALLOWED=false
LIVE_PUBLISHING_ALLOWED=false
```

PR #150 und #152 bleiben Referenzstände. PR #157 und #159 bleiben geparkt, solange Issue #153 und #155 offen sind.
