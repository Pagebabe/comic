# GitHub Pages und öffentliche Beweiskette

Status: `DEPLOY_AND_PUBLIC_PROOF_SEPARATED`

Tracking: #95, #103, #105, #107

## Problem des alten Ablaufs

Der frühere Workflow erledigte in einem einzigen Job:

1. Build und lokale Verträge,
2. GitHub-Pages-Deploy,
3. öffentliche Desktop-/Mobil-Browserprüfung,
4. drei öffentliche Evidence-Checker,
5. Aktualisierung von Issue #11 und #95.

Wenn nur Schritt 3 oder 4 scheiterte, war der gesamte Job rot. Ein GitHub-Retry führte danach erneut Build und Deploy aus. Dadurch konnte eine reine Beweiswiederholung am Pages-Deployment selbst scheitern, obwohl der öffentliche Stand bereits korrekt ausgeliefert war.

Zusätzlich konnte `pages-outcome.yml` bei einem verzögerten Rich-Proof einen schwächeren Fallbacktext über den letzten ausführlichen Beweis in Issue #11 schreiben.

## Neuer Vertrag

### Workflow 1: `Deploy Comic Factory Dashboard`

Verantwortlich für:

- Verträge und Regressionen
- Studio-Build
- technische Medienregressionen
- lokale Desktop-/Mobil-Smokes
- exakte Pages-Artefaktprüfung
- Upload und GitHub-Pages-Deploy

Nicht verantwortlich für:

- öffentliche Browser-Smokes
- öffentliche Evidence-Checker
- Issue-Updates

### Workflow 2: `Verify and Report Comic Factory Pages`

Wird nach Abschluss des Deploy-Workflows durch `workflow_run` gestartet.

Bei erfolgreichem Deploy:

1. Checkout des exakten ausgelieferten Commits
2. Polling, bis der vollständige öffentliche Snapshot zu diesem Commit verfügbar ist
3. Studio-, Academy- und Readiness-Smoke auf Desktop und Mobil
4. Recovery-/Studio-, Academy- und Readiness-Public-Checker
5. Upload des öffentlichen Evidence-Pakets
6. Rich-Proof in Issue #11
7. idempotentes Aktualisieren des OPS1-Kommentars in Issue #95
8. Schließen eines vorhandenen Deploy-Blockers

Bei fehlgeschlagenem Deploy oder Public-Proof:

- Issue #11 wird nicht überschrieben
- der letzte bewiesene Online-Stand bleibt erhalten
- ein separates Blocker-Issue wird erstellt oder aktualisiert
- für den neuen Commit wird kein Erfolg behauptet

## Wiederholungsregeln

### Deploy fehlgeschlagen

Nur den Deploy-Workflow erneut ausführen oder einen belegten Infrastrukturfehler beheben.

### Deploy grün, Public-Proof rot

Nur den fehlgeschlagenen Job im Outcome-Workflow erneut ausführen. Kein erneuter Pages-Deploy ist erforderlich.

### Public-Proof grün

Verbindliche Evidence umfasst:

- exakten Commit
- Deploy-Run
- separaten Public-Proof-Run
- Runtime-Manifeste
- Desktop-/Mobil-Screenshots
- drei öffentliche Checker
- unveränderte kreative und Growth-Grenzen

## Unveränderte Sicherheitsgrenzen

Diese Pipeline darf niemals verändern oder implizit freigeben:

- Ricco-Kandidatenstand `0/1`
- Bildgenerierung `false`
- Character-Master `0/4`
- Location-Master `0/4`
- Voice-Master `0/3`
- fertige Episode `0`
- `Production Ready=false`
- `Beginner Ready=false`
- beobachteter Nullwissen-Lauf `false`
- Growth-OS-Integration `false`
- kreative Freigabe `false`

## Abnahme

Die Trennung gilt erst als bewiesen, wenn:

1. der PR auf seinem finalen Head vollständig grün ist,
2. der Merge-Commit vom neuen Deploy-Workflow erfolgreich veröffentlicht wurde,
3. der separate Outcome-Workflow denselben Commit öffentlich geprüft hat,
4. Issue #11 den Rich-Proof mit beiden Run-URLs enthält,
5. Issue #105 geschlossen ist,
6. Issue #95 weiterhin offen und ehrlich begrenzt bleibt.
