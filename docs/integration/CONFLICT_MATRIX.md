# Program Conflict Matrix

Source of truth: GitHub compare results captured on 2026-07-12 against `main@b58534d0a737b1d01834628177e1090de027de61`.

`potential` means both lines changed the same path since their relevant merge base. Only the disposable CI rehearsal may classify a path as an actual Git merge conflict.

| Pair | Shared changed paths | Initial classification | Required action |
|---|---|---|---|
| current main ↔ Worker 1 | none beyond Worker 1 changes based directly on current main | low | Pin exact reviewed head and rerun full CI. |
| current main ↔ provisional Worker 2 | none beyond Worker 2 additions based directly on current main | provisional low | Repeat against Worker 2 final head. |
| Worker 1 ↔ provisional Worker 2 | no shared changed filenames observed | provisional low | Rehearse again after Worker 2 finalizes. |
| current main since Growth merge base ↔ MKT0 | `package.json` | high potential conflict | Preserve current main scripts; add Growth scripts explicitly; run combined tests. |
| current main since Growth merge base ↔ PR #131 | `package.json` | high potential conflict | Integrate only through current-main MKT0 package. |
| current main since Growth merge base ↔ Worker 3 | `package.json` | high potential conflict | Never take the old Growth file wholesale. |
| Worker 1 ↔ MKT0 / PR #131 / Worker 3 | `package.json` | high potential conflict | Compose scripts by intent, not by choosing one side. |
| provisional Worker 2 ↔ Growth stack | no shared changed filenames observed | provisional low | Still rerun complete Episode and Growth regression together. |
| MKT0 ↔ PR #131 | ancestry relationship | expected clean when ordered | PR #131 must follow MKT0. |
| PR #131 ↔ Worker 3 | ancestry relationship | expected clean when ordered | Worker 3 must follow PR #131. |

## File-specific resolution rules

### `package.json`

Never resolve with `--ours` or `--theirs` over the complete file.

The integration owner must:

1. begin with the current-main script set;
2. retain Worker-1 lint, typecheck, build, Canon and cockpit gates;
3. add Growth, Factory-handoff and Studio-MKT0 scripts explicitly;
4. retain all existing recovery, fresh-install and evidence scripts;
5. run syntax checks before installing;
6. run the complete main and Growth test suites;
7. record the resulting script inventory in the integration report.

### `.github/workflows/ci.yml`

Worker 1 changes this file while the Growth stack adds separate workflows. Preserve all current-main jobs and the `worker/**` trigger. Separate Growth workflows are not a justification to remove main CI gates.

### `studio-app/**`

Worker 1 changes the production cockpit. Worker 2 executes an archived production app in an isolated worktree rather than modifying current Studio source. Combined integration must still rerun current Studio build and browser smoke tests because file independence is not behavioral independence, a fact software enjoys revealing after lunch.

## Actual conflict evidence

The workflow `Program Merge Rehearsal` runs detached disposable merges and writes exact `conflict_files` for variants A, B and C to:

```text
output/program-merge-rehearsal.json
```

That artifact supersedes this static candidate matrix for the tested commit heads. Worker 2 remains provisional until its final report pins a head.
