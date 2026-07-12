# Worker 4 · Integration Rehearsal Report

Decision: `PROGRAM_MERGE_REHEARSAL_READY_CURRENT_HEADS`  
Repository: `Pagebabe/comic`  
Branch: `worker/integration-rehearsal`  
Draft PR: `#142`  
Main basis: `b58534d0a737b1d01834628177e1090de027de61`

## Scope

Dieser Branch enthält ausschließlich Merge-Rehearsal-, Abhängigkeits-, Konflikt-, Rollback- und Evidence-Kontrollen. Keine Canon-, Episode-, Studio-, Growth-, Publishing-, OAuth-, Secret- oder Account-Produktlogik wurde aktiviert.

## Gepinnte Linien

| ID | Head | Status |
|---|---|---|
| Worker 1 | `1bb4df874d8e2a36fd32fbad19074ed629ec922d` | `CANON_CAST_SEPARATION_PROVEN` |
| Worker 2 | `e8b8e348120ad527abe7a33caab9f56b6627f8c2` | `EPISODE_PIPELINE_PROVEN` |
| MKT0 | `4b4673f2d068e3b8c1e007daf1cda763d9836ed3` | `DIVERGED` |
| PR #131 | `9573757dbd9b39858ebae2b37337d2728a3455e4` | `PROVEN_NOT_MERGED` |
| Worker 3 | `c8c0adcef30645142190c19d8fbc6903fe177ae7` | `MKT0_INTEGRATION_MERGE_READY` |

Worker 2 ist final gebunden. Sein Status bleibt ein technischer Testasset-Beweis, keine echte Pilotepisode und keine Masterfreigabe.

## Gemessene Factory-Distanzen

```text
Worker 1: 38 ahead · 0 behind · 20 changed files
Worker 2: 24 ahead · 0 behind · 14 changed files
```

Beide Factory-Worker besitzen denselben Merge-Base zum aktuellen Main-Stand.

## Aktueller Wegwerf-Worktree-Beweis

Implementierungs-Head:

```text
ba7f5aef7b74e572de47028ca8c45ccfcf6f1a4d
```

Workflow:

```text
Program Merge Rehearsal: 29189672482 · success
Artifact-ID: 8259114038
Artifact: program-merge-rehearsal-e0a7c114f5e29960c23dbee2509197caf178ee81
Digest: sha256:6b357cc5f4ba0a24f3f733b378b37eba9c0939c97da4b02682c59cfe8ed5cbf8
Expired: false
```

## Exakte Sequenzresultate

### Variante A

```text
main
→ Worker 1: MERGEABLE_IN_REHEARSAL
→ Worker 2: MERGEABLE_IN_REHEARSAL
→ PR #131: CONFLICT_REQUIRES_MANUAL_INTEGRATION
Conflict: package.json
Rollback: clean
```

### Variante B

```text
main
→ PR #131: CONFLICT_REQUIRES_MANUAL_INTEGRATION
Conflict: package.json
Rollback: clean
```

### Variante C

```text
main
→ Worker 1: MERGEABLE_IN_REHEARSAL
→ Worker 2: MERGEABLE_IN_REHEARSAL
→ MKT0: CONFLICT_REQUIRES_MANUAL_INTEGRATION
Conflict: package.json
Rollback: clean
```

Damit ist bewiesen:

- Worker 1 und Worker 2 sind auf den finalen Heads miteinander konfliktfrei komponierbar.
- Der erste harte Konflikt liegt in der alten Growth-Linie und betrifft `package.json`.
- PR #131 und Worker 3 dürfen nicht direkt auf die aktuelle Main-Linie gezogen werden.
- Jeder Versuch wurde sauber abgebrochen oder zurückgesetzt.

## Rollback und Safety

```text
source_worktree_clean_after = true
direct_main_merge_performed = false
pushes_performed = 0
force_pushes_performed = 0
force_push_allowed = false
history_rewrite_allowed = false
branch_deletion_allowed = false
live_activation_allowed = false
```

## Verbindliche Integrationsreihenfolge

1. Frischen Integrationsbranch vom verifizierten Main-Head erstellen.
2. Exakten Worker-1-Head integrieren.
3. Exakten Worker-2-Head integrieren.
4. Factory-only Regression ausführen.
5. Separaten Current-main-MKT0-Reintegrationsbranch erstellen.
6. `package.json` explizit komponieren, niemals pauschal `ours` oder `theirs` verwenden.
7. MKT0 vollständig gegen Current Main regressieren.
8. PR #131 auf die aktualisierte MKT0-Linie übernehmen.
9. Worker 3 auf die aktualisierte PR-131-Linie übertragen.
10. Aktualisiertes Growth-Paket in den Program-Integrationsbranch integrieren.
11. Vollständige CI, Browser-, Fresh-Install-, Recovery-, Evidence- und Rollback-Gates ausführen.
12. Menschliche Prüfung vor jedem späteren Main-Merge.

## Verbleibende Blocker

```text
MKT0_CURRENT_MAIN_REINTEGRATION_NOT_PROVEN
PR_131_AND_WORKER_3_STACK_NOT_REBASED_TO_CURRENT_MAIN
PROGRAM_COMBINED_REGRESSION_NOT_PROVEN
PROGRAM_ROLLBACK_NOT_PROVEN
HUMAN_MAIN_MERGE_APPROVAL_MISSING
```

## Nicht behauptet

- keine konfliktfreie Gesamtintegration
- kein Merge nach `main`
- keine Produktmutation
- keine echte Pilotepisode
- keine Growth-Live-Aktivierung
- keine Produktionsreife

Der Bericht dokumentiert den erfolgreichen Implementierungs-Run. Der nachfolgende Dokumentations-Head muss erneut durch Program Merge Rehearsal und Comic Factory CI bestätigt werden. Der finale Branch-Head und dessen Runs werden im Draft-PR #142 geführt.
