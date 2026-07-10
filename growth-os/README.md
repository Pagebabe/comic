# Comic Growth OS · MKT0

MKT0 ist die auditierbare Shadow-Schicht zwischen Comic-Studio und späterer Distribution.

## Was bereits ausführbar ist

- Episode-Pakete strikt validieren
- plattformspezifische Varianten deterministisch planen
- Publish-Jobs über eine Zustandsmaschine steuern
- Human-in-the-Loop- und Verbotsregeln auswerten
- Metriken gegen eine Vergleichsbasis normalisieren
- Growth Scores, Diagnosen und Folgeaktionen erzeugen
- Produktionsbriefings erstellen
- alle Entscheidungen in einer SHA-256-Hashkette protokollieren
- die komplette Pipeline offline und ohne Secrets demonstrieren

## Was bewusst gesperrt bleibt

- echte OAuth-Verbindungen
- reales Publishing
- reale Plattformmetriken
- automatische öffentliche Antworten
- Änderungen an Figurenidentität, Canon oder Dialog ohne Freigabe

## Befehle

```bash
npm run growth:demo
npm run growth:check
npm test
```

## Modulfluss

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

Der enthaltene Beispieldatensatz ist synthetisch. Er ist kein Beweis, dass Episode 001 produziert wurde.
