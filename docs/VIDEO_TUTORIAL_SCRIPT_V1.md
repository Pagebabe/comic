# Comic Factory Videoanleitung V1

Status: `READY_TO_RECORD`  
Zielgruppe: Person ohne Comic-, Animations- oder Softwareerfahrung  
Gesamtlänge: etwa 22 Minuten  
Tracking: Issue #95

## Aufnahmeformat

- Bildschirmaufnahme 1920×1080
- Browser-Zoom 110 Prozent
- Maus sichtbar
- keine privaten Tabs, Tokens oder Benachrichtigungen
- ruhiges Sprechtempo
- Kapitelmarker einblenden
- keine Hintergrundmusik während wichtiger Bedienhinweise

## Kapitel 1 · Was dieses System ist · 00:00–01:40

### Bildschirm

Dashboard öffnen: `https://pagebabe.github.io/comic/`

### Sprechertext

„Willkommen bei Comic Factory. Dieses System führt eine Serie von der Idee über Figuren, Orte, Stimmen und Episoden bis zum geprüften Export. Es arbeitet mit klaren Freigabegates. Ein Ergebnis ist nicht deshalb final, weil es gut aussieht oder technisch erfolgreich erzeugt wurde. Kandidaten bleiben REVIEW_REQUIRED, bis ein Mensch sie ausdrücklich freigibt.“

### Einblendung

`Quelle ≠ Kandidat ≠ Master ≠ fertige Episode`

### Stop-Hinweis

„Aktuell ist das System noch nicht 10 von 10 produktionsreif. Die Readiness-Matrix zeigt zwei geschlossene, sechs teilweise erfüllte und zwei offene Gates.“

## Kapitel 2 · Status lesen · 01:40–03:20

### Mausaktionen

1. auf das aktive Gate zeigen
2. Masterzähler zeigen
3. Link zum Studio öffnen

### Sprechertext

„Oben sehen wir den aktuellen Stand. LR0 bis LR4 sind öffentlich bewiesen. LR5 ist aktiv. Das kreative Teilgate LR5.1 betrifft den ersten Ricco-Mastervertrag. Character-, Location- und Voice-Master stehen weiterhin auf null. Das ist kein Fehler, sondern die ehrliche Produktionsgrenze.“

### Einblendung

`Keine Prüfung → keine Freigabe → kein nächster kreativer Schritt`

## Kapitel 3 · Guided Mode starten · 03:20–04:40

### Mausaktionen

1. Studio öffnen
2. Navigation **Guided Mode** anklicken
3. Kapitelübersicht zeigen

### Sprechertext

„Der Guided Mode ist der Einstieg für neue Operatoren. Jedes Kapitel zeigt Ziel, Mausweg, erwartetes Ergebnis und Stop-Regel. Der Fortschritt wird nur lokal im Browser gespeichert. Er erteilt keine kreative Freigabe und startet keine externe Ausführung.“

### Sichtprüfung

- fünf Kapitel
- Fortschritt 0 von 5 beim ersten Start
- `NOT PRODUCTION READY`

## Kapitel 4 · Die fünf Pflichtbegriffe · 04:40–06:30

### Bildschirm

Guided Mode → Kapitel 1 → Begriffe

### Sprechertext

„Eine Quelle ist ein belegtes Dokument, eine Entscheidung oder ein freigegebenes Asset. Ein Kandidat ist noch nicht final und bleibt REVIEW_REQUIRED. Ein Master ist menschlich freigegeben, versioniert und mit Quelle und Hash gebunden. Ein Gate blockiert den nächsten Schritt. Die Beweiskette verbindet Quelle, Test, Artefakt, Laufbeweis, sichtbare Gegenprüfung und ehrlichen Status.“

### Übung

Testperson erklärt die fünf Begriffe mit eigenen Worten.

## Kapitel 5 · Lokaler Start · 06:30–08:40

### Mausaktionen

1. VS Code öffnen
2. **File → Open Folder…**
3. Ordner `comic` wählen
4. **Terminal → New Terminal**
5. Befehle einblenden

```bash
npm --prefix studio-app ci
npm --prefix studio-app run build
npm test
```

### Sprechertext

„Die Installation verwendet das Lockfile. Wenn ein Schritt rot wird, wird nicht geraten oder alles gleichzeitig umgebaut. Wir lesen den ersten echten Fehler, korrigieren nur den belegten Befund und führen die gesamte Kette erneut aus.“

### Stop-Hinweis

Kein Merge bei roten Tests oder unbekanntem Branch.

## Kapitel 6 · Ricco-Mastervertrag · 08:40–11:40

### Mausaktionen

1. Studio → **LR5.1 Ricco**
2. Quellen zeigen
3. Konflikte zeigen
4. Reviewtests zeigen
5. Kandidatenzähler zeigen

### Sprechertext

„Der aktuelle Ricco-Vertrag bindet sieben Quellen und dokumentiert fünf Konflikte. Er definiert Ansichten, Expressions, Posen und Ablehnungskriterien. Aktuell existiert kein Kandidat. Deshalb steht der Zähler auf null von eins und die Ausführung ist blockiert.“

