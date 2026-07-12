# Comic Factory · Program Merge Rehearsal

Status: `PROGRAM_MERGE_REHEARSAL_READY_PENDING_WORKER_2`  
Repository: `Pagebabe/comic`  
Audit basis: `main@b58534d0a737b1d01834628177e1090de027de61`

## Purpose

This package proves merge order, branch dependencies, rollback behavior and stop rules. It does not merge any worker branch into `main`, rewrite history, publish content or change Canon, Episode or Growth product logic.

## Observed lines

| Line | Observed head | Merge base to main | Ahead | Behind | State |
|---|---|---|---:|---:|---|
| `worker/canon-lock` | `b891d36c32c2a38badcfb897f46e6f1a29f13e70` | current main | 20 | 0 | final, review pending |
| `worker/episode1-proof` | `44184ca72924a1e0b23d84c19014c57ba503f108` | current main | 16 | 0 | provisional, still running |
| `feature/mkt0-growth-os-rebased` | `4b4673f2d068e3b8c1e007daf1cda763d9836ed3` | `6ea5b2ab...` | 91 | 344 | diverged |
| `feature/mkt1-001-factory-handoff` | `9573757dbd9b39858ebae2b37337d2728a3455e4` | `6ea5b2ab...` | 102 | 344 | stacked on MKT0 |
| `worker/mkt0-shadow-integration` | `c8c0adcef30645142190c19d8fbc6903fe177ae7` | `6ea5b2ab...` | 115 | 344 | stacked on PR #131 |

The Worker-2 head is an observation, not a final pin. PR #140 remains Draft and reported `PENDING_DEPLOY` when this rehearsal was created.

## Reproducible proof

Static contract:

```bash
node --check scripts/check_program_merge_readiness.mjs
node --test --test-concurrency=1 tests/program-merge-readiness.test.mjs
node scripts/check_program_merge_readiness.mjs
```

Disposable Git rehearsal:

```bash
mkdir -p output
node scripts/check_program_merge_readiness.mjs --git-probe --output output/program-merge-rehearsal.json
```

The probe:

1. requires a clean source worktree;
2. fetches the six exact remote lines;
3. verifies pinned heads except the explicitly provisional Worker-2 observation;
4. creates a detached temporary worktree;
5. runs variants A, B and C with `git merge --no-commit --no-ff`;
6. records exact conflicted files;
7. aborts failed merges;
8. resets and cleans after each sequence;
9. removes and prunes the temporary worktree;
10. proves that no push or direct `main` merge occurred.

## Tested variants

### Variant A

```text
main → Worker 1 → Worker 2 → PR #131 → Worker 3
```

Blocked as an intended merge path. Worker 2 is not final and PR #131 imports a Growth ancestry 344 commits behind `main`.

### Variant B

```text
main → PR #131 → Worker 3 → Worker 1 → Worker 2
```

Rejected. It introduces the oldest and most diverged line first, before Canon and the Episode production proof.

### Variant C

```text
fresh integration branch from current main
→ Worker 1
→ final Worker 2
→ current-main MKT0 reintegration
→ PR #131
→ Worker 3
```

This is the recommended structure, but it remains blocked until Worker 2 has a final report, exact immutable head and green CI. The old MKT0 branch must not be treated as a drop-in merge into current `main`.

## Decision

```text
PROGRAM_MERGE_REHEARSAL_READY_PENDING_WORKER_2
```

This means the rehearsal mechanism and integration plan are ready. It does not mean the program is ready to merge.
