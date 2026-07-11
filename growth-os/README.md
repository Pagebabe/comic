# Comic Growth OS · MKT0

Status: `SHADOW CORE + DATA LAYER + GROWTH RADAR PROVEN · LIVE ACTIONS BLOCKED · MAIN INTEGRATION BLOCKED`

MKT0 ist die auditierbare Shadow-Schicht zwischen Comic-Studio und späterer Distribution. Das Modul bleibt isoliert im Repository `Pagebabe/comic`, verändert weder Canon noch Produktion und besitzt absichtlich keinen Live-Publishing-Zustand.

## Implementiert und lokal bewiesen

### MKT0-001 · Shadow-Kern

- strikte EpisodePackage-Validierung
- deterministische Variantenplanung für TikTok, Instagram Reels und YouTube Shorts
- PublishJob-Zustandsmaschine ausschließlich für Shadow-Simulationen
- Human-in-the-Loop- und Verbotsregeln
- harte Ablehnung aller Live-Aktionen
- Metriknormalisierung gegen eine explizite Baseline
- Growth Score, Diagnosen und Folgeaktionen
- ProductionBrief-Rückkanal zum Studio
- manipulationssichtbare SHA-256-Auditkette
- deterministische Offline-End-to-End-Demo
- sieben Kern-Tests

### MKT0-002 · Daten- und Event-Layer

- versionierte Domain Events für Kampagnen, Content, Varianten, Jobs, Metriken, Kommentare, Trends, Hypothesen, Experimente und Produktionsbriefings
- deterministischer append-only Event-Store
- eindeutige Event-IDs und lückenlose Sequenzen pro Stream
- Tenant- und Projektgrenzen in jedem Vertrag
- globale SHA-256-Integritätskette
- referenzgeprüfte deterministische Projektionen
- Postgres-/Supabase-kompatibler SQL-Vertrag
- Append-only-Trigger, Foreign Keys, Indizes und RLS-Vorbereitung
- neun Datenlayer-Tests
- GitHub Actions Runs `29146229591` und `29146278018` erfolgreich

### MKT0-003 · Analytics & Growth Radar

- versionierte Performance-Snapshot-Verträge
- robuste Median- und Perzentil-Baselines
- Segment-, Plattform- und globale Fallbacks
- Hold statt Fantasiescore bei unzureichenden Daten
- Hook-, Completion-, Share-, Conversion-, Watch-, Rewatch- und Efficiency-Indizes
- Winner-, Outlier-, Baseline- und Underperformer-Klassifikation
- Datenqualitäts- und Anomaliewarnungen
- Momentum- und Sättigungsanalyse
- nachvollziehbare Empfehlungen mit Regel-ID und Begründung
- deterministische Hypothesis- und Production-Brief-Events
- Daily Growth Brief
- zehn Analytics-Tests
- GitHub Actions Run `29146520406` erfolgreich

MKT0-003 verwendet derzeit ausschließlich synthetische Fixtures. Reale Plattformdaten und Forecasting bleiben ausdrücklich unbewiesen.

## Ausführbare Befehle

```bash
npm run growth:check
npm run growth:demo
npm run growth:data-check
npm run growth:analytics-check
npm run test:growth
npm test
```

`growth:demo` schreibt nach `output/growth-os/mkt0-shadow-demo.json`. `growth:analytics-check` schreibt nach `output/growth-os/mkt0-growth-radar.json`. Beide verwenden ausschließlich synthetische Daten.

## Modulfluss

```text
EpisodePackage
→ Contract Validation
→ SocialVariant Plan
→ Policy Gate
→ Shadow PublishJob
→ Domain Events
→ Append-only Event Store
→ Growth Projection
→ Robust Baseline
→ Data Quality Gate
→ Growth Radar
→ Hypothesis + ProductionBrief Events
→ Studio
```

## Harte Grenzen

- kein Live-Publishing
- keine öffentliche Antwort, DM oder Löschung
- kein Social-Konto und kein OAuth-Flow
- keine reale Plattformmetrik
- keine Remote-Datenbankmigration
- keine produktiv bewiesene RLS-Wirkung
- keine autonome Änderung von Figurenidentität, Canon, Dialog, Voice oder Produktionsfreigaben
- synthetische Daten sind kein Beweis realer Performance
- keine Follower- oder Millionenziel-Prognose ohne reale Daten
- kein Merge in `main`, solange die aktuelle Recovery-Linie Growth OS verbietet

## `NOT_YET_BUILT`

- echte Postgres-/Supabase-Anbindung
- produktive RLS- und Backup-/Restore-Beweise
- produktive Queue-Worker
- Packaging- und Render-Engine
- echte Trend- und Community-Datenimporte
- reale Plattformmetriken
- Forecasting mit echten Zeitreihen
- Growth-Cockpit
- Betriebs-, Incident- und Restore-Laufbeweise
- externe Audit-Signatur oder unveränderbare Verankerung

## `BLOCKED_BY_EXTERNAL_CREDENTIALS`

- produktive Instagram-, TikTok-, YouTube- und weitere Plattformadapter
- OAuth-Verbindungen
- reales Publishing
- reale Plattformmetriken
- öffentliche Community-Aktionen

Live-Funktionen bleiben zusätzlich bis zu Plattformfreigabe, Runtime-Test, vollständigem Evidence Packet und menschlicher Abnahme gesperrt.

## Beweiskette

- Kernarchitektur: `docs/GROWTH_OS_ARCHITECTURE.md`
- Datenmodell: `docs/GROWTH_OS_DATA_MODEL.md`
- Analytics: `docs/GROWTH_OS_ANALYTICS.md`
- MKT0-001 Evidence: `growth-os/evidence/MKT0-001.md`
- MKT0-002 Evidence: `growth-os/evidence/MKT0-002.md`
- MKT0-003 Evidence: `growth-os/evidence/MKT0-003.md`
- Kern-Tests: `tests/growth-os.test.mjs`
- Daten-Tests: `tests/growth-os-data.test.mjs`
- Analytics-Tests: `tests/growth-os-analytics.test.mjs`
- Persistenzvertrag: `growth-os/sql/001_growth_os_foundation.sql`
- Single Source of Truth: Issue #34
- MKT0-003 Tracking: Issue #48
