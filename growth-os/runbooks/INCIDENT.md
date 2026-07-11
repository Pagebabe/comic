# Runbook · Incident Response

Status: `SHADOW CONTRACT · NO EXTERNAL PAGER`

## Auslöser

- Datenintegritätswarnung
- unerwartete Job-Duplikate
- mögliche Secret-Offenlegung
- Rechte- oder Datenschutzfall
- Plattform- oder Verfügbarkeitsfehler
- Auditkettenbruch

## Sofortmaßnahmen

1. Incident mit Tenant, Projekt, Kategorie, Schweregrad und Evidence-Referenzen anlegen.
2. Bei SEV0 oder SEV1 `INCIDENT_LOCKDOWN` aktivieren.
3. Globalen Kill Switch aktivieren.
4. Alle Shadow-Jobs über das Operations Gate blockieren.
5. Keine öffentliche Antwort oder automatische Kommunikation ausführen.
6. menschlichen Incident Owner festlegen.
7. betroffene Artefakte und Logs read-only sichern.

## Triage

| Schweregrad | Zielreaktion | Handlung |
| --- | ---: | --- |
| SEV0 | 5 Min. | sofortiger Lockdown und menschliche Eskalation |
| SEV1 | 15 Min. | Lockdown und dringende menschliche Eskalation |
| SEV2 | 60 Min. | Pause betroffener Module und menschliche Prüfung |
| SEV3 | 240 Min. | geplanter Review |

## Untersuchung

- Scope und Zeitfenster bestimmen
- letzte gültige Auditkette identifizieren
- letzte verifizierte Backup-ID ermitteln
- betroffene Module deaktivieren
- keine Daten verändern, bevor Rollback-Punkt und Evidence dokumentiert sind

## Aufhebung

Lockdown darf nur mit menschlicher Freigabe, Zeitstempel und Evidence-Referenz aufgehoben werden. Das System wechselt danach ausschließlich zu `PAUSED`; der globale Kill Switch bleibt aktiv.

## Abschlusskriterien

- Ursache dokumentiert
- Manipulations- und Datenschutzrisiko bewertet
- Restore-Drill bei Bedarf bestanden
- Evidence Packet ergänzt
- menschliche Freigabe protokolliert
- erneute Readiness-Prüfung durchgeführt

## Nicht erlaubt

- automatische Incident-Lösung
- direkte Rückkehr zu `SHADOW`
- öffentliche Kommunikation ohne Prüfung
- Löschen oder Überschreiben von Evidence
