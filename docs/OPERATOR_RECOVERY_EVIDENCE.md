# Evidence Packet · P0.3 Operator Failure Lab

Status: `CURRENT_MAIN_PORT · PR-BOUND WORKFLOW EVIDENCE REQUIRED · PR8 PARTIAL`

Tracking: Issue #118  
Programm: Issue #101  
Readiness: Issue #95

## Behauptung

Dreizehn bekannte technische Fehler und ein unbekanntes Fail-Closed-Szenario werden deterministisch klassifiziert. Jeder Drill bewahrt den synthetischen Sandboxzustand, führt keine externe oder destruktive Aktion aus und liefert einen hashgebundenen Recovery-Plan.

Der technische Beweis schließt PR8 nicht. Ein realer Anfängerfehler und die anschließende Recovery müssen weiterhin durch einen Menschen beobachtet werden.

## Quelle

- `project/operator-recovery-contract.json`
- `project/production-readiness-v1.json`
- `docs/OPERATOR_RECOVERY_DRILLS.md`
- `lib/operator-recovery.mjs`
- `scripts/operator_doctor.mjs`
- `scripts/operator_failure_drill.mjs`
- `.github/workflows/operator-recovery-drill.yml`

## Beweisregel

Der statische Vertrag speichert keine Workflow-Run-IDs, Commit-SHAs, Artefakt-IDs oder Digests.

Diese Werte sind dynamische Evidenz und gehören in das Evidence Packet des Pull Requests. Nur dort können sie an den exakt geprüften Head gebunden werden, ohne beim nächsten Commit sofort zu veralten.

Verbindlich sind:

1. `Operator Recovery Drill` erfolgreich,
2. `Comic Factory CI` erfolgreich,
3. `Fresh Install Drill` erfolgreich,
4. Artefakt-IDs und Digests im PR dokumentiert,
5. Merge ausschließlich des exakt geprüften Heads.

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

`PENDING_DEPLOY`

Die Implementierung ist auf den aktuellen Main-Stand portiert. Terminale Evidence wird erst nach grünen Läufen auf dem finalen PR-Head in der PR-Beschreibung dokumentiert.

PR8 bleibt `PARTIAL`. Offen bleiben:

- erfolgreicher finaler Workflow-Satz auf dem exakten Head
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
- [x] aktuelle Main-Arbeit und Asset-Recovery-Runner erhalten
- [x] statische Vertragsregeln und dynamische Run-Evidence getrennt
- [x] Unknown-Fail-Closed implementiert
- [x] keine externen oder destruktiven Aktionen
- [x] PR8 bleibt ohne Beobachtung `PARTIAL`
- [x] keine unbelegte Produktions- oder Kreativfreigabe
