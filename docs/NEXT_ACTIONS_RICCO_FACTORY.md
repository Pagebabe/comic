# Next Actions — Ricco Comic Factory

## 1. Jetzt nicht weiter feature-creepen

Der aktuelle Stand ist gut genug, um Episode 001 wirklich durch die Pipeline zu bekommen. Neue große Module werden erst gebaut, wenn der Pilot sauber produziert wurde.

## 2. Direkter Produktionsweg

```text
1. npm run dev
2. Öffne http://localhost:3100/#/ricco-control
3. Prompt Queue exportieren
4. Panels in ComfyUI / Draw Things generieren
5. Bilder als panel_001.png bis panel_008.png organisieren
6. Bildvarianten in Image Review prüfen
7. Genau ein Finalbild pro Panel wählen
8. Ricco Gate prüfen
9. Lettering Preview prüfen
10. Finalbilder nach outputs/ricco/ep001/final/ kopieren
11. npm run assemble:ricco-pilot
```

## 3. Finalbild-Namen für Assembly

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

## 4. Danach erst Code-Cleanup

Nach dem ersten echten Export:

```text
- src/types/ricco.ts einführen
- LocalStorage-Review-State auf path-first umbauen
- tvShots.json Canon-migrieren oder als Legacy markieren
- alte assemblePilot.mjs entweder umbenennen oder deprecated markieren
- e2e Smoke Tests regelmäßig laufen lassen
```

## 5. Qualitätsregel

Ein Panel ist nicht final, nur weil es hübsch ist. Es ist erst final, wenn es in Story, Figur, Location, Stil und Lesbarkeit funktioniert.
