# Comic Factory · Program Merge Rehearsal

Status: `PROGRAM_MERGE_REHEARSAL_READY_CURRENT_HEADS`  
Repository: `Pagebabe/comic`  
Audit basis: `main@b58534d0a737b1d01834628177e1090de027de61`

## Zweck

Dieses Paket beweist die aktuelle Merge-Reihenfolge, Branch-Abhängigkeiten, Konfliktstellen und Rollback-Sicherheit. Es führt keinen Merge nach `main` aus und verändert keine Canon-, Episoden-, Growth-, Publishing-, OAuth- oder Account-Logik.

## Verbindlich geprüfte Heads

| Linie | Finaler Head | Status |
|---|---|---|
| `worker/canon-lock` | `1bb4df874d8e2a36fd32fbad19074ed629ec922d` | Canon/Cast bewiesen, nicht gemergt |
| `worker/episode1-proof` | `e8b8e348120ad527abe7a33caab9f56b6627f8c2` | `EPISODE_PIPELINE_PROVEN`, technischer Beweis |
| `feature/mkt0-growth-os-rebased` | `4b4673f2d068e3b8c1e007daf1cda763d9836ed3` | 344 Commits hinter aktuellem `main` |
| `feature/mkt1-001-factory-handoff` | `9573757dbd9b39858ebae2b37337d2728a3455e4` | PR #131, offen und ungemergt |
| `worker/mkt0-shadow-integration` | `c8c0adcef30645142190c19d8fbc6903fe177ae7` | Shadow-Integration, gestapelt auf PR #131 |

Worker 2 ist nicht mehr `PENDING`. Sein Ergebnis ist weiterhin keine echte Pilotepisode und keine Character-, Location-, Style- oder Voice-Freigabe.

## Reproduzierbarer Beweis

```bash
node --check scripts/check_program_merge_readiness.mjs
node --check scripts/run_program_merge_rehearsal.mjs
node --test --test-concurrency=1 tests/program-merge-readiness.test.mjs
node scripts/check_program_merge_readiness.mjs
node scripts/run_program_merge_rehearsal.mjs \
  --manifest project/program-merge-readiness.json \
  --output output/program-merge-rehearsal.json
```

Der Runner erstellt einen detached Wegwerf-Worktree, prüft die gepinnten Remote-Refs, führt drei Sequenzen mit `git merge --no-commit --no-ff` aus, zeichnet Konfliktdateien auf und setzt jede Sequenz sauber auf den verifizierten Main-Head zurück.

## Gemessene Sequenzen

| Sequenz | Erfolgreiche Schritte | Stopppunkt | Konflikt | Rollback |
|---|---|---|---|---|
| A | Worker 1, finaler Worker 2 | PR #131 | `package.json` | sauber |
| B | keine | PR #131 | `package.json` | sauber |
| C | Worker 1, finaler Worker 2 | MKT0 | `package.json` | sauber |

Damit ist bewiesen:

- Worker 1 und Worker 2 lassen sich gemeinsam konfliktfrei auf dem aktuellen Main-Stand proben.
- Der erste reale Integrationsblocker liegt in der alten Growth-Linie und betrifft `package.json`.
- PR #131 und Worker 3 dürfen nicht direkt auf die heutige Main-Linie gezogen werden.
- MKT0 muss zuerst auf einem eigenen Current-Main-Reintegrationsbranch neu zusammengesetzt und vollständig regressionsgetestet werden.

## Workflow-Beweis

```text
Program Merge Rehearsal: 29189672482 · success
Head: ba7f5aef7b74e572de47028ca8c45ccfcf6f1a4d
Artifact: 8259114038
Digest: sha256:6b357cc5f4ba0a24f3f733b378b37eba9c0939c97da4b02682c59cfe8ed5cbf8
JSON SHA-256: 41c4fb05292cce6391b066aec0fd62d7728df79822ed293a6dd77adf3a5025f2
```

## Verbindliche nächste Reihenfolge

1. Frischen Factory-Integrationsbranch vom verifizierten `main` erstellen.
2. Exakten Worker-1-Head integrieren.
3. Exakten Worker-2-Head integrieren.
4. Factory-only Regression, Browser, Fresh Install, Recovery und Rollback ausführen.
5. Separaten Current-Main-MKT0-Reintegrationsbranch erstellen.
6. `package.json` explizit zusammensetzen, niemals pauschal `ours` oder `theirs` verwenden.
7. MKT0 und Growth vollständig testen.
8. PR #131 auf die aktualisierte MKT0-Linie portieren.
9. Worker 3 auf die aktualisierte PR-#131-Linie setzen.
10. Erst danach das geprüfte Growth-Paket in den Programmintegrationsbranch übernehmen.
11. Menschliches Review vor jedem späteren Main-Merge.

## Entscheidung

```text
PROGRAM_MERGE_REHEARSAL_READY_CURRENT_HEADS
PROGRAM_INTEGRATION_BLOCKED_BY_GROWTH_PACKAGE_CONFLICT
```

Kein Main-Merge, kein Force-Push, kein Publishing und keine Live-Aktivierung wurden ausgeführt oder autorisiert.
