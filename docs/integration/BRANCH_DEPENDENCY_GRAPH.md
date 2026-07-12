# Branch Dependency Graph

Audit basis: `main@b58534d0a737b1d01834628177e1090de027de61`

```text
main
├── worker/canon-lock @ 1bb4df874d8e2a36fd32fbad19074ed629ec922d
│   └── PR #138 · Draft · Canon/Cast bewiesen · nicht gemergt
├── worker/episode1-proof @ e8b8e348120ad527abe7a33caab9f56b6627f8c2
│   └── PR #140 · Draft · EPISODE_PIPELINE_PROVEN · nicht gemergt
└── zukünftiger Programmintegrationsbranch
    ├── exakter Worker-1-Head
    ├── exakter Worker-2-Head
    └── Current-Main-Growth-Paket
        ├── neu integriertes MKT0
        │   └── Quelle: feature/mkt0-growth-os-rebased @ 4b4673f2d068e3b8c1e007daf1cda763d9836ed3
        ├── aktualisierte PR-#131-Linie
        │   └── Quelle: feature/mkt1-001-factory-handoff @ 9573757dbd9b39858ebae2b37337d2728a3455e4
        └── aktualisierte Worker-3-Linie
            └── Quelle: worker/mkt0-shadow-integration @ c8c0adcef30645142190c19d8fbc6903fe177ae7
```

## Harte Abhängigkeiten

| Abhängiger Teil | Benötigt | Grund |
|---|---|---|
| Worker 3 | PR #131 | Der Studio-MKT0-Adapter baut auf dem Factory-Handoff auf. |
| PR #131 | MKT0 | PR #131 ist auf der isolierten MKT0-Linie gestapelt. |
| Programmintegration | finaler Worker-1-Head | Canon und Pilotcast müssen eindeutig bleiben. |
| Programmintegration | finaler Worker-2-Head | Der technische Episode-Pfad ist jetzt exakt gepinnt. |
| Programmintegration | Current-Main-MKT0-Reintegration | Die vorhandene Growth-Abstammung liegt 344 Commits hinter `main`. |

## Durch die aktuelle Rehearsal bewiesen

- Worker 1 lässt sich konfliktfrei auf den verifizierten Main-Stand proben.
- Worker 2 lässt sich danach ebenfalls konfliktfrei integrieren.
- PR #131 kollidiert anschließend in `package.json`.
- PR #131 kollidiert auch direkt gegen den aktuellen Main-Stand in `package.json`.
- MKT0 kollidiert nach Worker 1 und Worker 2 in `package.json`.
- Jede Probe endet mit sauberem Rollback und unverändertem Quell-Worktree.

## Verbotene Abkürzungen

- Worker 3 direkt nach `main`.
- PR #131 direkt nach `main`.
- MKT0 pauschal über den aktuellen Main-Stand legen.
- `package.json` vollständig mit `ours` oder `theirs` auflösen.
- Aus dem technischen Worker-2-Beweis eine echte Pilot- oder Masterfreigabe ableiten.
- Force-Push, Branch-Löschung oder History Rewrite.

## Aktueller Integrationsblocker

```text
MKT0_CURRENT_MAIN_REINTEGRATION_NOT_PROVEN
PR_131_AND_WORKER_3_STACK_NOT_REBASED_TO_CURRENT_MAIN
PROGRAM_COMBINED_REGRESSION_NOT_PROVEN
PROGRAM_ROLLBACK_NOT_PROVEN
HUMAN_MAIN_MERGE_APPROVAL_MISSING
```
