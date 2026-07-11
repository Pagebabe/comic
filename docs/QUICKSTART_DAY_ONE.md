# Comic Factory · Morgen-Start für Anfänger

Ziel: Bis zum Tagesende einen vollständigen **technischen Übungsdurchlauf** erzeugen und genau wissen, welche kreativen Master für die erste echte Episode fehlen.

Wichtig: Der erste Tag produziert noch keine freigegebene Serienepisode. Er produziert einen verständlichen, speicherbaren und prüfbaren Ablauf. Wer das überspringt, produziert später hauptsächlich Dateichaos mit wechselnden Gesichtern.

## Vor dem Start

Benötigt:

- MacBook Pro M1 Pro mit 32 GB RAM
- VS Code
- Git
- Node.js 20 oder neuer
- Python 3
- FFmpeg
- Browser mit Chromium
- ComfyUI für Bild-/Video-Experimente
- optional RunPod für schwere Modelle und längere Videojobs

Projektordner:

```text
Pagebabe/comic
```

Arbeitsbranch für Änderungen:

```text
lr5/zero-to-episode-production-academy
```

## 09:00 · System öffnen

1. Repository in VS Code öffnen.
2. Terminal im Repository öffnen.
3. Abhängigkeiten installieren:

```bash
npm install
npm --prefix studio-app install
```

4. Studio starten:

```bash
npm --prefix studio-app run dev
```

5. Im Browser öffnen:

```text
http://localhost:3100/studio/#academy
```

6. `Übungsmodus` und `Anfänger` auswählen.

Ergebnis: Die zwölf Produktionsstufen sind sichtbar. Nur die erste Stufe ist offen.

## 09:30 · Series Brief

Vorlage öffnen:

```text
docs/templates/SERIES_BRIEF.md
```

Ausfüllen:

- Arbeitstitel
- Ein-Satz-Prämisse
- Hauptfigur
- wiederholbarer Konflikt
- Zielgruppe
- Format und Länge
- Humorart
- Grenzen

Minimalbeispiel:

```text
Ein gutgläubiger junger DJ zieht in ein chaotisches Berliner Haus und versucht jede Woche, zwischen absurden Mitbewohnern, Clubträumen und Alltag halbwegs würdevoll zu bleiben.
```

Prüffrage:

> Kann jemand nach einem Satz erklären, warum daraus viele Episoden entstehen können?

Danach im Wizard `Trainingsstufe abschließen` drücken.

## 10:30 · Serien- und Style-Bibel

Vorlage:

```text
docs/templates/SERIES_BIBLE.md
```

Festlegen:

- Weltregeln
- Ton und Humor
- Formensprache
- Farben
- Kamerastil
- Schnittgeschwindigkeit
- Untertitelstil
- Do/Don't
- verbotene Canon-Abkürzungen

Für eine wiederkehrende Serie sind diese Regeln wichtiger als ein einzelner schöner Prompt.

## 11:30 · Einen Figurenmaster verstehen

Vorlage:

```text
docs/templates/CHARACTER_MASTER_CARD.md
```

Noch keine Massenproduktion starten.

Für eine einzige Testfigur prüfen:

- Front
- Profil
- Dreiviertel
- Rücken
- Ganzkörper
- sechs Gesichtsausdrücke
- stabile Farben
- stabile Proportionen
- Wiederholung in drei neuen Szenen

Im Übungsmodus darf diese Stufe als `TRAINING ONLY` markiert werden. In echter Produktion bleibt sie `HUMAN REVIEW`, bis exakt ein Master-Hash freigegeben ist.

## 12:30 · Pause und Projektlog

Notieren:

- Was ist klar?
- Welche Begriffe sind unklar?
- Welche Datei fehlt?
- Was blockiert die echte Produktion?

Der Fortschritt wird im Browser lokal gespeichert. Zusätzlich `Fortschritt exportieren` verwenden.

## 13:00 · Episode Brief

Vorlage:

```text
docs/templates/EPISODE_BRIEF.md
```

Eine kurze Übungsepisode mit sechs Beats planen:

1. Hook
2. Setup
3. Problem
4. Eskalation
5. Wendepunkt
6. Payoff

Jeder Beat braucht eine sichtbare Funktion.

## 14:00 · Script und Readthrough

Vorlage:

```text
docs/templates/BEAT_AND_SCRIPT_SHEET.md
```

Regeln:

- nur sichtbare oder hörbare Handlung schreiben
- jede Dialogzeile bekommt eine Line-ID
- Quelle als `sourceBoundCandidateLine`
- alle Zeilen bleiben `REVIEW_REQUIRED`
- laut vorlesen und Zeit messen

Nicht versuchen, schlechte Dialoge mit schnellerem Schnitt zu verstecken. Das ist nur schlechte Dialogführung mit zusätzlichem Stress.

## 15:00 · Shot Sheet und technisches Animatic

Vorlage:

```text
docs/templates/SCENE_SHOT_SHEET.md
```

Pro Shot eintragen:

- Dauer
- Ort
- Figuren
- Bildgröße
- Kamera
- sichtbare Aktion
- Dialog und Ton
- Asset-Abhängigkeiten

Danach vorhandenen Timing-Export testen:

```bash
npm run export:ep001-timing
```

Ergebnis:

```text
output/ep001-readthrough/ep001-timing-draft.srt
output/ep001-readthrough/ep001-timing-report.json
```

## 16:00 · Technische Produktion simulieren

Prompt Package öffnen:

```text
docs/templates/PROMPT_PACKAGE.md
```

Für einen Shot dokumentieren:

- Modell
- Workflow
- Prompt
- Negativprompt
- Seed
- Referenzdateien
- Quellen-Hashes
- Auflösung
- Review-Ergebnis

Noch kein ungeprüfter Batch. Ein reproduzierbarer Take ist wertvoller als fünfzig namenlose PNGs.

## 16:30 · QA und Übergabe

Vorlagen:

```text
docs/templates/AUDIO_POST_CHECKLIST.md
docs/templates/EPISODE_QA_CHECKLIST.md
docs/templates/PRODUCTION_HANDOFF.md
```

Prüfen:

- Story verständlich
- Canon nicht verletzt
- technische Spezifikation korrekt
- Quellen und Modelle dokumentiert
- Untertitel lesbar
- keine automatische kreative Freigabe
- Fortschritt exportiert

## 17:00 · Tagesabschluss

Ausführen:

```bash
npm test
npm run build:studio
```

Im Studio:

- Fortschritt exportieren
- Blocker in der aktiven Stufe notieren
- nächste menschliche Entscheidung benennen

Erwartetes Tagesergebnis:

```text
Series Brief                     vorhanden
kleine Series/Style Bible        vorhanden
Character-Master-Prüfung         verstanden
Episode Brief                    vorhanden
Script- und Shot-Kandidaten      vorhanden
Timing-/SRT-Export               getestet
Prompt Package                   ausgefüllt
QA-/Handoff-Struktur             verstanden
echte kreative Freigaben         0 oder ausdrücklich dokumentiert
```

## Ab Tag zwei

Die echte Reihenfolge lautet:

1. genau einen Character-Master fertigstellen
2. Wiederholungstest bestehen
3. menschlich freigeben
4. danach weitere Figuren
5. Location-Master
6. Voice-Master
7. Script und Animatic
8. Szenenassets
9. Audio und Post
10. QA und finale Episode

Die Maschine wird mit jedem freigegebenen Master schneller. Vorher würde Automation nur Inkonsistenz vervielfachen.
