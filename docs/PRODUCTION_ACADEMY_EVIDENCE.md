# Evidence Packet · LR5/6 Production Academy

Status: `PENDING_CI · PRODUCTION_ENABLEMENT_ONLY · CREATIVE_GATES_OPEN`

Tracking: Issue #94

## Behauptung

Der Branch implementiert einen geführten Zero-to-Episode-Produktionsmodus für Anfänger und erfahrene Operatoren. Er bietet zwölf gesperrte Produktionsstufen, Training/Echtmodus, lokalen Resume-Status, Fortschrittsexport, Rollen, Tagesplan, Vorlagen, Produktionshandbuch, Video-Tutorialskript und ein 80-Prozent-KI-Betriebsmodell.

Der Branch genehmigt keine Character-, Location-, Voice-, Script- oder Episodenmaster automatisch.

## Quelle

- Issue #94
- `project/production-academy.json`
- `project/production-academy-status.json`
- `docs/PRODUCTION_HANDBOOK_DE.md`
- `docs/AUTOMATION_80_PERCENT_MODEL.md`
- `docs/QUICKSTART_DAY_ONE.md`
- `docs/VIDEO_TUTORIAL_SCRIPT_DE.md`

## Test

```bash
npm test
npm run test:academy
npm run build:studio
```

Browser-Beweis:

```bash
node studio-app/tests/academy-smoke.mjs http://127.0.0.1:4174/studio/ --output _site/proof/studio
```

Geprüft werden:

- exakt zwölf Stufen in verbindlicher Reihenfolge
- nur Stufe 1 darf technisch automatisch abgeschlossen werden
- kreative und finale Gates bleiben menschlich
- Übungsabschlüsse werden `TRAINING ONLY`
- Produktionsmodus setzt kreative Stufen auf `HUMAN REVIEW`
- gesperrte Folgestufen können nicht übersprungen werden
- Fortschritt und Notizen überleben Browser-Reload
- Desktop und Mobile besitzen keinen horizontalen Overflow
- Vorlagen und Handbücher sind vorhanden
- Timingexport nutzt `sourceBoundCandidateLine` statt vorgetäuschtem Dialog-Lock

## Artefakte

- `studio-app/src/ProductionAcademy.tsx`
- aktualisierte `studio-app/src/App.tsx`
- aktualisierte `studio-app/src/styles.css`
- `studio-app/tests/academy-smoke.mjs`
- `project/production-academy.json`
- `project/production-academy-status.json`
- zwölf Dateien unter `docs/templates/`
- `docs/PRODUCTION_HANDBOOK_DE.md`
- `docs/QUICKSTART_DAY_ONE.md`
- `docs/VIDEO_TUTORIAL_SCRIPT_DE.md`
- `docs/AUTOMATION_80_PERCENT_MODEL.md`
- `scripts/check_production_academy.mjs`
- `tests/production-academy.test.mjs`
- aktualisierte CI

Erwartete CI-Artefakte:

```text
output/production-academy/academy-check.json
_site/proof/studio/academy-runtime-evidence.json
_site/proof/studio/academy-desktop.png
_site/proof/studio/academy-mobile.png
```

## Sichtprüfung

Die Oberfläche muss zeigen:

- sichtbaren aktuellen Schritt
- Fortschritt 0 bis 12
- Übungs- und Produktionsmodus
- Anfänger- und Profi-Erklärung
- Pflicht-Ergebnisse
- Werkzeuge
- Gate-Typ
- Arbeitsnotiz/Blocker
- Morgen-Tagesplan
- Rollen und Stop-Regeln

Im Produktionsmodus darf die Series Bible nach Einreichung nur `HUMAN REVIEW`, niemals `APPROVED`, anzeigen.

## Aktueller Status

`PENDING_DEPLOY`

Nach vollständig grüner GitHub-Actions-CI kann der Produktionsmodus als technisch einsatzbereit gelten. LR5 selbst bleibt offen, solange reale Character-, Location- und Voice-Master fehlen.

## Nicht behauptet

- keine Character-Master sind freigegeben
- keine Location-Master sind freigegeben
- keine Stimmen sind freigegeben
- kein Script oder Dialog wurde automatisch finalisiert
- kein echtes Animatic wurde kreativ freigegeben
- keine vollständige Episode wurde produziert
- keine Qualitätsgleichheit mit einer etablierten TV-Serie ist bewiesen
- keine Live-Veröffentlichung ist aktiviert
- Growth OS wurde nicht in `main` integriert

## Pflichtbestätigungen

- [x] Scope auf `Pagebabe/comic` begrenzt
- [x] Branch basiert auf aktuellem `main`
- [x] kein blindes Growth-OS-Merge
- [x] kreative Human Gates bleiben gesperrt
- [x] Regressionstests und Browser-Smoke sind definiert
- [x] Nichtbehauptungen sind ausdrücklich dokumentiert
