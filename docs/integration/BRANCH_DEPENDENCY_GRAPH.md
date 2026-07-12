# Branch Dependency Graph

Audit basis: `main@b58534d0a737b1d01834628177e1090de027de61`

```text
main
├── worker/canon-lock
│   └── 1bb4df874d8e2a36fd32fbad19074ed629ec922d
├── worker/episode1-proof
│   └── e8b8e348120ad527abe7a33caab9f56b6627f8c2
└── future program-integration
    ├── exact Worker 1 final head
    ├── exact Worker 2 final head
    └── current-main Growth package

legacy Growth merge-base 6ea5b2ab22079ea9083bccaef14c19be9306ae72
└── feature/mkt0-growth-os-rebased
    └── feature/mkt1-001-factory-handoff · PR #131
        └── worker/mkt0-shadow-integration · PR #139
```

## Harte Regeln

- Worker 3 benötigt PR #131.
- PR #131 benötigt MKT0.
- Worker 1 und Worker 2 werden nur über ihre exakten finalen Heads integriert.
- Die alte Growth-Linie ist 344 Commits hinter Current Main und kein Direktmerge-Kandidat.
- Vor Growth-Integration ist eine separate Current-main-MKT0-Reintegration verpflichtend.
- Kein direkter Merge nach `main`.
