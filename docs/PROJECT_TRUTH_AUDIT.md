# Comic Factory – vollständiger Projekt- und Canon-Audit

Stand: 2026-07-10

## Zweck

Dieses Dokument verhindert, dass frühere Story-, Figuren-, Stil- und Produktionsarbeit beim Neustart übersehen oder mit späteren Entscheidungen vermischt wird.

Geprüfte Quellen:

- aktueller Branch `main`
- Archivbranch `archive/legacy-comic-2026-07-10`
- Git-Historie des Repositories
- frühere Produktionsplanung `07_PRODUCTION_WORKFLOW_BLUEPRINT.md`
- bestehende Daten, Skripte, Tests und Runbooks

## Ergebnis in einem Satz

Die Comic Factory besitzt bereits eine große kreative und technische Vorarbeit, aber sie enthält drei Entwicklungsstufen. Die späteste ausdrückliche Canon-Entscheidung bleibt verbindlich; ältere Figuren, Locations, Dialoge und Produktionssheets werden als Erweiterungsbibliothek erhalten und kontrolliert migriert.

---

# 1. Drei verifizierte Entwicklungsstufen

## Stufe A – frühe große Serienwelt

Titel:

```text
Rico gegen Berlin
```

Prämisse:

```text
Rico Bassmann zieht behütet vom Land nach Berlin, um DJ zu werden. Er landet im chaotischen Haus Nebenwirkung und wird von Falk Reuter mit politischer Sprache und überteuerten Gebühren ausgenommen.
```

Verifizierter Bestand:

- 13 aktive Figuren
- 9 Character Production Sheets
- 6 LoRA Training Sheets
- 15 Locations beziehungsweise geplante Episodenzonen
- 10 Location Production Sheets
- Style Bible `Free-for-All Berlin Absurd Cartoon`
- Story Bible
- 30-Panel-Pilot `Die Entkommerzialisierungsgebühr`
- 11 TV-Shots für ungefähr 60 Sekunden
- Voice-, Sound-, Keyframe-, Motion-, Review- und Assembly-Verträge

Wichtige Quellen im Archivbranch:

```text
src/data/storyBible.json
src/data/styleGuide.json
src/data/characters.json
src/data/characterProductionSheets.json
src/data/loraTrainingSheets.json
src/data/locations.json
src/data/locationProductionSheets.json
src/data/episodes.ts
src/data/scenes.ts
src/data/pilotPanels.ts
src/data/tvShots.json
src/data/outputStructure.json
src/data/comfyRunner.json
```

Diese Stufe ist nicht der aktuellste Canon, enthält aber wertvolle Figuren-, Story-, Set-, Dialog- und Produktionsarbeit.

## Stufe B – ausdrücklicher Canon-Cleanup

Commit:

```text
33951d7 – Document EP001 canon cleanup plan
```

Verbindliche Entscheidung dieses Stands:

```text
Serie: Ricco im Haus
Pilot: Episode 001 – Das Zimmer
Kerncast: Ricco, Basti Prenzl, Jule, Don Miau
Kernlocations: Hausfassade, Riccos Zimmer, Flur/Treppenhaus, Gemeinschaftsküche
MVP: 8 stabile Panels → Review → Lettering → 9:16 Motion Comic
```

Der Commit verbietet ausdrücklich mehrere parallele Episodenwirklichkeiten und definiert folgende Migration:

```text
Rico Bassmann → Ricco
Falk Reuter → Basti Prenzl
Kralle → Don Miau
Haus Nebenwirkung → Haus Nr. 13 beziehungsweise aktive Hauslocation
Sami → spätere Nebenfigur oder entfernen
```

Die acht vollständigen Panel-Beats liegen in:

```text
src/data/riccoStudio.ts
```

Diese Stufe ist die letzte explizite kreative Canon-Entscheidung im alten Produktionssystem.

## Stufe C – aktueller technischer Neustart

Aktueller Schwerpunkt:

- Online-Dashboard über GitHub Pages
- kontrollierter Comic Director Bot
- GitHub als Quelle der Wahrheit
- Anfänger-Meilensteine M0 bis M7
- deterministischer Viersekunden-M1-Render
- CI, FFprobe und öffentlicher Medienbeweis

