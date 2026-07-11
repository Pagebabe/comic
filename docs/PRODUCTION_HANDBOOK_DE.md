# Comic Factory Produktionshandbuch

Status: `OPERATING MANUAL · LR5 CREATIVE GATES OPEN`

Dieses Handbuch beschreibt den vollständigen Weg von einer Serienidee bis zu einer geprüften Episode. Es ist so geschrieben, dass eine Person ohne Produktionswissen den Ablauf verstehen und bedienen kann.

Es verspricht keine automatische Qualität auf dem Niveau einer seit Jahrzehnten produzierten TV-Serie. Es baut die Voraussetzungen, mit denen eine wiederkehrende Serie stabil, lernfähig und weitgehend KI-gestützt produziert werden kann.

---

# 1. Das Produktionsprinzip

Eine stabile Serie entsteht nicht durch den besten Einzelprompt. Sie entsteht durch vier wiederholbare Ebenen:

1. **Identität:** Serienbibel, Figuren, Orte und Stimmen.
2. **Planung:** Episode Brief, Script, Shots und Timing.
3. **Produktion:** kontrollierte Asset- und Audioerstellung.
4. **Beweis:** Review, QA, Package, Hash und Freigabe.

Die Reihenfolge ist verbindlich. Wer direkt bei Bildgenerierung beginnt, spart am ersten Tag Zeit und verliert sie danach in jeder einzelnen Szene zurück.

## 1.1 Technischer Abschluss und kreative Freigabe

Diese Begriffe dürfen nie vermischt werden:

- `GENERATED`: Eine Datei wurde erzeugt.
- `TECHNICAL_PASS`: Format, Datei und Metadaten sind korrekt.
- `REVIEW_REQUIRED`: Ein Mensch muss sichtbar prüfen.
- `APPROVED`: Genau diese Version und dieser Hash sind freigegeben.
- `FINAL_EPISODE`: Showrunner und QA haben genau diesen Master freigegeben.

Ein Render kann technisch perfekt und kreativ falsch sein.

## 1.2 Die 80-Prozent-Automation

Automatisiert werden sollen:

- Entwürfe
- Varianten
- Vollständigkeitsprüfungen
- Shot- und Promptpakete
- Batchjobs
- Dateibenennung
- Metadaten
- Timing
- Untertitel
- technische QA
- Packaging
- Marketingvarianten
- Metrikaufbereitung

Menschlich bleiben:

- Serienidentität
- Canon
- Master-Auswahl
- Scriptfreigabe
- Rechte
- sensible Inhalte
- finale Episode

---

# 2. System und Werkzeuge

## 2.1 Hauptarbeitsplatz

Der zentrale Arbeitsplatz ist VS Code mit dem Repository:

```text
Pagebabe/comic
```

Das Studio läuft lokal über:

```bash
npm --prefix studio-app run dev
```

Route:

```text
http://localhost:3100/studio/#academy
```

## 2.2 Projektstandard auf M1 Pro 32 GB

Lokale Aufgaben:

- Dokumentation
- Story und Script
- Browser-Studio
- kleine und mittlere Bildtests
- Metadaten- und QA-Prüfung
- Audio- und Timingarbeit
- FFmpeg-Assembly
- Git, Tests und Packaging

Cloud/RunPod nur für:

- große Video-Modelle
- hochauflösende Batchgeneration
- Training größerer LoRAs
- Jobs, die lokal unvernünftig langsam oder speicherintensiv sind

## 2.3 Produktionswerkzeuge

### Planung und Organisation

- VS Code
- Git und GitHub
- Markdown-Vorlagen
- Comic Factory Studio

### Bild und Design

- ComfyUI als reproduzierbarer Generationsgraph
- Krita oder anderes Layer-Zeichenprogramm für Korrekturen
- optional Blender für Layout, Kameraanker und 2.5D

### Video und Assembly

- FFmpeg für deterministische Exporte
- optional DaVinci Resolve oder Blender für manuelle Feinarbeit
- I2V nur selektiv für kontrollierte Mikroanimationen

### Audio

