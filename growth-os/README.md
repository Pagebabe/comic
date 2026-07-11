# Comic Growth OS · MKT0

Status: `CORE + DATA + GROWTH RADAR + SIGNAL RADAR + ORCHESTRATOR + COCKPIT + OPERATIONS PROVEN · LIVE ACTIONS BLOCKED · MAIN INTEGRATION BLOCKED`

MKT0 ist die auditierbare Shadow-Schicht zwischen Comic-Studio und späterer Distribution. Das Modul bleibt isoliert im Repository `Pagebabe/comic`, verändert weder Canon noch Produktion und besitzt absichtlich keinen Live-Publishing-Zustand.

## Bewiesene Module

### MKT0-001 · Shadow-Kern

- EpisodePackage-Validierung und deterministische Social-Varianten
- Shadow-PublishJob-Zustandsmaschine
- Human-in-the-Loop- und Verbotsregeln
- harte Ablehnung aller Live-Aktionen
- Growth Score, ProductionBrief-Rückkanal und SHA-256-Auditkette
- Offline-End-to-End-Demo und sieben Tests

### MKT0-002 · Daten- und Event-Layer

- versionierte Domain Events
- append-only Event-Store mit Tenant-, Projekt-, Sequenz- und Hashprüfung
- deterministische Projektionen
- Postgres-/Supabase-kompatibler SQL-Vertrag mit RLS-Vorbereitung
- neun Tests und erfolgreiche CI

### MKT0-003 · Analytics & Growth Radar

- robuste Median-/Perzentil-Baselines
- Datenqualitätsgates statt Fantasiescores
- Hook-, Completion-, Share-, Conversion-, Watch-, Rewatch- und Efficiency-Indizes
- Winner-, Outlier-, Underperformer-, Anomalie-, Momentum- und Sättigungslogik
- nachvollziehbare Empfehlungen und Direction Events
- Daily Growth Brief, zehn Tests und erfolgreiche CI

### MKT0-004 · Community-, Trend- und Opportunity-Radar

- PII-Redaktion für E-Mail, Telefon und URLs
- Community-Kategorien, Dringlichkeit und Human-Gates
- Krisen-, Rechte- und Kollaborationseskalation
- Shadow-Antwortentwürfe ohne Veröffentlichungsrecht
- datensparsame Aggregation ohne Rohtexte oder persönliche Profile
- Trend-Scoring, Verfall, Brand- und Rechte-Sperren
- Opportunity Ranking, Direction Events und Daily Signal Brief
- 15 Tests und erfolgreiche CI

### MKT0-005 · Campaign-, Kalender- und Workflow-Orchestrator

- versionierte Kampagnen- und Content-Plan-Verträge
- Zeitzonen- und Veröffentlichungsfenster
- Abhängigkeitsgraph mit Zyklusprüfung
- Workflow von Packaging bis Iteration
- Automationsvertrauen Level 0 bis 4
- Einzel- und Bulk-Human-Gates
- deterministischer Shadow-Scheduler
- Idempotenz, begrenzte Retries und Dead-Letter
- Kalenderprojektion, Tagesplan und Engpassbericht
- 15 Tests und erfolgreiche CI

### MKT0-006 · Read-only Growth Cockpit

- deterministischer View-Model-Vertrag
- acht Ansichten: Heute, Wachstum, Content, Community, Radar, Lernen, System und Audit
- klare Datenzustände `AVAILABLE`, `UNKNOWN` und `NOT_AVAILABLE`
- sichtbare Provenienz und Shadow-Warnung
- Secret-, Kontakt- und Rohdaten-Sperren
- HTML-Escaping und restriktive Content-Security-Policy
- keine externen Ressourcen, Tracker, Scripts oder mutierenden Controls
- responsive Desktop-/Mobilstruktur
- statischer JSON- und HTML-Export
- 15 Tests und erfolgreiche CI

### MKT0-007 · Operations, Security und Resilience

