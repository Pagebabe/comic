# Comic Factory Operator-Handbuch V1

Status: `DRAFT_FOR_PUBLIC_ACCEPTANCE`

Tracking: Issue #95  
Kreatives Gate: LR5.1 · Issue #88  
Repository: `Pagebabe/comic`

## 1. Zweck dieses Handbuchs

Dieses Handbuch führt eine Person ohne technische oder produktionelle Vorerfahrung durch Comic Factory. Das Ziel ist eine wiederholbare, professionelle Serienproduktion mit eigener visueller Identität, konsistenten Figuren und kontrollierten Freigaben.

Das System soll die Produktionsdisziplin einer professionellen Animationsserie erreichen. Es kopiert keine bestehende Serie, keinen Künstler und keine geschützte Ästhetik.

### Was du am Ende verstehen sollst

Du kannst:

1. den aktuellen Projektstatus lesen,
2. Canon, Kandidat und Master unterscheiden,
3. einen Character-, Set- oder Voice-Kandidaten sicher prüfen,
4. einen Episodenplan durch den technischen Produktionspfad führen,
5. Fehler erkennen und ohne Datenverlust zurückkehren,
6. einen Export mit Beweisen und Übergabeinformationen erzeugen.

### Was dieses Handbuch nicht automatisch erlaubt

- keine Bildgenerierung ohne aktives Freigabegate,
- kein Batch-Rendering,
- kein LoRA-Training,
- keine automatische Masterfreigabe,
- keine Episodeproduktion mit ungeprüften Assets,
- keine Growth-OS- oder Publishing-Aktivierung.

## 2. Die fünf Begriffe, die du zuerst lernen musst

### 2.1 Quelle

Eine Quelle ist ein belegtes Dokument, eine Entscheidung oder ein freigegebenes Asset. Beispiele:

- `project/truth-state.json`
- menschliche Pilotentscheidung
- Character-Bible
- Visual-Preproduction
- freigegebener Master mit Version und SHA-256

Eine alte Datei ist nicht automatisch eine aktuelle Quelle.

### 2.2 Kandidat

Ein Kandidat ist ein noch nicht freigegebenes Ergebnis. Er darf geprüft, überarbeitet oder verworfen werden.

Status: `REVIEW_REQUIRED`

### 2.3 Master

Ein Master ist ein ausdrücklich menschlich freigegebenes, versioniertes Referenzasset.

Beispiele:

- Character-Master
- Location-Master
- Voice-Master

Ein hübsches Bild ist kein Master. Ein grüner technischer Test ist ebenfalls kein Master.

### 2.4 Gate

Ein Gate ist eine kontrollierte Freigabegrenze. Ohne bestandene Kriterien geht die Produktion nicht weiter.

Beispiele:

- Quellenvertrag freigegeben
- genau ein Kandidat erlaubt
- Kandidat als Master freigegeben
- Episode bereit für Export

### 2.5 Beweiskette

Jede wichtige Behauptung folgt dieser Reihenfolge:

```text
Behauptung
→ Quelle
→ Test
→ Artefakt
→ Lauf- oder Deployment-Beweis
→ sichtbare Gegenprüfung
→ ehrlicher Status
```

## 3. Aktueller Projektstand

### Geschlossen und öffentlich bewiesen

- LR0 Truth Reset
- LR1 Pilotentscheidung
- LR2 Studio Foundation
- LR3 neutraler Produktionsloop
- LR4 Selected-Pilot-Fire-Test

### Aktiv

- LR5 Visual-, Set- und Voice-Locks
- LR5.1 Ricco Visual-Master-Vertrag

### Aktueller Ricco-Zustand

- Quellen: 7/7
- Konflikte: 5/5 dokumentiert
- Reviewtests: 10/10 definiert
- Kandidaten: 0/1
- Status: `CONTRACT_READY_REVIEW_REQUIRED`
- Bildgenerierung: gesperrt
- Masterfreigabe: nein

## 4. Schnellstart ohne Installation

Der öffentliche Lese- und Prüfbetrieb funktioniert im Browser.

### Dashboard öffnen

1. Browser öffnen.
2. In die Adressleiste klicken.
3. `https://pagebabe.github.io/comic/` eingeben.
4. Enter drücken.

### Studio öffnen

1. Auf dem Dashboard den Studio-Link öffnen oder direkt aufrufen:
2. `https://pagebabe.github.io/comic/studio/`

### Guided Mode öffnen

Nach Veröffentlichung von OPS1:

`https://pagebabe.github.io/comic/studio/#guided`

### Aktuellen Ricco-Vertrag öffnen

`https://pagebabe.github.io/comic/studio/#lr5-ricco`