### Einblendung

`CONTRACT_APPROVED_FOR_ONE_CANDIDATE`

### Sprechertext

„Erst diese ausdrückliche menschliche Entscheidung erlaubt genau einen Kandidaten. Sie genehmigt noch keinen Master. Das Ergebnis bleibt REVIEW_REQUIRED und erhält danach eine von drei Entscheidungen: APPROVED_MASTER, REVISION_REQUIRED oder REJECTED.“

### Stop-Hinweise

- kein Batch
- kein LoRA-Training
- kein zweiter Kandidat
- keine automatische Masterfreigabe

## Kapitel 7 · Episode verstehen · 11:40–14:40

### Mausaktionen

1. LR4 Das Zimmer öffnen
2. acht Panels zeigen
3. Dialog- und Timingstatus zeigen
4. Package-Schritte zeigen

### Sprechertext

„Eine Episode beginnt mit Brief, Script und Dialogreview. Danach folgen Shotliste, Storyboard und Assetbindung. Erst freigegebene Character-, Set- und Voice-Master dürfen in die echte Produktion. LR4 beweist den technischen Transport von acht Panels, aber keine Dialogqualität, kein finales Timing und keine visuellen Master.“

### Einblendung

`Brief → Script → Shots → Storyboard → Masterbindung → Produktion → Review`

## Kapitel 8 · Delete und Restore · 14:40–16:30

### Mausaktionen

1. LR3 Proof Loop öffnen
2. Package erzeugen
3. Zustand löschen
4. Restore ausführen
5. Hash-Match zeigen

### Sprechertext

„Das Package bleibt erhalten, während der Arbeitszustand vollständig gelöscht wird. Danach wird der Zustand wiederhergestellt. Nur ein identischer SHA-256-Hash gilt als bestanden. Das schützt vor stiller Datenabweichung und macht die Produktion nachvollziehbar.“

### Einblendung

`Nur HASH MATCH = PASS`

## Kapitel 9 · QA und Fehler · 16:30–18:50

### Bildschirm

Guided Mode → QA-Kapitel

### Sprechertext

„Technische QA prüft Format, Framerate, Codec, Audio, Untertitel und Dauer. Kreative QA prüft Figurenidentität, Sets, Continuity, Dialog, Timing und Lesbarkeit. Ein technischer Pass ersetzt keine kreative Freigabe.“

„Wenn ein Test fehlschlägt, notieren wir den exakten Testnamen. Wenn ein Provider ausfällt, stoppen wir den Job und schützen das Kostenlimit. Wenn ein Kandidat falsch aussieht, setzen wir REVISION_REQUIRED oder REJECTED. Fehler werden nicht durch neue Behauptungen repariert.“

## Kapitel 10 · Export und Übergabe · 18:50–20:20

### Bildschirm

Übergabecheckliste zeigen

### Sprechertext

„Ein vollständiges Übergabepaket enthält Mastervideo, Untertitel, EpisodePackage, Assetmanifest, Versionsmanifest, Reviewprotokoll, QA-Bericht, Hashes und bekannte Einschränkungen. Alle Dateien müssen aus derselben Version stammen.“

### Einblendung

`series_episode_asset_version_status.ext`

## Kapitel 11 · Growth OS bleibt getrennt · 20:20–21:00

### Sprechertext

„Die Marketinglinie ist aktuell nur SHADOW_RELEASE_READY. Live-Publishing, OAuth, Provider-Credentials und Scheduler bleiben getrennt, bis ein eigener Integrations-Smoke bestanden ist. Produktionsreife und Marketingreife sind zwei verschiedene Dinge, auch wenn beide gern dasselbe Dashboard benutzen würden.“

## Kapitel 12 · Anfänger-Abnahme · 21:00–22:00

### Mausaktionen

1. Guided Mode → Abnahme
2. zwölf Fragen zeigen
3. Fortschritt zurücksetzen zeigen

### Sprechertext

„Eine neue Person muss zwölf Fragen und den sicheren Übungslauf ohne undokumentierte Hilfe bestehen. Der beobachtete Lauf wird mit Commit, Umgebung, Dauer, benötigter Hilfe und Befunden dokumentiert. Erst danach darf das Onboarding-Gate geschlossen werden.“

### Schluss-Einblendung

`10/10 erst bei 10 × CLOSED_VERIFIED`

### Abschlusstext

„Der nächste kreative Schritt ist nicht eine komplette Episode, sondern die menschliche Prüfung des Ricco-Vertrags. Danach darf genau ein Kandidat entstehen. So wird aus schnellem Generieren eine wiederholbare Serienproduktion.“

## Aufnahme-Abnahme

Das Video ist bestanden, wenn:

- alle zwölf Kapitel enthalten sind
- Mauswege sichtbar sind
- keine privaten Daten erscheinen
- Readiness nicht als 10/10 dargestellt wird
- Ricco-Ausführung sichtbar blockiert bleibt
- Growth OS als getrennt erklärt wird
- Restore und Hash-Match gezeigt werden
- Untertitel vorhanden sind
- eine zweite Person das Video gegen Handbuch und Guided Mode prüft