# Ricco Masterreview · Revision erforderlich

Status: `REVISION_REQUIREMENTS_RECORDED_GENERATION_BLOCKED`

Das echte, source-bound Ricco-Reviewblatt wurde technisch in Run `29355551995` und visuell in Issue #88 geprüft. Zwei getrennte Entscheidungen bleiben erhalten:

```text
EXISTING_ASSET_REVIEW_DECISION=POSSIBLE_RICCO_REFERENCE
MASTER_REVIEW_DECISION=REVISION_REQUIRED
```

Das bedeutet: Der Entwurf trägt Riccos Identität und darf als Revisionsreferenz dienen. Er ist noch kein Produktionsmaster.

## Gebundene Quelle

```text
TARGET_FILENAME=Ricco - Charakterdesign Übersicht.png
TARGET_SHA256=145941b9e6f2fcde7657d6cd147f3ab83e3754d82d40dce5c5de0f78cf212313
TARGET_SIZE_BYTES=1708575
TARGET_DIMENSIONS=1448x1086
ARTIFACT_ID=8319961025
ARTIFACT_NAME=ricco-existing-character-review-29355551995
```

## Verbindliche Revision

1. Produktionsblatt ohne eingebetteten Titel, Reviewstempel, Labels, Logos oder Sprechblasen.
2. Anime-/YA-Signale in Augen, Haaren und Gesichtsrendering reduzieren.
3. Rucksack, Kleidung, Schuhe, Schattierung und Nebenformen für Limited-2D vereinfachen.
4. Den blauen Tupperware-Deckel eindeutig als Deckel lesbar machen.
5. Stabile dickere schwarze Konturen und einheitlicheres Liniengewicht.
6. Alter, Gesichtskern, Haare, Kopfhörer, Rucksack, Haltung, Outfitfamilie und helle Sneaker beibehalten.

## Harte Sperren

```text
APPROVED_MASTER=false
RICCO_MASTER=0/1
CANDIDATE_SLOTS_USED=1/1
ACTIVE_GENERATION_JOBS=0
IMAGE_GENERATION_ALLOWED=false
AUTOMATIC_IMAGE_EDITING_ALLOWED=false
CONSISTENCY_VIEWS_ALLOWED=false
SECOND_CANDIDATE_ALLOWED=false
MODEL_DOWNLOAD_ALLOWED=false
LORA_TRAINING_ALLOWED=false
AUTOMATIC_MASTER_APPROVALS=0
IMAGE_BYTES_IN_REPOSITORY=0
```

## Prüfung

```bash
node --test --test-concurrency=1 tests/ricco-master-review-decision.test.mjs
node scripts/check_ricco_master_review_decision.mjs
```

Eine tatsächliche Bildrevision bleibt gesperrt. Issue #88 muss später genau einen source-bound Revisionskandidaten ausdrücklich autorisieren.
