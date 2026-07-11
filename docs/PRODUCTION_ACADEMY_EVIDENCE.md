# Evidence Packet · LR5/6 Production Academy

Status: `PROVEN_GUIDED_TRAINING_READY · NOVICE_ACCEPTANCE_OPEN · NOT_PRODUCTION_READY`

Tracking: Issue #94  
Operator-Readiness: Issue #95  
Kreatives Gate: Issue #88

## Behauptung

Die Production Academy implementiert einen geführten Zero-to-Episode-Modus mit zwölf gesperrten Produktionsstufen, Training/Echtmodus, lokalem Resume-Status, Fortschrittsexport, Rollen, Tagesplan, Vorlagen, Handbuch und Video-Drehbuch.

Technisch bewiesen sind Bedienbarkeit, Reihenfolge, Human-Gates, Resume und Desktop/Mobil. Nicht bewiesen sind ein beobachteter Nullwissen-Lauf, reale Master, eine vollständige Episode oder Produktionsreife.

## Quelle

- `project/production-academy.json`
- `project/production-academy-status.json`
- `project/production-readiness-v1.json`
- `project/novice-acceptance-template.json`
- `docs/PRODUCTION_HANDBOOK_DE.md`
- `docs/VIDEO_TUTORIAL_SCRIPT_DE.md`
- `docs/NOVICE_ACCEPTANCE_PROTOCOL.md`
- LR5.1 Ricco-Vertrag

## Technischer Grundbeweis

GitHub Actions Run `29157416433` bestand auf Head `6b380f574c3d390987d7f0eac72ce3778f5c64ec`:

- Evidence-Preflight
- 62 Node-Vertrags- und Regressionstests
- 8 Python-Recovery-Tests
- LR3-, LR4- und LR5.1-Verträge
- Production-Academy-Contract-Checker
- TypeScript-/Vite-Build
- Desktop- und Mobil-Browser-Smoke
- Pages-Artefaktprüfung
- Timing- und SRT-Export
- read-only Asset Scanner
- technischer M1-Render

## Geprüfte Academy-Invarianten

- exakt zwölf Stufen
- nur Stufe 1 darf technisch automatisch abgeschlossen werden
- kreative Gates bleiben menschlich
- Training bleibt `TRAINING ONLY`
- Produktionsmodus setzt Human-Gates auf `HUMAN REVIEW`
- Folgestufen können nicht übersprungen werden
- Fortschritt und Notizen überleben Reload
- Desktop und Mobil besitzen keinen horizontalen Overflow
- Ricco-Ausführungssperren bleiben erhalten
- automatische kreative Freigabe bleibt false
- automatische Episodenfreigabe bleibt false

## Readiness-Matrix

Aktueller Stand:

`2/10 CLOSED_VERIFIED · 7 PARTIAL · 1 OPEN`

Geschlossen:

- PR3 Canon- und Freigabegrenzen
- PR7 Backup, Delete und Restore

Teilweise:

- Installation
- Onboarding
- Character-, Set- und Voice-Workflow
- Episodenworkflow
- QA
- Fehlerdiagnose und Recovery
- Export und Übergabe

Offen:

- PR10 vollständiger beobachteter Nullwissen-Abnahmelauf

## Nullwissen-Abnahme

Die Vorlage liegt unter `project/novice-acceptance-template.json`. Das Protokoll liegt unter `docs/NOVICE_ACCEPTANCE_PROTOCOL.md`.

Erforderlich sind 12/12 Aufgaben ohne undokumentierte Hilfe, ein exakter getesteter Commit, dokumentierte Umgebung, Beobachter, Dauer, Befunde, Korrekturen und eine zweite Gegenprüfung.

Automatisierte Browser-Smokes können diesen menschlichen Lauf nicht ersetzen.

## Sichtprüfung

Der Academy-Grundbeweis prüfte:

- zwölf sichtbare Stufen
- elf anfänglich gesperrte Folgestufen
- Fortschritt 0/12
- Training und Echtmodus
- Anfänger- und Profi-Erklärung
- Pflicht-Ergebnisse und Werkzeuge
- Rollen und Stop-Regeln
- Resume nach Reload
- keine kreative Freigabe
- keinen horizontalen Overflow

Die Readiness-Erweiterung prüft zusätzlich:

- zehn sichtbare Readiness-Gates
- Score 2 geschlossen, 7 teilweise, 1 offen
- zwölf sichtbare Anfängeraufgaben
- Production Ready nein
- Beginner Ready noch nicht
- Bildgenerierung gesperrt
- Growth OS getrennt
- Training verändert den Readiness-Score nicht

## Aktueller Status

`PROVEN_GUIDED_TRAINING_READY_NOVICE_ACCEPTANCE_OPEN`

Die Academy ist technisch als geführte Trainings- und Produktionsoberfläche bewiesen. Sie darf nicht als `Beginner Ready` oder `Production Ready` bezeichnet werden, solange kein beobachteter Nullwissen-Lauf und keine vollständige geprüfte Episode existieren.

## Nicht behauptet

- kein beobachteter Anfänger-Lauf wurde bestanden
- keine Character-Master sind freigegeben
- keine Location-Master sind freigegeben
- keine Stimmen sind freigegeben
- kein Ricco-Kandidat wurde erzeugt
- kein Script oder Dialog wurde automatisch finalisiert
- keine vollständige Episode wurde produziert
- keine Qualitätsgleichheit mit einer etablierten TV-Serie ist bewiesen
- keine Live-Veröffentlichung ist aktiviert
- Growth OS wurde nicht integriert
- 10/10 ist nicht erreicht

## Pflichtbestätigungen

- [x] Scope auf `Pagebabe/comic` begrenzt
- [x] Canon und autorisierende Quelle geprüft
- [x] Regressionstest dokumentiert
- [x] Keine unbelegte Visual-, Voice-, Canon- oder Finalfreigabe
- [x] Nicht behauptete Ergebnisse ausdrücklich benannt
- [x] Sichtprüfung oder verbindlicher Prüfplan vorhanden