Der M1-Clip beweist:

```text
Manifest → Stimme → kontrollierte 2D-Bewegung → Untertitel → MP4 → technischer Test → Online-Deployment
```

Er beweist ausdrücklich nicht:

- endgültiges Character Design
- endgültige Stimme
- endgültigen Serienlook
- endgültigen Story-Canon

Der aktuelle Vektor-Ricco ist nur ein technischer Platzhalter.

---

# 2. Verbindliche Quellenhierarchie

Wenn Informationen widersprechen, gilt ab jetzt diese Reihenfolge:

1. **Neue, ausdrücklich freigegebene Canon-Entscheidung** in `project/canon.json`
2. **Canon-Cleanup-Entscheidung** aus Commit `33951d7`
3. **Aktuelle technische Beweise** und geprüfte Workflows
4. **Frühe kreative Bibliothek** aus `Rico gegen Berlin`
5. **Experimentelle beziehungsweise verworfene Module**

Technisch neuer bedeutet nicht automatisch kreativ verbindlicher.

---

# 3. Aktiver Serien-Canon

## Serie

```text
Ricco im Haus
```

## Pilot

```text
Episode 001 – Das Zimmer
```

## Format

- deutschsprachige animierte Social-Comedy
- zuerst 9:16
- gesprochene Figuren
- Untertitel als eigene Ebene
- keine Sprechblasen oder lesbaren Dialogtexte in generierten Bildern
- begrenzte kontrollierte 2D-/Motion-Comic-Animation als Start
- generative Bild- und Videoverfahren nur als kontrollierte Produktionswerkzeuge

## Kerncast

```text
Ricco
Basti Prenzl
Jule
Don Miau
```

## Kernlocations

```text
Haus Nr. 13 / Hausfassade
Riccos Zimmer
Flur / Treppenhaus
Gemeinschaftsküche
```

## Pilotstruktur

Die acht Beats aus `riccoStudio.ts` bleiben die primäre Storygrundlage:

1. Ricco kommt am Haus an.
2. Basti erklärt, dass es kein Mietverhältnis sei.
3. Die solidarische Nutzungsgebühr beträgt 780 Euro.
4. Ricco sieht das winzige kaputte Zimmer.
5. Seine Mutter ruft an.
6. Basti erklärt die widersprüchlichen Hausregeln.
7. Jule führt die Gemeinschaftsküchenlogik ein.
8. Ricco sitzt abends im Zimmer; Don Miau urteilt wortlos.

---

# 4. Erhaltener Erweiterungscast

Die 13 Figuren aus der frühen Bibliothek werden nicht gelöscht.

## Direkt zu migrierende Konzepte

| Früher | Aktiver Canon | Regel |
|---|---|---|
| Rico Bassmann | Ricco | frühe Herkunft, DJ-Traum, Tupperware und naive Berlin-Perspektive als mögliche Merkmale erhalten; Alter und finale Biografie separat festlegen |
| Falk Reuter | Basti Prenzl | Soft-Antagonist, KeepCup, Schlüsselbund, politische Rechtfertigung und Prenzlauer-Berg-Doppelmoral erhalten |
| Kralle | Don Miau | Bosskatzenfunktion, territoriale Ruhe und visuelle Autorität erhalten; Sprachregel separat festlegen |
| Haus Nebenwirkung | Haus Nr. 13 | Welt- und Setdetails erhalten, Name auf aktiven Canon migrieren |

## Eigenständige spätere Figurenbibliothek

Diese Figuren bleiben als zukünftige Kandidaten erhalten, werden aber nicht automatisch in Episode 001 aktiviert:

- Sami – Späti-Orakel
- Madame Rita – altes Berliner Hausgedächtnis
- Kira – chaotische Projektbewohnerin
- Olli – inoffizieller Hausmeister
- DJ Krätze – alte Rave-Legende und Warnfigur
- DJ Nebel – falsches Club-Idol
- Sven Null – Türsteher und Gatekeeper
- Mutti – Riccos emotionale Verbindung nach Hause
- Möpse – Katzenclan-Futter- und Pfandlogik
- Flitz – nervöser Katzen-Informationskurier

