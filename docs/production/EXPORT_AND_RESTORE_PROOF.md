# Export and Restore Proof

## Beweisziel

Die Episode-1-Testproduktion muss nicht nur `Exportbereit` anzeigen. Sie muss ein tatsächliches PDF und ein reproduzierbares Production Package erzeugen, den lokalen Zustand verlieren dürfen und ihn anschließend aus dem Package wiederherstellen können.

## Exportbeweis

### Export Gate

Erwarteter sichtbarer Zustand unter `#/ricco-export`:

- Überschrift `Exportbereit`
- `8/8 Panels haben ein finales Bild`
- `100% ready`
- `0 fehlend`
- acht Finalkarten in Panelreihenfolge

### Lettering und PDF

Unter `#/ricco-lettering`:

- acht `.lettering-panel`-Elemente
- acht finale Bild-Elemente
- Alt-Texte in Reihenfolge `Panel 1` bis `Panel 8`
- bestehende Schaltfläche `Browser Print / PDF` ruft `window.print()` auf

Der Proof erzeugt zusätzlich über die Chromium-Druckengine:

```text
output/episode1-proof/episode1-lettering-preview.pdf
```

Abnahme:

- Datei ist nicht leer
- Header beginnt mit `%PDF`
- PDF entsteht aus der vorhandenen Lettering-Seite
- keine Behauptung eines freien Drag-and-Drop-Lettering-Editors

### Production Package

Unter `#/ricco-package` wird die vorhandene Downloadfunktion ausgelöst. Erwartetes Artefakt:

```text
output/episode1-proof/episode1-production-package.json
```

Pflichtinhalt:

- `packageVersion = ricco-production-package-v1`
- Episode `ep_001`
- acht Panels
- neun gespeicherte Testvarianten
- acht Finalbilder
- `exportReady = true`
- Prompts, Dialoge, Ratings, Continuity und Review-Notizen

## Restore-Gegenprobe

1. Production Package im Testprozess im Arbeitsspeicher und als Download sichern.
2. neue Seite im selben Browserprofil öffnen.
3. Exportstatus erneut prüfen.
4. `#/ricco-restore` öffnen.
5. `Local Review löschen` bestätigen.
6. Export Gate erneut öffnen und acht fehlende Bilder erwarten.
7. Package JSON in Restore-Seite einfügen.
8. neun gefundene Bilder und acht Finalbilder erwarten.
9. `Bilder wiederherstellen` ausführen.
10. Export Gate erneut öffnen und `Exportbereit` erwarten.
11. Package erneut erzeugen.

## Reproduzierbarkeitsbeweis

Die dynamische Eigenschaft `generatedAt` wird aus Original und rekonstruiertem Package entfernt. Die gespeicherten Bilder werden deterministisch nach Panel-ID und Notiz sortiert. Danach werden beide normalisierten Objekte als JSON gehasht.

Erwartetes Ergebnis:

```text
originalNormalizedSha256 == reconstructedNormalizedSha256
```

Maschinenlesbarer Beweis:

```text
output/episode1-proof/episode1-reconstruction-proof.json
```

## Fail-closed-Regeln

Der Proof ist blockiert, wenn mindestens einer dieser Fälle eintritt:

- PDF fehlt oder besitzt keinen `%PDF`-Header
- Package enthält weniger als acht Panels
- Package enthält nicht neun Varianten und acht Finals
- ein Panel ist nicht `exportReady`
- nach dem Löschen bleibt Export fälschlich bereit
- Restore stellt nicht alle Bilder und Finals wieder her
- normalisierte Hashes unterscheiden sich
- `npm run lint`, `npm run typecheck`, `npm test` oder `npm run build` schlägt fehl
- Testbilder werden als kreative Freigabe ausgegeben

## Speicherimplementierung

Der praktisch geprüfte Archivcode nutzt `localStorage` mit Data-URLs. Der Proof behauptet keine IndexedDB-Blob-Persistenz. Diese Abweichung ist ein technisches Risiko für große reale Bilddateien, blockiert aber den kleinen deterministischen Testdatensatz nicht automatisch.
