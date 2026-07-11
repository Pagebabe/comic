# Comic Growth OS · MKT0

Status: `MKT0-001–008 PROVEN · MKT0-009 INTEGRATED RUNTIME PENDING CI · LIVE ACTIONS BLOCKED · MAIN INTEGRATION BLOCKED`

MKT0 ist die auditierbare Shadow-Schicht zwischen Comic-Studio und späterer Distribution. Das System bleibt im isolierten Marketing-Branch, verändert weder Canon noch Produktion und besitzt absichtlich keinen Live-Publishing-Zustand.

## Bewiesene Module

### MKT0-001 · Shadow-Kern

EpisodePackage-Vertrag, Social-Varianten, Policy, Shadow-Jobs, Growth Score, Production Brief und SHA-256-Auditkette. Sieben Tests und erfolgreiche CI.

### MKT0-002 · Daten- und Event-Layer

Versionierte Domain Events, append-only Event Store, Scope-, Sequenz- und Hashprüfung sowie deterministische Projektionen. Neun Tests und erfolgreiche CI.

### MKT0-003 · Analytics & Growth Radar

Robuste Baselines, Datenqualitätsgates, Winner/Anomalien/Momentum/Sättigung, Empfehlungen, Direction Events und Daily Growth Brief. Zehn Tests und erfolgreiche CI.

### MKT0-004 · Community-, Trend- und Opportunity-Radar

PII-Redaktion, datensparsame Aggregation, Krisen-/Rechte-/Kollaborationseskalation, Trend Scoring und Direction Events. 15 Tests und erfolgreiche CI.

### MKT0-005 · Campaign-, Kalender- und Workflow-Orchestrator

Kampagnenverträge, Workflow-Graph, Human Gates, Shadow-Scheduler, Idempotenz, Retries, Dead Letter, Kalender und Tagesplan. 15 Tests und erfolgreiche CI.

### MKT0-006 · Read-only Growth Cockpit

Acht read-only Ansichten, `AVAILABLE`/`UNKNOWN`/`NOT_AVAILABLE`, Secret-/Rohdatensperren, CSP, Escaping und statischer Export. 15 Tests und erfolgreiche CI.

### MKT0-007 · Operations, Security und Resilience

Betriebsmodi, Kill Switch, Incident Lockdown, Backup-Manifeste, Dry-Run-Restore, Retention, Readiness und Runbooks. 18 Tests und erfolgreiche CI.

### MKT0-008 · Connector Contracts und Provider Sandbox

Provider-Slots, Capability-Matrix, Auth-Zustände, `PLANNED_SHADOW`-Requests, Idempotenz, Rate Limits, Envelopes, Webhook-Schutz und `SIMULATED`-Antworten. 22 Tests und erfolgreiche CI.

## MKT0-009 · Integrated Shadow Runtime & Replay Lab

Implementiert, terminaler Status erst nach Repository-CI:

- deterministischer Runtime-Input-Vertrag
- Trace-, Correlation- und Causation-IDs
- vollständiger Modulfluss MKT0-001 bis MKT0-008
- append-only Runtime Journal
- separater MKT0-002 Domain Event Store
- Checkpoints nach Operations und Connector Stage
- Base Replay und Full Replay
- Full Runtime mit echtem MKT0-003 Analytics Radar
- fünf Szenarien: Happy Path, Rate Limit, Auth Blocked, Webhook Replay, Incident Lockdown
- globaler Kill-Switch-Test
- Quarantäne bei Journal-, Checkpoint-, Regelversions- oder Evidence-Fehlern
- ausschließlich menschlich freizugebender Resume-Plan
- vollständiges End-to-End-Evidence-Bundle
- 30 Runtime-Tests

Regelversionen:

```text
Base Runtime:  mkt0-009.v1
Full Runtime:  mkt0-009.full.v1
```

Die Runtime verwendet keine versteckte Echtzeituhr, keine Zufalls-IDs, kein Netzwerk und keine echten Providerdaten.

## Ausführbare Befehle

```bash
npm run growth:demo
npm run growth:data-check
npm run growth:analytics-check
npm run growth:signals-check
npm run growth:orchestrator-check
npm run growth:cockpit-check
npm run growth:operations-check
npm run growth:connectors-check
npm run growth:runtime-check
npm run test:growth
npm run growth:check
npm test
```

## Erzeugte lokale Reports

