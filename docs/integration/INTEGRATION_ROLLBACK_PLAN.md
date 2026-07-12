# Integration Rollback Plan

Status: fail closed. Dieses Dokument autorisiert keinen direkten Merge nach `main`.

## Betriebsregel

Jeder Integrationsversuch findet auf einem neuen Branch statt, der von einem exakt verifizierten Main-Head erstellt wurde. Worker-Branches bleiben unveränderliche Inputs. Ein fehlerhafter Integrationsbranch wird verworfen oder über normale Git-Historie korrigiert, niemals per Force-Push oder History Rewrite.

## Vor jeder Integration

Dokumentieren:

```bash
git status --short
git rev-parse HEAD
git rev-parse origin/main
git branch --show-current
git log -10 --oneline --decorate
```

Pflichtbedingungen:

- sauberer Arbeitsbaum;
- exakt gepinnte finale Worker-Heads;
- terminal grüne Pflichtworkflows;
- aktuelle Evidence-Kette aus PR #141;
- keine ungelösten Reviewthreads;
- erreichbare Remote-Refs für alle Input-Branches;
- keine Live-, OAuth-, Secret-, Account- oder Publishing-Aktivierung.

## Aktuell bewiesene Factory-Inputs

```text
Worker 1: 1bb4df874d8e2a36fd32fbad19074ed629ec922d
Worker 2: e8b8e348120ad527abe7a33caab9f56b6627f8c2
```

Beide Heads sind in der Rehearsal nacheinander konfliktfrei. Das ist noch kein Main-Merge und keine Gesamtintegration.

## Wegwerf-Rehearsal und Rollback

Bei einem nicht committeten Mergekonflikt:

```bash
git diff --name-only --diff-filter=U
git merge --abort
git reset --hard <verified-integration-start>
git clean -fdx
git status --short
```

Die Worker-4-Automation führt dies ausschließlich in einem temporären detached Worktree aus, entfernt danach den Worktree und führt `git worktree prune` aus.

## Integrationsbranch-Rollback

Wenn ein committierter Integrationsstand falsch ist:

1. weitere Merges sofort stoppen;
2. Logs, Artefakte und den exakten fehlerhaften Commit bewahren;
3. nicht force-pushen;
4. entweder einen normalen Revert-Commit verwenden oder einen Ersatzbranch vom gleichen verifizierten Main-Head erstellen;
5. nur die letzte bewiesene Sequenz wiederholen;
6. Konflikte durch explizite Dateikomposition lösen;
7. alle Gates erneut ausführen.

Kein pauschales `ours` oder `theirs` für `package.json`, CI-Workflows, Canon-Dateien oder Studio-Dateien.

## Growth-Reintegrationsregel

Der bewiesene Konflikt liegt in `package.json` der alten Growth-Linie. Daher:

1. separaten Current-Main-MKT0-Reintegrationsbranch erstellen;
2. mit dem aktuellen Main-Paket beginnen;
3. Growth-Scripts einzeln und nachvollziehbar ergänzen;
4. MKT0 vollständig regressionsprüfen;
5. PR #131 auf diese Linie portieren;
6. Worker 3 zuletzt auf die aktualisierte PR-#131-Linie setzen;
7. Rehearsal und Rollback erneut beweisen.

## Main-Schutz

Kein Worker-4-Befehl pusht oder mergt nach `main`. Eine spätere menschlich freigegebene Main-Integration muss über einen PR erfolgen, dessen Head exakt dem getesteten Integrationscommit entspricht.

Bei einem unautorisierten Main-Merge:

- Deployment und Publishing stoppen;
- unautorisierten Merge-SHA dokumentieren;
- normalen Revert-PR gegenüber History Rewrite bevorzugen;
- Recovery- und Fresh-Install-Drills auf dem Revert-Kandidaten ausführen;
- vollständige Evidence für das Audit bewahren.

## Stopbedingungen

Sofort stoppen, wenn:

- ein gepinnter Worker-, Growth- oder Main-Head driftet;
- der Merge-Base nicht auflösbar ist;
- ein Abhängigkeitszyklus entsteht;
- eine Konfliktlösung aktuelles Main-Verhalten verwerfen würde;
- Package-Scripts oder Pflichtgates verschwinden;
- Main-, Growth-, Browser-, Fresh-Install- oder Recovery-Regression fehlschlägt;
- der Quell-Worktree nach einer Probe nicht sauber ist;
- echte Pilot- oder Masterfreigaben aus dem technischen Worker-2-Beweis abgeleitet werden;
- Force-Push, Branch-Löschung, OAuth, Secrets, Live-Publishing oder Account-Aktivierung verlangt werden.

## Bewiesener Rollback-Zustand

Eine Sequenz gilt nur als sauber zurückgesetzt, wenn:

```text
merge state absent
working tree clean
temporary worktree removed
source branch unchanged
pushes performed = 0
force pushes performed = 0
```

Das aktuelle Rehearsal-Artefakt bestätigt diese Eigenschaften für alle drei Varianten und den Quell-Worktree.
