# Comic Factory Evidence Closure

## Bedeutung von 100 Prozent

`100 % Beweiskettenabdeckung` bedeutet:

- alle 8 Arbeitsregeln sind erfasst,
- alle 15 Hauptbehauptungen sind erfasst,
- alle 23 Einträge besitzen einen terminalen Status,
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
→ Deployment
→ sichtbare Gegenprüfung
→ terminaler Status
```

Der Pages-Workflow erzeugt bei jedem Deploy:

- `proof/runtime-evidence.json`
- `proof/dashboard-desktop.png`
- `proof/dashboard-mobile.png`

Der Runtime-Beweis enthält den exakten Commit, die Screenshot-Hashes und die Browserprüfungen. Nach dem Deployment lädt der Workflow alle drei Dateien erneut von der öffentlichen Pages-URL und verifiziert Commit und Hashes.

## Ehrlicher Produktstand

Die Beweiskette ist vollständig klassifiziert. Die Produktion selbst ist noch nicht vollständig:

- Character-Master: `not_yet_built`
- Location-Master: `not_yet_built`
- freigegebene Stimmen: `not_yet_built`
- Animatic-Panelbilder: `not_yet_built`
- fertige Episode: `not_yet_built`

Diese Zustände schließen die Beweiskette, ohne unfertige Arbeit als fertig auszugeben.
