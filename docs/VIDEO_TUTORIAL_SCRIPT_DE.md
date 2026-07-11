# Video-Tutorial · Comic Factory von null zur ersten Episode

Status: `RECORD_READY`

Zielgruppe: Personen ohne Vorkenntnisse in Serien-, Comic- oder KI-Produktion.

Geplante Länge: 28 bis 35 Minuten.

Format: Bildschirmaufnahme des Studios plus kurze Einblendungen aus VS Code, ComfyUI und dem Dateisystem.

## Aufnahmevorgaben

- Bildschirm: 1440 × 900 oder höher
- Browserzoom: 100 Prozent
- Mausbewegungen langsam
- jede wichtige Schaltfläche vor dem Klick kurz markieren
- keine echten Secrets, Tokens oder privaten Daten zeigen
- Beispielprojekt nur synthetisch oder freigegeben
- Kapitel als sichtbare Titelkarte einblenden
- Untertitel aus diesem Sprechertext erzeugen

---

## 00:00–01:20 · Was du am Ende kannst

### Bildschirm

- Titelkarte: `Comic Factory · Von null zur produzierbaren Episode`
- danach Studio-Startseite zeigen
- Navigation `Serie starten` markieren

### Sprechertext

Willkommen in der Comic Factory. In diesem Video lernst du nicht nur, ein einzelnes KI-Bild zu erzeugen. Du lernst den vollständigen Ablauf für eine wiederkehrende Serie mit stabilen Figuren, festen Orten, wiederverwendbaren Stimmen, geprüften Episoden und einer sauberen Beweiskette.

Das System unterstützt ungefähr achtzig Prozent der operativen Arbeit mit KI und Automation. Es erstellt Entwürfe, Varianten, Shotlisten, Promptpakete, Timing, Untertitel, technische Prüfungen, Renderpakete und später Marketingdaten. Der Mensch bleibt verantwortlich für Serienrichtung, Canon, Master-Auswahl, Rechte und die finale Episode.

Am Ende dieses Videos weißt du, wo du morgen beginnst, welche Reihenfolge verbindlich ist und warum ein schöner Render noch lange keine freigegebene Serienfigur ist.

### Einblendung

```text
KI: vorbereitet, erzeugt, prüft, verpackt
Mensch: entscheidet Identität, Rechte und finale Freigaben
```

---

## 01:20–03:00 · Das wichtigste Prinzip

### Bildschirm

- Academy öffnen
- die zwölf Stufen langsam von oben nach unten scrollen
- Human-Review-Markierungen zeigen

### Sprechertext

Eine stabile Serie entsteht in vier Ebenen. Erstens Identität: Serienbibel, Figuren, Orte und Stimmen. Zweitens Planung: Episode Brief, Script, Shots und Timing. Drittens Produktion: Bilder, Animation, Audio und Schnitt. Viertens Beweis: Review, Qualitätssicherung, EpisodePackage und finale Freigabe.

Die Reihenfolge darf nicht umgedreht werden. Wer direkt mit hundert Bildern anfängt, erzeugt hundert Varianten eines ungelösten Problems. Die Comic Factory öffnet deshalb immer nur den nächsten zulässigen Schritt.

Im Übungsmodus kannst du den gesamten Ablauf mit synthetischen Daten durchspielen. Im Echtmodus werden kreative Stufen niemals automatisch freigegeben. Sie landen bei Human Review.

### Kontrollfrage

> Was ist der Unterschied zwischen `TECHNICAL_PASS` und `APPROVED`?

Antwort nach kurzer Pause einblenden:

```text
TECHNICAL_PASS = Datei und Format korrekt
APPROVED = Mensch hat exakt diese Version und diesen Hash freigegeben
```

---

## 03:00–04:30 · Studio starten

### Bildschirm

- VS Code öffnen
- Repository-Ordner zeigen
- Terminal öffnen
- Befehle eingeben

### Sprechertext

Öffne das Repository Pagebabe slash comic in VS Code. Im Terminal installierst du zuerst die Abhängigkeiten. Das ist nur beim ersten Mal oder nach größeren Änderungen nötig.

### Terminaleinblendung

```bash
npm install
npm --prefix studio-app install
npm --prefix studio-app run dev
```

### Sprechertext

Öffne danach im Browser localhost Port 3100, Studio, Raute Academy.

### Einblendung

```text
http://localhost:3100/studio/#academy
```

### Sprechertext

