# Comic Growth OS · MKT0

Status: `SHADOW CORE + DATA LAYER PROVEN · LIVE ACTIONS BLOCKED · REMOTE PERSISTENCE NOT_YET_BUILT · MAIN INTEGRATION BLOCKED`

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
- GitHub Actions Run `29146229591` erfolgreich

Die SQL-Datei ist ein geprüfter Vertrag. Sie wurde nicht an einer Remote-Datenbank ausgeführt. Der gesamte Growth-OS-Branch bleibt wegen der aktuellen Produktions-Stop-Regel außerhalb von `main`.

## Ausführbare Befehle

```bash
npm run growth:check
npm run growth:demo
npm run growth:data-check
npm run test:growth
npm test
```

`growth:demo` verwendet ausschließlich synthetische Daten und schreibt nach `output/growth-os/mkt0-shadow-demo.json`.

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
→ Metric Normalization
→ GrowthAnalysis
→ ProductionBrief
→ Studio
```

## Harte Grenzen

- kein Live-Publishing
- keine öffentliche Antwort, DM oder Löschung
- kein Social-Konto und kein OAuth-Flow
- keine reale Plattformmetrik
- keine Remote-Datenbankmigration
- keine produktiv bewiesene RLS-Wirkung
- keine automatische Änderung von Figurenidentität, Canon, Dialog, Voice oder Produktionsfreigaben
- synthetische Daten sind kein Beweis realer Performance
- kein Merge in `main`, solange die aktuelle Recovery-Linie Growth OS verbietet

## `NOT_YET_BUILT`

- echte Postgres-/Supabase-Anbindung
- produktive RLS- und Backup-/Restore-Beweise
- produktive Queue-Worker
- Packaging- und Render-Engine
- Trend- und Community-Radar als Datenimport
- reale Metrikimporte
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
- MKT0-001 Evidence: `growth-os/evidence/MKT0-001.md`
- MKT0-002 Evidence: `growth-os/evidence/MKT0-002.md`
- Kern-Tests: `tests/growth-os.test.mjs`
- Daten-Tests: `tests/growth-os-data.test.mjs`
- Persistenzvertrag: `growth-os/sql/001_growth_os_foundation.sql`
- Single Source of Truth: Issue #34
- MKT0-002 Tracking: Issue #46
