# Comic Growth OS · MKT0 Architektur

Status: `SHADOW CORE IMPLEMENTED · LIVE DISTRIBUTION BLOCKED`

Repository: `Pagebabe/comic`

Autoritative Quelle: Issue #34

## Zweck

MKT0 ist die auditierbare Shadow-Schicht zwischen einem freigegebenen Studio-Produktionspaket und einer späteren Distribution. Der aktuelle Kern plant, prüft, simuliert, bewertet und erzeugt Produktionsbriefings. Er führt keine öffentliche Plattformaktion aus.

## Modulgrenzen

```text
Studio / M1R
  │
  │ EpisodePackage
  ▼
MKT0 Contract Validation
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

MKT0 verändert niemals Mastermedien, Canon, Figurenidentität, Dialog, Voice-Freigaben oder Produktionsstatus. Es erzeugt abgeleitete Pläne und Empfehlungen mit nachvollziehbarer Herkunft.

## Verträge

### EpisodePackage

Ein Paket muss mindestens enthalten:

- Schema-Version
- stabile Projekt-, Serien-, Episoden- und Paket-ID
- Titel und Dauer
- Quellenart `synthetic_fixture` oder `studio_export`
- Asset-Referenzen
- Rechte-Status
- passende Freigabe
- Tags und Figurenreferenzen

Synthetische Fixtures dürfen ausschließlich `APPROVED_FOR_SHADOW_DEMO` tragen. Studio-Exporte benötigen `PRODUCTION_APPROVED`. Dadurch kann eine Testdatei nicht durch bloßes Umbenennen als Produktionsfreigabe auftreten.

### SocialVariant

Der aktuelle Planer erzeugt deterministische Verträge für:

- TikTok
- Instagram Reels
- YouTube Shorts

Er erzeugt noch keine Medien. `renderRequired` beschreibt nur, ob eine spätere Packaging Engine schneiden oder neu rendern müsste.

### PublishJob

Zulässige Shadow-Zustände:

```text
DRAFT
→ POLICY_CHECK
→ APPROVED_SHADOW | WAITING_HUMAN | CANCELLED
→ SIMULATED | FAILED | CANCELLED
```

Ein Live-Zustand existiert absichtlich nicht. Dadurch kann der MKT0-Kern ohne spätere Codeänderung an einem Adapter keine öffentliche Veröffentlichung auslösen.

### PolicyDecision

- `ALLOW_SHADOW`
- `REQUIRE_HUMAN`
- `DENY`

Alle Live-Aktionen werden mit `MKT0_LIVE_ACTIONS_DISABLED` abgelehnt. Ungeklärte Rechte und sensible Tags erzeugen ein Human Gate.

### GrowthAnalysis

Der Score normalisiert Eingangsdaten gegen eine explizite Vergleichsbasis. Berücksichtigt werden:

- 3-Sekunden-Hold-Rate
- Completion Rate
- Share Rate
- Follower Conversion
- Watch Ratio
- Save Rate
- Comment Rate
- Produktionseffizienz

Klassifikationen:

- `OUTLIER` ab 150
- `WINNER` ab 120
- `BASELINE` ab 85
- `UNDERPERFORMER` darunter

Die Schwellen sind MKT0-Startwerte und keine behauptete Plattformwahrheit. Reale Kalibrierung bleibt `NOT_YET_BUILT`.

## Auditkette

Jedes Ereignis enthält:

- Sequenz
- Zeitstempel
- Ereignistyp
- Actor
- vorherigen Hash
- kanonisch serialisierte Daten
- SHA-256-Hash

Die Kette ist manipulationssichtbar, nicht manipulationssicher. Dauerhafte externe Verankerung, Signaturen und Datenbank-Persistenz bleiben spätere Stufen.

## Determinismus

Die Offline-Demo nutzt:

- feste synthetische Eingangsdaten
- festen Zeitstempel
- sortierte IDs und Plattformen
- kanonische JSON-Serialisierung
- keine Netzwerkanfragen
- keine Secrets

Gleicher Eingang muss bitgleich denselben Objektgraphen und denselben Audit-Head erzeugen.

## Human-in-the-Loop

Der Kern erlaubt automatische Shadow-Simulation nur bei risikoarmen Fällen. Menschliche Prüfung ist zwingend bei:

- ungeklärten Rechten
- sensiblen Inhalts-Tags
- späteren Live-Aktionen
- Canon-, Dialog-, Voice- oder Figurenänderungen
- neuen produktiven Plattformadaptern

## Harte Stop-Regeln

1. Kein Live-Publishing aus `growth-os/core.mjs`.
2. Keine öffentliche Antwort, DM, Löschung oder Veröffentlichung.
3. Keine reale Plattformmetrik als bewiesen ohne autorisierten Adapter und Rohdatenbeleg.
4. Kein synthetischer Datensatz als Beweis realer Performance.
5. Keine Empfehlung verändert automatisch Canon oder Produktionsassets.
6. Jede Entscheidung muss auf Daten, Policy-Version und Audit-Ereignisse zurückführbar sein.

## Noch nicht gebaut

- Postgres-/Supabase-Persistenz
- RLS und Service-Rollen
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
