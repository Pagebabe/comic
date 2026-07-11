# Comic Growth OS · MKT0-005 Orchestrator

Status: `IMPLEMENTED LOCALLY · PENDING REPOSITORY CI · SHADOW ONLY`

Tracking: Issue #53

## Zweck

MKT0-005 verbindet die bereits bewiesenen Growth-, Daten- und Signalmodule zu einem deterministischen Arbeitsablauf für Kampagnen, Content-Kalender, Freigaben, Jobs, Retries und Tagesplanung.

Der Orchestrator führt keine öffentliche Plattformaktion aus. Sein Endpunkt ist ein `APPROVED_SHADOW`-Job, der nur simuliert und als Domain Event protokolliert werden darf.

## Kampagnenvertrag

Jede Kampagne enthält:

- `tenantId` und `projectId`
- stabile Kampagnen-ID
- IANA-Zeitzone
- Status
- Shadow-Modus
- Automationsvertrauen von 0 bis 4
- mindestens einen Content-Plan

Jeder Content-Plan enthält:

- Content- und Varianten-ID
- Plattform
- Format-ID
- Kennzeichnung, ob das Format bereits bekannt ist
- Packaging-Bereitschaft
- Priorität
- Veröffentlichungsfenster
- Content-Abhängigkeiten
- Risikoflaggen

Ungültige Zeitfenster, doppelte IDs, unbekannte Abhängigkeiten, Selbstabhängigkeiten und Zyklen werden abgelehnt.

## Workflow

Jeder Content durchläuft exakt diese Schritte:

```text
PACKAGING
→ QA
→ APPROVAL
→ SCHEDULING
→ SHADOW_PUBLISH
→ MONITORING
→ ITERATION
```

Content-Abhängigkeiten werden am Einstieg abgebildet. Ein abhängiger Content darf erst mit `PACKAGING` beginnen, wenn der vorherige Content `ITERATION` abgeschlossen hat.

## Zustände

```text
BLOCKED
READY
RUNNING
WAITING_HUMAN
RETRY_WAIT
COMPLETED
DEAD_LETTER
CANCELLED
```

Unerlaubte Übergänge werfen einen Fehler. Abgeschlossene, abgebrochene und Dead-Letter-Tasks sind terminal.

Jede Transition besitzt Zeitstempel und Begründung. Kein Task darf `mode: shadow` oder `publicActionAllowed: false` verlassen.

## Automationsvertrauen

| Level | Bedeutung im Shadow-System |
| --- | --- |
| 0 | vollständig manuell; jeder Content benötigt menschliche Freigabe |
| 1 | System bereitet vor; Einzelprüfung bleibt Pflicht |
| 2 | sichere bekannte Formate dürfen in einer menschlichen Sammelfreigabe landen |
| 3 | bekannte risikofreie Formate dürfen automatisch bis zum Shadow-Job laufen |
| 4 | bekannte risikofreie Formate dürfen innerhalb bewiesener Regeln optimiert werden; öffentliche Aktionen bleiben verboten |

Vertrauenslevel ersetzen keine Risikoprüfung.

## Harte Human Gates

Folgende Fälle benötigen unabhängig vom Vertrauenslevel eine Einzelprüfung:

- neues oder unbekanntes Format
- ungeklärte Rechte
- sensible Inhalte
- Kooperation
- Krise

MKT0-005 genehmigt keine Canon-, Voice-, Figuren- oder Produktionsänderung.

## Bulk-Freigaben

Bulk-Freigaben sind nur für Level 2 zulässig und enthalten ausschließlich:

- bekannte Formate
- keine Risikoflaggen
- Approval-Tasks im Zustand `WAITING_HUMAN`

Das Ergebnis ist weiterhin ein menschlich zu bestätigendes Paket. Es veröffentlicht nichts.

## Scheduler-Simulation

Der Scheduler arbeitet ausschließlich mit übergebenem `asOf`-Zeitpunkt. Es gibt keine versteckte Echtzeituhr und damit keine nicht reproduzierbaren Tests.

Ein Shadow-Job entsteht nur, wenn:

- das Veröffentlichungsfenster geöffnet ist
- Approval abgeschlossen ist
- Scheduling abgeschlossen ist
- `SHADOW_PUBLISH` bereit ist
- der Idempotenzschlüssel noch nicht existiert

Nach Ablauf des Fensters wird `PUBLISH_WINDOW_MISSED` erzeugt. Es erfolgt kein verspätetes stilles Veröffentlichen.

## Idempotenz

Der Idempotenzschlüssel wird deterministisch aus Tenant, Projekt, Kampagne, Content, Variante, Fensterstart und Shadow-Modus gebildet.

Wiederholte Scheduler-Läufe mit demselben Schlüssel erzeugen keinen zweiten Job.

## Retry und Dead Letter

Ein fehlgeschlagener laufender Task besitzt maximal drei Versuche.

```text
Versuch 1 → 60 Sekunden
Versuch 2 → 300 Sekunden
Versuch 3 → DEAD_LETTER
```

Ein Retry darf erst nach `retryAt` wieder auf `READY` gesetzt werden. Dauerhafte Fehler werden nicht endlos wiederholt. Dead-Letter-Tasks erscheinen im Engpass- und Tagesbericht.

## Kalender

Die Kalenderprojektion nutzt die Kampagnenzeitzone und gruppiert Content nach lokalem Datum. UTC-Grenzen dürfen nicht dazu führen, dass ein Berliner Mitternachtspost am falschen Kalendertag erscheint.

## Tagesplan

Der Tagesplan enthält:

- heute geplanten Content
- offene menschliche Freigaben
- ausführbare Tasks
- wartende Retries
- Dead-Letter-Tasks
- Engpässe nach Zustand und Workflow-Schritt

Das Ergebnis ist eine Datenprojektion für ein späteres Growth-Cockpit, keine bereits gebaute Oberfläche.

## Event-Integration

Ein simulierter Scheduler-Job kann als vorhandenes Domain Event ausgegeben werden:

```text
PUBLISH_JOB_RECORDED
state: APPROVED_SHADOW
```

Der Event-Vertrag wird durch MKT0-002 geprüft. Ein Live-State existiert nicht.

## Sicherheitsinvarianten

- `mode` bleibt immer `shadow`
- `publicActionAllowed` bleibt immer `false`
- `publicActionsExecuted` bleibt immer `false`
- kein OAuth, keine Plattform-API, kein externer Kalender
- kein echtes Scheduling oder Publishing
- kein automatisches Freigeben riskanter Inhalte
- keine Änderung von Canon oder Produktionsfreigaben
- keine Integration in `main` während der Recovery-Stop-Regel

## Ausführbare Prüfung

```bash
node growth-os/orchestrator-check.mjs
node --test --test-concurrency=1 tests/growth-os-orchestrator.test.mjs
npm run test:growth
npm test
```

Der Offline-Check erzeugt:

```text
output/growth-os/mkt0-orchestrator.json
```

Das Artefakt verwendet ausschließlich synthetische Fixtures.