- Betriebsmodi `SHADOW`, `PAUSED` und `INCIDENT_LOCKDOWN`
- globaler Kill Switch und Modulschalter
- SEV0-bis-SEV3-Incident-Triage
- zwingender Lockdown bei SEV0 und SEV1
- keine automatische Incident-Lösung oder Lockdown-Aufhebung
- sortierte, hashprüfbare Backup-Manifeste
- `DRY_RUN_ONLY`-Restore-Pläne
- synthetischer Restore-Drill
- explizite Retention- und Legal-Hold-Regeln
- Secret-Inventar ohne Secret-Werte
- Readiness- und Degraded-State-Projektion
- lokales Audit-Anchor-Manifest
- Incident-, Backup-, Restore- und Security-Runbooks
- 18 Tests und erfolgreiche CI
- GitHub Actions Run `29149790390` erfolgreich

MKT0-007 führt kein Remote-Backup, keinen echten Restore, keine externe Alarmierung und keine externe Audit-Verankerung aus.

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
→ Human Gate
→ Calendar + Scheduler Simulation
→ APPROVED_SHADOW Job
→ Domain Events
→ Append-only Event Store
→ Growth Radar
→ Community + Trend Radar
→ Opportunity Review
→ Hypothesis + ProductionBrief Events
→ Read-only Growth Cockpit
→ Menschliche Richtungsentscheidung
→ Studio
```

## Betriebs- und Notfallfluss

```text
Health + Incident Signal
→ Incident Triage
→ Kill Switch / Module Stop
→ PAUSED oder INCIDENT_LOCKDOWN
→ Backup Manifest Verify
→ DRY_RUN Restore Plan
→ Synthetic Restore Drill
→ Readiness Projection
→ Menschliche Freigabe
```

## Harte Grenzen

- kein Live-Publishing
- kein echtes Scheduling
- keine automatische öffentliche Antwort, DM, Löschung oder Moderation
- keine persönlichen Fanprofile
- kein Social-Konto und kein OAuth-Flow
- keine reale Plattformmetrik oder echte Trendquelle
- keine Remote-Datenbankmigration
- keine externen Kalenderzugriffe
- keine mutierenden Cockpit-Controls
- keine produktiven Backups oder Restores
- keine Secret-Werte im Repository oder Output
- keine automatische Incident-Lösung oder Lockdown-Aufhebung
- keine automatische Datenlöschung
- keine externe Alarmierung oder Audit-Verankerung
- keine autonome Änderung von Figurenidentität, Canon, Dialog, Voice oder Produktionsfreigaben
- synthetische Daten sind kein Beweis realer Performance oder produktiver Resilience
- kein Merge in `main`, solange die aktuelle Recovery-Linie Growth OS verbietet

## `NOT_YET_BUILT`

- echte Postgres-/Supabase-Anbindung und produktive RLS-Beweise
- produktive Queue- und Scheduler-Worker
- Packaging- und Render-Engine
- echte Trend-, Community- und Metrikimporte
- Forecasting mit echten Zeitreihen
- produktiver Cockpit-Deploy, Authentication und Benutzerverwaltung
- Remote-Backup und produktiver Restore
- produktive RPO-/RTO-Messung
- externe Alarmierung und Pager-Anbindung
- externe unveränderbare Audit-Verankerung

## `BLOCKED_BY_EXTERNAL_CREDENTIALS`

- produktive Instagram-, TikTok-, YouTube- und weitere Plattformadapter
- OAuth-Verbindungen
- reales Scheduling und Publishing
- reale Plattformmetriken
- öffentliche Community-Aktionen
- Remote-Storage, Datenbank und externe Audit-Anker

Live-Funktionen bleiben bis zu Plattformfreigabe, Runtime-Test, vollständigem Evidence Packet und menschlicher Abnahme gesperrt.

## Beweiskette

- Kern: `docs/GROWTH_OS_ARCHITECTURE.md`
- Datenmodell: `docs/GROWTH_OS_DATA_MODEL.md`
- Analytics: `docs/GROWTH_OS_ANALYTICS.md`
- Signale: `docs/GROWTH_OS_SIGNALS.md`
- Orchestrator: `docs/GROWTH_OS_ORCHESTRATOR.md`
- Cockpit: `docs/GROWTH_OS_COCKPIT.md`
- Operations: `docs/GROWTH_OS_OPERATIONS.md`
- Runbooks: `growth-os/runbooks/`
- Evidence: `growth-os/evidence/MKT0-001.md` bis `MKT0-007.md`
- Tests: `tests/growth-os*.test.mjs`
- Persistenzvertrag: `growth-os/sql/001_growth_os_foundation.sql`
- Single Source of Truth: Issue #34
- MKT0-007 Tracking: Issue #63
