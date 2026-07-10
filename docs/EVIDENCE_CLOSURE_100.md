# Comic Factory Evidence Closure

## Bedeutung von 100 Prozent

`100 % Beweiskettenabdeckung` bedeutet:

- alle 9 Arbeitsregeln sind erfasst,
- alle 16 Hauptbehauptungen sind erfasst,
- alle 25 Einträge besitzen einen terminalen Status,
- 25 Pull Requests und eine Vor-PR-Basis sind rückwirkend geprüft,
- alle 26 historischen Einheiten besitzen einen terminalen Status,
- kein Eintrag bleibt in einem offenen Prüf- oder Schwebezustand,
- jeder Deploy erzeugt einen commitgebundenen Runtime-Beweis,
- Desktop und Mobilansicht werden als öffentliche Screenshots erzeugt und geprüft.

Es bedeutet ausdrücklich nicht, dass alle geplanten Produktassets existieren.

## Terminale Zustände

- `proven`: Die Behauptung ist innerhalb ihres definierten Scopes bewiesen.
- `disproven`: Die Behauptung wurde widerlegt.
- `not_yet_built`: Das geplante Ergebnis existiert nachweislich noch nicht.
- `historically_unverifiable`: Die historische Aussage kann aus prinzipiellen oder fehlenden Quellen nicht vollständig bewiesen werden; diese Grenze ist abgeschlossen dokumentiert.
- `superseded`: Die alte Linie wurde kontrolliert beendet und durch eine neue ersetzt.

## Automatische Beweiskette

```text
Behauptung
→ Quelle
→ Test
→ Artefakt
→ Deployment oder Laufbeweis
→ sichtbare Gegenprüfung
→ terminaler Status
```

Der Pages-Workflow erzeugt bei jedem Deploy:

- `proof/runtime-evidence.json`
- `proof/dashboard-desktop.png`
- `proof/dashboard-mobile.png`

Der Runtime-Beweis enthält den exakten Commit, die Screenshot-Hashes, Browserprüfungen, 25/25 Evidence-Einträge und die 26 rückwirkend geprüften historischen Einheiten. Nach dem Deployment lädt der Workflow diese Beweise erneut von der öffentlichen Pages-URL und verifiziert Commit und Hashes.

## Historischer Backfill

Maschinenlesbar:

- `project/historical-pr-evidence.json`

Menschenlesbar:

- `docs/HISTORICAL_PR_EVIDENCE_BACKFILL.md`

Der Backfill klassifiziert jede gefundene PR-Entwicklungsstufe als `proven`, `disproven`, `historically_unverifiable` oder `superseded`. Fehlende GitHub-Nummern zwischen den PRs sind Issues, weil beide dieselbe Nummernfolge verwenden.

## Ehrlicher Produktstand

Die Beweiskette ist vollständig klassifiziert. Die Produktion selbst ist noch nicht vollständig:

- Character-Master: `not_yet_built`
- Location-Master: `not_yet_built`
- freigegebene Stimmen: `not_yet_built`
- Animatic-Panelbilder: `not_yet_built`
- fertige Episode: `not_yet_built`

Diese Zustände schließen die Beweiskette, ohne unfertige Arbeit als fertig auszugeben.
