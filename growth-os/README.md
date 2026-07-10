# Comic Growth OS · MKT0

Status: `FOUNDATION DOCUMENTED · IMPLEMENTATION NOT_YET_BUILT · LIVE ACTIONS BLOCKED`

MKT0 ist die geplante auditierbare Shadow-Schicht zwischen Comic-Studio und späterer Distribution. Das Modul bleibt im Repository `Pagebabe/comic`, nutzt künftig dieselbe Daten- und Beweiskette und verändert den aktiven Produktionsmeilenstein `M1R` nicht.

## Bewiesener Stand

- Issue #34 ist die verbindliche Single Source of Truth für MKT0.
- Der Arbeitsbranch `feature/mkt0-growth-os` existiert.
- Diese Datei dokumentiert Scope, Modulfluss, Grenzen und ehrlichen Implementierungsstatus.
- M1R, Canon, Figuren, Stimmen, Panels und Episodenstatus wurden durch MKT0 nicht verändert.
- Es wurde kein Social-Konto verbunden, kein realer Post veröffentlicht und keine reale Plattformmetrik importiert.

## `NOT_YET_BUILT`

- Episode-Paketvalidierung
- plattformspezifische Variantenplanung
- Publish-Job-Zustandsmaschine
- Human-in-the-Loop- und Verbotsregeln als Code
- Metriknormalisierung und Growth Scoring
- Community- und Trendsignalverarbeitung
- Hypothesen, Experimente und Produktionsbriefings
- manipulationssichtbare Audit-Hashkette
- gemeinsame Postgres-/Supabase-Migrationen und RLS
- Offline-End-to-End-Demo
- Growth-OS-Tests und CI-Integration
- Growth-Cockpit
- Betriebs-, Security-, Incident- und Restore-Dokumentation

## `BLOCKED_BY_EXTERNAL_CREDENTIALS`

- echte OAuth-Verbindungen
- reales Publishing
- reale Plattformmetriken
- automatische öffentliche Antworten
- produktive Instagram-, TikTok-, YouTube- oder weitere Plattformadapter

Diese Funktionen bleiben zusätzlich bis zu Plattformfreigabe, Runtime-Test, vollständigem Evidence Packet und menschlicher Abnahme gesperrt.

## Geplanter Modulfluss

```text
freigegebenes EpisodePackage
→ SocialVariant
→ PublishJob
→ Human Gate
→ MetricSnapshot
→ GrowthAnalysis
→ Hypothesis
→ ProductionBrief
→ Studio
```

## Geplante Befehle

Die folgenden Befehle sind Zielverträge und existieren noch nicht:

```bash
npm run growth:demo
npm run growth:check
```

`npm test` bleibt das bestehende Repository-Gate. MKT0 darf erst als ausführbar beschrieben werden, nachdem Implementierung, Tests, CI-Lauf und Evidence Packet den jeweiligen Claim belegen.

## Stop-Regeln

- Kein Live-Publishing ohne OAuth, Plattformfreigabe, Runtime-Beweis und menschliche Abnahme.
- Keine Änderungen an Figurenidentität, Canon, Dialog oder Produktionsfreigaben durch Growth-Automation.
- Keine Erfolgs- oder Ausführbarkeitsbehauptung aus Dokumentation allein.
- Synthetische Daten beweisen weder reale Plattformleistung noch eine produzierte Episode.
- Jede künftige MKT0-Entscheidung muss auf Eingangsdaten, Policy, Version und Audit-Eintrag zurückführbar sein.
