# Runbook · MKT0 Release und Live-Aktivierung

Status: `SHADOW PROCEDURE · LIVE EXECUTION FORBIDDEN WITHOUT COMPLETE EVIDENCE`

## 1. Shadow Release erzeugen

```bash
npm run growth:release-check
npm run test:growth
npm test
```

Erwartet:

- `releaseDecision: SHADOW_RELEASE_READY`
- `liveDecision: BLOCKED`
- neun bewiesene Module
- 17 offene externe Gates
- keine Netzwerk- oder Live-Aktion

## 2. Artefakte sichern

Zu sichern sind:

```text
output/growth-os/mkt0-final-release.json
output/growth-os/mkt0-final-release.html
growth-os/evidence/MKT0-001.md bis MKT0-010.md
growth-os/sql/001_growth_os_foundation.sql
```

Hashes müssen vor und nach der Ablage verglichen werden.

## 3. Externe Gates bearbeiten

Jedes Gate benötigt:

- benannte Owner-Rolle
- konkrete Evidence-Referenz
- UTC-Zeitstempel
- menschliche Verifikation
- keine Secret-Werte im Repository

Eine Aussage wie „ist eingerichtet“ ist kein Beweis. Zulässig sind beispielsweise geprüfte Run-IDs, signierte Prüfprotokolle, unveränderbare Artefaktreferenzen oder verlinkte Providerfreigaben ohne Credentials.

## 4. Datenbank

Vor einer Remote-Migration:

1. separates nichtproduktives Projekt verwenden
2. Migration-Dry-Run dokumentieren
3. RLS aktivieren
4. zwei Test-Tenants anlegen
5. Cross-Tenant-Reads und -Writes negativ testen
6. append-only Event-Trigger prüfen
7. Backup erzeugen
8. Restore in separates Ziel durchführen
9. erst danach produktive Migration zur Freigabe vorlegen

## 5. Provider und OAuth

Vor Aktivierung eines Providers:

1. offizielle App-Freigabe dokumentieren
2. OAuth in isolierter Sandbox testen
3. Tokens ausschließlich im Managed Secret Store ablegen
4. minimale Scopes verwenden
5. Status-, Metrics- und Webhookpfade getrennt testen
6. echte Signaturprüfung und Replay-Schutz beweisen
7. Kill Switch gegen den Provider testen
8. kein Publishing im ersten Runtime-Test

## 6. Worker und Scheduler

Pflichtbeweise:

- idempotente Jobanlage
- Retry-Grenze
- Dead-Letter-Queue
- Locking gegen parallele Ausführung
- kontrollierter Shutdown
- Kill Switch
- Incident Lockdown
- Metriken, Logs und Alertzustellung

## 7. Security Review

Mindestens zu prüfen:

- Tenant-Isolation
- Auth- und Rollenmodell
- Secret Handling
- Webhook-Kryptografie
- SSRF- und URL-Grenzen
- PII-Redaktion
- Audit-Manipulationsschutz
- Retention und Löschfreigaben
- Rechte- und Community-Risiken

Das Review muss von einer benannten Person signiert werden.

## 8. Menschliche Live-Freigabe

Live-Aktivierung darf nur erfolgen, wenn:

- alle 17 Gates `PROVEN_EXTERNAL` melden
- Security Review signiert ist
- Restore Drill bestanden ist
- Kill Switch getestet ist
- Plattformfreigaben vorliegen
- Aktivierungszeitfenster und Rollback-Owner benannt sind
- erste Veröffentlichung separat menschlich freigegeben wird

## 9. Aktivierung

Reihenfolge:

```text
Read-only Metrics
→ Statusabfragen
→ Webhooks
→ Community Import ohne Antworten
→ Scheduling Shadow
→ einzelner privater/Test-Post
→ manuell freigegebener öffentlicher Post
```

Kein Sprung direkt von Offline-Sandbox zu autonomem Publishing.

## 10. Rollback

Bei jedem unerwarteten Zustand:

1. globalen Kill Switch setzen
2. Scheduler und Worker pausieren
3. Providerzugriffe widerrufen oder deaktivieren
4. Incident eröffnen
5. Journal und Audit-Artefakte sichern
6. keine automatische Wiederaufnahme
7. menschliche Freigabe für Resume verlangen

## Abschluss

Dieses Runbook ist ein Aktivierungsvertrag, kein Nachweis, dass eine Aktivierung bereits stattgefunden hat.