- getrennte Dialogspuren
- Audioeditor
- Lautheitsmessung
- SRT als separate Datei

### Qualität

- Browser-Smoke mit Playwright
- ffprobe
- SHA-256
- Review Sheets
- Evidence Packets

---

# 3. Dateistruktur

Empfohlene Struktur pro Serie:

```text
series/<series-id>/
  bible/
    series-brief.md
    series-bible.md
    style-bible.md
    canon-log.md
  masters/
    characters/
      <character-id>/
        v001/
          card.md
          sources/
          turnaround/
          expressions/
          evidence/
    locations/
      <location-id>/
    voices/
      <voice-id>/
  episodes/
    ep001/
      brief/
      script/
      shots/
      prompts/
      assets/
      audio/
      subtitles/
      renders/
      qa/
      package/
  shared/
    props/
    sound/
    music-licenses/
  operations/
    backups/
    incidents/
    daily-logs/
```

## 3.1 Namenskonvention

```text
<series>_<episode>_<scene>_<shot>_<entity>_v###_<status>.<ext>
```

Beispiel:

```text
ricco_ep001_sc02_sh04_ricco_v003_candidate.png
```

Verboten:

```text
final.png
final2.png
wirklich-final-neu.png
```

Diese Namen sind keine Versionierung, sondern Hilferufe.

## 3.2 IDs

- Serie: `series_ricco_im_haus`
- Figur: `char_ricco`
- Ort: `loc_riccos_zimmer`
- Episode: `ep001`
- Szene: `sc003`
- Shot: `sh005`
- Dialog: `line_ep001_sc003_02`
- Prompt Package: `prompt_ep001_sc003_sh005_v002`

IDs ändern sich nicht durch neue Versionen.

---

# 4. Phase A · Serienentwicklung

## 4.1 Series Brief

Ziel: Die Serie in einem Satz erklären können.

Pflichtfragen:

- Wer ist die Hauptfigur?
- Was will sie dauerhaft?
- Was verhindert es dauerhaft?
- Welche Welt erzeugt neue Konflikte?
- Warum können dieselben Figuren wiederkehren?
- Für wen ist die Serie?
- Wie lang ist eine Episode?

Eine gute Prämisse erzeugt von selbst neue Episodenideen.

## 4.2 Serienmotor testen

Schreibe zwanzig mögliche Episodentitel ohne Details.

Wenn nach fünf Ideen Schluss ist, fehlt ein Serienmotor.

Beispiele für Motoren:

- Beruf mit ständig neuen Fällen
- Wohngemeinschaft mit festen Gegensätzen
- Familie mit wiederkehrenden Zielen
- Ort mit wechselnden Besuchern
- Figur mit dauerhaft falscher Selbstwahrnehmung

## 4.3 Series und Style Bible

Die Bibel beantwortet:

- Was ist immer wahr?
- Was darf sich entwickeln?
- Was darf nie passieren?
- Wie sieht die Welt aus?
- Wie bewegt sich die Kamera?
- Wie schnell ist der Schnitt?
- Wie sprechen die Figuren?
- Welche Themen brauchen besondere Vorsicht?

Jede wichtige Änderung erhält:

- Decision Record
- Grund
- betroffene Episoden
- neue Version
- Entscheider

---

# 5. Phase B · Master-Produktion

Master sind die wichtigste Investition. Sobald sie stabil sind, beschleunigt sich jede Episode.

## 5.1 Figurenmaster

Für jede Hauptfigur werden erzeugt:

- Front
- Profil
- Dreiviertel
- Rücken
- Ganzkörper
- Größenvergleich
- sechs bis zwölf Ausdrücke
- drei typische Posen
- Kleidung und Requisiten
- Farbreferenz

### Prüfregel

Die Figur muss in drei neuen, nicht im Masterset enthaltenen Szenen wiedererkennbar bleiben.

### KI-Workflow

1. Referenzen auswählen.
2. Quellenrechte prüfen.
3. Character Master Card ausfüllen.
4. kleine Kandidatenserie erzeugen.
5. beste Richtung auswählen.
6. Fehler gezielt korrigieren.
7. Wiederholungstest.
8. menschliche Freigabe für exakt einen Hash.
9. optional LoRA oder Adapter auf freigegebenem Material trainieren.

