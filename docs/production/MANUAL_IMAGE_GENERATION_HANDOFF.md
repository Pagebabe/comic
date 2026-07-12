# Manual Image Generation Handoff

## Zweck

Der lokale Workflow beginnt mit Story, Panels und Panel-Prompts. Die eigentliche kreative Bildgenerierung liegt außerhalb des getesteten Repositories und bleibt ein **manueller Schritt**. Dieser Vertrag beschreibt die sichere Übergabe zurück in die vorhandene App, ohne einen Provider oder ein neues Tooling einzubauen.

## Ausgangspunkt

1. App starten:

   ```bash
   npm run dev
   ```

2. `http://localhost:3100/#/ricco-studio` öffnen.
3. Episode `ep_001 · Das Zimmer` prüfen.
4. `Alle Prompts erzeugen` ausführen.
5. Positive Prompt, Negative Prompt und Continuity Checklist je Panel übernehmen.

## Externe Generierung

Erlaubt sind vorhandene lokale Bilder oder extern erzeugte Bilder. Der lokale Test startet keinen Provider und behauptet keine erfolgreiche externe Generierung.

Für jedes Panel müssen folgende Informationen zusammenbleiben:

- Episode-ID `ep_001`
- Panel-ID `panel_001` bis `panel_008`
- verwendeter positiver Prompt
- verwendeter negativer Prompt
- Variante beziehungsweise Versuch
- Generator/Quelle
- Datum
- bekannte Fehler oder Abweichungen

## Dateinamen

Empfohlen:

```text
panel_001_v1.png
panel_001_v2.png
panel_002_v1.png
panel_003_v1.png
...
panel_008_v1.png
```

Die vorhandene Bulk-Upload-Seite erkennt außerdem Formen wie `panel-2.webp`, `p03.jpg` oder `04_variant.png`. Eindeutige `panel_00N`-Namen reduzieren jedoch das menschliche Talent, Dateien dem falschen Panel zuzuordnen.

## Technische Anforderungen

- Format: PNG, JPG oder WEBP
- maximale Dateigröße der vorhandenen App: 3.500.000 Bytes pro Datei
- kein Text und keine Sprechblasen im Bild
- Dialog wird später in der Lettering-Vorschau ergänzt
- Bilder vor dem Import lokal sichern

## Rückgabe in die App

1. `#/ricco-bulk-upload` öffnen.
2. Dateien auswählen.
3. automatische Panelzuordnung sichtbar prüfen.
4. falsche Zuordnung vor dem Speichern korrigieren.
5. `Bereite Dateien speichern` anklicken.
6. `#/ricco-image-review` öffnen.
7. je Variante Rating, Continuity und Notiz pflegen.
8. genau ein Finalbild pro Panel wählen.
9. bei Korrektur eine andere Variante wählen. Die alte Auswahl muss wieder `VARIANT` werden.
10. `#/ricco-qa` und danach `#/ricco-export` prüfen.

## Pflichtnotiz für echte Bilder

Review-Notizen sollen mindestens enthalten:

```text
Quelle: <Tool oder vorhandenes Asset>
Prompt-Version: <Version oder Hash>
Kontinuität geprüft: <ja/nein + Abweichung>
Finalgrund: <warum diese Variante>
Offene kreative Prüfung: <ja/nein>
```

## Nicht erlaubt

- Testbilder als finalen Character Lock ausgeben
- M1-Clip als Character Lock verwenden
- fehlende externe Generierung als erfolgreich markieren
- Batch, LoRA oder ComfyUI-Ausbau als Nebenprodukt dieses Proofs starten
- Cast-, Figuren- oder Dashboard-Daten von Worker 1 verändern

## Speicherwarnung

Im geprüften Archiv-Commit werden lokale Dateien als Data-URLs in `localStorage` gespeichert. Das ist für kleine Proof-Fixtures ausreichend, aber kein belastbarer Beweis für große Produktionsbilder. Bei echten Bildern:

1. Originaldateien außerhalb des Browsers sichern.
2. nach jedem abgeschlossenen Review ein Production Package herunterladen.
3. Browser-Quota-Fehler ernst nehmen.
4. eine spätere IndexedDB-Blob-Migration als separates, getestetes Arbeitspaket behandeln.
