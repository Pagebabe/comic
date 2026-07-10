# Visual Preproduction Pack

Status: `PREPRODUCTION_READY · GENERATION_PAUSED`

Dieses Paket bereitet die spätere Bildproduktion vollständig vor, erzeugt aber selbst keine Bilder und setzt keine Masterreferenz. Der Bildgenerator ist aktuell belegt. Das ist ein Kapazitätszustand, kein Anlass für einen zweiten Stilpfad oder eine improvisierte Ersatzpipeline.

## Verbindliche Linie

1. Story und Text-Canon bleiben unverändert.
2. Es werden keine neuen Figuren und keine neue Pilotgeschichte entwickelt.
3. Ricco wird zuerst visuell erzeugt und geprüft.
4. Vor dem Ricco-Lock beginnt keine Batch-Produktion für Basti, Jule oder Don Miau.
5. Character- und Location-Sheets bleiben `image_pending`, bis echte Bilder visuell geprüft sind.
6. Kein Bild wird automatisch Canon.
7. Der vorhandene M1-Clip bleibt ausschließlich ein Technikbeweis.

Maschinenlesbare Quelle: [`project/visual-preproduction.json`](../project/visual-preproduction.json)

## Serienweite Bildregeln

- Dicke schwarze Konturen.
- Klare, wiederholbare Silhouetten.
- Überzeichnete Köpfe, Hände, Augenbrauen und Haltungen.
- Schmutzige Berliner Neutralfarben mit kontrollierten Neonakzenten.
- Ein klarer Gag und eine klare Emotion pro Shot.
- Keine Fotorealistik, kein Anime, kein glossy 3D und keine direkte Kopie einer existierenden Serie.
- Keine zufälligen Outfitwechsel.
- Kein lesbarer KI-Text, keine echten Logos und keine Sprechblasen in generierten Frames.
- Untertitel werden erst im kontrollierten Assembly-Schritt gesetzt.

## Character-Sheet-Standard

Jedes Character Sheet muss mindestens enthalten:

- Vorderansicht
- Dreiviertelansicht
- Profil
- Rückansicht
- schwarze Silhouette
- neutralen Stand
- vier bis sechs klar getrennte Expressions
- zwei bis vier charaktertypische Posen
- alle verbindlichen Requisiten
- einheitliche Kleidung und Proportionen

### Ricco, Produktionsreihenfolge 1

Sofort lesbar durch Kopfhörer, übergroßen Rucksack und leicht nach vorn gezogene Haltung. Sein Gesicht muss offen, ehrlich und leicht müde wirken. Er ist überfordert, aber nicht dumm. Der blaue Tupperware-Deckel bleibt ein kleiner Herkunftsanker und darf nicht zum albernen Hauptgag werden.

Pflicht-Expressions:

- neutral und offen
- überfordert
- nervöses halbes Lächeln
- ehrlich verärgert
- leise hoffnungsvoll
- müde nach dem Club

Stop-Regel: Keine weitere Kernfigur generieren, bevor Riccos Silhouette, Gesicht und Outfit in mehreren Ansichten konsistent funktionieren.

### Basti Prenzl, Produktionsreihenfolge 2

Basti ist freundlich, gepflegt und moralisch selbstzufrieden. Die Komik entsteht daraus, dass seine Manipulation nicht wie offene Bedrohung aussieht. KeepCup und Schlüsselbund sind Machtzeichen, keine beliebigen Accessoires.

Pflicht-Expressions:

- weiches Dauerlächeln
- pseudo-empathisch
- sanft belehrend
- kurz ertappt
- moralisch überlegen

### Jule, Produktionsreihenfolge 3

Jule ist kein Glamour- oder Aktivistinnen-Klischee. Ihr kritischer Blick, breiter Oversized-Oberkörper und sicherer Stand machen ihre Kontrollfunktion lesbar. Marker oder Klebeband sind funktionale Macht-Requisiten.

Pflicht-Expressions:

- kritischer Blick
- ruhig vorwurfsvoll
- moralisches Urteil
- kurz irritiert
- selbstzufrieden kontrolliert

