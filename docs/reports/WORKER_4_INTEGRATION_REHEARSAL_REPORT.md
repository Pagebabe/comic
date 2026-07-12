# Worker 4 · Current Integration Rehearsal Report

Repository: `Pagebabe/comic`  
Branch: `worker/integration-rehearsal`  
Draft-PR: `#142`  
Main-Basis: `b58534d0a737b1d01834628177e1090de027de61`

## Entscheidung

```text
PROGRAM_MERGE_REHEARSAL_READY_CURRENT_HEADS
PROGRAM_INTEGRATION_BLOCKED_BY_GROWTH_PACKAGE_CONFLICT
```

Die Rehearsal bindet die finalen Heads von Worker 1, Worker 2 und Worker 3 sowie die unveränderten Growth-Inputs. Worker 2 wird nicht mehr als `PENDING` oder provisorisch geführt.

## Technisch bewiesener Head

```text
ba7f5aef7b74e572de47028ca8c45ccfcf6f1a4d
```

Dieser Head wurde durch die aktuelle Merge-Rehearsal und die vollständige Comic-Factory-CI geprüft. Der nachfolgende Dokumentationscommit verändert keine Rehearsal- oder Produktlogik; dessen finaler Branch-Head und Merge-Testcommit werden nach den erneuten GitHub-Läufen im Draft-PR dokumentiert.

## Gepinnte Inputs

| ID | Branch | Finaler Head | Status |
|---|---|---|---|
| Worker 1 | `worker/canon-lock` | `1bb4df874d8e2a36fd32fbad19074ed629ec922d` | Canon/Cast bewiesen, nicht gemergt |
| Worker 2 | `worker/episode1-proof` | `e8b8e348120ad527abe7a33caab9f56b6627f8c2` | `EPISODE_PIPELINE_PROVEN` |
| MKT0 | `feature/mkt0-growth-os-rebased` | `4b4673f2d068e3b8c1e007daf1cda763d9836ed3` | 344 Commits hinter aktuellem Main |
| PR #131 | `feature/mkt1-001-factory-handoff` | `9573757dbd9b39858ebae2b37337d2728a3455e4` | offen und ungemergt |
| Worker 3 | `worker/mkt0-shadow-integration` | `c8c0adcef30645142190c19d8fbc6903fe177ae7` | Shadow-Integration auf PR #131 |

## Worker-2-Beweisgrenze

```text
TECHNICAL EPISODE PIPELINE PROOF ONLY
NO REAL PILOT
NO CREATIVE APPROVAL
NO CHARACTER LOCK
NO LOCATION LOCK
NO STYLE LOCK
NO VOICE LOCK
NO PRODUCTION READINESS CLAIM
```

## Reale Merge-Ergebnisse

### Sequenz A

```text
main → Worker 1 → Worker 2 → PR #131 → Worker 3
```

Ergebnis:

```text
Worker 1: MERGEABLE_IN_REHEARSAL
Worker 2: MERGEABLE_IN_REHEARSAL
PR #131: CONFLICT_REQUIRES_MANUAL_INTEGRATION
Konfliktdatei: package.json
Rollback: sauber
```

### Sequenz B

```text
main → PR #131 → Worker 3 → Worker 1 → Worker 2
```

Ergebnis:

```text
PR #131: CONFLICT_REQUIRES_MANUAL_INTEGRATION
Konfliktdatei: package.json
Rollback: sauber
```

Diese Reihenfolge ist verboten, weil sie die alte Growth-Abstammung zuerst einführt.

### Sequenz C

```text
main → Worker 1 → Worker 2 → MKT0 → PR #131 → Worker 3
```

Ergebnis:

```text
Worker 1: MERGEABLE_IN_REHEARSAL
Worker 2: MERGEABLE_IN_REHEARSAL
MKT0: CONFLICT_REQUIRES_MANUAL_INTEGRATION
Konfliktdatei: package.json
Rollback: sauber
```

## Zentrale Erkenntnis

Das Factory-Paket aus Worker 1 und Worker 2 ist auf dem aktuellen Main-Stand konfliktfrei zusammensetzbar. Der verbleibende Integrationsblocker liegt nicht mehr bei Worker 2, sondern bei der 344 Commits zurückliegenden Growth-Linie und ihrer `package.json`.

## GitHub-Beweise des technischen Heads

```text
Program Merge Rehearsal: 29189672482 · success
Comic Factory CI:       29189672479 · success
```

Workflow-Artefakt:

```text
Artifact-ID: 8259114038
Name: program-merge-rehearsal-e0a7c114f5e29960c23dbee2509197caf178ee81
Digest: sha256:6b357cc5f4ba0a24f3f733b378b37eba9c0939c97da4b02682c59cfe8ed5cbf8
JSON SHA-256: 41c4fb05292cce6391b066aec0fd62d7728df79822ed293a6dd77adf3a5025f2
Expired: false
```

Das heruntergeladene Artefakt bestätigt:

```text
all_final_worker_heads_pinned = true
worker_2_final_status = EPISODE_PIPELINE_PROVEN
source_worktree_clean_after = true
direct_main_merge_performed = false
pushes_performed = 0
force_pushes_performed = 0
```

## Verbindliche Integrationsreihenfolge

1. Frischen Factory-Integrationsbranch vom exakten Main-Head erstellen.
2. Exakten Worker-1-Head integrieren.
3. Exakten Worker-2-Head integrieren.
4. Factory-only Regression, Browser, Fresh Install, Recovery, Evidence und Rollback beweisen.
5. Separaten Current-Main-MKT0-Reintegrationsbranch erstellen.
6. `package.json` explizit zusammensetzen, niemals pauschal `ours` oder `theirs` verwenden.
7. MKT0 und Growth vollständig regressionsprüfen.
8. PR #131 auf die aktualisierte MKT0-Linie portieren.
9. Worker 3 auf die aktualisierte PR-#131-Linie setzen.
10. Das bewiesene Growth-Paket in den Programmintegrationsbranch übernehmen.
11. Vollständige kombinierte Regression und Rollback wiederholen.
12. Menschliches Review vor jedem späteren Main-Merge.

## Aktuelle Blocker

```text
MKT0_CURRENT_MAIN_REINTEGRATION_NOT_PROVEN
PR_131_AND_WORKER_3_STACK_NOT_REBASED_TO_CURRENT_MAIN
PROGRAM_COMBINED_REGRESSION_NOT_PROVEN
PROGRAM_ROLLBACK_NOT_PROVEN
HUMAN_MAIN_MERGE_APPROVAL_MISSING
```

## Sicherheitsresultat

```text
direct_main_merge_allowed = false
force_push_allowed = false
branch_deletion_allowed = false
history_rewrite_allowed = false
live_activation_allowed = false
publishing_allowed = false
oauth_allowed = false
secrets_allowed = false
```

## Nicht behauptet

- keine konfliktfreie Growth-Gesamtintegration,
- kein Merge nach `main`,
- keine Änderung fremder Worker-Branches,
- kein lokaler Assetscan,
- keine Masterfreigabe,
- keine echte Pilotepisode,
- kein Publishing oder Live-Betrieb.

`PROVEN · CURRENT HEADS · NOT MERGED`
