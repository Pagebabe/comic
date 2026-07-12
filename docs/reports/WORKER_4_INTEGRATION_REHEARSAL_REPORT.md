# Worker 4 · Integration Rehearsal Report

Decision: `PROGRAM_MERGE_REHEARSAL_READY_PENDING_WORKER_2`  
Repository: `Pagebabe/comic`  
Branch: `worker/integration-rehearsal`  
Draft PR: `#142`  
Main basis: `b58534d0a737b1d01834628177e1090de027de61`  
Proven implementation head: `94a69b1de6f16e51fe1a9a7dd84f80cf823eda0d`

> The report commit itself becomes the later branch head. Git commit hashes include the report contents, so a commit cannot truthfully embed its own final hash. The authoritative final branch head is therefore the head shown by Draft PR #142 after this report commit; no implementation files are changed after the proven implementation head.

## Scope

Worker 4 created only Git-history, dependency, merge-order, conflict, rollback and evidence controls. It did not modify Canon content, Episode production, Studio product behavior, Growth product logic, publishing, OAuth, secrets or accounts.

No merge to `main`, force-push, branch deletion or history rewrite was performed.

## Reconstructed branches

| ID | Branch | Head observed or pinned | Merge base to main | Ahead | Behind | PR | State |
|---|---|---|---|---:|---:|---:|---|
| Worker 1 | `worker/canon-lock` | `b891d36c32c2a38badcfb897f46e6f1a29f13e70` | current main | 20 | 0 | #138 | final, Draft, not merged |
| Worker 2 | `worker/episode1-proof` | observed `44184ca72924a1e0b23d84c19014c57ba503f108` | current main | 16 observed | 0 observed | #140 | Draft, final head unknown |
| MKT0 | `feature/mkt0-growth-os-rebased` | `4b4673f2d068e3b8c1e007daf1cda763d9836ed3` | `6ea5b2ab22079ea9083bccaef14c19be9306ae72` | 91 | 344 | n/a | diverged |
| PR #131 | `feature/mkt1-001-factory-handoff` | `9573757dbd9b39858ebae2b37337d2728a3455e4` | `6ea5b2ab22079ea9083bccaef14c19be9306ae72` | 102 | 344 | #131 | open, proven, not merged |
| Worker 3 | `worker/mkt0-shadow-integration` | `c8c0adcef30645142190c19d8fbc6903fe177ae7` | `6ea5b2ab22079ea9083bccaef14c19be9306ae72` | 115 | 344 | #139 | stacked, not merged |

Worker 2 is only a read-only observation. Its visible head is not promoted to a final acceptance pin.

## Dependency graph

```text
MKT0 → PR #131 → Worker 3
current main → Worker 1
current main → provisional Worker 2
Worker 1 + final Worker 2 + current-main MKT0 package → future program integration
```

Hard rules:

- Worker 3 without PR #131 is invalid.
- PR #131 without MKT0 is invalid.
- Worker 2 without final report, exact final head and terminal green CI is a hard stop.
- The old Growth ancestry is not a direct-main merge candidate.

## Reproducible probe design

The workflow:

1. checks out complete history;
2. validates syntax, manifest and 22 focused tests;
3. fetches the exact remote refs;
4. verifies pinned heads, while treating Worker 2 as provisional;
5. creates a detached worktree below a temporary parent directory;
6. configures a local throwaway Git identity only in that worktree;
7. runs `git merge --no-commit --no-ff` for variants A, B and C;
8. records exact conflict files and stderr;
9. aborts conflicted merges;
10. resets and cleans after every sequence;
11. removes and prunes the worktree;
12. rejects `PROBE_FAILED`, `ROLLBACK_FAILED`, missing conflict files or dirty worktrees;
13. runs current-main regression and Studio build;
14. uploads JSON, log and conventional-script availability evidence.

## Actual conflict evidence

### Variant A

```text
main → Worker 1 → Worker 2 → PR #131 → Worker 3
```

Measured result:

```text
Worker 1: MERGEABLE_IN_REHEARSAL
Worker 2 observed head: MERGEABLE_IN_REHEARSAL
PR #131: CONFLICT_REQUIRES_MANUAL_INTEGRATION
Conflict file: package.json
Rollback: clean
```

