# Worker 4 · Integration Rehearsal Report

Decision: `PROGRAM_MERGE_REHEARSAL_READY_PENDING_WORKER_2`  
Repository: `Pagebabe/comic`  
Branch: `worker/integration-rehearsal`  
Main basis: `b58534d0a737b1d01834628177e1090de027de61`  
Implementation head before this report: `480c31ab3432657e406a1050f5841b50e053d9f7`

## Scope

This worker created only Git-history, dependency, merge-order, conflict, rollback and evidence controls. It did not modify Canon content, Episode production, Studio product behavior, Growth product logic, publishing, OAuth, secrets or accounts.

## Reconstructed branches

| ID | Branch | Head observed/pinned | Merge base to main | Ahead | Behind | PR | State |
|---|---|---|---|---:|---:|---:|---|
| Worker 1 | `worker/canon-lock` | `b891d36c32c2a38badcfb897f46e6f1a29f13e70` | current main | 20 | 0 | #138 | final, Draft, not merged |
| Worker 2 | `worker/episode1-proof` | observed `44184ca72924a1e0b23d84c19014c57ba503f108` | current main | 16 observed | 0 observed | #140 | Draft, `PENDING_DEPLOY`, final head unknown |
| MKT0 | `feature/mkt0-growth-os-rebased` | `4b4673f2d068e3b8c1e007daf1cda763d9836ed3` | `6ea5b2ab22079ea9083bccaef14c19be9306ae72` | 91 | 344 | n/a | diverged |
| PR #131 | `feature/mkt1-001-factory-handoff` | `9573757dbd9b39858ebae2b37337d2728a3455e4` | `6ea5b2ab22079ea9083bccaef14c19be9306ae72` | 102 | 344 | #131 | open, proven, not merged |
| Worker 3 | `worker/mkt0-shadow-integration` | `c8c0adcef30645142190c19d8fbc6903fe177ae7` | `6ea5b2ab22079ea9083bccaef14c19be9306ae72` | 115 | 344 | #139 | stacked, not merged |

## Dependency graph

```text
MKT0 → PR #131 → Worker 3
current main → Worker 1
current main → provisional Worker 2
Worker 1 + final Worker 2 + current-main MKT0 package → future program integration
```

Worker 3 without PR #131 is invalid. PR #131 without MKT0 is invalid. Worker 2 without its final report, immutable final head and terminal green CI is a hard program stop.

## Conflict matrix

Static compare evidence found:

- Worker 1 and provisional Worker 2: no shared changed filenames.
- Worker 2 and the Growth stack: no shared changed filenames in the observed provisional state.
- current main and every Growth-stack layer: shared modification of `package.json` relative to the old Growth merge base.
- Worker 1 and the Growth stack: shared modification of `package.json`.
- MKT0 → PR #131 → Worker 3 is an ancestry chain and must retain that order.

The exact disposable merge workflow records actual conflict files per tested sequence. Static overlap is not falsely presented as a completed Git merge result.

## Tested sequences

### A

```text
main → Worker 1 → Worker 2 → PR #131 → Worker 3
```

Risk: high. Not authorized. Worker 2 is not final and the Growth ancestry is stale relative to main.

### B

```text
main → PR #131 → Worker 3 → Worker 1 → Worker 2
```

Risk: critical. Rejected because the most diverged branch is imported before current Canon and Episode proof.

### C

```text
fresh integration branch from current main
→ Worker 1
→ final Worker 2
→ current-main MKT0 reintegration
→ PR #131
→ Worker 3
```

Risk: controlled only after all gates. This is the recommended structure.

## Recommended merge order

1. Create a fresh program integration branch from an exact verified `main` head.
2. Review Worker 1 and merge only its exact tested head into the integration branch.
3. Wait for Worker 2's final report, exact final head and terminal green workflows.
4. Rehearse and merge the exact final Worker-2 head.
5. Create a separate current-main MKT0 reintegration branch.
6. Preserve current-main behavior while porting or rebasing MKT0 explicitly.
7. Integrate PR #131 only after the updated MKT0 regression passes.
8. Retarget or rebase Worker 3 onto that updated line.
9. Merge the tested MKT0 package into the program integration branch.
10. Run full current-main, Growth, Studio, fresh-install, recovery and evidence gates.
11. Require human approval before any later main merge.

## Rollback

All automated merges occur inside a detached temporary worktree. Failed attempts are aborted, reset to the verified main head, cleaned and removed. No push is executed. A failed future integration branch must be replaced with a new branch rather than force-pushed.

## Tests

Focused static tests cover:

- unknown branch;
- invalid head SHA;
- missing merge base;
- dependency cycle;
- Worker 3 without PR #131;
- Worker 2 pending without final head;
- false Worker-2 finalization;
- direct Worker-3-to-main permission;
- unsafe MKT0 sequence;
- conflict classification;
- conflict-free classification;
- rollback failure;
- force-push permission;
- direct main permission;
- history rewrite permission;
- duplicate worker ID;
- live activation permission.

The dedicated workflow additionally executes variants A, B and C in a disposable worktree, current-main regression and Studio build. Final workflow IDs and artifact digest are added to the Draft-PR evidence after terminal completion.

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
```

## Final decision

```text
PROGRAM_MERGE_REHEARSAL_READY_PENDING_WORKER_2
```

The rehearsal system and merge map are ready for review. The program itself is not merge-ready while Worker 2 remains pending and MKT0 has not been reintegrated against current main.
