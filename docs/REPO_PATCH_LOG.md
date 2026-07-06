# Repo Patch Log

## Aktueller Arbeitsstand

Dieser Log dokumentiert kleine, sichere Repo-Schritte für die Ricco Comic Factory.

## Bereits ergänzt

```text
scripts/assembleRiccoPilot.mjs
```

Neuer 8-Panel-Assembly-Workflow für die aktuelle Ricco-Folge.

```text
npm run assemble:ricco-pilot
```

Erwartet Finalbilder unter:

```text
outputs/ricco/ep001/final/panel_001.png
...
outputs/ricco/ep001/final/panel_008.png
```

Schreibt Export nach:

```text
outputs/ricco/ep001/exports/ricco_ep001_9x16.mp4
outputs/ricco/ep001/exports/ricco_ep001_9x16.srt
```

## Tests

```text
tests/e2e/ricco-smoke.spec.ts
```

Prüft die wichtigsten Ricco-Routen, Prompt Queue und QA Gate.

## Playwright

```text
playwright.config.ts
```

Base URL wurde auf den lokalen Vite-Port gesetzt:

```text
http://localhost:3100
```

## Nächste harte Aufgabe

Canon-Daten konsolidieren:

```text
src/data/tvShots.json
scripts/assemblePilot.mjs
```

Alte Namen wie Rico Bassmann, Falk Reuter, Kralle, Sami und Haus Nebenwirkung müssen entweder migriert oder klar als Legacy markiert werden.
