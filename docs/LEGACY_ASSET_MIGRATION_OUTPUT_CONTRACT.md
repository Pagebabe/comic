# Comic Factory · Legacy-Migrationsausgabe-Vertrag

Tracking: Issue #125  
Realer Inventarlauf: Issue #123

Status: `OUTPUT_CONTRACT_DEFINED_REVIEW_REQUIRED`

## Zweck

Der Ausgabe-Vertrag prüft die drei Dateien, die Worker B aus Inventory, Shortlist und Mappingvertrag erzeugen muss:

```text
legacy-asset-migration-report.json
legacy-asset-migration-review.csv
legacy-asset-migration-review.html
```

Der Prüfer liest ausschließlich Reports. Er lädt keine Modelle, öffnet keine Medien, kopiert keine Quelldateien und erteilt keine kreative Freigabe.

## Deterministische Quellenbindung

Der JSON-Report muss SHA-256-Werte für Inventory und Shortlist sowie einen gemeinsamen Input-Fingerprint enthalten.

Der Fingerprint wird über die kanonisch serialisierte Struktur berechnet:

```text
{
  inventory,
  shortlist,
  mappingContract
}
```

Objektschlüssel werden rekursiv sortiert. Array-Reihenfolgen bleiben erhalten. Gleiche Eingaben müssen denselben Fingerprint liefern.

## JSON-Ausgabe

Der Fixture-Lauf muss melden:

```text
inputRecords: 19
includedRecords: 17
excludedRecords: 2
duplicateGroups: 1
automaticMasterApprovals: 0
sourceFilesExecuted: 0
sourceFilesCopied: 0
sourceFilesImported: 0
defaultReviewStatus: REVIEW_REQUIRED
```

Jede Prüfzeile enthält mindestens:

```text
sourcePath
sourceSha256
assetClass
sourceExtension
legacyCharacterId
canonicalCharacterId
mappingStatus
reviewStatus
duplicateOf
sourceExecuted
sourceCopied
sourceImported
automaticMasterApproval
```

Jeder Ausschluss enthält Pfad, SHA-256, Ausschlussgrund und dieselben Safety-Felder.

Prüfzeilen und Ausschlüsse werden jeweils aufsteigend nach `sourcePath` sortiert.

## CSV-Ausgabe

Die CSV enthält genau die 17 JSON-Prüfzeilen in identischer Reihenfolge.

- UTF-8
- LF-Zeilenenden
- Nullwerte als leeres Feld
- Booleans ausschließlich `true` oder `false`
- exakter Header aus `project/legacy-asset-migration-output-contract.json`

Ein anders sortiertes CSV, selbst mit denselben Daten, ist nicht deterministisch und wird abgelehnt.

## Statischer HTML-Report

Der HTML-Report dient ausschließlich der sichtbaren Prüfung.

Pflicht:

- `lang="de"`
- restriktive Content Security Policy
- alle 19 Quellpfade als sichtbar escapeter Text
- sichtbare Zusammenfassung
- `REVIEW_REQUIRED`
- `LEGACY_SUPPORT_UNMAPPED`
- `AUTOMATIC_MASTER_APPROVALS: 0`

Verboten:

- Script, iframe, object, embed
- Formulare, Buttons oder Inputs
- Video- oder Audioelemente
- `http:`, `https:`, `file:`, `data:` oder `javascript:`
- `href`- oder `src`-Attribute
- Base64-Medien
- klickbare lokale Dateipfade

Der HTML-Report zeigt Pfade, bindet aber keine Quelldatei ein. Ein Pfad ist Beweismetadatum, kein praktischer Downloadknopf für versehentliche Datenlecks.

## Abnahmebefehle

Statischer Vertrag:

```bash
npm run check:legacy-asset-migration-output-contract
```

Tests inklusive vollständig erzeugtem temporärem JSON-, CSV- und HTML-Paket:

```bash
npm run test:legacy-asset-migration-output
```

Worker-B-Ausgabe prüfen:

```bash
node scripts/check_legacy_asset_migration_output.mjs \
  --output-dir /pfad/zum/output-verzeichnis
```

## Harte Grenzen

```text
reviewStatus: REVIEW_REQUIRED
sourceExecuted: false
sourceCopied: false
sourceImported: false
automaticMasterApproval: false
AUTOMATIC_MASTER_APPROVALS: 0
```

Nicht bewiesen werden:

- Abschluss des realen lokalen Scans
- Funktion einer gefundenen LoRA-Datei
- ausreichende Trainingsdaten
- visuelle Masterfreigabe
- Location- oder Voice-Freigabe
- Produktionsbereitschaft der Episode
