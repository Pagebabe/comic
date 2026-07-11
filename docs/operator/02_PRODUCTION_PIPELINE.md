# 02 · Master- und Episodenproduktion

## Ziel

Dieses Kapitel beschreibt den vollständigen Produktionsweg von der Serienidee bis zum geprüften EpisodePackage. Es erteilt keine automatische kreative Freigabe.

## A. Seriengrundlage

Vor der ersten Episode müssen dokumentiert sein:

- Serienprämisse
- Zielgruppe
- Tonalität
- eigene visuelle Designregeln
- wiederkehrende Figuren
- wiederkehrende Orte
- Episodenlänge
- Ausgabeformate
- rechtliche Grenzen

### Abnahme

- keine direkte Kopie einer bestehenden Serie oder eines lebenden Künstlers
- klare Figurenfunktionen
- wiederholbare Comedy- oder Dramaturgieregeln
- technisch realistische Produktionsgrenzen

## B. Pilotentscheidung

1. zwei bis drei Pilotideen erstellen.
2. Machbarkeit, Figurenfunktion und Serienpotenzial bewerten.
3. genau einen Pilot auswählen.
4. Entscheidung mit Person und Zeitpunkt dokumentieren.
5. nicht ausgewählte Kandidaten archivieren.

Eine Pilotauswahl genehmigt keine Dialoge, Bilder, Stimmen oder finales Timing.

## C. Character-Master

### Quellenbindung

Jede Figur braucht:

- aktuelle Character-Bible
- Rolle und Alter
- Silhouette
- Körperproportionen
- Gesicht und Frisur
- Default-Outfit
- Requisiten
- Ansichten
- Expressions
- Posen
- verbotene Abweichungen

### Ricco V1

1. Studio öffnen.
2. **LR5.1 Ricco** wählen.
3. 7 Quellen und 5 Konflikte lesen.
4. 10 Reviewtests prüfen.
5. menschliche Entscheidung `CONTRACT_APPROVED_FOR_ONE_CANDIDATE` dokumentieren.
6. genau ein versioniertes Review-Sheet erzeugen.
7. Kandidat sichtbar prüfen.
8. eine Entscheidung setzen:
   - `APPROVED_MASTER`
   - `REVISION_REQUIRED`
   - `REJECTED`

### Stop-Regeln

- kein Kandidat ohne Vertragsfreigabe
- kein Batch
- kein LoRA-Training
- keine automatische Masterfreigabe
- kein zweiter Kandidat, solange der erste nicht entschieden ist

## D. Location-Master

Jeder Ort benötigt:

- räumliche Logik oder Grundriss
- Hauptansichten
- feste Kameraachsen
- Farb- und Materialregeln
- Tag-/Nachtzustände
- feste Requisiten
- Größenvergleich mit Figuren
- verbotene Veränderungen

### Ablehnungsgründe

- wandernde Türen oder Fenster
- wechselnde Raumgröße
- ungebundene Farbpalette
- widersprüchliche Requisiten
- unmögliche Blickachsen

## E. Voice-Master

Jede Stimme benötigt:

- Sprecher- oder Modellquelle
- Nutzungsfreigabe
- Sprache und Aussprache
- Tempo
- Tonhöhe
- Energie
- emotionale Varianten
- Lautheitsziel
- Dateiformat
- Version und Reviewentscheidung

Keine reale Person imitieren oder klonen, wenn keine ausdrückliche Erlaubnis vorliegt.

## F. Episode Brief

Der Brief enthält:

- Episoden-ID
- Ziel und Kernkonflikt
- Figuren
- Orte
- Anfang, Wendepunkt und Ende
- erwartete Länge
- benötigte Master
- bekannte Risiken

## G. Script und Dialog

### Script Draft

- Szenenziel
- Beatfolge
- Dialog
- visuelle Gags
- Soundideen
- geschätzte Länge

### Dialogreview

- spricht jede Figur erkennbar anders?
- funktioniert der Witz ohne Erklärung?
- trägt jede Zeile Handlung oder Figur?
- ist die Länge realistisch?
- widerspricht etwas dem Canon?

Technischer Transport genehmigt keine Dialogzeile.

## H. Shotliste und Storyboard

Jeder Shot besitzt:

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

### Storyboard-Abnahme

- Achsen und Blickrichtungen stimmen
- Figurenpositionen sind nachvollziehbar
- Continuity bleibt erhalten
- benötigte Master sind freigegeben
- Timing ist lesbar

## I. Bild- und Animationsproduktion

### Vor der Ausführung

- aktives Gate erlaubt Ausführung
- Quellen sind gebunden
- Kandidatenlimit ist bekannt
- Kostenlimit ist bekannt
- Zielpfad und Version sind festgelegt
- sensible Inhalte und Rechte sind geprüft

### Nach der Ausführung

- Anzahl stimmt
- keine unerwartete Person oder Marke
- Figur bleibt identisch
- Gesicht, Hände, Kleidung und Requisiten sind plausibel
- Hintergrund entspricht dem Location-Master
- Status bleibt `REVIEW_REQUIRED`

## J. Voice, Schnitt und Sound

### Voice

- Take-ID und Textversion binden
- Stimme und Modellversion binden
- Pausen, Atmer und Aussprache prüfen
- Lautheit messen

### Schnitt

- Timing gegen Script und Storyboard prüfen
- Reaktionszeit lassen
- Dialog nicht abschneiden
- Gags lesbar halten

### Sound

- Sprache verständlich
- Musik nicht über Sprache
- Effekte motiviert
- Nutzungsrechte geklärt

## K. Untertitel

- korrekter Text
- sinnvolle Zeilenumbrüche
- ausreichende Lesedauer
- sichere Position
- keine wichtigen Bildinformationen verdeckt

Eine SRT-Datei kann Timing beweisen, aber nicht automatisch Dialogqualität.

## L. EpisodePackage

Das Package enthält mindestens:

- Episode-ID und Version
- Quellen
- Script- und Shotversion
- gebundene Master
- Medienmanifest
- Untertitel
- Reviewentscheidungen
- QA-Ergebnisse
- SHA-256-Hashes
- bekannte Einschränkungen

## M. Delete und Restore

1. Package erzeugen.
2. Package getrennt erhalten.
3. Arbeitszustand vollständig löschen.
4. prüfen, dass der Zustand fehlt.
5. Package wiederherstellen.
6. Hash vor Löschung und nach Restore vergleichen.

Nur `HASH MATCH` gilt als bestanden.