## 5. Lokaler Start für Bearbeitung

Diese Schritte sind für Personen gedacht, die Dateien ändern oder lokal testen sollen.

### Voraussetzungen

- Mac, Linux oder Windows mit aktueller Node.js-LTS-Version
- Git
- moderner Browser
- Zugriff auf das Repository

### Mausweg in VS Code

1. VS Code öffnen.
2. Menü **File → Open Folder…** wählen.
3. Ordner `comic` auswählen.
4. Links im Explorer prüfen, ob `studio-app`, `project`, `docs` und `tests` sichtbar sind.
5. Menü **Terminal → New Terminal** wählen.

### Befehle

```bash
npm --prefix studio-app ci
npm --prefix studio-app run build
npm test
```

### Erwartetes Ergebnis

- Abhängigkeiten werden aus dem Lockfile installiert.
- Studio baut ohne TypeScript-Fehler.
- bestehende Tests bleiben grün.

### Stop-Regel

Nicht weiterarbeiten, wenn:

- `npm ci` den Lockfile-Vertrag verletzt,
- Tests rot sind,
- `truth-state.json` nicht geladen wird,
- der aktuelle Branch nicht bekannt ist.

## 6. Projektstruktur

### `project/`

Maschinenlesbare Wahrheit, Entscheidungen, Verträge und Closure-Beweise.

### `studio-app/`

Bedienoberfläche und Browserprüfungen.

### `docs/`

Handbücher, Runbooks, Audits und Produktionsregeln.

### `tests/`

Unit-, Vertrags- und Regressionstests.

### `scripts/`

Prüfer, Exporte, Beweis- und Recovery-Skripte.

### `proof/`

Öffentlich ausgelieferte Runtime- und Screenshot-Beweise.

### `growth-os/`

Isolierte Marketing-Shadow-Linie. Nicht in die Produktionslinie integrieren.

## 7. Täglicher Operator-Ablauf

### Start des Tages

1. Dashboard öffnen.
2. Aktives Gate und Issue lesen.
3. Prüfen, ob ein Deploy-Blocker offen ist.
4. Studio öffnen.
5. Nur die aktive Route bearbeiten.
6. Vor Änderungen Branch und Basiscommit notieren.

### Ende des Tages

1. Geänderte Dateien prüfen.
2. Tests ausführen.
3. Status nicht übertreiben.
4. Offene Blocker dokumentieren.
5. Beweise und Artefakte verlinken.
6. Keine ungeprüften Kandidaten als Master markieren.

## 8. Von der Serienidee zur Episode

### Phase A: Seriengrundlage

Benötigt:

- Serienprämisse
- Zielgruppe
- Tonalität
- eigene visuelle Designregeln
- wiederkehrende Figuren
- wiederkehrende Orte
- Episodenlänge
- technische Ausgabeformate

Abnahme:

- keine direkte Stilkopie
- klare Figurenrollen
- klare Comedy- oder Dramaturgieregeln
- wiederholbare Produktionsgrenzen

### Phase B: Pilotentscheidung

1. Zwei bis drei Pilotkandidaten schreiben.
2. Jeden Kandidaten nach Machbarkeit, Figurenfunktion und Serienpotenzial bewerten.
3. Genau einen Pilot auswählen.
4. Entscheidung dokumentieren.
5. Nicht ausgewählte Kandidaten archivieren.

### Phase C: Masteraufbau

Reihenfolge:

1. Character-Master
2. Location-Master
3. Voice-Master
4. erst danach echte Episode

Keine parallele Massenproduktion.

### Phase D: Episode

1. Episode Brief
2. Script Draft
3. Dialogreview
4. Shotliste
5. Storyboard
6. Assetbindung
7. Bild- oder Animationsproduktion
8. Voice
9. Schnitt
10. Sound
11. Untertitel
12. QA
13. Export
14. Package und Restore-Beweis

## 9. Character-Master-Workflow

### Schritt 1: Quellen prüfen

Sichtbarer Weg:

1. Studio öffnen.
2. Route **LR5.1 Ricco** anklicken.
3. Quellenzahl prüfen.
4. Konfliktliste lesen.
5. sicherstellen, dass Platzhalter nicht als Masterquelle verwendet werden.

### Schritt 2: Vertrag prüfen

Prüfe:

- Identität
- Alter und Rolle
- Körperform
- Silhouette
- Kleidung
- wiederkehrende Requisiten
- Ansichten
- Expressions
- Posen
- verbotene Abweichungen

### Schritt 3: menschliche Vertragsentscheidung

Zulässige Entscheidung vor dem ersten Kandidaten:

`CONTRACT_APPROVED_FOR_ONE_CANDIDATE`

