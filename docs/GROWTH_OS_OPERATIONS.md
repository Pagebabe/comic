# Comic Growth OS · MKT0-007 Operations & Resilience

Status: `IMPLEMENTED LOCALLY · PENDING REPOSITORY CI · SHADOW ONLY`

Tracking: Issue #63

## Zweck

MKT0-007 ergänzt den bewiesenen MKT0-001-bis-006-Stack um eine deterministische Betriebs-, Sicherheits- und Wiederherstellungsschicht. Das Modul aktiviert keine produktive Infrastruktur. Es definiert und testet ausschließlich Verträge, Projektionen, Manifeste und synthetische Drills.

## Betriebsmodi

```text
SHADOW
PAUSED
INCIDENT_LOCKDOWN
```

Andere Modi, insbesondere `LIVE`, werden abgelehnt.

### SHADOW

- bewiesene Offline- und Shadow-Abläufe dürfen innerhalb ihrer Modulschalter laufen
- öffentliche Aktionen bleiben verboten
- produktive Infrastruktur ist nicht nachgewiesen

### PAUSED

- neue Jobs werden blockiert
- Analyse- und Auditdaten dürfen read-only untersucht werden
- ein Restore-Drill darf ausgeführt werden

### INCIDENT_LOCKDOWN

- sämtliche Shadow-Jobs werden blockiert
- SEV0 und SEV1 erzwingen diesen Zustand
- automatische Freigabe ist verboten
- menschliche Freigabe führt zunächst nur zu `PAUSED`, niemals direkt zurück zu `SHADOW`

## Kill Switches

### Globaler Kill Switch

`globalKillSwitch: true` setzt den effektiven Betriebsmodus auf `PAUSED` und blockiert alle geplanten Shadow-Jobs.

### Modulschalter

Folgende Module besitzen eigene Schalter:

- `core`
- `data`
- `analytics`
- `signals`
- `orchestrator`
- `cockpit`

Ein deaktivierter Orchestrator blockiert Jobs auch dann, wenn der globale Modus `SHADOW` bleibt.

## Incident-Modell

Schweregrade:

| Stufe | Zielreaktion | Lockdown |
| --- | ---: | --- |
| SEV0 | 5 Minuten | zwingend |
| SEV1 | 15 Minuten | zwingend |
| SEV2 | 60 Minuten | menschliche Prüfung |
| SEV3 | 240 Minuten | menschliche Prüfung |

Kategorien:

- Security
- Datenintegrität
- Verfügbarkeit
- Rechte
- Datenschutz
- Plattform
- unbekannt

Kommunikation wird ausschließlich als Entwurf vorbereitet. Kein Incident wird automatisch gelöst oder öffentlich kommentiert.

## Lockdown-Aufhebung

Eine Aufhebung benötigt:

- ausdrückliche menschliche Zustimmung
- Zeitstempel
- Evidence-Referenz

Das Ergebnis bleibt `PAUSED` mit aktivem globalem Kill Switch. Ein späterer Wechsel zurück zu `SHADOW` benötigt eine getrennte Freigabe und erneute Readiness-Prüfung.

## Backup-Manifest

Ein Backup-Manifest enthält ausschließlich Metadaten:

- Backup-ID
- Tenant und Projekt
- Erstellungszeit
- Source Commit
- sortierte Artefaktpfade
- SHA-256 je Artefakt
- Größe
- Retention-Klasse
- Restore-Pflicht
- deterministische Restore-Reihenfolge
- Manifest-Hash

Es enthält keine Secret-Werte und führt kein Remote-Backup aus.

### Validierung

Abgelehnt werden:

- doppelte Pfade
- ungültige Hashes
- falsche Reihenfolge
- falsche Artefaktanzahl
- falsche Gesamtgröße
- manipulierte Manifest-Hashes
- leere Manifeste

## Restore-Vertrag

Ein Restore-Plan ist ausschließlich `DRY_RUN_ONLY` und enthält:

