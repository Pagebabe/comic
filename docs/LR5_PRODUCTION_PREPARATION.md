# LR5 · Produktionsvorbereitung für Figuren, Locations und EP001

Tracking: Issue #156  
Aktiver visueller Blocker: #153  
Lokaler Evidence-Lauf: #155  
Review-Builder: Draft-PR #154

## Zweck

Dieses Paket bereitet die spätere Bildproduktion für den ausgewählten Pilot **„Das Zimmer“** vollständig vor, ohne Bilder zu erzeugen oder kreative Freigaben vorzutäuschen.

Es trennt vier Dinge, die sonst gern zu einem herrlichen Produktionsunfall vermischt werden:

1. Text-Canon und visuelle Pflichtmerkmale;
2. reproduzierbare Location-Geometrie;
3. ausführbare Render-Jobs;
4. menschliche Master- und Panelentscheidungen.

## Verbindlicher Status

```text
PACKAGE=PREPARED_GENERATION_BLOCKED
ACTIVE_GENERATION_JOBS=0
RICCO_MASTER=0/1
CHARACTER_MASTERS=0/4
LOCATION_MASTERS=0/4
VOICE_MASTERS=0/3
FINISHED_EPISODES=0
IMAGE_BYTES_CREATED_BY_PACKAGE=0
AUTOMATIC_MASTER_APPROVALS=0
```

Bildgenerierung, Modell-Downloads, LoRA-Training, Voice-Master und automatische Masterfreigaben bleiben gesperrt.

## Artefakte

### `project/lr5-production-preparation-contract.json`

Zentrale Status- und Autorisierungsdatei. Sie pinnt zehn autorisierende Quelldateien über Git-Blob-SHA und dokumentiert:

- erlaubte Vorbereitung;
- verbotene Ausführung;
- aktive Blocker #153 und #155;
- Aktivierungsbedingungen;
- unveränderte Wahrheitszähler.

### `project/lr5-character-render-contracts.json`

Providerneutrale Produktionsverträge für:

- Ricco;
- Basti Prenzl;
- Jule;
- Don Miau.

Jeder Vertrag enthält:

- aktuelle Identität und Alter;
- Kleidungs-, Requisiten- und Silhouettenanker;
- fünf Pflichtansichten;
- Expressions und Posen;
- verbotene Abweichungen;
- Prompt-Template;
- negative Prompt-Ergänzungen;
- Abnahmekriterien.

Historische Konflikte wurden nicht übernommen. Insbesondere gilt:

```text
Ricco=24
Basti Prenzl=44
Jule=29
Don Miau=wortlos und vollständig Katze
```

### `project/lr5-location-continuity-contract.json`

Kandidaten-Topologien für:

- Hausfassade;
- Riccos Zimmer;
- Flur/Treppenhaus;
- Gemeinschaftsküche.

Die Datei fixiert vor der Bildproduktion:

- qualitative und normalisierte Top-down-Geometrie;
- Tür-, Fenster-, Möbel- und Requisitenpositionen;
- Kameraanker für die Pilotpanels;
- Tages- und Nachtpaletten;
- Kontinuitätsprüfungen;
- die Regel, lesbare Beschriftungen erst deterministisch in der Montage hinzuzufügen.

Diese Topologien sind detaillierte **Layout-Kandidaten**, noch keine Location-Master.

### `project/lr5-image-generation-queue.json`

Die komplette Ausführungsreihenfolge ist vorbereitet, aber alle Generierungsjobs bleiben `BLOCKED`.

```text
S0_EXISTING_ASSET_REVIEW
S1_RICCO_REFERENCE
S2_REMAINING_CHARACTER_MASTERS
S3_LOCATION_MASTERS
S4_EP001_PANEL_RENDER
```

Die Queue enthält 26 Jobs:

- 1 lokaler Existing-Asset-Review;
- 3 mögliche Ricco-Folgeaktionen;
- 6 Jobs für Basti, Jule und Don Miau;
- 8 Location-Layout-/View-Jobs;
- 8 EP001-Panel-Jobs.

Pro Generierungsjob gilt genau ein Kandidat. Batchalternativen sind nicht freigegeben.

### `project/ep001-render-matrix.json`

Ausführbare Renderverträge für alle acht Panels:

1. Ankunft vor Haus Nr. 13;
2. Kein Mietverhältnis;
3. Die solidarischen 780;
4. Zimmer-Reveal;
5. Telefonat mit Mutti;
6. Hausregeln im Flur;
7. Gemeinschaftsküchenlogik;
8. Abendliches Urteil.

Jeder Panelvertrag enthält:

