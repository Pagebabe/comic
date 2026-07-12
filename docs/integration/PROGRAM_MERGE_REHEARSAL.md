# Comic Factory · Program Merge Rehearsal

Status: `PROGRAM_MERGE_REHEARSAL_READY_CURRENT_HEADS`  
Repository: `Pagebabe/comic`  
Audit basis: `main@b58534d0a737b1d01834628177e1090de027de61`

## Final gepinnte Worker

```text
Worker 1: 1bb4df874d8e2a36fd32fbad19074ed629ec922d
Worker 2: e8b8e348120ad527abe7a33caab9f56b6627f8c2
Worker 3: c8c0adcef30645142190c19d8fbc6903fe177ae7
PR #131: 9573757dbd9b39858ebae2b37337d2728a3455e4
MKT0: 4b4673f2d068e3b8c1e007daf1cda763d9836ed3
```

## Bewiesener Befund

- Worker 1 und Worker 2 sind in der Wegwerfprobe konfliktfrei kombinierbar.
- MKT0 und PR #131 kollidieren beim Übergang auf Current Main in `package.json`.
- Alle drei Varianten enden mit sauberem Rollback.
- Kein Merge nach `main`, kein Push und kein Force-Push wurde ausgeführt.

## Kontrollierte Zielform

```text
main
→ Worker 1 final
→ Worker 2 final
→ Factory-only Regression
→ Current-main MKT0 Reintegration
→ PR #131
→ Worker 3
→ vollständige Regression und Rollback
→ Human Review
```

Alle Sequenzen bleiben bis zur Umsetzung der MKT0-Reintegration `allowed: false`.
