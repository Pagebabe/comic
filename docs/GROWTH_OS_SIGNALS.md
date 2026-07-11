# Comic Growth OS · Community-, Trend- und Opportunity-Radar MKT0-004

Status: `LOCAL SIGNAL RADAR IMPLEMENTED · SYNTHETIC DATA ONLY · PUBLIC ACTIONS BLOCKED · MAIN INTEGRATION BLOCKED`

Tracking: Issue #50

## Zweck

MKT0-004 verwandelt Community- und Trendsignale in überprüfbare Wachstumsimpulse. Das Modul darf sammeln, redigieren, klassifizieren, aggregieren, priorisieren und Antwortentwürfe vorbereiten. Es darf nichts öffentlich senden, löschen oder moderieren.

## Community-Vertrag

Jedes Community-Signal enthält:

```text
id
tenantId
projectId
variantId
platform
observedAt
provenance
authorRef, bereits anonymisiert
text
topics
characterIds
```

Der Text wird auf 500 Zeichen begrenzt. E-Mail-Adressen, Telefonnummern und URLs werden redigiert. Aggregationen enthalten weder Rohtexte noch persönliche Profile.

## Kategorien und Gates

```text
FAN_REACTION
QUESTION
EPISODE_IDEA
CRITICISM
RIGHTS
COLLAB
SPAM
CRISIS
```

- Krisenfälle: `CRITICAL`, keine Antwort, sofortige menschliche Eskalation
- Rechtefälle: `HIGH` oder `CRITICAL`, ausschließlich Rechteprüfung
- Kollaborationen: `HIGH`, ausschließlich manuelle Prüfung
- Kritik: menschliche Sichtung vor Antwort
- Spam: keine Antwort und kein Produktionsbriefing
- alle übrigen Antworten: nur Shadow-Entwurf, nie automatische Veröffentlichung

Hochrisikokategorien überschreiben harmlose Kategorie-Hinweise. Ein Rechtehinweis darf also nicht durch ein falsch gesetztes „Fan Reaction“-Label verschwinden, nur weil Menschen gern Formulare falsch ausfüllen.

## Aggregation

Der Radar berechnet:

- Anzahl pro Kategorie
- Hochprioritätsalarme
- häufige Themen
- häufig genannte Figuren
- wiederholte Episodenwünsche
- Zahl möglicher Antwortentwürfe

Spam wird aus Nachfrage- und Produktionssignalen ausgeschlossen. Eine Episodenidee gilt erst ab mindestens zwei passenden Community-Signalen als Kandidat. Auch dann entsteht nur ein Prüfimpuls, keine kreative Freigabe.

## Trend-Vertrag

Jedes Trendsignal enthält:

```text
id
tenantId
projectId
platform
source
topic
observedAt
expiresAt
provenance
velocity
brandFit
characterFit
saturation
rightsRisk
productionEffort
relatedTopics
```

## Opportunity Score

Regelversion: `mkt0-004.v1`

```text
Velocity              22 %
Brand Fit             25 %
Character Fit         18 %
Freshness             15 %
fehlende Sättigung     8 %
niedriges Rechte-Risiko 7 %
niedriger Aufwand      5 %
```

Entscheidungen:

- abgelaufen: `EXPIRED`
- Rechte-Risiko ab 70: `REJECT`
- Brand Fit unter 50: `REJECT`
- Score ab 70: `RECOMMEND_REVIEW`
- Score ab 55: `WATCH`
- darunter: `IGNORE`

`RECOMMEND_REVIEW` bedeutet menschlich prüfen, nicht produzieren oder posten.

## Community plus Trend

Passt ein Community-Thema zu einem Trend, erhält die Opportunity einen begrenzten Nachfragebonus. Der Bonus ist gedeckelt, damit zehn ähnliche Kommentare nicht plötzlich sämtliche Marken- und Rechteprüfungen überschreiben.

Nur Opportunities mit mindestens 75 Punkten und Entscheidung `RECOMMEND_REVIEW` dürfen Direction Events erzeugen:

1. `HYPOTHESIS_REGISTERED`
2. `PRODUCTION_BRIEF_REGISTERED`

Jeder Brief enthält zwingend:

```text
VERIFY_RIGHTS_AND_BRAND_FIT
NO_CANON_CHANGE_WITHOUT_HUMAN_APPROVAL
NO_PUBLIC_ACTION_WITHOUT_HUMAN_APPROVAL
```

## Datenschutzgrenzen

- `authorRef` muss vor Eingang anonymisiert sein
- keine Namen-, Kontakt- oder Beziehungsprofile
- keine unredigierten Kontaktangaben in Projektionen
- keine dauerhafte Sammlung ohne definierten Zweck und Aufbewahrungsregel
- aggregierte Signale sind gegenüber Rohtexten zu bevorzugen
- echte Plattformimporte benötigen später eine gesonderte Datenschutz- und Rechtsprüfung

## Täglicher Signal Brief

Der Brief enthält:

- Signalanzahl
- Hochprioritätsalarme
- wiederholte Episodenideen
- häufige Themen und Figuren
- Top-Opportunities
- Antwortmodus `DRAFT_ONLY`
- bestätigte Grenze `publicActionsExecuted: false`

## Bewiesener lokaler Umfang

- PII-Redaktion
- deterministische Klassifikation
- Human-Gate- und Dringlichkeitslogik
- Shadow-Antwortentwürfe
- datensparsame Aggregation
- Trend-Scoring und Verfall
- Rechte- und Brand-Fit-Sperren
- Community-Nachfragebonus
- deterministische Direction Events
- Integration mit MKT0-002 Event Store
- täglicher Signal Brief
- 15 isolierte Tests

## Nicht bewiesen

- echte Kommentarimporte
- echte Trendquellen
- produktive Moderation
- öffentliche Antworten
- Plattform-Scraping
- personenbezogene Profile
- produktives Cockpit
- Merge in `main`