Nicht zuerst trainieren und danach hoffen, dass die Figur stimmt.

## 5.2 Location-Master

Jeder wiederkehrende Ort braucht:

- Grundriss
- Türen und Fenster
- feste Möbel
- wichtige Props
- drei Standardkameras
- Lichtzustände
- Größenreferenz mit Figuren

### Kontinuität

Ein Ort wird wie ein physisches Set behandelt. Türen teleportieren nicht, außer die Serienbibel erlaubt es ausdrücklich.

## 5.3 Voice-Master

Für jede Stimme:

- Tonhöhe
- Tempo
- Haltung
- Aussprache
- Emotionstests
- Lautheitsziel
- Rechte
- Testdatei-Hashes

### Freigabe

Eine Stimme wird nicht wegen einer guten Testzeile freigegeben. Sie muss in mehreren Emotionen dieselbe Figur bleiben.

---

# 6. Phase C · Episodenvorproduktion

## 6.1 Episode Brief

Eine Episode beginnt mit:

- Logline
- Konflikt
- emotionalem Weg
- sechs bis acht Beats
- Produktionsumfang
- benötigten Masters
- Rechterisiken

## 6.2 Beat Sheet

Jeder Beat braucht mindestens eine Funktion:

- Story
- Figur
- Gag
- Information
- emotionale Reaktion

Beats ohne Funktion werden entfernt.

## 6.3 Script

Script-Regeln:

- nur sichtbare oder hörbare Handlung
- kurze Szenen
- klare Reaktionen
- Dialogzeilen besitzen IDs
- jede Zeile besitzt Quelle und Status
- Timing wird gemessen

Dialogstatus vor Freigabe:

```text
sourceBoundCandidateLine
```

Nicht:

```text
lockedLine
```

Der Begriff „locked“ wird erst verwendet, wenn eine echte menschliche Scriptentscheidung vorliegt.

## 6.4 Readthrough

Dialog laut lesen.

Messen:

- Gesamtdauer
- Dauer pro Zeile
- zu hohe Zeichengeschwindigkeit
- fehlende Reaktionspausen
- unverständliche Übergänge

Eine Textzeile kann auf Papier kurz und gesprochen unerträglich lang sein. Die menschliche Stimme besitzt leider keine Token-Kompression.

## 6.5 Shot List

Pro Shot:

- Funktion
- Dauer
- Bildgröße
- Kamera
- Figur
- sichtbare Aktion
- Anfang und Ende
- Ton
- Untertitelzone
- Asset-Abhängigkeiten

## 6.6 Animatic

Das Animatic darf hässlich sein. Es muss verständlich sein.

Prüfen:

- Hook
- Storyfluss
- Blickrichtung
- Achsen
- Gag-Timing
- Reaktionspausen
- Gesamtdauer
- Untertitel

Erst nach funktionierendem Animatic beginnt teure Asset-Produktion.

---

# 7. Phase D · Asset-Produktion

## 7.1 Prompt Package

Jeder Generationsjob speichert:

- Ziel
- Storyfunktion
- freigegebene Master
- Modell und Version
- LoRA/Adapter
- Prompt
- Negativprompt
- Seed
- Referenzdateien und Hashes
- Auflösung
- Sampler und Steps
- Outputdateien
- Reviewentscheidung

## 7.2 Batchstrategie

Empfohlen:

1. ein Shot
2. drei bis sechs Varianten
3. Auswahl
4. Korrektur
5. Wiederholungstest
6. nächster Shot

Nicht empfohlen:

- ganze Episode blind rendern
- wechselnde Modelle ohne Dokumentation
- Seeds verlieren
- gute Ergebnisse aus dem Downloadordner zusammensuchen

## 7.3 Konsistenzwerkzeuge

Je nach Workflow:

- freigegebene Referenzbilder
- ControlNet für Pose und Komposition
- IP-Adapter oder vergleichbare Referenzführung
- LoRA nur auf geprüften Daten
- feste Promptbausteine
- feste Farbwerte
- Set-Layouts
- reproduzierbare Seeds