Jule bleibt aktiver Canon und besitzt keine direkte Doppelung in der frühen 13-Figuren-Bibliothek.

---

# 5. Stil-Canon

Die frühe Style Bible bleibt als wertvolle Stilgrundlage erhalten:

```text
Free-for-All Berlin Absurd Cartoon
```

Verbindliche Stilmerkmale:

- dicke schwarze Konturen
- klare wiederholbare Silhouetten
- überzeichnete Köpfe und Gesichtsausdrücke
- matte schmutzige Berlin-Grundfarben plus aggressive Neonakzente
- kaputte, schiefe und lebendige Architektur
- ein klarer visueller Gag und eine klare Emotion pro Shot
- keine fotorealistische oder halb-realistische Darstellung
- kein Anime, kein glossy 3D, keine direkte Kopie existierender Serien
- keine zufälligen Outfitwechsel
- keine echten Clublogos oder exakten realen Innenräume

Offen bleibt die endgültige visuelle Masterreferenz. Der technische Vektorclip ist keine solche Referenz.

---

# 6. Welt- und Location-Bibliothek

## Aktive Pilotsets

- Hausfassade
- Riccos Zimmer
- Flur / Treppenhaus
- Gemeinschaftsküche

## Wiederverwendbare spätere Sets aus der frühen Bibliothek

- Ricos beziehungsweise Riccos Kinderzimmer bei Mutti
- Späti mit Sami
- Innenhof / Mülltonnen / Katzenrevier
- Keller mit altem DJ-Pult
- Club Nein
- Bastis beziehungsweise Falks Prenzlauer-Berg-Wohnung
- Görli-Parodiewelt
- CSD-Parade-Overload
- Loveparade-/Rave-Flashbacks
- weitere Berliner Missverständniszonen

Reale Orte und Events dürfen nur als Skriptreferenz dienen. Visuell werden eigene fiktionale Orte und Symbole verwendet.

---

# 7. Produktionswissen, das erhalten bleibt

Die frühere Pipeline enthält bereits sinnvolle Verträge für:

- Character- und Location-Sheets
- Promptbausteine
- Keyframe-Jobs
- Repair-Jobs
- Review-Manifeste
- ComfyUI-Batches
- Asset-Intake
- Voice- und Untertitelpakete
- Sound-Cues
- Motion-Jobs
- Remotion-Planung
- Frame-QA
- Episode-State
- Work-Packets
- Assembly und Export
- Backup und Restore

Wichtige Regel aus dem früheren System:

```text
Kein finales Asset ist Canon, bevor es einen Review-Eintrag besitzt.
```

Brauchbare Dateilogik:

```text
Episode → Szene/Shot → Assettyp → Version → Review → Final → Export
```

## Bekannte technische Probleme der alten Automation

- mehrere Skripte verwendeten veraltete JSON-Import-Assertions unter Node 22
- mehrere Buildfehler durch `replaceAll` und inkonsistente TypeScript-Ziele
- einige Tests wurden ohne gestarteten Vite-Server ausgeführt und erzeugten falsche rote Ergebnisse
- ComfyUI-Runner war ausdrücklich nur ein Dry-Run-Stub
- Supabase und große Backendmodule wurden zu früh begonnen
- verschiedene Pilot-, Panel- und TV-Shot-Modelle liefen parallel

Diese Probleme werden nicht ungeprüft zurückkopiert.

---

# 8. Verbindliche Produktionsmethode

Für Version 1 gilt eine hybride, aber kontrollierte Methode:

1. Story und Timing als Storyboard/Animatic beweisen.
2. Character- und Location-Referenzen sperren.
3. Saubere Keyframes ohne Schrift generieren oder zeichnen.
4. Begrenzte 2D-/Motion-Comic-Bewegungen verwenden:
   - Blick
   - Blinzeln
   - Mundzustände/Viseme
   - kleine Körperimpulse
   - Zoom/Pan/Parallax
