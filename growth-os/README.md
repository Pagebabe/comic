# Comic Growth OS · MKT0

Status: `MKT0-001–010 PROVEN · SHADOW_RELEASE_READY · LIVE ACTIONS BLOCKED · MAIN INTEGRATION BLOCKED`

MKT0 ist die auditierbare Shadow-Schicht zwischen Comic-Studio und späterer Distribution. Das System bleibt im isolierten Marketing-Branch, verändert weder Canon noch Produktion und besitzt absichtlich keinen Live-Publishing-Zustand.

## Bewiesene Module

### MKT0-001 · Shadow-Kern

EpisodePackage-Vertrag, Social-Varianten, Policy, Shadow-Jobs, Growth Score, Production Brief und SHA-256-Auditkette. Sieben Tests und erfolgreiche CI.

### MKT0-002 · Daten- und Event-Layer

Versionierte Domain Events, append-only Event Store, Scope-, Sequenz- und Hashprüfung, deterministische Projektionen sowie Postgres-/RLS-Vertrag. Neun Tests und erfolgreiche CI.

### MKT0-003 · Analytics & Growth Radar

Robuste Baselines, Datenqualitätsgates, Winner, Anomalien, Momentum, Sättigung, Empfehlungen, Direction Events und Daily Growth Brief. Zehn Tests und erfolgreiche CI.

### MKT0-004 · Community-, Trend- und Opportunity-Radar

PII-Redaktion, datensparsame Aggregation, Krisen-, Rechte- und Kollaborationseskalation, Trend Scoring und Direction Events. 15 Tests und erfolgreiche CI.

### MKT0-005 · Campaign-, Kalender- und Workflow-Orchestrator

Kampagnenverträge, Workflow-Graph, Human Gates, Shadow-Scheduler, Idempotenz, Retries, Dead Letter, Kalender und Tagesplan. 15 Tests und erfolgreiche CI.

### MKT0-006 · Read-only Growth Cockpit

Acht read-only Ansichten, `AVAILABLE`/`UNKNOWN`/`NOT_AVAILABLE`, Secret- und Rohdatensperren, CSP, Escaping und statischer Export. 15 Tests und erfolgreiche CI.

### MKT0-007 · Operations, Security und Resilience

Betriebsmodi, Kill Switch, Incident Lockdown, Backup-Manifeste, Dry-Run-Restore, Retention, Readiness und Runbooks. 18 Tests und erfolgreiche CI.

### MKT0-008 · Connector Contracts und Provider Sandbox

Provider-Slots, Capability-Matrix, Auth-Zustände, `PLANNED_SHADOW`-Requests, Idempotenz, Rate Limits, Envelopes, Webhook-Schutz und `SIMULATED`-Antworten. 22 Tests und erfolgreiche CI.

### MKT0-009 · Integrated Shadow Runtime & Replay Lab

Deterministischer End-to-End-Lauf mit Runtime Journal, Domain Event Store, Checkpoints, Base-/Full-Replay, fünf Szenarien, Quarantäne, integriertem Analytics Radar und Evidence Bundle. 30 Tests und erfolgreiche CI.

Die fehlgeschlagenen Vorläufe `29150651504` und `29152595989` bleiben im MKT0-009-Evidence Packet dokumentiert. Sie führten zu nachvollziehbaren Korrektur-Commits statt zu einer bereinigten Erfolgserzählung.

### MKT0-010 · Finaler Shadow Release und Deployment-Readiness

Bewiesen vorhanden:

- Release-Manifest für MKT0-001 bis MKT0-009
- SHA-256-Prüfung aller neun Evidence-Pakete
- Trace- und Causation-Graph
- statische Prüfung des Postgres-/RLS-Vertrags
- klare Trennung `SHADOW_RELEASE_READY` und `LIVE_READY`
- 17 produktive Gates mit Owner-Rollen
- externe Evidence nur mit Zeitstempel und menschlicher Verifikation
- kein automatischer Gate-Abschluss
- acht sichere Failure-Szenarien
- Aktivierungscheckliste und Release-Runbook
- statischer read-only JSON-/HTML-Release-Report
- 20 Release-Tests
- GitHub Actions Run `29154848192` erfolgreich

MKT0-010 beweist `SHADOW_RELEASE_READY`. `LIVE_READY` bleibt blockiert, solange Remote-Datenbank, RLS-Runtime-Test, Auth, OAuth, Worker, Scheduler, Backup/Restore, Observability, Security Review und menschliche Live-Freigabe fehlen.

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
npm run growth:release-check
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
output/growth-os/mkt0-final-release.json
output/growth-os/mkt0-final-release.html
```

Alle Reports verwenden ausschließlich synthetische Daten oder Repository-Evidence.

## Integrierter Modulfluss

```text
EpisodePackage
→ Core + Policy
→ Campaign + Workflow
→ Domain Events + Event Store
→ Signal Radar
→ Operations Gate
→ Connector Sandbox
→ Read-only Cockpit
→ Analytics Radar
→ Runtime Journal + Checkpoints
→ Replay + Evidence Bundle
→ Finales Release-Manifest
→ Deployment-Gate-Matrix
```

## Testumfang

```text
MKT0-001      7
MKT0-002      9
MKT0-003     10
MKT0-004     15
MKT0-005     15
MKT0-006     15
MKT0-007     18
MKT0-008     22
MKT0-009     30
MKT0-010     20
─────────────────
Gesamt       161
```

## Harte Grenzen

- kein Live-Publishing oder echtes Scheduling
- keine öffentliche Antwort, DM, Löschung oder Moderation
- kein HTTP, DNS, Socket oder echter Provider-Endpunkt
- kein OAuth und keine Secret-Werte
- keine realen Account-, Channel-, Page- oder Profile-IDs
- keine reale Plattformmetrik, Community-Nachricht oder echte Webhook-Signatur
- keine Remote-Datenbankmigration, produktiven Backups oder Restores
- kein Umgehen von Human Gates, Kill Switch oder Incident Lockdown
- kein automatisches Resume oder Gate-Hochstufen
- kein Umschreiben des Runtime Journals
- kein Replay über Regelversionsgrenzen
- keine autonome Canon-, Figuren-, Dialog-, Voice- oder Produktionsänderung
- synthetische Daten beweisen weder Plattformkompatibilität noch reale Performance
- kein Merge in `main`, solange die Recovery-Linie Growth OS verbietet

## Noch extern zu beweisen

- produktive Postgres-/Supabase-Runtime und Migration-Dry-Run
- Cross-Tenant-RLS-Test
- Authentication und Managed Secret Store
- produktive Queue-, Scheduler- und Runtime-Worker
- echte Provider-Adapter, OAuth und App-Freigaben
- reale Webhook-Kryptografie
- Remote-Backup und echter Restore-Drill
- Observability, Alerting und externer Audit Anchor
- signiertes Security Review
- menschliche Live-Aktivierung

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
- Release: `docs/GROWTH_OS_RELEASE.md`
- Runbooks: `growth-os/runbooks/`
- Evidence: `growth-os/evidence/MKT0-001.md` bis `MKT0-010.md`
- Tests: `tests/growth-os*.test.mjs`
- Persistenzvertrag: `growth-os/sql/001_growth_os_foundation.sql`
- Single Source of Truth: Issue #34
- MKT0-010 Tracking: Issue #87
