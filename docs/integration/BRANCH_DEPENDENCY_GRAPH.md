# Branch Dependency Graph

Audit basis: `main@b58534d0a737b1d01834628177e1090de027de61`

```text
main
├── worker/canon-lock @ b891d36c...
│   └── PR #138 · Draft · READY_FOR_REVIEW_NOT_MERGED
├── worker/episode1-proof @ observed 44184ca7...
│   └── PR #140 · Draft · PENDING_DEPLOY · FINAL HEAD UNKNOWN
└── future integration/program-composition
    ├── reviewed Worker 1 exact head
    ├── final Worker 2 exact head
    └── integration/mkt0-current-main
        ├── feature/mkt0-growth-os-rebased @ 4b4673f2...
        ├── feature/mkt1-001-factory-handoff @ 9573757d...
        │   └── PR #131 · base: feature/mkt0-growth-os-rebased
        └── worker/mkt0-shadow-integration @ c8c0adce...
            └── PR #139 · base: feature/mkt1-001-factory-handoff
```

## Hard dependencies

| Dependent | Requires | Reason |
|---|---|---|
| Worker 3 | PR #131 | Studio-to-MKT0 adapter imports the Factory handoff line. |
| PR #131 | MKT0 base | PR #131 is stacked on the isolated Growth branch. |
| Program integration | Worker 1 reviewed head | Canon must be fixed before production composition. |
| Program integration | Worker 2 final green head | Episode proof is still running and cannot be inferred. |
| Program integration | current-main MKT0 reintegration | The isolated Growth ancestry is 344 commits behind current main. |

## Forbidden shortcuts

- Worker 3 directly into `main`.
- PR #131 directly into `main` as if its old ancestry were current.
- Marking Worker 2 complete from its provisional Draft-PR head.
- Resolving conflicts by taking the Growth side wholesale over current `main`.
- Force-push, branch deletion or history rewrite.

## Worker-2 observation rule

`worker/episode1-proof@44184ca72924a1e0b23d84c19014c57ba503f108` is recorded only as the head visible during this audit. It is not a final acceptance pin. Any later integration rehearsal must fetch the final Worker-2 report and replace the provisional observation with its exact approved head.
