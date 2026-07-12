# Program Conflict Matrix

Source of truth: GitHub compare results and disposable merge artifact captured on 2026-07-12 against `main@b58534d0a737b1d01834628177e1090de027de61`.

## Proven sequence results

| Sequence | Successful steps | Exact stopping point | Conflict files | Rollback |
|---|---|---|---|---|
| A | Worker 1, provisional Worker 2 | PR #131 | `package.json` | clean |
| B | none | PR #131 | `package.json` | clean |
| C | Worker 1, provisional Worker 2 | MKT0 | `package.json` | clean |

The observed Worker-2 head was `44184ca72924a1e0b23d84c19014c57ba503f108`. It remains provisional and must be retested after Worker 2 publishes its final report and immutable head.

## Static and dynamic matrix

| Pair | Static overlap | Disposable merge result | Required action |
|---|---|---|---|
| current main ↔ Worker 1 | Worker 1 is based directly on current main | mergeable in rehearsal | Pin the exact reviewed head and rerun full CI on the future integration branch. |
| Worker 1 ↔ provisional Worker 2 | no shared changed filenames observed | mergeable in rehearsal | Repeat against Worker 2 final head. |
| current main ↔ provisional Worker 2 | Worker 2 additions based directly on current main | mergeable in rehearsal after Worker 1 | Treat only as provisional evidence. |
| current main / Worker 1 / Worker 2 ↔ PR #131 | `package.json` | actual conflict in A and B | Do not merge PR #131 directly; rebuild the Growth package against current main. |
| current main / Worker 1 / Worker 2 ↔ MKT0 | `package.json` | actual conflict in C | Create a current-main MKT0 reintegration branch and compose scripts explicitly. |
| current main ↔ Worker 3 | `package.json` plus stale Growth ancestry | not reached because its required predecessors conflict first | Retarget or rebase only after updated MKT0 and PR #131 are proven. |
| MKT0 ↔ PR #131 | ancestry relationship | expected ordered dependency | PR #131 must follow MKT0. |
| PR #131 ↔ Worker 3 | ancestry relationship | expected ordered dependency | Worker 3 must follow PR #131. |

## File-specific resolution rules

### `package.json`

Never resolve with `--ours` or `--theirs` over the complete file.

The integration owner must:

1. begin with the current-main script set;
2. retain all current Canon, cockpit, recovery, fresh-install and evidence gates;
3. add Growth, Factory-handoff and Studio-MKT0 scripts explicitly;
4. preserve the current Studio build command;
5. record every script added, removed or renamed;
6. run the complete main and Growth suites;
7. rerun the disposable sequence after Worker 2 finalizes.

The current `main` package does not define conventional root scripts named `lint`, `typecheck` or `build`. The rehearsal records these honestly as `NOT_DEFINED_ON_CURRENT_MAIN`; it does run `npm test` and `npm run build:studio`.

### `.github/workflows/ci.yml`

Worker 1 changes this file while the Growth stack adds separate workflows. Preserve all current-main jobs and the `worker/**` trigger. Separate Growth workflows are not permission to delete main CI gates.

### `studio-app/**`

Worker 1 changes the production cockpit. Worker 2 executes an archived production app in an isolated worktree rather than modifying current Studio source. Combined integration must still rerun the Studio build and browser smoke tests because independent filenames can still cooperate in producing delightfully dependent failures.

## Evidence

```text
Program Merge Rehearsal Run: 29186073592
Artifact ID: 8258037264
Artifact digest: sha256:406089d98e203aa545f72756d6478479de2fa9c2d621b9e71bf39da821cef5bd
Artifact file: program-merge-rehearsal.json
```

The artifact records:

```text
source_worktree_clean_after = true
direct_main_merge_performed = false
pushes_performed = 0
force_pushes_performed = 0
worker_2_final_status = PENDING
```
