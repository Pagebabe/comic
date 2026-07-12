# Current-Main Growth Reintegration

Tracking: Issue #145

## Entscheidung

`IMPLEMENTED_PENDING_PULL_REQUEST_PROOF`

Die bewiesenen Factory-Handoff- und Studio-MKT0-Shadow-Dateien wurden aus den exakt gepinnten Heads von PR #131 und PR #139 auf einen neuen Branch ab aktuellem `main` portiert. Es wurde keine Legacy-Historie gemergt.

`package.json` aus aktuellem `main` bleibt Autorität. Ergänzt wurden ausschließlich fokussierte Handoff-, Shadow- und Prüfskripte. Der alte vollständige Analytics-Unterbau wurde nicht übernommen; stattdessen existiert eine minimale, kompatible `buildDirectionPackage`-Grenze für den bewiesenen Shadow-Adapter.

## Grenzen

- kein Merge nach `main`
- kein Live-Publishing
- kein OAuth oder Plattformkonto
- keine Netzwerkrequests
- keine Canon- oder Masterfreigabe
- keine echte Pilotepisode
- ausschließlich synthetische beziehungsweise später separat autorisierte Eingaben
