# Evidence Packet · LR5/6 Production Academy

Status: `PROVEN_GUIDED_TRAINING_READY · NOVICE_ACCEPTANCE_OPEN · NOT_PRODUCTION_READY`

Tracking: Issue #94  
Operator-Readiness: Issue #95

Branch: `lr5/zero-to-episode-production-academy-v2`  
Base: `main@0eed25ef7ac47c355fb36dfad61f646086f68532`  
Proven head: `6b380f574c3d390987d7f0eac72ce3778f5c64ec`

## Behauptung

Die Production Academy implementiert einen geführten Zero-to-Episode-Modus mit zwölf gesperrten Produktionsstufen, Training/Echtmodus, lokalem Resume-Status, Fortschrittsexport, Rollen, Tagesplan, Vorlagen, Handbuch, Video-Drehbuch und einem kontrollierten Automationsmodell.

Technisch bewiesen sind Bedienbarkeit, Gates, Training/Echtmodus, lokaler Resume-Status, Desktop/Mobil und die unveränderten kreativen Sperren. Nicht bewiesen sind ein beobachteter Nullwissen-Lauf, reale Master, eine vollständige Episode oder Produktionsreife.

## Quelle

- Issue #94
- Issue #95
- Issue #88
- `project/production-academy.json`
- `project/production-academy-status.json`
- `project/production-readiness-v1.json`
- `project/novice-acceptance-template.json`
- `project/lr5-ricco-master-contract.json`
- `docs/PRODUCTION_HANDBOOK_DE.md`
- `docs/QUICKSTART_DAY_ONE.md`
- `docs/VIDEO_TUTORIAL_SCRIPT_DE.md`
- `docs/AUTOMATION_80_PERCENT_MODEL.md`
- `docs/NOVICE_ACCEPTANCE_PROTOCOL.md`

## Technischer Test

```bash
npm test
npm run test:academy
npm run build:studio
npm run export:ep001-timing
```

Browser-Beweis:

```bash
node studio-app/tests/browser-smoke.mjs http://127.0.0.1:4174/studio/ --output _site/proof/studio
node studio-app/tests/academy-smoke.mjs http://127.0.0.1:4174/studio/ --output _site/proof/studio
```

GitHub Actions Run `29157416433` bestand auf Head `6b380f574c3d390987d7f0eac72ce3778f5c64ec` vollständig:

- Evidence-Preflight
- 62 Node-Vertrags- und Regressionstests
- 8 Python-Recovery-Tests
- LR3-, LR4- und LR5.1-Verträge
- Production-Academy-Contract-Checker
- TypeScript-/Vite-Studio-Build
- Dashboard-, Studio- und Academy-Browser-Smoke auf Desktop und Mobil
- Pages-Artefaktprüfung
- EP001-Timing- und SRT-Export
- read-only Asset Scanner
- technischer 1080×1920-M1-Render

## Geprüfte Invarianten

- exakt zwölf Stufen in verbindlicher Reihenfolge
- nur Stufe 1 darf technisch automatisch abgeschlossen werden
- kreative und finale Gates bleiben menschlich
- Übungsabschlüsse bleiben `TRAINING ONLY`
- Produktionsmodus setzt kreative Stufen auf `HUMAN REVIEW`
- gesperrte Folgestufen können nicht übersprungen werden
- Fortschritt und Notizen überleben Browser-Reload
- Desktop und Mobil besitzen keinen horizontalen Overflow
- Ricco-Vertrag und Ausführungssperren bleiben erhalten
- Timingexport nutzt ausschließlich `sourceBoundCandidateLine`
- automatische kreative Freigabe bleibt `false`
- automatische Episodenfreigabe bleibt `false`

## Negative Evidenz

1. Run `29157240294` scheiterte vor Produkttests am Evidence-Parser, weil Pflichtbestätigungen nicht wortgleich dem Repository-Vertrag entsprachen.
2. Run `29157316012` erreichte die Produktverträge und scheiterte an zwei konkreten Regressionen:
   - zu enge Wortlautprüfung für die menschliche finale Episodenfreigabe
   - fehlende bestehende UI-Vertragsüberschrift `Visual-, Set- und Voice-Locks`
3. Beide Ursachen wurden minimal korrigiert. Run `29157416433` bestand danach vollständig.

