# Comic Growth OS · MKT0-006 Growth Cockpit

Status: `IMPLEMENTED · PENDING REPOSITORY CI · READ_ONLY_SHADOW`

Tracking: Issue #58

## Zweck

MKT0-006 bündelt die bewiesenen Projektionen aus MKT0-001 bis MKT0-005 in einer browserfähigen Control Plane. Das Cockpit zeigt Zustand, Datenqualität, Wachstumssignale, Community-Risiken, Trends, Hypothesen, Tagesplan, Systemgesundheit und Auditspur.

Das Cockpit ist absichtlich vollständig read-only. Es enthält keine mutierenden Controls, keine Plattformaktionen und keine Netzwerkaufrufe.

## Ansichten

```text
Heute
Wachstum
Content
Community
Radar
Lernen
System
Audit
```

### Heute

- Content des lokalen Kalendertags
- offene menschliche Freigaben
- bereite Tasks
- Retries
- Dead-Letter-Tasks
- Engpässe

### Wachstum

- Anzahl analysierter Posts
- Gewinner und Held-Snapshots
- nachvollziehbare Empfehlungen
- Content-Analysen mit Klassifikation, Score, Warnungen und Regel-IDs

Reale Followerzahlen und Wachstumsraten werden ohne autorisierten Plattformimport als `NOT_AVAILABLE` dargestellt. Sie werden niemals als null erfunden.

### Content

- Snapshot- und Variantenreferenzen
- Plattform und Serie
- Analysezustand
- Score und Klassifikation
- Empfehlungen samt Regel-ID

### Community

- Signalanzahl
- kritische Rechte-, Krisen- und Kooperationsfälle
- Episodenideen
- Top-Themen und Figuren
- sichtbarer Antwortmodus `DRAFT_ONLY`

Rohtexte und persönliche Profile sind ausgeschlossen.

### Radar

- Opportunity Score
- Community-Nachfrage
- Entscheidung
- Gründe
- Pflicht zur menschlichen Prüfung

Live-Trendquellen und Konkurrenz-Scraper bleiben deaktiviert.

### Lernen

- Hypothese
- Status
- Confidence
- Quellenreferenz

Die Ansicht besitzt kein Recht zur Canon- oder Storyänderung.

### System

- Shadow-Modus
- Live-Publishing gesperrt
- OAuth nicht verbunden
- Remote-Datenbank nicht verbunden
- Komponentenstatus
- kritische Jobs und Human Queue

### Audit

- Audit-Einträge
- Evidence-Pakete
- Regelversionen und Provenienz der Datenquellen
- Status der externen unveränderbaren Audit-Verankerung

## Datenvertrag

`buildCockpitViewModel()` benötigt:

- `asOf`
- `scope.tenantId`
- `scope.projectId`

Optional:

- `growthBrief`
- `analyses`
- `signalBrief`
- `dailyPlan`
- `opportunities`
- `hypotheses`
- `systemHealth`
- `auditEntries`

Fehlende optionale Daten erzeugen `UNKNOWN`, nicht erfundene Werte.

## Provenienz

Erlaubte Provenienztypen:

- `synthetic_fixture`
- `authorized_platform_import`
- `manual_public_observation`
- `synthetic_or_authorized_input_only`

Unbekannte Provenienz wird abgelehnt.

Jede relevante Ansicht zeigt ihren Datenzustand. Das globale Banner weist auf Shadow-Daten und das Verbot realer Erfolgsbehauptungen hin.

## Datenschutz und Secret-Sperren

Das View Model lehnt unter anderem folgende Felder rekursiv ab:

- Passwort und Secrets
- API- und OAuth-Tokens
- API Keys
- E-Mail und Telefon
- Author-Referenzen
- Rohtexte und Message Bodies

Es werden keine persönlichen Fanprofile aufgebaut.

## HTML-Sicherheit

Der Export ist eine einzelne statische HTML-Datei.

Pflicht-CSP:

```text
default-src 'none'
style-src 'unsafe-inline'
img-src 'none'
font-src 'none'
script-src 'none'
connect-src 'none'
object-src 'none'
base-uri 'none'
form-action 'none'
frame-ancestors 'none'
```

Zusätzlich:

- alle dynamischen Inhalte werden HTML-escaped
- kein `<script>`
- kein `<form>`
- keine Buttons oder Eingabefelder
- kein `fetch` oder `XMLHttpRequest`
- keine externen URLs
- keine Event-Handler
- `no-referrer`

## Responsive Struktur

Der Export enthält:

- Viewport-Metadaten
- semantische Sections
- sticky Navigation
- responsive Kartenraster
- Mobile-Breakpoint bei 720 Pixeln

Die Oberfläche ist ein nachweisbares Artefakt, kein produktiv deploytes Webprodukt.

## Determinismus

Gleiche Eingaben erzeugen:

- identisches View Model
- identisches HTML
- stabile Sortierung für Analysen, Opportunities, Hypothesen und Audit-Einträge

Es gibt keine versteckte Echtzeituhr und keine Netzwerkabhängigkeit.

## Ausführbare Prüfung

```bash
node growth-os/cockpit-check.mjs
node --test --test-concurrency=1 tests/growth-os-cockpit.test.mjs
npm run test:growth
npm test
```

Erzeugte Artefakte:

```text
output/growth-os/mkt0-growth-cockpit.json
output/growth-os/mkt0-growth-cockpit.html
```

Beide Artefakte verwenden ausschließlich synthetische Daten.

## Harte Grenzen

- vollständig read-only
- keine Mutationsendpunkte
- keine öffentliche Aktion
- kein Publishing oder Scheduling
- keine Antworten, DMs oder Löschungen
- keine Freigabefunktion
- keine Secrets oder personenbezogenen Rohdaten
- kein externes Tracking
- kein Remote-Deploy
- kein Merge in `main` während der Recovery-Stop-Regel