- gebundene Figuren und Location;
- Kameraanker;
- Emotion und Komposition;
- providerneutrales Prompt-Template;
- panelbezogene Negativregeln;
- Motion-Plan;
- mindestens fünf QA-Prüfungen.

Gesamtdauer bleibt exakt `45.5` Sekunden. Untertitel werden niemals in die Bildgenerierung eingebrannt.

## Prüfung

```bash
npm run check:lr5-preparation
npm run test:lr5-preparation
```

Der Validator prüft unter anderem:

- zehn unveränderte Source-Pins über echte Git-Blob-SHAs;
- vier korrekte Figurenverträge;
- vier reproduzierbare Location-Verträge;
- null aktive Generierungsjobs;
- jeden Generierungsjob als `BLOCKED` mit Kandidatenlimit `1`;
- acht Panels in korrekter Reihenfolge;
- Gesamtzeit `45.5` Sekunden;
- Ricco-Alter `24`;
- Basti-Alter `44`;
- Jule-Alter `29`;
- Don-Miau-Sprach- und Humanoidverbot;
- keine automatische Freigabe.

Die Negativtests lehnen mindestens ab:

- vorzeitige Bildgenerierungsfreigabe;
- Rückfall auf einen jüngeren Legacy-Ricco;
- aktive Jobs während des Blockers;
- Änderung der Zimmergeometrie;
- unvollständige Panelmatrix;
- Entfernung von Don Miaus Sprachverbot;
- Batchausweitung über einen Kandidaten.

## Aktivierung nach #153

### Fall A · vorhandenes Ricco-Bild wird als Referenz akzeptiert

1. Lokalen Pfad, SHA-256, Pixelmaße und Reviewentscheidung binden.
2. Keine neue Identität erzeugen.
3. Genau ein kontrolliertes Konsistenz-Sheet aus der gebundenen Referenz ausführen.
4. Ergebnis separat menschlich prüfen.

### Fall B · vorhandenes Bild braucht Revision

1. Exakte Konflikte dokumentieren.
2. #88 muss genau einen Revision-Kandidaten freigeben.
3. Provider, Modell, Workflow und Seed pinnen.
4. Genau einen Kandidaten ausführen.
5. Ausgabe hashen und menschlich prüfen.

### Fall C · vorhandenes Bild wird abgelehnt

1. Canon-Konflikte dokumentieren.
2. #88 muss genau einen neuen Ricco-Review-Kandidaten freigeben.
3. Kein Batch, kein LoRA und keine alternativen Stilfamilien.
4. Erst nach Ricco-Entscheidung Basti, Jule und Don Miau sequenziell bearbeiten.

## Pflichtdaten pro späterem Renderlauf

```text
jobId
authorizedByIssue
authorizedDecisionComment
provider
model
modelVersion
modelSha256
workflowPath
workflowSha256
sourceReferences[]
promptVersion
promptResolved
negativePromptVersion
negativePromptResolved
seed
width
height
steps
sampler
scheduler
cfg
denoise
outputPath
outputSha256
reviewStatus
automaticMasterApproval=false
```

Fehlt ein Pflichtwert, wird der Job nicht ausgeführt. „Das Modell weiß schon, was gemeint ist“ ist kein reproduzierbarer Produktionsvertrag, sondern Aberglaube mit GPU-Rechnung.

## Stop-Regeln

- keine Ausführung der Queue vor dokumentierter Aktivierung;
- keine Bilder oder Reports automatisch nach Git committen;
- keine Änderung oder Löschung vorhandener Source-Assets;
- kein Modell-Download;
- kein LoRA-Training;
- keine Voice-Master-Produktion;
- keine automatische Character-, Location-, Panel- oder Episodenfreigabe;
- kein Merge dieses Preparation-Pakets als Behauptung, LR5 sei abgeschlossen.

## Definition of Done für Issue #156

```text
SOURCE_PINS_RECORDED
CHARACTER_RENDER_CONTRACTS=4/4_PREPARED
LOCATION_CONTINUITY_CONTRACTS=4/4_PREPARED
EP001_PANEL_RENDER_CONTRACTS=8/8_PREPARED
GENERATION_QUEUE_STAGES=5
GENERATION_QUEUE_TOTAL_JOBS=26
GENERATION_QUEUE_ACTIVE_JOBS=0
VALIDATOR=GREEN
TESTS=GREEN
IMAGE_BYTES_CREATED=0
AUTOMATIC_MASTER_APPROVALS=0
DRAFT_PR_OPEN
```

Issue #156 kann technisch abgeschlossen werden, während #153, #155 und die kreativen LR5-Gates offen bleiben.