1. Incident Lockdown oder Pause prüfen
2. Manifest-Hash prüfen
3. Tenant-/Projekt-Scope prüfen
4. Rollback-Punkt dokumentieren
5. erforderliche Artefakte in Reihenfolge prüfen und stagen
6. Hashes und Größen prüfen
7. Event-Kette prüfen
8. read-only Startup prüfen

Ein echter Restore ist nicht implementiert und nicht automatisch zulässig.

## Restore-Drill

Der synthetische Drill:

- benötigt `PAUSED` oder `INCIDENT_LOCKDOWN`
- vergleicht Pfad, SHA-256 und Größe
- meldet `MISSING`, `HASH_MISMATCH`, `SIZE_MISMATCH` oder `VERIFIED`
- führt keinen echten Restore aus
- berührt keinen Remote-Dienst
- lässt menschliche Freigabe weiterhin offen

## Recovery-Ziele

RPO und RTO sind derzeit Planwerte:

```text
rpoMinutesTarget
rtoMinutesTarget
evidenceStatus: NOT_PROVEN
```

Sie sind keine produktiv gemessene Zusage. Das Readiness-Modell weist dies ausdrücklich aus.

## Retention

Klassen:

| Klasse | Zweck |
| --- | --- |
| EPHEMERAL_7D | kurzlebige Diagnostik |
| OPERATIONAL_30D | Betriebsprojektionen |
| AUDIT_365D | Evidence und Auditmetadaten |
| LEGAL_HOLD | keine automatische Löschung |

Auch abgelaufene Daten werden nicht automatisch gelöscht. Das System erzeugt nur `REVIEW_FOR_DISPOSITION`.

## Secret-Inventar

Erlaubte Felder:

- Name
- Pflichtstatus
- Status
- letzter Rotationszeitpunkt
- verantwortliche Rolle

Secret-, Token-, Passwort-, Credential-, API-Key- oder Private-Key-Werte sind verboten. Das Inventar besitzt für jeden Eintrag `valueIncluded: false`.

Status:

- `PRESENT`
- `MISSING_REQUIRED`
- `MISSING_OPTIONAL`
- `ROTATION_DUE`
- `DISABLED`

Fehlende Pflicht-Secrets blockieren Readiness. Dies aktiviert jedoch keine Verbindung und speichert keinen Wert.

## Audit Anchor

Das Modul erzeugt ein lokales Audit-Anchor-Manifest aus sortierten Event-Hashes und einem Root-Hash.

```text
externalAnchorExecuted: false
externalAnchorProvider: NOT_CONFIGURED
```

Eine spätere unveränderbare externe Verankerung benötigt einen eigenen Connector, Credentials, Evidence und menschliche Freigabe.

## Readiness-Projektion

Mögliche Zustände:

- `READY_SHADOW`
- `DEGRADED`
- `NOT_READY`

Blocker:

- aktiver Incident Lockdown
- fehlende Pflicht-Secrets
- fehlgeschlagener Restore-Drill
- Backup-Zeitpunkt in der Zukunft

Warnungen:

- System pausiert
- Rotation fällig
- kein verifizierter Backup-Laufbeweis
- kein Restore-Drill
- RPO-Ziel auf Basis der Planwerte überschritten

Die Projektion setzt immer:

```text
recoveryObjectivesProvenInProduction: false
liveActionsAllowed: false
automaticRecoveryAllowed: false
```

## Sicherheitsinvarianten

- kein Live-Modus
- keine echte Plattformaktion
- kein produktives Backup
- kein echter Restore
- keine Secret-Werte
- keine automatische Incident-Lösung
- keine automatische Lockdown-Aufhebung
- keine automatische Datenlöschung
- keine externe Alarmierung
- keine externe Audit-Verankerung
- keine Änderung von Canon, Voice, Figuren oder Produktion
- keine Integration in `main` während der Recovery-Stop-Regel

## Ausführbare Prüfung

```bash
node growth-os/operations-check.mjs
node --test --test-concurrency=1 tests/growth-os-operations.test.mjs
npm run test:growth
npm test
```

Erzeugtes Artefakt:

```text
output/growth-os/mkt0-operations-readiness.json
```

Alle Daten sind synthetisch.
