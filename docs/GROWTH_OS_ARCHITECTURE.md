# Comic Growth OS · MKT0 Architektur

Status: `SHADOW CORE IMPLEMENTED · LIVE DISTRIBUTION BLOCKED`

Repository: `Pagebabe/comic`

Autoritative Quelle: Issue #34

## Zweck

MKT0 ist die auditierbare Shadow-Schicht zwischen einem freigegebenen Studio-Produktionspaket und einer späteren Distribution. Der aktuelle Kern plant, prüft, simuliert, bewertet und erzeugt Produktionsbriefings. Er führt keine öffentliche Plattformaktion aus.

## Modulgrenzen

```text
Studio
  │ EpisodePackage
  ▼
Contract Validation
  ▼
Social Variant Planning
  ▼
Policy Gate
  ▼
Shadow Publish Job State Machine
  ▼
Metric Normalization + Growth Analysis
  ▼
Production Brief
  ▼
Studio
```

MKT0 verändert niemals Mastermedien, Canon, Figurenidentität, Dialog, Voice-Freigaben oder Produktionsstatus. Es erzeugt nur abgeleitete Pläne und Empfehlungen.

## Verträge

### EpisodePackage

Erforderlich sind Schema-Version, stabile IDs, Titel, Dauer, Quellenart, Asset-Referenzen, Rechte-Status und passende Freigabe.

Synthetische Fixtures dürfen ausschließlich `APPROVED_FOR_SHADOW_DEMO` tragen. Studio-Exporte benötigen `PRODUCTION_APPROVED`. Dadurch kann eine Testdatei nicht durch bloßes Umbenennen als Produktionsfreigabe auftreten.

### SocialVariant

Der Planer erzeugt deterministische Verträge für TikTok, Instagram Reels und YouTube Shorts. Er erzeugt noch keine Medien. `renderRequired` beschreibt nur, ob eine spätere Packaging Engine schneiden oder neu rendern müsste.

### PublishJob

```text
DRAFT
→ POLICY_CHECK
→ APPROVED_SHADOW | WAITING_HUMAN | CANCELLED
→ SIMULATED | FAILED | CANCELLED
```

Ein Live-Zustand existiert absichtlich nicht.

### PolicyDecision

- `ALLOW_SHADOW`
- `REQUIRE_HUMAN`
- `DENY`

Alle Live-Aktionen werden mit `MKT0_LIVE_ACTIONS_DISABLED` abgelehnt. Ungeklärte Rechte und sensible Tags erzeugen ein Human Gate.

### GrowthAnalysis

Der Score normalisiert Eingangsdaten gegen eine explizite Vergleichsbasis. Berücksichtigt werden 3-Sekunden-Hold-Rate, Completion Rate, Share Rate, Follower Conversion, Watch Ratio, Save Rate, Comment Rate und Produktionseffizienz.

Klassifikationen:

- `OUTLIER` ab 150
- `WINNER` ab 120
- `BASELINE` ab 85
- `UNDERPERFORMER` darunter

Diese Schwellen sind MKT0-Startwerte und keine behauptete Plattformwahrheit.

## Auditkette

Jedes Ereignis enthält Sequenz, Zeitstempel, Ereignistyp, Actor, vorherigen Hash, kanonisch serialisierte Daten und SHA-256-Hash.

Die Kette ist manipulationssichtbar, nicht manipulationssicher. Externe Signaturen und unveränderbare Verankerung bleiben spätere Stufen.

## Determinismus

Die Offline-Demo nutzt feste synthetische Eingangsdaten, festen Zeitstempel, sortierte IDs, kanonische JSON-Serialisierung, keine Netzwerkanfragen und keine Secrets. Gleicher Eingang muss denselben Objektgraphen und denselben Audit-Head erzeugen.

## Human-in-the-Loop

Menschliche Prüfung ist zwingend bei ungeklärten Rechten, sensiblen Inhalten, späteren Live-Aktionen, Canon-/Dialog-/Voice-/Figurenänderungen und neuen produktiven Plattformadaptern.

## Harte Stop-Regeln

1. Kein Live-Publishing aus `growth-os/core.mjs`.
2. Keine öffentliche Antwort, DM, Löschung oder Veröffentlichung.
3. Keine reale Plattformmetrik als bewiesen ohne autorisierten Adapter und Rohdatenbeleg.
4. Kein synthetischer Datensatz als Beweis realer Performance.
5. Keine Empfehlung verändert automatisch Canon oder Produktionsassets.
6. Jede Entscheidung bleibt auf Daten, Policy-Version und Audit-Ereignisse zurückführbar.

## Noch nicht gebaut

- Postgres-/Supabase-Persistenz und RLS
- echte Queue-Worker
- Packaging-/Render-Engine
- OAuth und Plattformadapter
- reale Metrikimporte
- Trend- und Community-Radar
- Growth-Cockpit
- externe Audit-Verankerung
- Restore- und Disaster-Recovery-Laufbeweis

## Betriebsbefehle

```bash
npm run growth:check
npm run growth:demo
npm run test:growth
npm test
```

`growth:demo` schreibt ausschließlich einen synthetischen Report nach `output/growth-os/mkt0-shadow-demo.json`.