Diese Entscheidung erlaubt genau einen Kandidaten. Sie genehmigt kein Ergebnis.

### Schritt 4: genau einen Kandidaten erzeugen

Pflichtumfang:

- Frontansicht
- Dreiviertelansicht
- Profil
- Rückenansicht
- Silhouette
- Expressions
- Default-Outfit
- neutraler Hintergrund

### Schritt 5: Review

Zulässige Entscheidungen:

- `APPROVED_MASTER`
- `REVISION_REQUIRED`
- `REJECTED`

Standard bleibt `REVIEW_REQUIRED`.

### Schritt 6: Versionieren

Ein Master benötigt:

- eindeutige Asset-ID
- Version
- Quelldateien
- Erstellungsparameter
- SHA-256
- Reviewentscheidung
- Entscheider
- Zeitstempel
- bekannte Einschränkungen

## 10. Location-Master-Workflow

Jeder Ort braucht:

- Grundriss oder räumliche Logik
- Hauptansichten
- Farb- und Materialregeln
- Tag-/Nachtzustände
- feste Requisiten
- Kameraachsen
- Größenvergleich mit Figuren
- verbotene Veränderungen

Abnahme:

- wiederholbare Geometrie
- keine wandernden Türen oder Fenster
- kontrollierte Farbpalette
- klare Kamerapositionen

## 11. Voice-Master-Workflow

Jede Stimme braucht:

- Sprecheridentität oder Modellquelle
- rechtliche Nutzungsfreigabe
- Tempo
- Tonhöhe
- Energie
- Aussprache
- emotionale Varianten
- Lautheitsziel
- Dateiformat
- Reviewentscheidung

Stop-Regel:

Keine reale Person imitieren oder klonen, wenn keine ausdrückliche Erlaubnis vorliegt.

## 12. Script- und Dialogworkflow

### Script Draft

Enthält:

- Szenenziel
- Konflikt
- Beatfolge
- Dialog
- visuelle Gags
- Länge

### Reviewfragen

- spricht jede Figur erkennbar anders?
- funktioniert der Witz ohne Erklärung?
- trägt jede Zeile die Handlung oder Figur?
- ist die Länge realistisch?
- widerspricht etwas dem Canon?

Keine Dialogzeile wird durch den technischen Transport automatisch final.

## 13. Shot- und Storyboardworkflow

Jeder Shot benötigt:

- Shot-ID
- Szene
- Panel oder Zeitbereich
- Figuren
- Ort
- Kamera
- Aktion
- Dialog
- benötigte Master
- Reviewstatus

Abnahme:

- Achsen und Blickrichtungen stimmen
- Figurenpositionen bleiben nachvollziehbar
- benötigte Master sind freigegeben
- keine verdeckten Continuity-Sprünge

## 14. Bild- und Animationsproduktion

### Vor jeder Erzeugung prüfen

- aktives Gate erlaubt Ausführung
- Vertrag ist freigegeben
- Kandidatenlimit ist bekannt
- Kostenlimit ist bekannt
- Quellen sind gebunden
- Ausgabepfad ist versioniert

### Nach jeder Erzeugung prüfen

- Anzahl der Ergebnisse stimmt
- keine unerwartete Person oder Marke
- Character-Identität konsistent
- Hände, Gesicht, Kleidung und Requisiten plausibel
- Hintergrund entspricht dem Set-Master
- keine automatische Freigabe

## 15. Voice, Schnitt und Sound

### Voice

- Takes benennen
- Textversion binden
- Sprecher oder Modellversion binden
- Lautheit prüfen
- Atmer und Pausen prüfen

### Schnitt

- Timing gegen Script prüfen
- Reaktionszeit lassen
- Dialog nicht abschneiden
- Gags lesbar halten

### Sound

- Sprache verständlich
- Musik nicht über Sprache
- Effekte motiviert
- keine ungeklärten Rechte

## 16. Untertitel

Pflicht:

- korrekter Text
- sinnvolle Zeilenumbrüche
- ausreichende Lesedauer
- sichere Bildschirmposition
- keine wichtigen Bildinformationen verdecken

Die bestehende SRT-Ausgabe ist ein Timingkandidat, kein automatisch finaler Dialog.

## 17. QA vor Export

### Technische QA

- Auflösung
- Framerate
- Codec
- Audioformat
- Lautheit
- Untertitel
- Dateigröße
- Abspieldauer

### Creative QA

- Figurenkonsistenz
- Setkonsistenz
- Continuity
- Dialogqualität
- Timing
- emotionale Lesbarkeit

### Evidence QA

- Quellen
- Versionen
- Hashes
- Reviewentscheidungen
- Tests
- sichtbarer Gegencheck