## 7.4 Animation

Stabile Strategie für Serienproduktion:

- wenige starke Keyframes
- kontrollierte Kamerabewegung
- Layer-/Parallaxbewegung
- Augen, Mund, Hände und kleine Körperbewegungen gezielt
- I2V nur dort, wo es zuverlässig bleibt
- harte Schnitte statt unnötiger Vollanimation

Die Serie braucht nicht in jeder Sekunde maximale Bewegung. Sie braucht kontrollierte, lesbare Bewegung.

## 7.5 Review-Queue

Jeder Take endet in:

- `APPROVED_FOR_SHOT`
- `CHANGES_REQUIRED`
- `REJECTED`
- `TECHNICAL_FAILURE`

Ein Modell darf keine eigene kreative Freigabe setzen.

---

# 8. Phase E · Audio und Postproduktion

## 8.1 Dialog

- pro Figur getrennte Spur
- Rohdatei archivieren
- Bearbeitung nicht destruktiv
- Aussprache prüfen
- keine Zeile automatisch ersetzen, wenn Script-Hash nicht passt

## 8.2 Sound Design

Reihenfolge:

1. Dialog
2. Raumton
3. notwendige Effekte
4. Reaktionssounds
5. Musik

Musik ist nicht dazu da, unverständliche Szenen emotional zu überreden.

## 8.3 Untertitel

- separate SRT
- maximal zwei Zeilen
- mobile Safe Area
- keine wichtigen Bilddetails verdecken
- Namen und Zahlen prüfen
- Untertitel nicht während Bildgenerierung einbrennen

## 8.4 Assembly

Deterministischer technischer Export bevorzugt:

- definierte Reihenfolge
- definierte Dauer
- definierte FPS
- definierte Audioquellen
- ffprobe-Report
- Hash

Manuelle Feinarbeit darf danach erfolgen, muss aber als neue Version dokumentiert werden.

---

# 9. Phase F · QA

## 9.1 Zweifache Prüfung

### Zuschauerprüfung

- Verstehe ich die Geschichte?
- Funktioniert der Witz?
- Bleibt Interesse?
- Sind Figuren sympathisch oder bewusst unsympathisch?

### Produktionsprüfung

- stimmen Dateien, IDs und Versionen?
- sind Figuren und Orte konsistent?
- sind Rechte belegt?
- sind Audio und Untertitel korrekt?
- ist der Export reproduzierbar?

## 9.2 Fehlerklassen

### Blocker

- falsche Figur
- Canon-Widerspruch
- Rechte ungeklärt
- Audio unverständlich
- kaputte Datei
- falsches Format
- Identitätsdrift

### Reparierbar vor Release

- kleine Timingkorrektur
- Untertitelposition
- einzelne Artefakte
- Pegelanpassung

### Dokumentierbar

- bewusste stilistische Abweichung
- bekannte kleine Limitierung ohne Wirkung auf Verständnis

## 9.3 EpisodePackage

Enthält mindestens:

- Episode-Metadaten
- Script-Version
- Master-Versionen
- Shot-Liste
- Asset-Manifest
- Audio-Manifest
- SRT
- Renderdatei
- QA-Bericht
- Rechtebelege
- Hashes
- Decision Records

---

# 10. Finale Freigabe

Die finale Freigabe bezieht sich immer auf:

- einen Dateipfad
- eine Version
- einen SHA-256-Hash
- einen QA-Bericht
- einen Entscheider
- einen Zeitpunkt

Exportieren ist nicht freigeben.

Eine Episode gilt erst als final, wenn:

- QA PASS
- Rechte PASS
- Showrunner APPROVED
- Archiv verifiziert
- Handoff akzeptiert

---

# 11. Serienbetrieb

## 11.1 Tagesroutine

Start:

1. aktives Gate lesen
2. Blocker prüfen
3. Branch und Git-Status prüfen
4. genau ein Produktionsziel wählen
5. benötigte Masters und Quellen prüfen