Wähle für den ersten Tag Übungsmodus und Anfänger. Dein Fortschritt wird lokal im Browser gespeichert. Mit Fortschritt exportieren erzeugst du zusätzlich eine JSON-Datei für Übergabe oder Backup.

---

## 04:30–06:30 · Stufe 1: Series Brief

### Bildschirm

- Stufe 1 öffnen
- Vorlage anklicken
- SERIES_BRIEF.md in VS Code zeigen

### Sprechertext

Der Series Brief beantwortet die Frage, warum deine Serie mehr als eine Episode tragen kann. Schreibe eine Ein-Satz-Prämisse. Sie enthält Hauptfigur, wiederholbaren Konflikt und Welt.

Ein Beispiel: Ein gutgläubiger junger DJ zieht in ein chaotisches Berliner Haus und versucht jede Woche, zwischen absurden Mitbewohnern, Clubträumen und Alltag halbwegs würdevoll zu bleiben.

Danach definierst du Zielgruppe, Episodenlänge, Format, Humor und Grenzen. Eine brauchbare Prämisse sollte mindestens zwanzig mögliche Episodentitel erzeugen. Schaffst du nur drei, fehlt wahrscheinlich der Serienmotor.

### Bildschirmaktion

- Notizfeld im Wizard ausfüllen
- `Trainingsstufe abschließen` klicken
- zeigen, dass Stufe 2 geöffnet wird

---

## 06:30–08:30 · Stufe 2: Series- und Style-Bibel

### Bildschirm

- Series Bible Vorlage zeigen
- Do/Don't-Bereich markieren

### Sprechertext

Die Bibel schützt die Identität deiner Serie. Sie legt Weltregeln, Ton, Humor, Formensprache, Farben, Kamera, Schnitt und Tabus fest.

Schreibe nicht nur, was du möchtest. Schreibe auch, was nie passieren darf. Diese Don't-Liste ist später für KI-Systeme besonders wichtig. Modelle sind sehr kreativ, vor allem dann, wenn niemand diese Kreativität bestellt hat.

Im Echtmodus bleibt diese Stufe bei Human Review. Showrunner und Art Director müssen dieselbe Version prüfen.

### Einblendung

```text
Do: klare Silhouetten, warme Absurdität, kontrollierte Kamera
Don't: Stilkopie, ungeprüfte Logos, wechselnde Proportionen, automatische Canonänderung
```

---

## 08:30–11:30 · Stufen 3 bis 5: Figuren, Orte und Stimmen

### Bildschirm

- Character Master Card
- Location Master Card
- Voice Master Card nacheinander zeigen
- Pflichtansichten und Checkboxen markieren

### Sprechertext

Jetzt kommen die drei wichtigsten Master-Gates.

Eine Figur braucht Front, Profil, Dreiviertel, Rücken, Ganzkörper, Größenvergleich und mehrere Gesichtsausdrücke. Danach wird sie in mindestens drei neuen Szenen getestet. Erst wenn sie dort stabil bleibt, kann genau ein Master-Hash freigegeben werden.

Ein Ort braucht Grundriss, feste Türen und Fenster, wichtige Requisiten und drei Standardkameras. So bleibt die Raumgeometrie zwischen den Shots stabil.

Eine Stimme braucht Tonhöhe, Tempo, Haltung, Aussprache, Emotionstests, Rechte und technische Messwerte. Eine gute Testzeile reicht nicht. Die Stimme muss in mehreren Emotionen dieselbe Figur bleiben.

### Einblendung

```text
Keine Massenproduktion vor einem freigegebenen Master.
```

### Sprechertext

Für dein aktuelles Pilotprojekt Das Zimmer sind genau diese Gates noch offen. Das ist kein Fehler. Das System zeigt ehrlich, was fehlt.

---

## 11:30–14:00 · Stufen 6 und 7: Episode Brief und Script

### Bildschirm

- Episode Brief mit sechs Beats zeigen
- Script Sheet und Dialogtabelle zeigen
- sourceBoundCandidateLine markieren

### Sprechertext

Eine Episode beginnt mit einem klaren Konflikt und sechs bis acht Beats. Hook, Setup, Problem, Eskalation, Wendepunkt und Payoff.

Jeder Beat braucht eine Funktion. Er bewegt Geschichte, Figur, Gag oder Information. Wenn er nichts davon tut, kostet er nur Zeit.

Im Script schreibst du nur sichtbare oder hörbare Handlung. Jede Dialogzeile bekommt eine Line-ID, Quelle und Status.

Vor der menschlichen Freigabe heißt die Quelle source bound candidate line. Nicht locked line. Der Begriff locked ist erst erlaubt, wenn ein Mensch diese Scriptversion wirklich beschlossen hat.