## 18. Export und Übergabe

Ein vollständiges Übergabepaket enthält:

- Mastervideo
- Untertitel
- Audio-Stems, falls benötigt
- EpisodePackage
- Assetmanifest
- Versionsmanifest
- Reviewprotokoll
- SHA-256-Hashes
- bekannte Einschränkungen

Keine Datei heißt `final_final_neu2`.

## 19. Delete und Restore

Der bewiesene technische Ablauf:

1. Package erzeugen.
2. Package separat erhalten.
3. Arbeitszustand vollständig löschen.
4. prüfen, dass der Zustand fehlt.
5. Package wiederherstellen.
6. Hash vor Löschung und nach Restore vergleichen.

Nur `HASH MATCH` gilt als bestanden.

## 20. Fehlerdiagnose

### Studio lädt nicht

Prüfe:

1. Netzwerk
2. Browser-Konsole
3. Pfad zu `truth-state.json`
4. Pages-Deploy-Status
5. ob ein Blocker-Issue existiert

### Test rot

1. exakten fehlgeschlagenen Test lesen
2. keine anderen Dateien ändern
3. prüfen, ob Test oder Implementierung veraltet ist
4. nur den belegten Fehler korrigieren
5. gesamte Kette erneut laufen lassen

### Hash stimmt nicht

- Package verändert
- falsche Version geladen
- nicht-kanonische Serialisierung
- versteckte Zustandsänderung

Nicht manuell überschreiben. Ursache finden.

### Kandidat sieht falsch aus

Status auf `REVISION_REQUIRED` oder `REJECTED` setzen. Kein nachträgliches Schönreden zur Masterfreigabe.

### Provider fällt aus

- keine Endlosschleife
- Kosten stoppen
- Job sicher beenden
- Eingaben und Fehler dokumentieren
- später kontrolliert neu starten

## 21. Backup und Recovery

Vor großen Änderungen:

- sauberer Git-Status
- Branchname notieren
- Basiscommit notieren
- keine Secrets committen
- vorhandene Artefakte sichern

Recovery-Reihenfolge:

1. Fehler eingrenzen
2. letzten bewiesenen Commit bestimmen
3. Arbeitsbranch isolieren
4. keinen Blind-Merge durchführen
5. Tests und sichtbare Gegenprüfung wiederholen

## 22. Growth OS bleibt getrennt

Growth OS ist aktuell:

- `SHADOW_RELEASE_READY`
- nicht `LIVE_READY`
- nicht in `main` integriert

Kein Operator darf:

- Live-Publishing aktivieren
- OAuth verbinden
- Provider-Credentials hinterlegen
- Remote-Scheduler starten
- Marketing-Automation in die Produktionslinie mergen

Erst ein separater gemeinsamer Integrations-Smoke darf diese Grenze neu bewerten.

## 23. Anfänger-Übung

Ziel: Das System verstehen, ohne etwas zu erzeugen.

1. Dashboard öffnen.
2. aktives Gate nennen.
3. Studio öffnen.
4. LR3 Proof Loop öffnen und Status lesen.
5. LR4 Das Zimmer öffnen und 8 Panels finden.
6. LR5.1 Ricco öffnen.
7. Quellenzahl nennen.
8. Kandidatenzahl nennen.
9. erklären, warum `EXECUTION BLOCKED` korrekt ist.
10. erklären, welcher menschliche Entscheid vor einem Kandidaten erforderlich ist.

Bestanden, wenn alle Antworten ohne Hilfe korrekt sind.

## 24. Production-Ready-Abnahme

Das System darf erst `10/10 PRODUCTION_READY` heißen, wenn alle zehn Gates in `project/production-readiness-v1.json` auf `CLOSED_VERIFIED` stehen.

Derzeitiger Stand:

`2/10 CLOSED_VERIFIED · 6 PARTIAL · 2 OPEN`

Die fehlenden Kernbeweise sind:

- frische Installation auf unterstützter Maschine
- Guided Mode
- echter Character-Master
- echte Set- und Voice-Master
- vollständige geprüfte Episode
- Nullwissen-Abnahmelauf

## 25. Morgen früh: erster sinnvoller Ablauf

1. Guided Mode öffnen.
2. Kapitel „Status lesen“ abschließen.
3. LR5.1 Ricco-Vertrag vollständig lesen.
4. offene Konflikte prüfen.
5. noch keine Bilder erzeugen.
6. Vertragsentscheidung dokumentieren.
7. erst danach genau einen Ricco-Kandidaten vorbereiten.

Das ist langsamer als wahlloses Generieren und schneller als eine Serie mit wechselnden Gesichtern, wandernden Türen und drei verschiedenen Hauptfiguren namens Ricco.