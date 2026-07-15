# LR5 · Produktionsvorbereitung für Figuren, Locations und EP001

Status: `REFERENCE_CANDIDATE_BOUND_GENERATION_BLOCKED`

Dieses Paket stellt vier Figurenverträge, vier Location-Verträge, eine fünfstufige nullaktive Produktionsqueue und acht EP001-Panelverträge bereit. Genau ein bestehender Ricco-Referenzkandidat ist durch technische und menschliche Evidence gebunden. Das Paket erzeugt keine Bild-, Audio-, Video-, Modell- oder Freigabebytes.

## Aktuelle Basis

```text
BASE_MAIN=63e4af920b4173e67cb2c5632547dcdd733a8587
CURRENT_PR=178
BINDING_ISSUE=179
CLOUD_REVIEW_RUN=29355551995
CLOUD_REVIEW_HEAD=63e4af920b4173e67cb2c5632547dcdd733a8587
CLOUD_WORKBENCH_AVAILABLE=true
CLOUD_REVIEW_AVAILABLE=true
AUDIO_PREPARATION_IN_MAIN=true
ASSEMBLY_PREPARATION_IN_MAIN=true
```

## Abgeschlossene Ricco-Gates

```text
ISSUE_155=CLOUD_REVIEW_SUCCESS
ISSUE_153=POSSIBLE_RICCO_REFERENCE
ISSUE_88=METADATA_BINDING_AUTHORIZED
CONTACT_SHEET_OPENED=true
LOCAL_MAC_REQUIRED_FOR_SOFTWARE=false
LOCAL_MAC_REQUIRED_FOR_RICCO_EVIDENCE=false
```

Gebundene Evidence:

```text
TARGET_FILENAME=Ricco - Charakterdesign Übersicht.png
TARGET_SHA256=145941b9e6f2fcde7657d6cd147f3ab83e3754d82d40dce5c5de0f78cf212313
TARGET_SIZE_BYTES=1708575
TARGET_DIMENSIONS=1448x1086
ARTIFACT_ID=8319961025
ARTIFACT_NAME=ricco-existing-character-review-29355551995
HUMAN_REVIEW_DECISION=POSSIBLE_RICCO_REFERENCE
VISUAL_CONFLICTS=NONE
SOURCE_BYTES_IN_REPOSITORY=false
```

Der Kandidat ist damit `SOURCE_BOUND_REFERENCE_CANDIDATE`, aber ausdrücklich **kein** Master.

## Queue-Zustand

```text
S0_EXISTING_ASSET_REVIEW=COMPLETED_CLOUD_REVIEW
S1_RICCO_REFERENCE=REFERENCE_CANDIDATE_BOUND_GENERATION_BLOCKED
RICCO_BIND_EXISTING_REFERENCE=COMPLETED
ACTIVE_GENERATION_JOBS=0
```

Alle Ricco-Generierungsjobs, alle übrigen Figuren, alle Locations und alle Episode-Panels bleiben blockiert.

## Paketinhalt

```text
project/lr5-production-preparation-contract.json
project/lr5-character-render-contracts.json
project/lr5-location-continuity-contract.json
project/lr5-image-generation-queue.json
project/ep001-render-matrix.json
scripts/check_lr5_production_preparation.mjs
tests/lr5-production-preparation.test.mjs
.github/workflows/lr5-production-preparation.yml
```

## Prüfung

```bash
node --test --test-concurrency=1 tests/lr5-production-preparation.test.mjs
node scripts/check_lr5_production_preparation.mjs
```

Geprüft werden zehn Source-Pins, vier Figuren, vier Locations, fünf Queue-Stufen, 26 Jobs, acht Panels, 45,5 Sekunden Gesamtdauer, exakt ein Ricco-Referenzkandidat, null Ricco-Master und null Repository-Bildbytes.

Der zugehörige Pull Request muss zusätzlich das vollständige Evidence-Paket aus `scripts/check_pr_evidence.mjs` bestehen. Ein grüner Spezialworkflow allein reicht nicht als Gesamtbeweis.

## Harte Sperren

```text
RICCO_REFERENCE_CANDIDATES=1/1
RICCO_MASTER=0/1
CHARACTER_MASTERS=0/4
LOCATION_MASTERS=0/4
VOICE_MASTERS=0/3
ACTIVE_GENERATION_JOBS=0
IMAGE_BYTES_IN_REPOSITORY=0
IMAGE_GENERATION_ALLOWED=false
MODEL_DOWNLOAD_ALLOWED=false
LORA_TRAINING_ALLOWED=false
VOICE_MASTER_CREATION_ALLOWED=false
AUTOMATIC_MASTER_APPROVALS=0
FINISHED_EPISODES=0
```

## Nächste erlaubte Linie

Issue #179 bindet ausschließlich die realen Evidence-Metadaten. Danach ist jede kreative Folgeaktion erneut gesperrt.

Issue #88 muss anschließend genau **eine** nächste Aktion ausdrücklich autorisieren, zum Beispiel:

- separate menschliche Masterentscheidung für den bestehenden Kandidaten;
- genau ein kontrollierter Konsistenz-View-Lauf;
- oder exakt dokumentierte Revision.

Dieser CI-Stand beweist die source-bound Referenzbindung. Er beweist weder einen Ricco-Master noch Produktions- oder Episodenreife.
