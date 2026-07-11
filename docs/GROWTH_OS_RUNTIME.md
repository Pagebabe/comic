# Comic Growth OS · MKT0-009 Integrated Shadow Runtime

Status: `IMPLEMENTED LOCALLY · PENDING REPOSITORY CI · SYNTHETIC DIGITAL TWIN ONLY`

Tracking: Issue #69

## Zweck

MKT0-009 verbindet die bewiesenen Module MKT0-001 bis MKT0-008 zu einem einzigen deterministischen Shadow-Lauf. Das Ergebnis ist kein produktiver Marketingdienst. Es ist ein reproduzierbarer digitaler Zwilling, der Entscheidungen, Sperren, Datenflüsse und Ausgaben als hashverkettete Beweiskette ausführt.

## Ausgeführte Modulfolge

```text
Runtime Input
→ MKT0-001 Core und Policy
→ MKT0-005 Campaign/Workflow/Scheduler
→ MKT0-002 Domain Events und Event Store
→ MKT0-004 Community Signal Brief
→ MKT0-007 Operations Gate
→ MKT0-008 Connector Capability/Request/Sandbox
→ MKT0-006 Read-only Cockpit
→ MKT0-003 Robust Analytics Radar
→ Terminaler Shadow-Zustand
→ Replay
```

Der Operations Gate liegt vor jeder Connector-Planung. Ein Kill Switch oder Incident Lockdown verhindert daher Request-Pläne und Simulationen.

## Zwei explizite Runtime-Schichten

### Base Runtime

Regelversion:

```text
mkt0-009.v1
```

Die Base Runtime führt Core, Orchestrator, Data, Signals, Operations, Connector Sandbox und Cockpit aus.

### Full Runtime

Regelversion:

```text
mkt0-009.full.v1
```

Die Full Runtime ergänzt den robusten MKT0-003 Analytics Radar. Score, Klassifikation, Recommendations, Direction Events und Daily Growth Brief werden als eigener Journal-Schritt und eigener Analytics-Hash in das Evidence Bundle aufgenommen.

Diese Trennung ist absichtlich sichtbar. Der Base Replay beweist das Journal als Source of Truth. Der Full Replay prüft zusätzlich die gespeicherten Analytics- und Endzustands-Hashes.

## Runtime-Vertrag

Pflichtfelder:

- `runId`
- `tenantId`
- `projectId`
- Szenario
- expliziter Zeitstempel
- EpisodePackage
- synthetische Metrics und Baseline
- Provider-Manifeste
- Operations-Konfiguration
- optionale deklarative Fault Fixture

Verboten:

- versteckte Echtzeituhr
- Zufalls-IDs
- Secret-Werte
- echte Account-IDs
- absolute Provider-URLs
- Netzwerkzugriff
- OAuth
- produktive Datenquellen

Trace-, Correlation-, Event- und Evidence-IDs entstehen deterministisch aus kanonischen Eingaben und Regelversionen.

## Runtime Journal

Jeder Eintrag enthält:

```text
sequence
 eventId
 traceId
 correlationId
 causationId
 module
 type
 occurredAt
 data
 previousHash
 hash
```

Regeln:

- Sequenzen beginnen bei 1 und sind lückenlos.
- `eventId` ist innerhalb eines Laufs eindeutig.
- `causationId` verweist auf das unmittelbar vorherige Ereignis.
- `previousHash` verkettet den Lauf.
- Der Hash wird aus dem kanonischen Datensatz berechnet.
- Journal-Einträge werden nicht geändert oder gelöscht.
- Manipulation, Reihenfolgenbruch oder doppelte IDs machen das Journal ungültig.

## Domain Event Store

Die Runtime erzeugt zusätzlich die bewiesenen MKT0-002-Domain-Events:

- Campaign
- Content
- Variants
- Publish Jobs
- Metric Snapshot
- Production Brief

Der Event Store prüft Scope, Stream-Sequenz, Event-ID und Hashkette. Runtime Journal und Domain Event Store sind getrennte Beweise:

- Runtime Journal beweist den Ablauf.
- Domain Event Store beweist die fachlichen Zustandsereignisse.

## Checkpoints

Vorhandene Checkpoints:

```text
AFTER_OPERATIONS_GATE
AFTER_CONNECTOR_STAGE
```

Ein Checkpoint enthält:

- Regelversion
- Journal-Sequenz
- Journal-Head
- Hash des projizierten Zustands
- eigenen Checkpoint-Hash

Resume ist nur ein Plan:

```text
RESUME_PLANNED_SHADOW
executionAllowed: false
networkAllowed: false
humanApprovalRequired: true
```

Ein Resume führt nichts automatisch aus.

## Replay

Replay arbeitet ausschließlich aus Journal und Evidence Bundle. Es ruft keine Provider, Datenbank oder Uhr auf.