5. Gesprochene Stimmen und Untertitel separat produzieren.
6. Generatives Video nur für begrenzte Spezialshots einsetzen.
7. FFmpeg/Remotion beziehungsweise vorhandenen Editor deterministisch für Assembly nutzen.
8. Jede Folge mit Review und aktualisierten Bibeln abschließen.

Vollgeneratives Video ist nicht die Hauptpipeline für Dialogszenen.

---

# 9. Aktueller technische Status

Bewiesen:

- Dashboard öffentlich erreichbar
- GitHub-Pages-Deployment nachweisbar
- Bot-Kommandos und Provider-Allowlist getestet
- technischer Viersekunden-M1-Clip reproduzierbar
- H.264/AAC, 1080x1920, 30 fps, 48 kHz geprüft
- Chris Fact Radar blieb vollständig getrennt

Nicht bewiesen:

- endgültige Character-Sheets als Bilddateien im Git-Repository
- endgültiger Ricco-/Basti-/Jule-/Don-Miau-Look
- endgültige Stimmen
- Character-Konsistenz über mehrere echte Shots
- fertiges Animatic der acht Pilotbeats
- produktionsreifer ComfyUI-Send-Worker
- fertige Pilotfolge

---

# 10. Kritischer fehlender Bestand

Die textlichen Character-, LoRA- und Location-Sheets sind verifiziert.

Tatsächliche visuelle Character-Sheet-Bilddateien wurden im Git-Repository und in der durchsuchbaren File Library noch nicht zuverlässig lokalisiert.

Wahrscheinliche Ursache:

- generierte Medien lagen lokal unter `outputs/`, `public/generated/` oder Browser-Storage
- große Medien waren absichtlich nicht in Git
- einige Bilder wurden eventuell nur lokal importiert

Diese Dateien dürfen nicht als verloren erklärt werden, bevor der lokale Projektordner und Backups geprüft wurden.

---

# 11. Aktives Gate ab jetzt

```text
M1R – Canon & Asset Recovery
```

Ziel:

- alle kreative Vorarbeit sichtbar machen
- aktive und alte Canon-Versionen trennen
- visuelle Sheets lokalisieren
- genau eine zusammengeführte Character Bible freigeben
- technischen M1-Renderer danach mit einer echten freigegebenen Referenz verbinden

## Stop-Regeln

Bis M1R abgeschlossen ist:

- keine neue Figur erzeugen
- keine neue Pilotstory schreiben
- keine neue Stilrichtung testen
- kein neues Character Design als Canon ausgeben
- keinen weiteren M2-Render starten
- keine große Appfunktion bauen
- keine alten Daten löschen

---

# 12. Nächste lineare Arbeitsschritte

1. Creative- und Production-Audit in `project/canon.json` abbilden.
2. Dashboard auf Kerncast plus Erweiterungsbibliothek umstellen.
3. Bot-Kontext auf vorhandene Story und Figuren aktualisieren.
4. Lokale Assets und Backups nach Character Sheets durchsuchen.
5. Rico/Ricco, Falk/Basti und Kralle/Don-Miau als endgültige Merge-Bibles schreiben.
6. Vier aktive Masterreferenzen auswählen oder aus vorhandenem Material fertigstellen.
7. Acht Pilotbeats als Animatic prüfen.
8. Erst danach M1 mit echtem Canon-Asset erneut rendern.
9. Dann M2: zwei Figuren, zwei Shots, echter Storybeat.

---

# 13. Definition of Done für M1R

M1R ist erst abgeschlossen, wenn:

- `project/canon.json` eindeutig ist
- Story-, Style-, Character- und Location-Bestand im Dashboard sichtbar ist
- alle 13 frühen Figuren erhalten und klassifiziert sind
- die vier aktiven Kernfiguren eindeutige Bibles besitzen
- visuelle Referenzdateien lokalisiert oder als wirklich fehlend protokolliert wurden
- mindestens eine freigegebene Masterreferenz pro Pilotfigur existiert
- der technische M1-Clip klar als Pipelinebeweis markiert ist
- Bot und Dashboard keine neuen Figuren vorschlagen, solange das Gate offen ist
- der nächste Render auf einer freigegebenen Referenz basiert