Lies das Script laut vor. Miss die Zeit. Markiere gehetzte Stellen, fehlende Reaktionspausen und Gags, die nur auf Papier funktionieren.

---

## 14:00–16:30 · Stufe 8: Shot List und Animatic

### Bildschirm

- Shot Sheet zeigen
- vorhandene Das-Zimmer-Blueprint-Datei öffnen
- Timingexport im Terminal ausführen

### Terminal

```bash
npm run export:ep001-timing
```

### Sprechertext

Pro Shot dokumentierst du Dauer, Ort, Figuren, Bildgröße, Kamera, sichtbare Aktion, Dialog, Ton und Asset-Abhängigkeiten.

Danach baust du ein technisches Animatic. Es darf hässlich sein. Es muss verständlich sein. Wenn Story oder Gag im Animatic nicht funktionieren, werden sie durch teure Bilder selten besser.

Der Timingexport erzeugt einen SRT-Entwurf und einen Bericht über Dauer, Sprechzeit und Zeichengeschwindigkeit.

### Bildschirm

- Output-Dateien zeigen

```text
output/ep001-readthrough/ep001-timing-draft.srt
output/ep001-readthrough/ep001-timing-report.json
```

---

## 16:30–19:30 · Stufe 9: Assetproduktion mit KI

### Bildschirm

- Prompt Package zeigen
- beispielhaft ComfyUI öffnen
- Workflow-Knoten nur als Übersicht zeigen

### Sprechertext

Jeder KI-Job beginnt mit einem Prompt Package. Darin stehen Ziel, Storyfunktion, freigegebene Master, Modell, Workflow, LoRA oder Adapter, Prompt, Negativprompt, Seed, Referenzen, Auflösung und Reviewstatus.

Arbeite Shot für Shot. Erzeuge wenige kontrollierte Varianten. Wähle, korrigiere und dokumentiere. Ein schönes Bild ohne Prompt, Seed und Quelle ist nicht wiederverwendbar.

Auf dem M1 Pro erledigst du Planung, Tests, kleinere Bildjobs, Audio, Assembly und QA lokal. Große Videojobs oder hochauflösende Batches dürfen auf RunPod laufen. Cloud ist Worker, nicht Wahrheitsquelle.

Für stabile Serienanimation empfiehlt sich eine Mischung aus starken Keyframes, kontrollierter Kamerabewegung, Layer- oder Parallaxanimation und selektiver Image-to-Video-Bewegung. Nicht jeder Frame muss neu erfunden werden.

### Einblendung

```text
Stabilität vor Bewegung.
Reproduzierbarkeit vor Menge.
Review vor Batch.
```

---

## 19:30–21:30 · Stufe 10: Audio, Musik und Untertitel

### Bildschirm

- Audio-Checkliste zeigen
- getrennte Spuren als schematische Grafik einblenden

### Sprechertext

Bearbeite Audio in dieser Reihenfolge: Dialog, Raumton, Effekte, Reaktionssounds und erst dann Musik.

Dialogspuren bleiben getrennt. Rechte und Quellen werden dokumentiert. Untertitel werden als eigene SRT-Datei erzeugt und nicht während der Bildgenerierung eingebrannt.

Prüfe die Episode mit Kopfhörern, Handy-Lautsprecher und kleinen Boxen. Eine Mischung, die nur auf Studiokopfhörern funktioniert, ist für mobile Serien ungefähr so hilfreich wie eine Wegbeschreibung in Latein.

---

## 21:30–24:00 · Stufe 11: QA und EpisodePackage

### Bildschirm

- Episode-QA-Checkliste zeigen
- Zuschauerprüfung und Produktionsprüfung markieren

### Sprechertext

Prüfe jede Episode zweimal.

Bei der Zuschauerprüfung fragst du: Verstehe ich die Geschichte? Funktioniert der Witz? Bleibt mein Interesse? Fühlen sich Figuren konsistent an?

Bei der Produktionsprüfung kontrollierst du Dateien, IDs, Versionen, Canon, Figuren, Orte, Audio, Untertitel, Rechte, Modelle, Seeds und Hashes.

Das EpisodePackage sammelt Scriptversion, Masterversionen, Shotliste, Assetmanifest, Audio, SRT, Render, QA, Rechte und Entscheidungen.

Nur was reproduzierbar und sichtbar geprüft ist, darf weiter.

---

## 24:00–25:30 · Stufe 12: Finale Freigabe

