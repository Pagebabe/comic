# Comic Growth OS · MKT0

Status: `CORE + DATA + GROWTH RADAR + SIGNAL RADAR PROVEN · LIVE ACTIONS BLOCKED · MAIN INTEGRATION BLOCKED`

MKT0 ist die auditierbare Shadow-Schicht zwischen Comic-Studio und späterer Distribution. Das Modul bleibt isoliert im Repository `Pagebabe/comic`, verändert weder Canon noch Produktion und besitzt absichtlich keinen Live-Publishing-Zustand.

## Implementiert und lokal bewiesen

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
- Themen-, Figuren- und Episodenwunsch-Signale
- Trend-Scoring nach Velocity, Brand Fit, Character Fit, Freshness, Sättigung, Rechte-Risiko und Produktionsaufwand
- Verfalls-, Brand- und Rechte-Sperren
- begrenzter Community-Nachfragebonus
- Opportunity Ranking, Direction Events und Daily Signal Brief
- 15 Signal-Radar-Tests
- GitHub Actions Run `29146823155` erfolgreich

MKT0-004 verwendet ausschließlich synthetische Fixtures. Echte Kommentar- und Trendimporte bleiben ausdrücklich unbewiesen.

## Ausführbare Befehle

```bash
npm run growth:check
npm run growth:demo
npm run growth:data-check
npm run growth:analytics-check
npm run growth:signals-check
npm run test:growth
npm test
```

Erzeugte lokale Reports:

```text
output/growth-os/mkt0-shadow-demo.json
output/growth-os/mkt0-growth-radar.json
output/growth-os/mkt0-signal-radar.json
```

Alle Reports verwenden ausschließlich synthetische Daten.

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
→ Growth Radar
→ Community + Trend Radar
→ Opportunity Review
→ Hypothesis + ProductionBrief Events
→ Studio
```

## Harte Grenzen

- kein Live-Publishing
- keine automatische öffentliche Antwort, DM, Löschung oder Moderation
- keine persönlichen Fanprofile
- kein Social-Konto und kein OAuth-Flow
- keine reale Plattformmetrik oder echte Trendquelle
- keine Remote-Datenbankmigration
- keine autonome Änderung von Figurenidentität, Canon, Dialog, Voice oder Produktionsfreigaben
- synthetische Daten sind kein Beweis realer Performance
- keine Follower- oder Millionenziel-Prognose ohne reale Daten
- kein Merge in `main`, solange die aktuelle Recovery-Linie Growth OS verbietet

## `NOT_YET_BUILT`

- echte Postgres-/Supabase-Anbindung und produktive RLS-Beweise
- produktive Queue-Worker
- Packaging- und Render-Engine
- echte Trend-, Community- und Metrikimporte
- Forecasting mit echten Zeitreihen
- Growth-Cockpit
- Betriebs-, Incident-, Backup- und Restore-Laufbeweise
- externe unveränderbare Audit-Verankerung

## `BLOCKED_BY_EXTERNAL_CREDENTIALS`

- produktive Instagram-, TikTok-, YouTube- und weitere Plattformadapter
- OAuth-Verbindungen
- reales Publishing
- reale Plattformmetriken
- öffentliche Community-Aktionen

Live-Funktionen bleiben bis zu Plattformfreigabe, Runtime-Test, vollständigem Evidence Packet und menschlicher Abnahme gesperrt.

## Beweiskette

- Kern: `docs/GROWTH_OS_ARCHITECTURE.md`
- Datenmodell: `docs/GROWTH_OS_DATA_MODEL.md`
- Analytics: `docs/GROWTH_OS_ANALYTICS.md`
- Signale: `docs/GROWTH_OS_SIGNALS.md`
- Evidence: `growth-os/evidence/MKT0-001.md` bis `MKT0-004.md`
- Tests: `tests/growth-os*.test.mjs`
- Persistenzvertrag: `growth-os/sql/001_growth_os_foundation.sql`
- Single Source of Truth: Issue #34
- MKT0-004 Tracking: Issue #50
