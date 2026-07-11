# Comic Growth OS · MKT0

Status: `CORE + DATA + GROWTH RADAR + SIGNAL RADAR + ORCHESTRATOR + COCKPIT + OPERATIONS + CONNECTOR SANDBOX PROVEN · LIVE ACTIONS BLOCKED · MAIN INTEGRATION BLOCKED`

MKT0 ist die auditierbare Shadow-Schicht zwischen Comic-Studio und späterer Distribution. Das Modul bleibt isoliert im Repository `Pagebabe/comic`, verändert weder Canon noch Produktion und besitzt absichtlich keinen Live-Publishing-Zustand.

## Bewiesene Module

### MKT0-001 · Shadow-Kern

- EpisodePackage-Validierung und deterministische Social-Varianten
- Shadow-PublishJob-Zustandsmaschine
- Human-in-the-Loop- und Verbotsregeln
- harte Ablehnung aller Live-Aktionen
- Growth Score, ProductionBrief-Rückkanal und SHA-256-Auditkette
- sieben Tests und erfolgreiche CI

### MKT0-002 · Daten- und Event-Layer

- versionierte Domain Events
- append-only Event-Store mit Tenant-, Projekt-, Sequenz- und Hashprüfung
- deterministische Projektionen
- Postgres-/Supabase-kompatibler SQL-Vertrag mit RLS-Vorbereitung
- neun Tests und erfolgreiche CI

### MKT0-003 · Analytics & Growth Radar

- robuste Baselines und Datenqualitätsgates
- Growth-Indizes, Winner, Anomalien, Momentum und Sättigung
- nachvollziehbare Empfehlungen und Daily Growth Brief
- zehn Tests und erfolgreiche CI

### MKT0-004 · Community-, Trend- und Opportunity-Radar

- PII-Redaktion und datensparsame Aggregation
- Krisen-, Rechte- und Kollaborationseskalation
- Trend-Scoring, Opportunity Ranking und Direction Events
- 15 Tests und erfolgreiche CI

### MKT0-005 · Campaign-, Kalender- und Workflow-Orchestrator

- Kampagnenverträge, Workflow-Graph und Human Gates
- deterministischer Shadow-Scheduler
- Idempotenz, Retries, Dead-Letter, Kalender und Tagesplan
- 15 Tests und erfolgreiche CI

### MKT0-006 · Read-only Growth Cockpit

- acht read-only Ansichten
- `AVAILABLE`, `UNKNOWN` und `NOT_AVAILABLE`
- Secret-, Kontakt- und Rohdatensperren
- CSP, HTML-Escaping und statischer Export
- 15 Tests und erfolgreiche CI

### MKT0-007 · Operations, Security und Resilience

- Betriebsmodi, Kill Switch und Modulschalter
- SEV0-bis-SEV3-Incident-Triage
- hashprüfbare Backup-Manifeste und `DRY_RUN_ONLY`-Restore
- Retention, Secret-Inventar, Readiness und Runbooks
- 18 Tests und erfolgreiche CI

### MKT0-008 · Connector Contracts und Provider Sandbox

- deklarative Provider-Slots für Postiz, Meta, TikTok und YouTube
- Capability-Matrix für Publish, Status, Metrics, Comments, Replies und Webhooks
- Auth-Zustände ohne OAuth oder Secret-Werte
- ausschließlich synthetische `sandbox_*`-Account-Aliase
- deterministische Request-Pläne im Zustand `PLANNED_SHADOW`
- Payload-Hashes und Idempotenz
- Rate-Limit- und Backoff-Verträge
- Fehlerklassifikation
- normalisierte Publish-, Status-, Metric- und Community-Envelopes
- Webhook-Replay-, Alters- und Future-Skew-Prüfung
- synthetische Provider-Simulation im Zustand `SIMULATED`
- Connector-Portfolio-Readiness mit Live-Readiness `0`
- 22 Connector-Tests und erfolgreiche CI
- GitHub Actions Run `29150151717` erfolgreich

MKT0-008 enthält keinen HTTP-Client, keine Endpoint-Basis, keine OAuth-Verbindung und keine echte Plattformaktion.

## Ausführbare Befehle

```bash
npm run growth:check
npm run growth:demo
npm run growth:data-check
npm run growth:analytics-check
npm run growth:signals-check
npm run growth:orchestrator-check
npm run growth:cockpit-check
npm run growth:operations-check
npm run growth:connectors-check
npm run test:growth
npm test
```

Erzeugte lokale Reports:

```text
output/growth-os/mkt0-shadow-demo.json
output/growth-os/mkt0-growth-radar.json
output/growth-os/mkt0-signal-radar.json
output/growth-os/mkt0-orchestrator.json
output/growth-os/mkt0-growth-cockpit.json
output/growth-os/mkt0-growth-cockpit.html
output/growth-os/mkt0-operations-readiness.json
output/growth-os/mkt0-connector-sandbox.json
```

Alle Reports verwenden ausschließlich synthetische Daten.

## Modulfluss

```text
EpisodePackage
→ Contract Validation
→ SocialVariant Plan
→ Campaign Plan
→ Workflow Graph
→ Operations Gate
→ Connector Request Plan
→ PLANNED_SHADOW
→ Provider Sandbox
→ SIMULATED Envelope
→ Domain Events
→ Growth Radar
→ Signal Radar
→ Read-only Cockpit
→ menschliche Richtungsentscheidung
→ Studio
```

## Harte Grenzen

- kein Live-Publishing oder echtes Scheduling
- keine öffentliche Antwort, DM, Löschung oder Moderation
- kein HTTP, DNS, Socket oder echter Provider-Endpunkt
- kein OAuth und keine Secret-Werte
- keine realen Account-, Channel-, Page- oder Profile-IDs
- keine reale Plattformmetrik, echter Kommentar oder echte Webhook-Signatur
- keine Remote-Datenbankmigration, produktiven Backups oder Restores
- keine automatische Incident-Lösung, Datenlöschung oder Live-Hochstufung
- keine autonome Canon-, Figuren-, Dialog-, Voice- oder Produktionsänderung
- synthetische Daten beweisen weder Plattformkompatibilität noch reale Performance
- kein Merge in `main`, solange die Recovery-Linie Growth OS verbietet

## `NOT_YET_BUILT`

- echte Postgres-/Supabase-Anbindung und produktive RLS-Beweise
- produktive Queue- und Scheduler-Worker
- echte Provider-Adapter und OAuth-Flows
- echte Trend-, Community- und Metrikimporte
- produktiver Cockpit-Deploy und Authentication
- Remote-Backup, echter Restore und produktive RPO-/RTO-Messung
- externe Alarmierung und unveränderbare Audit-Verankerung

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
- Runbooks: `growth-os/runbooks/`
- Evidence: `growth-os/evidence/MKT0-001.md` bis `MKT0-008.md`
- Tests: `tests/growth-os*.test.mjs`
- Persistenzvertrag: `growth-os/sql/001_growth_os_foundation.sql`
- Single Source of Truth: Issue #34
- MKT0-008 Tracking: Issue #67