### Bildschirm

- Production Handoff zeigen
- Felder Datei, Version, Hash, QA und Entscheider markieren

### Sprechertext

Exportieren ist nicht Freigeben. Eine Episode wird erst final, wenn Showrunner und QA genau dieselbe Datei und denselben SHA-256-Hash freigeben.

Die Übergabe enthält Master, SRT, EpisodePackage, Assetmanifest, Audio-Stems, Evidence Packet und Archivpaket.

Wenn eine Datei nach der Prüfung verändert wird, entsteht eine neue Version und eine neue Prüfung.

---

## 25:30–27:30 · Wie die 80-Prozent-Maschine arbeitet

### Bildschirm

- Tabelle aus AUTOMATION_80_PERCENT_MODEL.md zeigen
- KI- und Mensch-Spalten hervorheben

### Sprechertext

Nach stabilen Masters übernimmt die Maschine den Großteil der operativen Arbeit. Sie plant Jobs, erzeugt Varianten, sortiert technische Fehler, berechnet Timing, baut Untertitel, rendert Kandidaten, verpackt Ergebnisse und bereitet Marketing und Analysen vor.

Der Mensch kontrolliert die wenigen Entscheidungen mit großer Wirkung: Identität, Master, Script, Rechte und finale Episode.

Mit jeder produzierten Episode lernt das System. Wiederkehrende Fehler werden zu neuen Prüfregeln. Stabile Prompts und Workflows werden wiederverwendet. Produktionszeit und Kosten werden messbar.

Das ist der Weg zu einer fast automatischen Serienmaschine. Nicht ein einzelner Superprompt, sondern ein kontrollierter Kreislauf.

---

## 27:30–29:30 · Dein erster Arbeitstag

### Bildschirm

- Day-One-Plan im Studio zeigen
- Uhrzeiten langsam durchgehen

### Sprechertext

Morgen um neun öffnest du das Studio und startest den Übungsmodus. Um halb zehn füllst du den Series Brief aus. Um halb elf die kleine Bibel. Vor der Mittagspause prüfst du einen Figurenmaster. Nachmittags erstellst du Episode Brief, Script, Shot Sheet, Timingexport und Prompt Package. Zum Schluss führst du QA aus und exportierst deinen Fortschritt.

Am Ende des ersten Tages hast du noch keine fertige Episode. Du hast etwas Wertvolleres: einen verstandenen und überprüfbaren Produktionsprozess, der nicht beim zweiten Projekt zusammenbricht.

---

## 29:30–30:30 · Abschluss und nächste Aktion

### Bildschirm

- Academy auf Stufe Character Masters
- aktuelles Projekt Das Zimmer und 0/4, 0/4, 0/3 zeigen

### Sprechertext

Die nächste echte Produktionsaktion ist genau ein Ricco-Master-Kandidat. Source-bound, versioniert, mit Pflichtansichten und Wiederholungstest. Danach erfolgt die menschliche Entscheidung.

Nicht zehn Figuren gleichzeitig. Nicht die ganze Episode. Genau ein Master und eine saubere Beweiskette.

Wenn dieser Schritt funktioniert, beginnt die Maschine wirklich schneller zu werden.

### Schlusskarte

```text
Nächster Schritt:
1 Ricco-Master-Kandidat
1 Review Sheet
1 menschliche Entscheidung
```

---

# Übungsfragen nach dem Video

1. Warum ist ein technischer PASS keine kreative Freigabe?
2. Welche drei Mastertypen müssen vor Episodenproduktion stabil sein?
3. Warum wird zuerst ein Animatic gebaut?
4. Welche Daten gehören in ein Prompt Package?
5. Welche fünf Entscheidungen bleiben menschlich?
6. Wann darf der Begriff `lockedLine` verwendet werden?
7. Was ist die nächste echte Aktion für Das Zimmer?

# Richtige Antworten

1. Technik prüft Datei und Vertrag, nicht Stil, Canon oder Verantwortung.
2. Character-, Location- und Voice-Master.
3. Story, Timing und Gags werden billig geprüft, bevor teure Assets entstehen.
4. Ziel, Storyfunktion, Master, Modell, Workflow, Prompt, Seed, Referenzen, Auflösung, Outputs und Review.
5. Identität/Canon, Master, Script, Rechte/sensible Inhalte und finale Episode.
6. Erst nach einer ausdrücklichen menschlichen Scriptentscheidung.
7. Genau einen source-bound Ricco-Master-Kandidaten erzeugen und sichtbar prüfen.
