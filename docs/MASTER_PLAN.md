# Comic Factory Masterplan

## Oberstes Ziel

Eine Person ohne professionelle Animationserfahrung produziert eine gute, kurze und wiederholbare Folge mit bereits entwickelter Storywelt, stabilen Figuren und wiederverwendbaren Sets.

Die Software wächst nur aus bewiesenen Produktionsschritten. Vorhandene kreative Arbeit wird zuerst gesichert, klassifiziert und in genau einen Canon überführt.

## Verbindliche Produktlinie

```text
Serie: Ricco im Haus
Pilot: Episode 001 – Das Zimmer
Kerncast: Ricco, Basti Prenzl, Jule, Don Miau
Kernsets: Hausfassade, Riccos Zimmer, Flur/Treppenhaus, Gemeinschaftsküche
Startmethode: kontrollierter Motion Comic / begrenzte 2D-Animation
```

Der frühere Bestand `Rico gegen Berlin` bleibt als kreative Erweiterungs- und Produktionsbibliothek erhalten. Er wird kontrolliert migriert, nicht gelöscht und nicht parallel als zweite aktive Serie betrieben.

## Quellenhierarchie

1. `project/canon.json`
2. ausdrückliche Canon-Entscheidung aus Commit `33951d7`
3. aktuelle technisch geprüfte Beweise
4. frühe kreative und technische Bibliothek
5. experimentelle oder verworfene Module

## Meilensteine

1. **M0 Bestand & Neustart – abgeschlossen**  
   Legacy archiviert, Online-Dashboard und kontrollierte GitHub-Linie eingerichtet.

2. **M1 Technisches Lebenszeichen – abgeschlossen**  
   Viersekunden-Pipelinebeweis mit Stimme, Blick, Blinzeln, Mundbewegung, Untertitel, MP4, FFprobe und GitHub Pages. Figur, Raum und Stimme sind Platzhalter und kein Character Lock.

3. **M1R Canon & Asset Recovery – aktiv**  
   Story-, Style-, Character-, Location-, Produktions- und LoRA-Sheets aus allen Projektständen sichern. Rico/Ricco, Falk/Basti und Kralle/Don Miau zusammenführen. Visuelle Sheets und lokale Assets lokalisieren. Vier Pilotfiguren und vier Sets als Masterreferenzen vorbereiten.

4. **M2 Kanonische Mini-Szene – danach**  
   Zwei freigegebene Figuren, zwei Shots, ein echter Beat aus `Das Zimmer`, verständliche Reaktion und Timing.

5. **M3 Character & Location Lock**  
   Vier Pilotfiguren und vier Pilotsets besitzen eindeutige Bibles, Masterreferenzen, Kontinuitätsregeln und Assetpfade.

6. **M4 Pilot-Animatic**  
   Die acht bestehenden Storybeats funktionieren mit Arbeitsstimmen, Timing, groben Bildern, Untertiteln und Schnitt.

7. **M5 Erste gute Folge**  
   Fertiger 9:16-Pilot mit stabilen Figuren, gesprochenem Dialog, Sound, Untertiteln, QC und archivierter Produktionshistorie.

8. **M6 Wiederholung**  
   Eine zweite Szene wird mit denselben Figuren, Sets und Verträgen produziert, ohne die Pipeline neu zu erfinden.

9. **M7 Comic Factory V1**  
   Nur praktisch bewiesene Wiederholungsarbeit wird gezielt automatisiert und in eine kleine Bedienoberfläche überführt.

## Erhaltener Bestand

Verifiziert vorhanden:

- 13 frühe Figuren
- 9 Character Production Sheets
- 6 LoRA Training Sheets
- 15 frühe Locations und Episodenzonen
- 10 Location Production Sheets
- Story Bible und Style Bible
- 30 frühe Pilotpanels
- 11 frühe TV-Shots
- 8 spätere kanonische Pilotbeats
- Verträge und Skripte für Keyframes, Repair, Review, Voice, Sound, Motion, ComfyUI, Assembly und Export

Nicht zuverlässig lokalisiert:

- tatsächliche visuelle Character-Sheet-Bilddateien
- tatsächliche visuelle Location-Sheet-Bilddateien
- freigegebene Masterreferenzen für den Kerncast und die Pilotsets

## Stop-Regeln während M1R

- keine neue Figur erzeugen
- keine neue Pilotstory schreiben
- keine neue Stilrichtung testen
- keine alte Story-, Figuren- oder Assetdatei löschen
- keine SVG- oder Testgrafik als Canon bezeichnen
- kein M2-Render vor freigegebenen Character- und Location-Referenzen
- keine große Plattformarchitektur
- keine Cloudkosten ohne konkretes freigegebenes Asset
- Chris Fact Radar niemals verändern

## Definition of Done für M1R

M1R ist abgeschlossen, wenn:

- `project/canon.json` als eindeutige Quelle funktioniert
- Story, Stil, Kerncast und Erweiterungsbibliothek im Dashboard sichtbar sind
- alle bekannten Sheets erhalten und klassifiziert sind
- Rico/Ricco, Falk/Basti und Kralle/Don Miau als Merge-Bibles abgeschlossen sind
- Jule eine vollständige Bible besitzt
- visuelle Referenzdateien lokalisiert oder als wirklich fehlend protokolliert wurden
- vier Character-Masterreferenzen und vier Set-Masterreferenzen freigegeben sind
- die acht Pilotbeats als Animatic vorbereitet sind
- der technische M1-Clip klar als Pipelinebeweis markiert bleibt
- Bot, Dashboard und Tests neue Figuren und neue Pilotstories blockieren

## Nächster sichtbarer Halt

```text
Online-Dashboard zeigt den vollständigen Bestand und den aktiven Canon.
Lokale Asset-Recovery liefert einen verifizierten Fundbericht.
Danach wird M1 mit einer echten freigegebenen Ricco-Referenz erneut gerendert.
```
