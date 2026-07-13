# Cloud Existing Character Review

## Zweck

Dieser Ablauf führt Issue #155 ohne eingeschalteten Mac aus. Das Ricco-Original wird manuell als GitHub-Issue-Anhang bereitgestellt und ausschließlich in einem ephemeren GitHub-Actions-Runner verarbeitet.

Verbindliche Datei:

```text
Ricco - Charakterdesign Übersicht.png
```

Gepinntes Review-Tooling:

```text
PR #154
19835df9fd3baaaa91d25ef58b2279ecf708e64c
```

## Vom Handy ausführen

1. Issue #155 im GitHub-Browser öffnen.
2. Einen neuen Kommentar beginnen.
3. In diesen Kommentar exakt diese Zeile schreiben:

```text
Ricco - Charakterdesign Übersicht.png
```

4. Im selben Kommentar das unveränderte Original als Bilddatei anhängen.
5. Den Kommentar veröffentlichen.
6. Den erzeugten Anhangslink kopieren. Er muss exakt diesem Muster entsprechen:

```text
https://github.com/user-attachments/assets/<uuid>
```

7. Im Repository **Actions** öffnen.
8. Workflow **Cloud Existing Character Review** wählen.
9. **Run workflow** öffnen.
10. Den Anhangslink in `asset_url` einfügen.
11. Workflow auf `main` starten.

Der Workflow akzeptiert den Link nur, wenn Link und exakter Zielname gemeinsam in einem Kommentar von Issue #155 stehen.

## Erfolgreicher Lauf

Der Workflow:

- akzeptiert ausschließlich einen öffentlichen GitHub-User-Attachment-Link;
- lehnt HTTP, fremde Hosts, Querystrings, Credentials, Ports und beliebige GitHub-Dateipfade ab;
- bestätigt die Herkunft aus Issue #155;
- speichert die Datei ephemer unter dem exakten Zielnamen;
- begrenzt die Datei auf 50 MiB;
- prüft PNG-Signatur, SHA-256, Größe und Pixelmaße;
- führt die 8 synthetischen Tests des gepinnten Builders aus;
- erstellt das vollständige Reviewpaket;
- entfernt Runner-Pfade und die Anhangs-URL aus dem auslieferbaren Paket;
- macht `ricco-contact-sheet.html` portabel;
- lädt das Paket als GitHub-Actions-Artefakt hoch;
- kommentiert technische Beweise in #155;
- kommentiert die offene Human-Review-Vorlage in #153.

Erwarteter Status:

```text
READY_FOR_HUMAN_REVIEW
SOURCE_ASSETS_MODIFIED=false
AUTOMATIC_MASTER_APPROVALS=0
```

## Menschlicher Abschluss

1. Im erfolgreichen Workflow-Lauf das Artefakt `ricco-existing-character-review-<run-id>` herunterladen.
2. ZIP entpacken.
3. `ricco-contact-sheet.html` öffnen.
4. Bild gegen den Ricco-Canon aus #153 prüfen.
5. Genau eine Entscheidung in #153 dokumentieren:

```text
POSSIBLE_RICCO_REFERENCE
REVISION_REQUIRED
REJECTED_CANON_CONFLICT
```

`APPROVED_MASTER` wird durch diesen Workflow nicht vergeben.

## Sicherheitsgrenzen

```text
NO_REPOSITORY_IMAGE_BYTES
NO_GENERIC_URL_DOWNLOAD
NO_PRIVATE_SIGNED_URL
NO_MODEL_DOWNLOAD
NO_IMAGE_GENERATION
NO_LORA_TRAINING
NO_AUTOMATIC_MASTER_APPROVAL
NO_AUTOMATIC_HUMAN_DECISION
NO_SOURCE_MUTATION
```

Das Workflow-Artefakt ist Evidence, kein Character-Master. Die Datei wird weder in Git committed noch nach GitHub Pages veröffentlicht.