Geprüft werden:

- Regelversion
- Journal-Integrität
- Checkpoint-Integrität
- Journal-Hash
- projizierter Endzustand
- Endzustands-Hash
- Full Runtime: Analytics-Hash

Mögliche Resultate:

```text
REPLAY_MATCHED
QUARANTINED
```

Ein Replay mit anderer Regelversion ist verboten. Eine neue Regelversion benötigt einen neuen Lauf und ein neues Evidence Bundle.

## Szenarien

### HAPPY_PATH

Erwartung:

```text
COMPLETED
3 Varianten
3 Connector-Pläne
3 Simulationen
Cockpit erzeugt
Replay matched
```

### RATE_LIMIT

Erwartung:

```text
COMPLETED_WITH_BACKOFF
1 deterministischer Backoff
keine Ausführung des blockierten Plans
übrige Sandbox-Pläne simulierbar
```

### AUTH_BLOCKED

Erwartung:

```text
BLOCKED_AUTH
Connector Readiness blockiert
kein Cockpit-Abschluss
keine Runtime-Hochstufung
```

### WEBHOOK_REPLAY

Erwartung:

```text
QUARANTINED
Replay erkannt
kein Cockpit-Abschluss
kein Weiterarbeiten mit dem betroffenen Lauf
```

### INCIDENT_LOCKDOWN

Erwartung:

```text
BLOCKED_INCIDENT
Operations Mode INCIDENT_LOCKDOWN
0 Connector-Pläne
0 Simulationen
```

Zusätzlich wird ein globaler Kill Switch geprüft. Er stoppt den integrierten Lauf vor Connector-Planung.

## Fault Injection

Faults sind ausschließlich deklarative Fixtures. Sie dürfen keine echte Störung, Netzwerkverbindung oder externe Mutation verursachen.

Zulässige Wirkung:

- Auth-State ändern
- Rate-Limit-Budget erschöpfen
- simuliertes Webhook-Replay auslösen
- synthetischen Incident einfügen

Jede Fault Fixture erscheint im Input Summary und verändert dadurch Input-, Journal- und Bundle-Hash.

## Quarantäne

Ein Lauf wird quarantänisiert bei:

- Journal-Manipulation
- Checkpoint-Manipulation
- Regelversionskonflikt
- Webhook-Replay
- Evidence-Hash-Mismatch

Quarantäne bedeutet:

- kein Resume ohne menschliche Prüfung
- keine Connector-Planung
- keine öffentliche Aktion
- unveränderte Aufbewahrung des fehlerhaften Evidence Bundles

## Evidence Bundle

Das Full Evidence Bundle enthält:

- sichere Input-Zusammenfassung
- Input-Hash
- Trace und Correlation IDs
- Runtime Journal
- Checkpoints
- projizierten Endzustand
- Event-Store-Head
- Connector-Zusammenfassung
- Cockpit-Zusammenfassung
- Analytics-Paket
- Journal-, Endzustands-, Analytics- und Bundle-Hash
- externe Aktionsflags
- ausdrückliche Nichtbehauptungen

Nicht enthalten:

- Secret-Werte
- OAuth-Tokens
- echte Account-IDs
- Community-Rohtexte
- persönliche Profile
- echte Provider-Endpunkte
- reale Plattformdaten

## Ein Offline-Befehl

```bash
node growth-os/runtime-check.mjs
```

oder:

```bash
npm run growth:runtime-check
```

Erzeugtes Artefakt:

```text
output/growth-os/mkt0-shadow-runtime.json
```

Der Check führt alle fünf Szenarien aus, prüft Base- und Full-Determinismus sowie beide Replay-Ebenen.

## Testbefehle

```bash
node --test --test-concurrency=1 tests/growth-os-runtime.test.mjs tests/growth-os-runtime-full.test.mjs
npm run test:growth
npm test
```

## Harte Sicherheitsgrenzen

- kein Netzwerk, HTTP, DNS oder Socket
- kein OAuth
- keine Secret-Werte
- keine echten Account- oder Provider-IDs
- kein Publishing, Reply, Delete oder DM
- kein realer Metrics-, Trend- oder Community-Import
- kein Umgehen von Human Gates
- kein Umgehen von Kill Switch oder Incident Lockdown
- kein automatisches Resume
- kein Umschreiben des Journals
- kein Replay über Regelversionsgrenzen
- keine Canon-, Story-, Figuren-, Voice- oder Produktionsänderung
- kein Merge in `main` während der Recovery-Stop-Regel

## Nicht bewiesen

- produktive Runtime-Verfügbarkeit
- echte Provider-Kompatibilität
- echte Queue- oder Worker-Ausführung
- produktive Performance und Skalierung
- produktive RPO/RTO-Werte
- echte Plattformdaten
- Live-Publishing
- OAuth oder Webhook-Kryptografie
