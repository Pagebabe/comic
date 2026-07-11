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
- vollständigen öffentlichen Snapshot
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

## PR-Laufbeweis

Geprüfter Head:

```text
b8e2de8667e41792fef918f54cd68d6b4a9c3472
```

CI-Run:

```text
29160056944
```

CI-Artefakt:

```text
Artifact-ID: 8250555210
Digest: sha256:3c377347dfe22312ddafedaeb5948c63398c23100cd208369496feb4681737e7
```

Bestanden:

- PR-Evidence-Preflight
- neuer Pages-Proof-Pipeline-Vertrag
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

## Nicht behauptet

- der getrennte Deploy-/Proof-Vertrag ist noch nicht auf `main` ausgeführt
- Issue #103, #105 oder #107 ist noch nicht geschlossen
- Production Ready oder Beginner Ready
- ein bestandener externer Nullwissen-Lauf
- ein Ricco-Kandidat oder kreativer Master
- eine fertige Episode
- Growth-OS-Integration oder Live-Publishing