Ende:

1. Ergebnisse versionieren
2. Reviewstatus setzen
3. Tests ausführen
4. Logs und Evidence aktualisieren
5. Backup prüfen
6. nächste Aktion dokumentieren

## 11.2 Wochenroutine

- Episodenstatus
- Master-Drift
- offene Reviews
- fehlgeschlagene Jobs
- Produktionszeit
- wiederkehrende Fehler
- neue Learnings
- Growth-Signale im Shadow-Modus

## 11.3 Nach jeder Episode

- Was war teuer?
- Was war wiederverwendbar?
- Welcher Prompt wurde stabil?
- Welche Figur driftete?
- Welcher Ort verursachte Probleme?
- Welche Dialoge waren zu lang?
- Welche QA-Regel sollte automatisiert werden?

Learnings werden in Vorlagen und Regeln zurückgeführt.

---

# 12. Backup, Restore und Incident

## 12.1 Vor jedem großen Batch

- Git-Status sauber
- relevante Quellen gesichert
- Workflow exportiert
- Modellversion dokumentiert
- genug Speicher
- Outputpfad eindeutig

## 12.2 Restore-Test

Ein Backup ist erst bewiesen, wenn:

- Manifest vorhanden
- Hashes stimmen
- Dateien in neuer Umgebung lesbar
- EpisodePackage rekonstruierbar

## 12.3 Stop-Schalter

Produktion stoppen bei:

- Quellenverlust
- falschen Rechten
- Massendrift
- kaputtem Modell- oder Workflowstand
- unbekannten Dateimutationen
- falschem Canon
- nicht reproduzierbaren Outputs

Nicht weiterproduzieren, nur weil der GPU-Mietzähler läuft. Ein teurer Fehler bleibt ein Fehler, bloß mit Rechnungsbeleg.

---

# 13. Fehlerdiagnose

## Figur sieht jedes Mal anders aus

Prüfen:

- richtiger Master-Hash
- Referenzgewicht
- Modell/LoRA-Version
- Promptbaustein
- Seedstrategie
- Pose-/Control-Eingang
- zu hohe Denoise-Stärke

## Ort verändert Geometrie

Prüfen:

- Location-Master
- Kameraanker
- Grundriss
- Referenzbild
- Perspektivkontrolle
- neue Props im Prompt

## Video flackert

Prüfen:

- zu starke I2V-Bewegung
- fehlende Identitätsführung
- unstabile Hintergründe
- zu viele Frames ohne Keyframekontrolle
- besser kurze Takes oder 2.5D verwenden

## Dialog wirkt gehetzt

Prüfen:

- Characters per Second
- Satzlänge
- Reaktionspausen
- zu viele Informationen pro Beat
- Timing erst im Readthrough ändern, nicht nur schneller sprechen

## Untertitel sind schlecht lesbar

Prüfen:

- Zeilenlänge
- Safe Area
- Kontrast
- Timing
- mobile Vorschau

## Repository ist unklar

Stoppen.

- aktiven Branch prüfen
- `git status`
- offene PRs prüfen
- Truth State lesen
- keine Datei „zur Sicherheit“ überschreiben

---

# 14. Definition Produktionsreife

Der Workflow ist produktionsreif, wenn:

- Anfänger den Ablauf ohne Erfinderwissen bedienen können
- harte Gates nicht übersprungen werden
- Vorlagen vollständig sind
- Status gespeichert und exportiert wird
- Tests und Browser-Smoke grün sind
- Backups und Restore geprüft sind
- technische Transformationen reproduzierbar sind

Eine Serie ist produktionsreif, wenn zusätzlich:

- Character-Master freigegeben
- Location-Master freigegeben
- Voice-Master freigegeben
- Script- und Animaticprozess bewiesen
- mindestens eine echte Episode vollständig produziert und geprüft
- Zeit- und Kostenwerte bekannt

Das System kann also produktionsfähig sein, bevor die kreativen Masters fertig sind. Diese Trennung verhindert falsche Fertigmeldungen und zeigt exakt, was morgen als Nächstes zu tun ist.
