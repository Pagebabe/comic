# Comic Growth OS · MKT0-009 Release Candidate

Status: `IMPLEMENTED LOCALLY · PENDING REPOSITORY CI · OFFLINE SHADOW ONLY`

Tracking: Issue #70

## Zweck

MKT0-009 verbindet die bewiesenen Module MKT0-001 bis MKT0-008 zu einer einzigen prüfbaren Release-Candidate-Beweiskette. Es fügt keine Live-Funktion hinzu. Es prüft, ob alle lokalen Shadow-Module, Artefakte, Regelversionen, Hashes und Sicherheitsgrenzen gemeinsam konsistent sind.

## Release-Manifest

Das Manifest enthält:

- Release-ID
- Correlation-ID
- Modul-ID und Regelversion
- Modulstatus
- CI-Referenz
- Claims
- Artefaktpfade und SHA-256-Hashes
- Blocker
- Manifest-Hash

Ein Release kann nur `PROVEN` sein, wenn MKT0-001 bis MKT0-008 vollständig vorhanden sind, alle Module `PROVEN` melden und jedes Modul mindestens ein hashprüfbares Artefakt besitzt.

## Trace-Graph

Jeder Schritt besitzt:

- `stepId`
- `moduleId`
- `correlationId`
- `causationId`
- Status
- Evidence-Referenz
- Sequenz

Vorwärtsreferenzen, fehlende Ursachen und doppelte Schritte werden abgelehnt.

## Failure-Szenarien

Verbindlich geprüft werden:

- Kill Switch
- Auth nicht bereit
- Rate Limit
- Webhook Replay
- Manifest-Manipulation
- unzureichende Metrics

Jeder Failure-Pfad endet mit `SAFE_*`, verwendet kein Netzwerk und führt keine Live-Aktion aus.

## Startklar-Matrix

Zulässige Zustände:

- `PROVEN`
- `NOT_PROVEN`
- `BLOCKED_EXTERNAL`
- `HUMAN_APPROVAL_REQUIRED`

Der lokale Shadow-Release-Candidate kann `PROVEN` sein. Produktive Live-Bereitschaft bleibt immer `false`, solange OAuth, echte Provider-Runtime, Remote-Datenbank, Remote-Backup/Restore, externer Audit-Anker und menschliche Freigaben fehlen.

## Artefakte

Der Offline-Check erzeugt:

```text
output/growth-os/mkt0-release-candidate.json
output/growth-os/mkt0-release-candidate.html
```

Die HTML-Datei ist read-only, besitzt eine restriktive CSP, keine Scripts, keine Formulare und keine Netzwerkabhängigkeit.

## Sicherheitsinvarianten

- ausschließlich synthetische Daten und Repository-Evidence
- kein HTTP, OAuth oder Provider-Endpunkt
- kein produktives Scheduling oder Publishing
- keine Datenbankmutation
- keine automatische Lockdown-Aufhebung
- keine produktive Startklar-Behauptung
- kein Merge in `main` während der Recovery-Stop-Regel

## Prüfungen

```bash
node growth-os/integration-check.mjs
node --test --test-concurrency=1 tests/growth-os-integration.test.mjs
npm run test:growth
npm test
```
