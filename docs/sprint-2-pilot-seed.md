# Sprint 2 - Pilot Seed Data

## Ziel

Dieser Sprint legt die Pilotfolge als strukturierte Datenbasis an. Die App soll nicht mehr nur ein Dashboard sein, sondern eine saubere Comic-Factory-Grundlage fuer:

```text
Episode -> Szenen -> Panels -> Prompts -> Render-Review -> Export
```

## Pilot

- Serie: Rico gegen Berlin
- Episode: Die Entkommerzialisierungsgebuehr
- Status: Storyboard Seed
- Szenen: 6
- Panel-Ziel: 30

## Neue Dateien

```text
src/types/comic.ts
src/data/characters.ts
src/data/locations.ts
src/data/episodes.ts
src/data/scenes.ts
src/data/panels.scene001.ts
src/data/panels.scene002.ts
src/data/panels.scene003.ts
src/data/panelsScene004.ts
src/data/panel017.ts
src/data/pilotPanels.ts
src/data/comicAssets.ts
src/utils/promptBuilder.ts
```

## Datenmodell

`src/types/comic.ts` enthaelt die neuen MVP-Typen:

- `ComicStatus`
- `PanelStatus`
- `ShotType`
- `Character`
- `Location`
- `Episode`
- `Scene`
- `Panel`
- `Asset`

Diese Typen sind bewusst getrennt von den alten Video-Machine-Typen in `src/types.ts`, damit der neue Comic-Factory-Seed ohne Bruch in der bestehenden App weiterentwickelt werden kann.

## Figuren

`src/data/characters.ts` enthaelt den schlanken MVP-Cast:

- Rico
- Der Vermieter
- Goerli-Katzen

Jede Figur hat:

- visuelle Beschreibung
- Kleidung
- Persoenlichkeit
- Sprachstil
- Running Gags
- Beziehungen
- Referenzbild-Platzhalter

## Orte

`src/data/locations.ts` enthaelt:

- Haus Nebenwirkung
- Prenzlauer Berg Wohnung
- Goerlitzer Park

Jeder Ort hat:

- Beschreibung
- visuelle Regeln
- wiederkehrende Details
- Referenzbild-Platzhalter

## Episode und Szenen

`src/data/episodes.ts` definiert die Pilotfolge.

`src/data/scenes.ts` definiert sechs Szenen:

1. Ankunft am Haus Nebenwirkung
2. Der Vermittler erscheint
3. Die Zimmerbesichtigung
4. Die Kostenaufstellung
5. Die Wahrheit im Flur
6. Willkommen im Widerstand

Jede Szene hat:

- Location-ID
- Character-IDs
- Summary
- Konflikt
- Punchline
- Panel-IDs

## Panels

Der Connector hat grosse Paneldateien und einige Dateinamen blockiert. Deshalb wurde die Panelstruktur sicher verteilt:

- Detaildaten fuer Szene 1 bis 3 liegen in einzelnen Szenendateien.
- Szene 4 hat einen ersten Panel-Seed plus einen Einzelpanel-Seed.
- `src/data/pilotPanels.ts` aggregiert die vorhandenen Detailpanels und erzeugt Platzhalter fuer die restlichen Panel-IDs bis `panel_030`.

Das Ergebnis ist ein vollstaendiges 30-Panel-Array, aber nicht alle 30 Panels sind final ausgeschrieben. Die Platzhalter sind bewusst markiert:

```text
Seed placeholder panel for the pilot storyboard. Replace with final visual beat before render.
```

## Prompt Builder

`src/utils/promptBuilder.ts` exportiert:

```ts
buildPanelPrompt(panel, scene, characters, location)
```

Der Prompt Builder baut aus Panel, Szene, Figuren und Ort einen sauberen Bildprompt.

Harte Regeln:

```text
No speech bubbles.
No readable text inside the image.
Leave clean space for dialogue placement later.
Avoid photorealism.
Keep character appearance consistent.
```

## Noch offen

1. UI an diese neuen Seed-Daten anschliessen.
2. Platzhalterpanels 18-30 durch echte Beats ersetzen.
3. Panel Board auf `pilotPanels.ts` mappen.
4. Prompt-Preview pro Panel anzeigen.
5. Danach erst Render-API oder ComfyUI-Integration anbinden.

## Nicht gemacht

- Keine Backend-Anbindung.
- Keine Render-API.
- Keine ComfyUI-Jobs.
- Keine Social-Posting-Logik.
- Keine UI-Seiten umgebaut.

Dieser Sprint ist bewusst Daten- und Prompt-Fundament, nicht Produktionsautomatisierung.
