# EP001 Canon und nächste Repo-Patches

Diese Datei hält die aktuelle Produktionsentscheidung fest, damit das Repo nicht wieder in mehrere widersprüchliche Pilot-Versionen auseinanderläuft.

## Aktiver Canon

Serie:

```text
Ricco im Haus
```

Pilot:

```text
Episode 001: Das Zimmer
```

Aktive Hauptfiguren:

```text
Ricco
Basti Prenzl
Jule
Don Miau
```

Aktive Hauptlocations:

```text
Hausfassade
Riccos Zimmer
Flur / Treppenhaus
Gemeinschaftsküche
```

Aktiver MVP-Output:

```text
1 Story
8 stabile Panels
mehrere Render-Varianten pro Panel
genau 1 Finalbild pro Panel
QA Gate
Lettering Preview
9:16 Motion-Comic-Export
Production Package JSON
```

## Legacy-Namen, die nicht mehr in aktiven Workflows verwendet werden sollen

Diese Namen stammen aus älteren Pilot-/TV-Shot-Experimenten und dürfen nicht mehr unkommentiert in neuen Produktionsdaten auftauchen:

```text
Rico Bassmann
Falk Reuter
Kralle
Sami
Haus Nebenwirkung
```

Wenn alte Daten weiterverwendet werden, dann nur mit klarer Migration:

```text
Rico Bassmann -> Ricco
Falk Reuter -> Basti Prenzl
Kralle -> Don Miau
Haus Nebenwirkung -> Haus Nr. 13 oder aktive Hauslocation
Sami -> spätere Nebenfigur oder entfernen
```

## Patch-Reihenfolge ab jetzt

### Patch 1: Canon-Daten konsolidieren

Ziel:

```text
src/data/tvShots.json entweder auf Ricco/Basti/Jule/Don Miau migrieren oder als Legacy markieren.
```

Nicht mehr mehrere Episodenwirklichkeiten parallel pflegen.

### Patch 2: Shared Types

Neue Datei:

```text
src/types/ricco.ts
```

Dort zentralisieren:

```text
RiccoPanelImage
ImageSource
QASeverity
QAItem
ProductionStep
```

Grund:

Aktuell definieren mehrere Pages dieselben Typen lokal. Das ist okay für den ersten Prototyp, aber schlecht für Wartung.

### Patch 3: Asset Storage härten

Ziel:

```text
Pfadbasierte Assets zuerst, Base64/localStorage nur als Notlösung.
```

Bevorzugte Struktur:

```text
public/generated/ep001/panel_001/panel_001_v1.png
public/generated/ep001/panel_001/panel_001_v2.png
public/generated/ep001/panel_002/panel_002_v1.png
```

Review-State speichert dann primär:

```json
{
  "panelId": "panel_001",
  "imagePath": "/generated/ep001/panel_001/panel_001_v1.png",
  "rating": 4,
  "continuityScore": 5,
  "selected": true
}
```

### Patch 4: Aktiven Assembly-Workflow nutzen

Neuer Befehl:

```bash
npm run assemble:ricco-pilot
```

Erwarteter Input:

```text
outputs/ricco/ep001/final/panel_001.png
outputs/ricco/ep001/final/panel_002.png
outputs/ricco/ep001/final/panel_003.png
outputs/ricco/ep001/final/panel_004.png
outputs/ricco/ep001/final/panel_005.png
outputs/ricco/ep001/final/panel_006.png
outputs/ricco/ep001/final/panel_007.png
outputs/ricco/ep001/final/panel_008.png
```

Output:

```text
outputs/ricco/ep001/exports/ricco_ep001_9x16.mp4
outputs/ricco/ep001/exports/ricco_ep001_9x16.srt
```

### Patch 5: Smoke Tests pflegen

Befehl:

```bash
npm run test:e2e
```

Die Tests prüfen zuerst nur:

```text
Ricco Control startet
Prompt Queue zeigt 8 Prompts
QA Gate ist ohne Finalbilder geblockt
wichtige Ricco-Routen öffnen
```

## Harte Projektregel

Keine neuen Features hinzufügen, bevor diese Punkte sauber sind:

```text
Canon einheitlich
8-Panel-Pilot konsistent
Assets nicht chaotisch
QA-Gate nutzbar
Assembly-Script aktuell
Smoke-Tests vorhanden
```