Worker 3 is not reached because its required predecessor already conflicts. This is a valid fail-closed stop, not evidence against Worker 3 itself.

### Variant B

```text
main → PR #131 → Worker 3 → Worker 1 → Worker 2
```

Measured result:

```text
PR #131: CONFLICT_REQUIRES_MANUAL_INTEGRATION
Conflict file: package.json
Rollback: clean
```

This sequence is rejected. It imports the stale Growth stack before current Canon and Episode evidence.

### Variant C

```text
fresh integration branch from current main
→ Worker 1
→ Worker 2
→ MKT0
→ PR #131
→ Worker 3
```

Measured result:

```text
Worker 1: MERGEABLE_IN_REHEARSAL
Worker 2 observed head: MERGEABLE_IN_REHEARSAL
MKT0: CONFLICT_REQUIRES_MANUAL_INTEGRATION
Conflict file: package.json
Rollback: clean
```

Variant C remains the recommended shape only after the explicit `package.json` integration is implemented on a separate current-main MKT0 branch and Worker 2 has finalized.

## Recommended merge order

1. Create a fresh program-integration branch from an exact verified `main` head.
2. Review Worker 1 and merge only its exact approved head into that integration branch.
3. Wait for Worker 2's final report, exact final head and terminal green workflows.
4. Rerun the rehearsal against that final Worker-2 head.
5. Merge the exact final Worker-2 head only after the repeated rehearsal is green.
6. Create a separate current-main MKT0 reintegration branch.
7. Resolve `package.json` by explicit script composition, never blanket `ours` or `theirs`.
8. Run current-main and complete Growth regression on the updated MKT0 line.
9. Integrate PR #131 only after updated MKT0 is proven.
10. Retarget or rebase Worker 3 onto the updated PR-#131 line.
11. Integrate the tested Growth package into the program-integration branch.
12. Run full Studio, browser, current-main, Growth, fresh-install, recovery and evidence gates.
13. Require human review before any later `main` merge.

## Rollback proof

All three sequences record:

```text
clean_after_rollback = true
source_worktree_clean_after = true
direct_main_merge_performed = false
pushes_performed = 0
force_pushes_performed = 0
```

A future failed integration branch must be replaced or reverted through normal Git history. Force-push and history rewrite remain prohibited.

## Tests and CI

Proven implementation head:

```text
94a69b1de6f16e51fe1a9a7dd84f80cf823eda0d
```

Successful runs:

```text
Program Merge Rehearsal: 29186073592 · success
Comic Factory CI:       29186073591 · success
```

Focused tests: `22` passed.

Additional successful gates in the rehearsal workflow:

```text
syntax checks
manifest parse and validation
actual disposable Git variants A/B/C
current-main npm test
Studio dependency install from lockfile
npm run build:studio
tracked source mutation check
artifact upload
```

Conventional root script availability was recorded honestly:

```text
lint = NOT_DEFINED_ON_CURRENT_MAIN
typecheck = NOT_DEFINED_ON_CURRENT_MAIN
build = NOT_DEFINED_ON_CURRENT_MAIN
```

No absent script is claimed as passed.

## Workflow artifact

```text
Artifact ID: 8258037264
Name: program-merge-rehearsal-609434b90d56c53c9456c9f774cbb16840ac084c
Digest: sha256:406089d98e203aa545f72756d6478479de2fa9c2d621b9e71bf39da821cef5bd
```

Files:

```text
program-merge-rehearsal.json
program-merge-rehearsal.log
conventional-script-availability.json
```

The artifact was downloaded and visually inspected. It contains the exact heads, states, `package.json` conflicts and clean rollback assertions listed above.

## Safety result

```text
direct_main_merge_allowed = false
force_push_allowed = false
branch_deletion_allowed = false
history_rewrite_allowed = false
live_activation_allowed = false
publishing_allowed = false
oauth_allowed = false
secrets_allowed = false
worker_2_status = PENDING
```

## Final decision

```text
PROGRAM_MERGE_REHEARSAL_READY_PENDING_WORKER_2
```

The rehearsal mechanism, conflict map and rollback path are proven. The overall program is not merge-ready while Worker 2 remains pending and MKT0 has not been rebuilt and regressed against current `main`.
