# Evidence Packet · Pages-Deploy und öffentlicher Beweis entkoppeln

Status: `PROVEN_PR_PREFLIGHT · DEPLOY_AND_PUBLIC_PROOF_PENDING`

Tracking: #95, #103, #105, #107

Pull Request: #109

## Ausgangsfehler

Merge-Commit:

```text
90079ccb0cd51be865c05bcb88cc22e63a287a24
```

Der erste Pages-Lauf `29159226185`, Job `86561319817`, bestand:

- Verträge und Readiness
- Studio-Build
- Medienregressionen
- lokale Browser-Smokes
- Pages-Artefaktverträge
- Upload und Pages-Deploy

Er scheiterte danach im gemeinsamen Schritt für die öffentliche Gegenprüfung.

Ein Retry desselben monolithischen Jobs, Job `86562626604`, musste erneut bauen und deployen. Er scheiterte diesmal bereits am GitHub-Pages-Deploy. Die öffentliche Gegenprüfung wurde dadurch nicht erneut ausgeführt.

## Öffentliche Diagnose

Diagnose-PR: #106

Diagnose-Run:

```text
29159536607
```

Diagnose-Artefakt:

```text
Artifact-ID: 8250407463
Digest: sha256:302151e250774737e616e0b216d80089c9ba867a9a48e38a65f07474d15ce9a6
```

Der bereits ausgelieferte Commit `90079ccb0cd51be865c05bcb88cc22e63a287a24` bestand:

- Studio-Live-Smoke
- Academy-Live-Smoke
- Readiness-Live-Smoke
- Academy-Public-Checker
- Readiness-Public-Checker
- Desktop und Mobil
- exakte Commitbindung
- Screenshot-Hashes gegen die jeweiligen Runtime-Manifeste

Öffentliche Wahrheit:

```text
Readiness: 2/10 CLOSED_VERIFIED · 7 PARTIAL · 1 OPEN
Production Ready: false
Beginner Ready: false
beobachteter Anfänger-Lauf: false
vollständige geprüfte Episode: false
kreative Freigabe: false
Growth OS integriert: false
Ricco-Kandidaten: 0/1
Bildgenerierung: false
```

Der im Diagnoseartefakt rote allgemeine Pages-Checker war kein Produktfehler. Der einmalige Diagnoseworkflow hatte `lr5-ricco-master-source-inventory.json` nicht heruntergeladen. Der produktive Snapshot in PR #109 enthält diese und alle weiteren Dateien für alle drei Public-Checker.

## Nachgewiesenes Betriebsproblem

Deploy und öffentlicher Beweis waren in einem Job gekoppelt.

Folge:

- ein roter Public-Checker machte den gesamten Deploy-Job rot
- ein Retry musste erneut deployen
- der zweite Deploy konnte unabhängig vom öffentlichen Produktzustand scheitern
- ein nachgelagerter Reporter konnte einen schwächeren Fallbacktext über Issue #11 schreiben

## Konsolidierungsentscheidung

Parallel entstand PR #108 mit einer nützlichen fail-closed Barriere, aber zusätzlich zwei weiteren Workflows, während die gekoppelte Alt-Pipeline bestehen geblieben wäre.

Aus PR #108 wurden ausschließlich übernommen:

- `scripts/wait_public_proof_barrier.mjs`
- `tests/public-proof-barrier.test.mjs`

Nicht übernommen wurden die parallelen Workflows. Der endgültige Vertrag besitzt damit genau:

1. einen Deploy-Workflow,
2. einen separat wiederholbaren Public-Proof-Workflow,
3. eine sechs Verträge umfassende Commit-Barriere,
4. einen stale-Manifest-Negativtest.

## Korrektur

### `pages.yml`

Verantwortet nur noch:

- Verträge
- Build
- lokale Browser- und Artefaktbeweise
- GitHub-Pages-Deploy

Der Workflow besitzt:

- keine öffentlichen Checker
- keine Issue-Schreibrechte
- keine Issue-Mutation

### `pages-outcome.yml`

Verantwortet nach erfolgreichem Deploy:

- Checkout des exakten ausgelieferten Commits
- fail-closed Barriere für Dashboard, Studio, Academy, Readiness und beide Statusverträge
- vollständigen öffentlichen Snapshot mit begrenzten Transport-Retries
- Studio-, Academy- und Readiness-Live-Smoke
- alle drei Public-Checker
- eigenes Public-Proof-Artefakt
- Rich-Proof in Issue #11
- idempotenten OPS1-Kommentar in Issue #95
- Schließen des Blocker-Issues bei PASS

Bei Fehlern:

- Issue #11 bleibt unverändert
- der letzte gute Beweis wird nicht überschrieben
- ausschließlich das Blocker-Issue wird aktualisiert
- kein Erfolg für den neuen Commit wird behauptet

## Barrier-Vertrag

Die Barriere wartet begrenzt auf sechs zusammenpassende öffentliche Verträge:

- Dashboard-Runtime
- Studio-Runtime
- Academy-Runtime
- Readiness-Runtime
- Academy-Status
- Readiness-Vertrag

Sie prüft unter anderem:

- exakten Commit bei allen Runtime-Manifeste
- LR5.1 als aktiven Arbeitspfad
- Academy 12/12
- `creativeApprovalGranted=false`
- `finalEpisodeApprovalGranted=false`
- Readiness `2/10 CLOSED_VERIFIED · 7 PARTIAL · 1 OPEN`
- `Production Ready=false`
- `Beginner Ready=false`

Der Negativtest hält ein Readiness-Manifest absichtlich auf einem stale Commit und verlangt einen harten `PUBLIC_BARRIER:TIMEOUT`.

## Negative PR-Evidence

### Lauf `29160379623`

Head:

```text
1c153d44ba992be5dd7686516f0c7a8f252f766a
```

Ergebnis: `failure` vor Produkt-Build und Browser-Smoke.

Ursache:

```text
missing public snapshot file: studio-runtime-evidence.json
```

Der Pipeline-Test suchte alle Pflichtdateien ausschließlich im Outcome-YAML. Nach der Konsolidierung werden sechs Commit-Verträge jedoch absichtlich vom Barrier-Skript erzeugt.

Korrektur:

- Barrier-Dateien werden gegen `wait_public_proof_barrier.mjs` geprüft
- restliche Snapshot-Dateien gegen `pages-outcome.yml`
- keine Produktionslogik oder öffentliche Sicherheitsgrenze wurde geändert

## Positiver PR-Laufbeweis

Geprüfter Head:

```text
dc6a8cdd2ea3a61effa73470f45e66807ea8a9a2
```

CI-Run:

```text
29160465572
```

CI-Artefakt:

```text
Artifact-ID: 8250669139
Digest: sha256:d02487a2a82c0bc98db7592b0003a15b8594bbcd9e16e14e0a4ac26689ccab0f
```

Bestanden:

- PR-Evidence-Preflight
- Deploy-/Public-Proof-Trennungsvertrag
- Barrier-PASS-Test
- stale-Manifest-TIMEOUT-Negativtest
- sämtliche Truth-, LR3-, LR4-, LR5.1-, Academy- und Readiness-Tests
- Studio-Build
- Dashboard-, Studio-, Academy- und Readiness-Browser-Smoke
- Pages-, Academy- und Readiness-Artefaktverträge
- Timingexport
- Recovery-Scanner
- technischer M1-Render

## Noch ausstehend

Dieses Evidence-Dokument verändert den Head. Deshalb muss der finale Head erneut die vollständige PR-CI bestehen.

Nach Merge müssen getrennt bewiesen werden:

1. `Deploy Comic Factory Dashboard` auf dem Merge-Commit
2. `Verify and Report Comic Factory Pages` auf demselben Commit
3. Rich-Proof in Issue #11 mit beiden Run-URLs
4. Blocker #105 geschlossen
5. OPS1 #95 weiterhin offen und ehrlich begrenzt
6. PR #108 als superseded geschlossen

## Nicht behauptet

- der getrennte Deploy-/Proof-Vertrag ist noch nicht auf `main` ausgeführt
- Issue #103, #105 oder #107 ist noch nicht geschlossen
- Production Ready oder Beginner Ready
- ein bestandener externer Nullwissen-Lauf
- ein Ricco-Kandidat oder kreativer Master
- eine fertige Episode
- Growth-OS-Integration oder Live-Publishing