```text
output/growth-os/mkt0-shadow-demo.json
output/growth-os/mkt0-growth-radar.json
output/growth-os/mkt0-signal-radar.json
output/growth-os/mkt0-orchestrator.json
output/growth-os/mkt0-growth-cockpit.json
output/growth-os/mkt0-growth-cockpit.html
output/growth-os/mkt0-operations-readiness.json
output/growth-os/mkt0-connector-sandbox.json
output/growth-os/mkt0-shadow-runtime.json
```

Alle Reports verwenden ausschließlich synthetische Daten.

## Integrierter Modulfluss

```text
Runtime Input
→ MKT0-001 Core + Policy
→ MKT0-005 Campaign + Workflow
→ MKT0-002 Domain Events + Event Store
→ MKT0-004 Signal Brief
→ MKT0-007 Operations Gate
→ MKT0-008 Connector Planning + Sandbox
→ MKT0-006 Read-only Cockpit
→ MKT0-003 Robust Analytics Radar
→ Runtime Journal + Checkpoints
→ Replay + Evidence Bundle
```

## Szenario-Endzustände

```text
HAPPY_PATH          → COMPLETED
RATE_LIMIT           → COMPLETED_WITH_BACKOFF
AUTH_BLOCKED         → BLOCKED_AUTH
WEBHOOK_REPLAY       → QUARANTINED
INCIDENT_LOCKDOWN    → BLOCKED_INCIDENT
```

Kill Switch und Incident Lockdown stoppen den Lauf vor Connector-Planung.

## Harte Grenzen

- kein Live-Publishing oder echtes Scheduling
- keine öffentliche Antwort, DM, Löschung oder Moderation
- kein HTTP, DNS, Socket oder echter Provider-Endpunkt
- kein OAuth und keine Secret-Werte
- keine realen Account-, Channel-, Page- oder Profile-IDs
- keine reale Plattformmetrik, Community-Nachricht oder echte Webhook-Signatur
- keine Remote-Datenbankmigration, produktiven Backups oder Restores
- kein Umgehen von Human Gates, Kill Switch oder Incident Lockdown
- kein automatisches Resume
- kein Umschreiben des Runtime Journals
- kein Replay über Regelversionsgrenzen
- keine automatische Incident-Lösung, Datenlöschung oder Live-Hochstufung
- keine autonome Canon-, Figuren-, Dialog-, Voice- oder Produktionsänderung
- synthetische Daten beweisen weder Plattformkompatibilität noch reale Performance
- kein Merge in `main`, solange die Recovery-Linie Growth OS verbietet

## `NOT_YET_BUILT`

- echte Postgres-/Supabase-Anbindung und produktive RLS-Beweise
- produktive Queue-, Scheduler- und Runtime-Worker
- echte Provider-Adapter und OAuth-Flows
- reale Trend-, Community- und Metrikimporte
- produktiver Cockpit-Deploy und Authentication
- Remote-Backup, echter Restore und produktive RPO-/RTO-Messung
- externe Alarmierung und unveränderbare Audit-Verankerung
- Last-, Chaos- und Langzeitbetrieb mit produktiver Infrastruktur

## `BLOCKED_BY_EXTERNAL_CREDENTIALS`

- produktive Instagram-, TikTok-, YouTube- und Postiz-Verbindungen
- OAuth und Provider-App-Freigaben
- reales Publishing und Scheduling
- reale Plattformmetriken und öffentliche Community-Aktionen
- Remote-Storage, Datenbank und externe Audit-Anker

Live-Funktionen bleiben bis zu Plattformfreigabe, Runtime-Test, Security-Prüfung, vollständigem Evidence Packet und menschlicher Abnahme gesperrt.

## Beweiskette

- Architektur: `docs/GROWTH_OS_ARCHITECTURE.md`
- Datenmodell: `docs/GROWTH_OS_DATA_MODEL.md`
- Analytics: `docs/GROWTH_OS_ANALYTICS.md`
- Signale: `docs/GROWTH_OS_SIGNALS.md`
- Orchestrator: `docs/GROWTH_OS_ORCHESTRATOR.md`
- Cockpit: `docs/GROWTH_OS_COCKPIT.md`
- Operations: `docs/GROWTH_OS_OPERATIONS.md`
- Connectoren: `docs/GROWTH_OS_CONNECTORS.md`
- Runtime: `docs/GROWTH_OS_RUNTIME.md`
- Runbooks: `growth-os/runbooks/`
- Evidence: `growth-os/evidence/MKT0-001.md` bis `MKT0-009.md`
- Tests: `tests/growth-os*.test.mjs`
- Persistenzvertrag: `growth-os/sql/001_growth_os_foundation.sql`
- Single Source of Truth: Issue #34
- MKT0-009 Tracking: Issue #69
