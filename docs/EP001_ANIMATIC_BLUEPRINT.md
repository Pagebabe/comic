# EP001 Animatic Blueprint

Status: `BLUEPRINT_READY · ASSETS_BLOCKED`

Episode: **Ricco im Haus · Episode 001: Das Zimmer**

Ziel: Ein 9:16-Motion-Comic-Animatic mit genau acht stabilen Panels, gesprochenem Dialog, separat gesetzten Untertiteln und kontrollierter Bewegung. Dieses Dokument fügt keine neue Story hinzu. Es übersetzt ausschließlich die acht gesperrten Pilotbeats in eine prüfbare Timing-Struktur.

Maschinenlesbare Quelle: [`project/ep001-animatic-blueprint.json`](../project/ep001-animatic-blueprint.json)

## Format

- 1080 × 1920
- 30 fps
- Zielzeit: **45,5 Sekunden**
- genau 8 Panels
- Limited 2D / Motion Comic
- Dialog, Sound und Untertitel getrennt vom Bild
- kein lesbarer Text und keine Sprechblasen in generierten Bildern
- kein Animatic-Render vor den visuellen und Audio-Gates

## Panelplan

| Panel | Zeit | Ort | Figuren | Funktion |
|---|---:|---|---|---|
| 001 | 4,5 s | Hausfassade | Ricco, Don Miau | Ankunft und erster wortloser Machtgag |
| 002 | 6,0 s | Flur | Ricco, Basti | „Kein Mietverhältnis, ein Prozess“ |
| 003 | 5,0 s | Flur | Ricco, Basti | Die solidarischen 780 Euro |
| 004 | 5,0 s | Riccos Zimmer | Ricco | Zimmer-Reveal und Enttäuschung |
| 005 | 6,0 s | Riccos Zimmer | Ricco | Telefonat mit Mutti |
| 006 | 5,5 s | Flur | Ricco, Basti | Widersprüchliche Hausregeln |
| 007 | 7,0 s | Gemeinschaftsküche | Ricco, Jule | Kühlschrank- und Hummuslogik |
| 008 | 6,5 s | Riccos Zimmer | Ricco, Don Miau | Abendlicher Schluss und wortloses Urteil |

Gesamt: **45,5 Sekunden**

## Verwendete Dialogzeilen

Alle gesprochenen Texte stammen aus den gesperrten Character-Bibles.

### Basti

- „Vermieter ist ein schwieriges Wort.“
- „Das ist kein Mietverhältnis, das ist ein Prozess.“
- „Die 780 sind eigentlich noch solidarisch gedacht.“
- „Ich halte nur den Raum.“

### Ricco

- „Das war so nicht abgemacht.“
- „Mama, das ist hier sehr kreativ.“
- „Ist das hier normal?“
- „Ich brauch nur WLAN und Ruhe.“

### Jule

- „Bitte reflektier mal deinen Kühlschrankanspruch.“
- „Eigentum an Hummus ist auch Eigentum.“

### Don Miau

Keine menschliche Stimme, keine Sprechblase und kein innerer Monolog.

## Bewegungsprinzip

Jedes Panel bleibt eine stabile Illustration. Bewegung entsteht sparsam durch:

- kontrollierten Push-in oder Seitenschub
- Augen- und Kopfbewegung
- Blinzeln
- kleine Requisitenbewegungen
- minimale Körperverlagerung
- kurze Reaktionspausen
- einen stillen Endhold

Keine freie Ganzkörperanimation und kein generatives Dauerwackeln. Bewegung soll den Gag und die Emotion lesbarer machen, nicht beweisen, dass irgendwo ein Slider existiert.

## Untertitel

- maximal zwei Zeilen
- maximal ungefähr 34 Zeichen pro Zeile
- mobile Safe Area im unteren Bildbereich
- keine Sprecherlabels
- Untertitel erst in der Assembly
- Dialogtexte niemals in das generierte Bild prompten

## Ton

### Wiederkehrende Räume

- Hausfassade: Berliner Straßenraum
- Flur: enge Raumakustik, Schlüssel, Türen und Papier
- Zimmer: dumpfer kleiner Raum, ferner Bass
- Küche: Kühlschrankbrummen, Geschirr und Klebeband

### Running-Gag-Sound

Bastis Schlüsselbund wird sparsam als Machtzeichen eingesetzt. Don Miau erhält keine menschliche Stimme; kleine natürliche Katzenlaute sind nur nach dramaturgischer Prüfung erlaubt.

## Aktuelle Gates

### Ohne Bilder möglich

- Dialog laut lesen
- Gesamtzeit prüfen
- Pausen prüfen
- Untertitellängen prüfen
- Sound-Cues prüfen

### Noch blockiert

- Panelbilder erzeugen
- Character- und Set-Kontinuität prüfen
- Animatic rendern
- finale Stimmen einsetzen
- M1 mit echten Canon-Assets wiederholen

## Definition of Done für den Blueprint

- exakt acht Panels
- Zielzeit zwischen 42 und 50 Sekunden
- alle Dialoge stammen aus gesperrten Bibles
- Don Miau bleibt stumm
- jeder Shot besitzt Ort, Figuren, Komposition, Bewegung, Ton und QA
- alle visuellen Abhängigkeiten sind sichtbar
- kein Panel wird als Finalbild oder Canon-Master bezeichnet

## Nächster Produktionsschritt

Solange der Bildgenerator belegt ist, darf nur ein neutraler Timing-Readthrough vorbereitet werden. Sobald der Generator verfügbar ist, beginnt die visuelle Arbeit ausschließlich mit Riccos Silhouette und Character Sheet. Erst nach Riccos Lock werden weitere Figuren erzeugt.
