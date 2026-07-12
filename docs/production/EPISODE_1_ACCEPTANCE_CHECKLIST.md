# Episode 1 Acceptance Checklist

Testfall: `ep_001 · Das Zimmer`

Statuswerte:

- `PASS`: im echten Browserlauf praktisch nachgewiesen
- `MANUAL`: absichtlich manueller externer Produktionsschritt
- `BLOCKED`: nicht bestanden oder kein belastbarer Beweis
- `PENDING`: Lauf noch nicht abgeschlossen

## Inhalt und Reihenfolge

- [ ] `PENDING` Episode wird aus der vorhandenen App geladen.
- [ ] `PENDING` Titel ist „Das Zimmer“.
- [ ] `PENDING` genau acht Panels sind vorhanden.
- [ ] `PENDING` Panelreihenfolge ist 1 bis 8.
- [ ] `PENDING` alle acht Panel-Prompts werden erzeugt und angezeigt.

## Bilder und Review

- [ ] `PENDING` neun lokale PNG-Testdateien werden durch die vorhandene Upload-UI importiert.
- [ ] `PENDING` Panel 1 erhält zwei Varianten.
- [ ] `PENDING` fehlende Finalbilder werden verständlich als Blocker gemeldet.
- [ ] `PENDING` Previews bleiben nach Reload verfügbar.
- [ ] `PENDING` eine erste Finalauswahl kann gesetzt werden.
- [ ] `PENDING` die Auswahl kann auf eine andere Variante geändert werden.
- [ ] `PENDING` pro Panel bleibt exakt ein Finalbild.
- [ ] `PENDING` Rating, Continuity und Review-Notiz bleiben gespeichert.

## QA, Export und Lettering

- [ ] `PENDING` QA meldet bei fehlenden Bildern Blocker.
- [ ] `PENDING` QA endet mit 0 Blockern, 0 Warnungen und 8/8 OK.
- [ ] `PENDING` Export Gate endet mit 8/8 und 0 fehlend.
- [ ] `PENDING` Lettering zeigt acht Bilder in korrekter Reihenfolge.
- [ ] `PENDING` Dialog-Overlays werden sichtbar dargestellt.
- [ ] `PENDING` vorhandener `Browser Print / PDF`-Button ruft `window.print()` auf.
- [ ] `PENDING` Chromium erzeugt ein valides PDF-Artefakt.

## Persistenz, Package und Restore

- [ ] `PENDING` Projekt wird geschlossen und in einer neuen Seite wieder geöffnet.
- [ ] `PENDING` Episode und Finalauswahl bleiben erhalten.
- [ ] `PENDING` Package enthält acht Panels, neun Varianten und acht Finals.
- [ ] `PENDING` Package wird als JSON heruntergeladen.
- [ ] `PENDING` lokaler Review-Stand kann bewusst gelöscht werden.
- [ ] `PENDING` fehlende Assets werden danach erneut korrekt gemeldet.
- [ ] `PENDING` Package stellt neun Varianten und acht Finals wieder her.
- [ ] `PENDING` normalisierter Original- und Restore-Package-Hash stimmen überein.

## Qualitätsgates

- [ ] `PENDING` `npm run lint` ohne Fehler.
- [ ] `PENDING` `npm run typecheck` erfolgreich.
- [ ] `PENDING` `npm test` erfolgreich.
- [ ] `PENDING` `npm run build` erfolgreich.
- [ ] `PENDING` Proof-Artefaktchecker erfolgreich.

## Ehrliche Grenzen

- [x] `MANUAL` echte Bildgenerierung bleibt ein externer manueller Schritt.
- [x] `PASS` synthetische Testbilder sind eindeutig als Testdaten gekennzeichnet.
- [x] `PASS` keine kreative Freigabe wird behauptet.
- [x] `PASS` keine kanonischen Figurendaten werden verändert.
- [x] `PASS` der M1-Clip wird nicht als Character Lock verwendet.
- [x] `PASS` beobachteter Speicherpfad wird als `localStorage`-Data-URL dokumentiert, nicht fälschlich als IndexedDB-Blob.

## Abnahmeentscheidung

Bis zum grünen vollständigen Browserlauf:

`EPISODE_PIPELINE_BLOCKED`

Nach einem grünen Lauf darf ausschließlich der Abschlussbericht die Entscheidung auf `EPISODE_PIPELINE_PROVEN` setzen. Die Aussage gilt dann nur für den technischen lokalen Testworkflow mit Testbildern, nicht für kreative Serienreife.