### Don Miau, Produktionsreihenfolge 4

Don Miau bleibt anatomisch vollständig Katze. Er spricht niemals. Seine Autorität entsteht aus Masse, Ruhe, Position im Bild und sehr kleinen Bewegungen. Kein Maskottchen, keine Menschenkleidung, keine humanoide Mimik.

Pflichtzustände:

- halb geschlossene Augen, neutral
- wortloses Urteil
- leicht genervt
- territorial aufmerksam

## Location-Sheet-Standard

Jedes Pilotset benötigt:

- eine Establishing-Ansicht
- zwei reproduzierbare Kamerawinkel
- eine Detailansicht
- einen einfachen Grundriss oder Top-down-Plan
- feste Positionen für Türen, Fenster und Hauptmöbel
- definierte Tages- oder Lichtvarianten
- freie Untertitelzonen

### Haus Nr. 13 / Hausfassade

Muss als kaputte Berliner Altbaufassade sofort wiedererkennbar sein. Hausnummer 13, Eingang, Fensterachsen und beschädigte Details bleiben geometrisch stabil. Keine echten Straßen- oder Markennamen.

### Riccos Zimmer

Zu klein, beschädigt und provisorisch, aber nicht als Horrorraum. Tür, Fenster, Matratze und Don-Miau-Sitzplatz dürfen zwischen Ansichten nicht wandern. Das Schlussbild mit Ricco und Don Miau muss bereits im Layout möglich sein.

### Flur / Treppenhaus

Treppenrichtung, Türpositionen und Laufwege müssen stabil bleiben. Regelzettel dürfen als farbige Flächen vorhanden sein, aber keinen generierten lesbaren Text enthalten.

### Gemeinschaftsküche

Jule muss den Raum sichtbar dominieren können. Kühlschrank, Tisch, Arbeitsfläche und Tür bleiben zwischen Ansichten stabil. Farbige Zettel und Fächer sind erlaubt, echte Logos und lesbarer KI-Text nicht.

## Freigabeprozess

Jede visuelle Freigabe erfolgt in fünf Schritten:

1. **Silhouette:** Figur oder Set ist ohne Details wiedererkennbar.
2. **Kontinuität:** Ansichten widersprechen sich nicht.
3. **Canon:** Pflichtmerkmale und Verbote werden eingehalten.
4. **Produzierbarkeit:** Das Design lässt sich in Limited 2D oder Motion Comic wiederholen.
5. **Szenentest:** Das Asset funktioniert in mindestens einem echten Pilotshot.

Mögliche Review-Entscheidungen:

- `REJECTED`
- `REVISION_REQUIRED`
- `CANON_CANDIDATE`
- `MASTER_APPROVED`

Nur `MASTER_APPROVED` darf später in ein `masterReference`-Feld eingetragen werden. Bis dahin bleiben alle Masterreferenzen `null`.

## Generator-Wiederaufnahme

Wenn der Bildgenerator wieder verfügbar ist, wird ausschließlich diese Reihenfolge abgearbeitet:

1. Ricco Silhouettenvarianten
2. Ricco vollständiges Character Sheet
3. Ricco visuelle Abnahme
4. Basti Silhouettenvarianten und Sheet
5. Jule Silhouettenvarianten und Sheet
6. Don Miau Silhouette, Fellpalette und Sheet
7. Hausfassade
8. Riccos Zimmer
9. Flur
10. Gemeinschaftsküche

Kein paralleler Cast-Batch. Kein Stilwechsel. Keine Episode, bevor mindestens Ricco und das Zimmer als echte Masterreferenzen freigegeben sind.

## Aktueller Beweisstand

- Text-Bibles: 4/4 gesperrt
- Character-Visual-Briefs: 4/4 vorbereitet
- Location-Visual-Briefs: 4/4 vorbereitet
- vertrauenswürdige gerettete visuelle Master: 0
- freigegebene Character-Master: 0/4
- freigegebene Location-Master: 0/4
- Bildgenerierung: pausiert
- M1-Technikpipeline: bestanden
