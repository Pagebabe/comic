# Comic Factory · Legacy-Asset-Migrationsfixture

Tracking: Issue #125  
Lokaler Realbestand: Issue #123

## Zweck

Dieses Fixture entkoppelt die Entwicklung der Legacy-Asset-Migrationsschicht vom noch ausstehenden lokalen Mac-Scan. Es bildet die beiden echten Runner-Ausgaben nach:

- `asset-recovery-inventory.json`
- `analysis/visual-candidate-shortlist.json`

Zusätzlich definiert `expected-migration-oracle.json` die verbindliche erwartete Klassifikation und Zuordnung.

Das Fixture enthält ausschließlich erfundene Metadaten unter `/fixture/...`. Es enthält keine echten Bild-, Audio-, Video- oder Modellbytes und keine realen Nutzerpfade.

## Abgedeckte Fälle

- Ricco-Legacy-ID `char_rico` nach `char_ricco`
- Falk nach Basti Prenzl
- Kralle nach Don Miau
- Jule als aktueller direkter Canon-Target
- Sami als `LEGACY_SUPPORT_UNMAPPED`
- vier Location-Kandidaten ohne erfundene Canon-IDs
- Bild, Video und Audio
- `.safetensors` als `MODEL_BYTES`, nicht automatisch als funktionierende LoRA
- LoRA-Trainingsplan
- LoRA-Datensatzbild und Caption
- Review-/Manifestdatei
- SHA-256-Duplikatgruppe
- technischer SVG-Platzhalter
- verbotener Fremdprojektpfad

## Erwarteter Umfang

```text
Input records: 19
Included records: 17
Excluded records: 2
Duplicate groups: 1
Automatic master approvals: 0
Source files executed: 0
Source files copied: 0
Source files imported: 0
```

Assetklassen:

```text
IMAGE: 10
VIDEO: 1
AUDIO: 1
MODEL_BYTES: 1
LORA_TRAINING_PLAN: 1
LORA_DATASET_MEMBER: 2
REVIEW_OR_MANIFEST: 1
UNCLASSIFIED: 0
```

## Ausschlüsse

```text
/fixture/comic/assets/characters/ricco.svg
→ TECHNICAL_PLACEHOLDER

/fixture/comic/chris-fact-radar-studio/ricco.png
→ FORBIDDEN_UNRELATED_PROJECT
```

## Sicherheitsstandard

Jede spätere Migrationsausgabe muss standardmäßig enthalten:

```text
reviewStatus: REVIEW_REQUIRED
sourceExecuted: false
sourceCopied: false
automaticMasterApproval: false
```

Das Fixture erteilt keine kreative Freigabe und beweist nicht, dass irgendeine dargestellte Quelldatei tatsächlich existiert.

## Prüfung

```bash
npm run test:legacy-asset-migration-fixture
npm run check:legacy-asset-migration-fixture
```

Worker B muss seinen Loader und die JSON-/CSV-/HTML-Ausgaben gegen dieses Fixture und seine Oracle testen. Der spätere Realbestand aus Issue #123 wird danach mit derselben Pipeline gegengeprüft.
