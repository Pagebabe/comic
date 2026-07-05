# Sprint 3 - UI Seed Connection

## Ziel

Die vorhandene UI wurde an die neue getypte Pilot-Datenbasis angeschlossen.

Der neue Import-Einstieg ist:

```ts
import { characters, locations, episodes, scenes, panels } from '../data/pilotData';
```

## Geaenderte Seiten

```text
src/pages/Dashboard.tsx
src/pages/Episodes.tsx
src/pages/PanelFactory.tsx
```

## Dashboard

Das Dashboard nutzt jetzt die Comic-Factory-Seed-Daten statt der alten Shot-/Job-Mischdaten.

Angezeigt werden:

- Characters
- Locations
- Episodes
- Scenes
- Panels
- Approved Panels
- Needs Fix
- Draft / Prompt Ready

Ausserdem zeigt die Startseite die aktive Pilotfolge und verweist direkt auf die Panel Factory.

## Episodes

Die Episode-Seite liest jetzt:

- Episode aus `episodes`
- Szenen ueber `sceneIds`
- Panels pro Szene
- Figuren ueber `characterIds`
- Orte ueber `locationIds`

Die Seite zeigt fuer jede Szene:

- Titel
- Ort
- Summary
- Conflict
- Punchline
- Panelanzahl
- Placeholder-Anzahl

## Panel Factory

Die Panel Factory ist jetzt ein Status-Board fuer die Pilotpanels.

Spalten:

```text
Draft
Prompt Ready
Rendered
Needs Fix
Approved
```

Jede Panelkarte zeigt:

- Panel-ID
- Szene
- Shot Type
- Status
- Location
- Visual Description
- Action
- Mood
- optional Dialogue Source
- live generierten Prompt

Der Prompt wird ueber `buildPanelPrompt(panel, scene, characters, location)` erzeugt.

## Wichtig

Das ist noch kein echter Drag-and-drop-Kanban und noch keine Render-Queue. Es ist die erste saubere UI-Verbindung zwischen Comic-Datenmodell und Produktionsoberflaeche.

## Naechster Sprint

Sprint 4 sollte die Platzhalterpanels 18-30 durch echte Story-Beats ersetzen und den Status `prompt_ready` fuer fertige Panels setzen.

Danach kann man eine echte Prompt-Pack-Exportfunktion bauen.
