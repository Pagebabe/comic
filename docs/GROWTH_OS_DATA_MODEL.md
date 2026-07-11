# Comic Growth OS · Datenmodell MKT0-002

Status: `LOCAL CONTRACT IMPLEMENTED · REMOTE DATABASE NOT TOUCHED · MAIN INTEGRATION BLOCKED`

Tracking: Issue #46

## Ziel

MKT0-002 definiert die gemeinsame Datenbasis für Kampagnen, Inhalte, Plattformvarianten, Publish-Jobs, Metriken, Community-Signale, Trends, Hypothesen, Experimente und Produktionsbriefings.

Der Datenlayer ist bewusst zweigeteilt:

1. deterministischer lokaler Event-Store für beweisbare Shadow-Läufe
2. Postgres-/Supabase-kompatibler SQL-Vertrag für spätere Persistenz

Die SQL-Datei wurde nicht remote ausgeführt.

## Leitprinzipien

- Append-only vor stiller Mutation
- jede Änderung als versioniertes Domain Event
- Mandant und Projekt in jedem Vertrag
- eindeutige Event-ID
- lückenlose Sequenz pro Stream
- globale SHA-256-Kette für Manipulationssichtbarkeit
- deterministische Projektionen
- keine Live-Daten oder Live-Aktionen
- synthetische Provenienz muss sichtbar bleiben
- Produktionsbriefings verändern keinen Canon automatisch

## Event-Vertrag

Jedes Event enthält:

```text
schemaVersion
id
tenantId
projectId
stream
sequence
type
occurredAt
actor
mode = shadow
payload
```

Unterstützte Ereignisse:

```text
CAMPAIGN_CREATED
CONTENT_REGISTERED
VARIANT_PLANNED
PUBLISH_JOB_RECORDED
METRIC_SNAPSHOT_RECORDED
COMMENT_SIGNAL_RECORDED
TREND_SIGNAL_RECORDED
HYPOTHESIS_REGISTERED
EXPERIMENT_REGISTERED
PRODUCTION_BRIEF_REGISTERED
```

## Integritätsregeln

Ein Event wird abgelehnt, wenn:

- Schema-Version falsch ist
- Event-ID bereits existiert
- Tenant oder Projekt nicht zum Store gehört
- Sequenz im Stream nicht exakt fortlaufend ist
- Event-Typ unbekannt ist
- Pflichtfelder fehlen
- Plattform, Status oder Kategorie außerhalb des Vertrags liegen
- Zeitstempel nicht als ISO-Zeit lesbar ist
- Modus nicht `shadow` ist

## Projektionen

Aus dem Event-Store werden deterministisch erzeugt:

- Campaigns
- Content Items
- Social Variants
- Publish Jobs
- Metric Snapshots
- jeweils jüngste Metrik pro Variante
- Comment Signals
- Trend Signals
- Hypotheses
- Experiments
- Production Briefs

Referenzen werden beim Projektionslauf geprüft. Eine Variante ohne Content Item oder ein Experiment ohne Hypothese führt zu einem harten Fehler.

## Persistenzvertrag

`growth-os/sql/001_growth_os_foundation.sql` enthält:

- eigenes Schema `growth_os`
- Foreign Keys und Unique Constraints
- Mandanten- und Projektgrenzen
- Shadow-only Checks
- append-only Trigger für Events
- Indizes für Metriken, Kommentare, Trends und Events
- RLS-Vorbereitung über `app.tenant_id`

Die RLS-Policies sind ein Entwurf für einen vertrauenswürdigen serverseitigen Kontext. Sie sind nicht als produktiv bewiesen, weil keine Datenbankmigration ausgeführt wurde.

## Sicherheitsgrenzen

- keine Client-Anwendung darf `app.tenant_id` frei setzen
- Service-Role-Schlüssel gehören ausschließlich in serverseitige Secret-Verwaltung
- Rohdaten und normalisierte Daten bleiben getrennt
- personenbezogene Daten werden nicht benötigt, solange aggregierte Signale reichen
- Kommentartexte werden später nur gespeichert, wenn Zweck, Rechtsgrundlage und Aufbewahrung geklärt sind
- Event-Hashketten machen Änderungen sichtbar, ersetzen aber keine externe unveränderbare Verankerung

## Bewiesener lokaler Umfang

- Event-Verträge
- Append-only-Funktionen
- Sequenz- und Scope-Prüfung
- Duplikaterkennung
- SHA-256-Integritätsprüfung
- deterministische Projektionen
- Referenzprüfung
- aggregierte Statuszusammenfassung
- SQL-Markerprüfung
- neun isolierte Datenlayer-Tests

## Nicht bewiesen

- echte Supabase-Verbindung
- erfolgreiche Remote-Migration
- produktive RLS-Wirkung
- Backup und Restore einer realen Datenbank
- reale Plattformdaten
- produktiver Worker
- öffentliche UI
- Merge in `main`
