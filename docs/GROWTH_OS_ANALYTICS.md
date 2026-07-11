# Comic Growth OS · Analytics & Growth Radar MKT0-003

Status: `LOCAL ANALYTICS IMPLEMENTED · REAL PLATFORM DATA NOT USED · MAIN INTEGRATION BLOCKED`

Tracking: Issue #48

## Ziel

MKT0-003 bewertet Content nicht mit Bauchgefühl, einzelnen View-Zahlen oder einem Sprachmodell-Orakel. Der Radar nutzt versionierte Regeln, robuste Vergleichsgruppen, Datenqualitätsprüfungen und nachvollziehbare Empfehlungen.

## Eingangsvertrag

Jeder Performance Snapshot enthält mindestens:

```text
id
tenantId
projectId
variantId
platform
format
seriesId
characterIds
publishedAt
capturedAt
durationSeconds
views
starts
viewersAfter3s
completions
shares
saves
comments
profileVisits
followersGained
averageWatchSeconds
rewatches
productionHours
provenance
```

Zulässige Provenienz:

- `synthetic_fixture`
- `authorized_platform_import`

Eine echte Plattformanbindung existiert noch nicht. Alle aktuellen Tests verwenden synthetische Fixtures.

## Vergleichslogik

Der Radar sucht Baselines in dieser Reihenfolge:

1. gleiche Plattform, gleiches Format und gleiche Längenklasse
2. gleiche Plattform
3. globale Vergleichsgruppe
4. `INSUFFICIENT_DATA`, falls weniger als fünf Vergleichswerte vorliegen

Längenklassen:

```text
00-15 Sekunden
16-30 Sekunden
31-60 Sekunden
61-600 Sekunden
```

Verwendet werden Mediane und Perzentile. Ein einzelner Ausreißer darf die Vergleichsbasis nicht dominieren.

## Kennzahlen

Aus jedem Snapshot werden abgeleitet:

- 3-Sekunden-Haltequote
- Completion Rate
- Share Rate
- Save Rate
- Comment Rate
- Follower Conversion
- Watch Ratio
- Rewatch Rate
- Production Efficiency

Der Composite Score verwendet versionierte Gewichte aus `mkt0-003.v1`.

## Klassifikation

```text
OUTLIER          Score >= 150
WINNER           Score >= 120
BASELINE         Score >= 85
UNDERPERFORMER   Score < 85
INSUFFICIENT_DATA kein belastbarer Score
```

Diese Grenzen sind Arbeitsregeln, keine Naturgesetze. Jede spätere Änderung braucht eine neue Regelversion und erneute Tests.

## Datenqualität

Der Radar hält die Entscheidung an, wenn:

- keine Starts vorliegen
- keine Views vorliegen
- Messzeit vor Veröffentlichungszeit liegt
- die Vergleichsgruppe zu klein ist

Warnungen entstehen unter anderem bei:

- mehr 3-Sekunden-Zuschauern als Starts
- unplausibel vielen Completions
- durchschnittlicher Watchtime über dem Dreifachen der Videolänge
- synthetischer Provenienz
- Fallback auf breitere Vergleichsgruppen
- null oder ungültigen Baselinewerten

Das System erzeugt bei unzureichenden Daten keinen Fantasiescore.

## Regelbasierte Empfehlungen

Jede Empfehlung enthält:

```text
code
priority
ruleId
reason
```

Aktuelle Regeln:

- `R-DQ-001` Daten reparieren und Entscheidung halten
- `R-HOOK-001` Hook testen, wenn Einstieg schwach und Body gesund ist
- `R-BODY-001` Mittelteil kürzen und Payoff früher liefern
- `R-SHARE-001` Follow-up erzeugen bei deutlich erhöhter Share Rate
- `R-CONVERT-001` Serien- und Figurensignal stärken
- `R-OUTLIER-001` Cross-Platform- und Sprachtest vorbereiten
- `R-LOW-001` schwaches Format pausieren und prüfen
- `R-ANOMALY-001` Trafficquelle prüfen, bevor skaliert wird

## Anomalien

Der Radar meldet:

- `HIGH_VIEW_OUTLIER`
- `LOW_VIEW_OUTLIER`
- `ABOVE_P90_EXTREME`

Ein Ausreißer ist eine Prüfaufforderung, kein automatischer Beweis für Viralität oder einen neuen Serienkurs.

## Momentum und Sättigung

Für Serien mit mindestens sechs bewerteten Veröffentlichungen vergleicht das System die Medianwerte der älteren und jüngeren Hälfte.

```text
GROWING    Delta > 15
DECLINING  Delta < -15
STABLE     dazwischen
```

Mögliche Sättigung wird nur markiert, wenn:

- Momentum rückläufig ist
- die letzten drei Scores nacheinander fallen
- der jüngere Median unter 85 % des älteren Medians liegt

## Rückkanal

Aus einer belastbaren Analyse können deterministisch zwei Domain Events entstehen:

1. `HYPOTHESIS_REGISTERED`
2. `PRODUCTION_BRIEF_REGISTERED`

Jeder Production Brief enthält zwingend:

```text
NO_CANON_CHANGE_WITHOUT_HUMAN_APPROVAL
```

Der Radar empfiehlt Produktionsrichtungen. Er ändert keine Figur, keinen Dialog und keinen Canon selbstständig.

## Tagesbrief

Der tägliche Growth Brief enthält:

- Gesamtzahl analysierter Snapshots
- gehaltene Entscheidungen
- Winner und Outlier
- Top-3 nach Score
- Datenqualitäts- und Anomaliealarme
- deduplizierte Empfehlungen
- Regelversion
- Provenienzgrenze

## Bewiesener lokaler Umfang

- robuste Median-/Perzentil-Baselines
- Segment-, Plattform- und globale Fallbacks
- Hold bei unzureichenden Daten
- versionierter Composite Score
- Winner-, Outlier- und Underperformer-Klassifikation
- Anomalieerkennung
- nachvollziehbare Regel-IDs
- Momentum- und Sättigungsanalyse
- deterministische Direction Events
- Integration mit MKT0-002 Event Store
- Daily Growth Brief
- zehn isolierte Analytics-Tests

## Nicht bewiesen

- reale Plattformdaten
- produktive Trenddaten
- reale Follower-Prognosen
- automatische Veröffentlichung
- autonome Canon- oder Storyentscheidung
- produktives Growth-Cockpit
- Merge in `main`