Die roten Läufe bleiben Teil der Auditspur und werden nicht als erfolgreiche Produktprüfung dargestellt.

## Technische Artefakte

- `studio-app/src/ProductionAcademy.tsx`
- `studio-app/tests/academy-smoke.mjs`
- `project/production-academy.json`
- `project/production-academy-status.json`
- dreizehn Dateien unter `docs/templates/`
- `docs/PRODUCTION_HANDBOOK_DE.md`
- `docs/QUICKSTART_DAY_ONE.md`
- `docs/VIDEO_TUTORIAL_SCRIPT_DE.md`
- `docs/AUTOMATION_80_PERCENT_MODEL.md`
- `scripts/check_production_academy.mjs`
- `tests/production-academy.test.mjs`

## Neue Readiness- und Abnahmeartefakte

- `project/production-readiness-v1.json`
- `project/novice-acceptance-template.json`
- `docs/NOVICE_ACCEPTANCE_PROTOCOL.md`
- `studio-app/src/AcademyReadiness.tsx`
- `scripts/check_production_readiness.mjs`
- `tests/production-readiness.test.mjs`

## CI-Artefakt des Academy-Grundbeweises

```text
Name: comic-lr5-production-academy-proof
Artifact-ID: 8249856559
Digest: sha256:51575477c876cf2af8bbacb0213edb2078e076712d93b2bdb97dd284f573da4e
```

Enthalten waren unter anderem:

```text
output/production-academy/academy-check.json
_site/proof/studio/academy-runtime-evidence.json
_site/proof/studio/academy-desktop.png
_site/proof/studio/academy-mobile.png
_site/proof/studio/studio-runtime-evidence.json
output/ep001-readthrough/ep001-timing-draft.srt
output/ep001-readthrough/ep001-timing-report.json
output/m1/ricco-life-sign.mp4
output/m1/render-report.json
```

## Sichtprüfung des Academy-Grundbeweises

Desktop-Screenshot SHA-256:

```text
372d2c01013a8875fa57ab1daec4d24af229bee5535e76ea5bd2d3d4aaf301df
```

Mobile-Screenshot SHA-256:

```text
feace53b80bdffc1fd209489e9069be38e44a96c45296c45efbf9bcc32d7f605
```

Sichtbar geprüft wurden:

- Hauptnavigation mit `Serie starten`
- aktueller Schritt
- Fortschritt 0 bis 12
- Übungs- und Produktionsmodus
- Anfänger- und Profi-Erklärung
- Pflicht-Ergebnisse
- Werkzeuge
- Gate-Typ
- Arbeitsnotiz und Blocker
- Tagesplan
- Rollen und Stop-Regeln
- unveränderte LR5.1-Ricco-Sperren
- kein horizontaler Overflow bei 1440×1000 und 390×844

Im Produktionsmodus zeigt die Series Bible nach Einreichung ausschließlich `HUMAN REVIEW`, niemals `APPROVED`.

## Production-Readiness

Aktueller messbarer Stand:

`2/10 CLOSED_VERIFIED · 7 PARTIAL · 1 OPEN`

Geschlossen sind:

- PR3 Canon- und Freigabegrenzen
- PR7 Backup, Delete und Restore

Teilweise erfüllt sind Installation, Onboarding, Master-Workflows, Episodenworkflow, QA, Recovery sowie Export und Übergabe.

Offen bleibt PR10: vollständiger beobachteter Nullwissen-Abnahmelauf.

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
- kein echtes Animatic wurde kreativ freigegeben
- keine vollständige Episode wurde produziert
- keine Qualitätsgleichheit mit einer etablierten TV-Serie ist bewiesen
- keine Live-Veröffentlichung ist aktiviert
- Growth OS wurde nicht in `main` integriert
- 80 Prozent KI-Unterstützung ist ein Zielbetriebsmodell und keine sofortige Zeitersparnisgarantie

## Pflichtbestätigungen

- [x] Scope auf `Pagebabe/comic` begrenzt
- [x] Canon und autorisierende Quelle geprüft
- [x] Regressionstest oder begründete Nichtanwendbarkeit dokumentiert
- [x] Keine unbelegte Visual-, Voice-, Canon- oder Finalfreigabe
- [x] Nicht behauptete Ergebnisse ausdrücklich benannt
- [x] Sichtprüfung oder verbindlicher Prüfplan vorhanden
