# Comic Growth OS · MKT0

Status: `SHADOW CORE IMPLEMENTED · PENDING FINAL CI · LIVE ACTIONS BLOCKED`

MKT0 ist die auditierbare Shadow-Schicht zwischen Comic-Studio und späterer Distribution. Das Modul bleibt im Repository `Pagebabe/comic`, verändert den aktiven Produktionsmeilenstein `M1R` nicht und besitzt absichtlich keinen Live-Publishing-Zustand.

## Implementiert

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
- sieben Growth-OS-Tests
- Einbindung in `npm test` und `npm run check`

Die Implementierung wurde lokal reproduzierbar geprüft. Terminal `PROVEN` wird erst nach erfolgreicher CI auf dem finalen PR-Commit gesetzt.

## Ausführbare Befehle

```bash
npm run growth:check
npm run growth:demo
npm run test:growth
npm test
```

`growth:demo` verwendet ausschließlich synthetische Daten und schreibt nach:

```text
output/growth-os/mkt0-shadow-demo.json
```

## Modulfluss

```text
EpisodePackage
→ Contract Validation
→ SocialVariant Plan
→ Policy Gate
→ Shadow PublishJob
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
- keine automatische Änderung von Figurenidentität, Canon, Dialog, Voice oder Produktionsfreigaben
- synthetische Daten sind kein Beweis realer Performance

## `NOT_YET_BUILT`

- Postgres-/Supabase-Schema und RLS
- produktive Queue-Worker
- Packaging- und Render-Engine
- Trend- und Community-Radar
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

- Architektur: `docs/GROWTH_OS_ARCHITECTURE.md`
- Evidence Packet: `growth-os/evidence/MKT0-001.md`
- Tests: `tests/growth-os.test.mjs`
- Single Source of Truth: Issue #34
- Review: Draft-PR #35
