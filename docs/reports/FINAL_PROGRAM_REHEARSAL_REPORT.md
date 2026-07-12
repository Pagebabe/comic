# Finale Programmintegrationsprobe

Tracking: Issue #147

## Entscheidung

`PENDING_DEPLOY`

Dieser Branch enthält ausschließlich den reproduzierbaren Runner, den statischen Prüfvertrag und den Evidence-Bericht für eine isolierte Gesamtintegrationsprobe.

## Gebundene Quellen

- `main`: `b58534d0a737b1d01834628177e1090de027de61`
- Worker 1 / PR #138: `1bb4df874d8e2a36fd32fbad19074ed629ec922d`
- Worker 2 / PR #140: `e8b8e348120ad527abe7a33caab9f56b6627f8c2`
- Growth / PR #146: `77f77db12a227c976e6e33ef7afde655f455772e`

## Methode

Die Probe erstellt einen detached temporären Worktree ab `main`, integriert Worker 1, Worker 2 und Growth in dieser Reihenfolge und akzeptiert ausschließlich den erwarteten Konflikt in `package.json`.

Die Paketauflösung erhält gleichzeitig:

- Canon- und Cast-Scripts aus Worker 1,
- die vollständige aktuelle Main-Testkette,
- Growth-Handoff- und Shadow-Scripts aus PR #146,
- `mainMergeAllowed=false`,
- `liveActivationAllowed=false`.

Danach laufen Canon-, Growth-, Episode-, Gesamtregressions-, Studio-, Browser-, Fresh-Install- und Recovery-Beweise. Der erzeugte Worktree wird anschließend entfernt.

## Grenzen

- kein Merge nach `main`
- kein Push des erzeugten Integrationsbaums
- kein Force-Push
- keine kreative Freigabe
- keine echte Pilotbehauptung
- kein OAuth, Netzwerk oder Publishing
- keine automatische Canon- oder Mastermutation

Finale Run-IDs, Artefakt-ID, Digest, Integrationsbaum und Paket-Hash werden erst nach terminal grünem Workflow in PR und Issue dokumentiert.
