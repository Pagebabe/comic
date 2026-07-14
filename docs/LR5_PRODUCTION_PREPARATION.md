# LR5 · Produktionsvorbereitung für Figuren, Locations und EP001

Status: `PREPARED_GENERATION_BLOCKED`

Dieses Paket stellt vier Figurenverträge, vier Location-Verträge, eine fünfstufige nullaktive Produktionsqueue und acht EP001-Panelverträge bereit. Es erzeugt keine Bild-, Audio-, Video-, Modell- oder Freigabebytes.

## Aktuelle Basis

```text
BASE_MAIN=06afa0c3e77bad9312c8cbdb83c689d026056ccf
CURRENT_PR=178
PORTED_FROM_PR=168
PORTED_FROM_HEAD=577a649fc22ef81011dd9c7b3d660029a5caa7a2
CLOUD_WORKBENCH_AVAILABLE=true
CLOUD_REVIEW_AVAILABLE=true
AUDIO_PREPARATION_IN_MAIN=true
ASSEMBLY_PREPARATION_IN_MAIN=true
```

## Aktive Gates

Der frühere lokale-Mac-Zwang ist technisch abgelöst.

```text
ISSUE_155=GITHUB_CLOUD_ASSET_DISPATCH_REQUIRED
ISSUE_153=HUMAN_VISUAL_DECISION_REQUIRED
LOCAL_MAC_REQUIRED_FOR_SOFTWARE=false
LOCAL_MAC_REQUIRED_FOR_RICCO_EVIDENCE=false
```

Ablauf:

1. Das unveränderte Original `Ricco - Charakterdesign Übersicht.png` gemeinsam mit seinem exakten Namen in Issue #155 anhängen.
2. GitHub Actions Workflow `Cloud Existing Character Review` auf `main` ausführen.
3. Das portable Contact Sheet aus dem Workflow-Artefakt öffnen.
4. Die menschliche Entscheidung in Issue #153 dokumentieren.
5. Issue #88 muss den nächsten einzelnen visuellen Schritt ausdrücklich autorisieren.
6. Erst danach darf die Queue mit echten Hashes oder genau einem autorisierten Kandidatenslot neu erzeugt werden.

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

Geprüft werden zehn Source-Pins, vier Figuren, vier Locations, fünf Queue-Stufen, 26 vorbereitete Jobs, acht Panels und 45,5 Sekunden Gesamtdauer.

## Harte Sperren

```text
ACTIVE_GENERATION_JOBS=0
IMAGE_GENERATION_ALLOWED=false
MODEL_DOWNLOAD_ALLOWED=false
LORA_TRAINING_ALLOWED=false
VOICE_MASTER_CREATION_ALLOWED=false
AUTOMATIC_MASTER_APPROVALS=0
RICCO_MASTER=0/1
CHARACTER_MASTERS=0/4
LOCATION_MASTERS=0/4
VOICE_MASTERS=0/3
FINISHED_EPISODES=0
```

Dieser Draft darf erst nach #155 → #153 und einer ausdrücklichen Autorisierung in #88 aus dem Gate weitergeführt werden. Ein erfolgreicher CI-Lauf beweist ausschließlich die Vorbereitung, nicht die kreative Freigabe.
