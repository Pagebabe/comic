# Evidence Packet · P0.3 Operator Failure Lab

Status: `CURRENT_MAIN_REBASE_IMPLEMENTED · FINAL_WORKFLOW_EVIDENCE_PENDING · PR8_PARTIAL`

Tracking: Issue #118  
Programm: Issue #101  
Readiness: Issue #95  
Pull Request: #119

## Behauptung

Dreizehn bekannte technische Fehler und ein unbekanntes Fail-Closed-Szenario werden deterministisch klassifiziert. Jeder Drill bewahrt den synthetischen Sandboxzustand, führt keine externe oder destruktive Aktion aus und liefert einen hashgebundenen Recovery-Plan.

Dieser Beweis schließt PR8 nicht. Ein echter Anfängerfehler und die anschließende Recovery müssen weiterhin durch einen Operator beobachtet werden.

## Quelle

- `project/operator-recovery-contract.json`
- `project/production-readiness-v1.json`
- `docs/OPERATOR_RECOVERY_DRILLS.md`
- `lib/operator-recovery.mjs`
- `scripts/operator_doctor.mjs`
- `scripts/operator_failure_drill.mjs`
- `.github/workflows/operator-recovery-drill.yml`

## Rebase auf aktuellen Main

Ausgangspunkt ist der aktuelle Main-Commit:

```text
da1f6aeb37c903a0893ce232101df317fc319852
```

Das Production Cockpit und die Ricco-Preflight-Arbeit bleiben vollständig erhalten. Die einzige inhaltliche Überschneidung war `package.json`; dort werden Cockpit-, Ricco-Preflight- und Recovery-Testketten gemeinsam geführt.

## Historischer Implementierungsbeweis

Der frühere Branch-Stand bewies die Recovery-Implementierung bereits technisch:

- Operator Recovery Drill `29165491249` · `SUCCESS`
- Branch-Head `9ee0f5f1aa0ba2c7a50a46b81768b1ee0aeefc12`
- Artefakt `8252019600`
- Digest `sha256:1cba9ccf64ee988b7b12ab7ffb7e6cbe1a6bb973729a15c891c07ff762aeed6a`
- Szenarien `14/14 PASS`
- Report-Hash `0213b75c0b276551178e95eb8f192193ed18f4e974c59369de27c0af59b78586`
- Unknown `HUMAN_ESCALATION_REQUIRED`
- externe Aktionen `0`
- destruktive Aktionen `0`
- Sandbox-Restore `14/14`

Dieser Lauf ist keine terminale Evidence für den neuen Head. Der finale Head benötigt frische grüne Läufe von `Operator Recovery Drill` und `Comic Factory CI`.

## Geprüfte Fehlerklassen

- Voraussetzungen
- Installation
- Build
- Projektwahrheit
- Preview und Port
- Browser
- Hashintegrität
- Restore
- Export
- unbekannter Fehler

## Sicherheitsgrenzen

- Unknown endet ohne Kommando und Retry
- nur ein freier lokaler Port darf automatisch neu gewählt werden
- keine automatische Datenlöschung
- kein `sudo`, `rm -rf`, Hard Reset oder Netzwerk-Shellpipe
- keine unbekannten Prozesse werden beendet
- keine kreative Freigabe
- keine Growth- oder Publishing-Aktion

## Sichtprüfung

Der statische HTML-Report muss 14 Fehlerkarten mit Severity, Erklärung, sicheren Schritten, Entscheidung und Sandboxstatus zeigen.

Erforderlich sichtbar:

- `14/14 sichere Failure-Drills`
- Unknown: `HUMAN_ESCALATION_REQUIRED`
- jede Sandbox: `RESTORED`
- Production Ready: nein
- Beginner Ready: nein
- Operator-Beobachtung: offen
- keine Scripts oder externen Requests
- restriktive Content-Security-Policy

## Aktueller Status

`FINAL_WORKFLOW_EVIDENCE_PENDING`

PR8 bleibt `PARTIAL`. Offen bleiben:

- terminale CI auf dem neuen Head
- frischer echter Anfängerfehler
- beobachtete Recovery durch einen Operator
- Nachweis ohne undokumentierte Hilfe

## Nicht behauptet

- keine Anfängerreife
- keine Produktionsreife
- keine externe Operator-Abnahme
- keine kreative Masterfreigabe
- keine fertige Episode
- keine Growth-OS-Integration
- kein Live-Publishing

## Pflichtbestätigungen

- [x] Scope auf `Pagebabe/comic` begrenzt
- [x] Production Cockpit und aktuelle Main-Arbeit erhalten
- [x] historische und finale Evidence getrennt
- [x] Unknown-Fail-Closed implementiert
- [x] keine externen oder destruktiven Aktionen
- [x] PR8 bleibt ohne Beobachtung `PARTIAL`
- [x] keine unbelegte Produktions- oder Kreativfreigabe
