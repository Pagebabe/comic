# Program Conflict Matrix

Source of truth: disposable merge artifact from Program Merge Rehearsal `29189672482` against `main@b58534d0a737b1d01834628177e1090de027de61`.

## Proven sequence results

| Variante | Erfolgreiche Schritte | Stop | Konfliktdatei | Rollback |
|---|---|---|---|---|
| A | Worker 1, Worker 2 | PR #131 | `package.json` | clean |
| B | keine | PR #131 | `package.json` | clean |
| C | Worker 1, Worker 2 | MKT0 | `package.json` | clean |

## Interpretation

- Worker 1 und Worker 2 bilden keinen Git-Konflikt auf ihren finalen Heads.
- Der erste reale Konflikt entsteht beim Übergang von Current Main zur alten Growth-Linie.
- Der Konflikt ist reproduzierbar und auf `package.json` begrenzt.
- Worker 3 wird in den gestoppten Varianten nicht erreicht; daraus folgt kein negativer Produktbefund über Worker 3.

## Verbindliche Auflösungsregel

`package.json` muss auf einem separaten Current-main-MKT0-Reintegrationsbranch manuell komponiert werden:

- alle aktuellen Main-Scripts erhalten,
- Growth-Scripts explizit ergänzen,
- keine pauschale `ours`- oder `theirs`-Auflösung,
- danach Main-, Growth- und vollständige Regression ausführen.

Bis diese Arbeit bewiesen ist, bleibt die Gesamtintegration blockiert.
