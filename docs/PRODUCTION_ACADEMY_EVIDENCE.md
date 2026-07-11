# Evidence Packet · LR5/6 Production Academy

Status: `PROVEN · PRODUCTION_ENABLEMENT_READY · CREATIVE_GATES_OPEN`

Tracking: Issue #94

Branch: `lr5/zero-to-episode-production-academy-v2`

Base: `main@0eed25ef7ac47c355fb36dfad61f646086f68532`

Proven head: `6b380f574c3d390987d7f0eac72ce3778f5c64ec`

## Behauptung

Der Branch implementiert einen geführten Zero-to-Episode-Produktionsmodus für Anfänger und erfahrene Operatoren. Er bietet zwölf gesperrte Produktionsstufen, Training/Echtmodus, lokalen Resume-Status, Fortschrittsexport, Rollen, Tagesplan, Vorlagen, Produktionshandbuch, Video-Tutorialskript und ein kontrolliertes 80-Prozent-KI-Betriebsmodell.

Der Branch genehmigt keine Character-, Location-, Voice-, Script- oder Episodenmaster automatisch. Der aktuelle LR5.1-Ricco-Vertrag bleibt erhalten und blockiert Bildgenerierung, Batch und LoRA bis zur menschlichen Vertragsentscheidung.

## Quelle

- Issue #94
- Issue #88
- `project/production-academy.json`
- `project/production-academy-status.json`
- `project/ricco-master-contract.json`
- `docs/PRODUCTION_HANDBOOK_DE.md`
- `docs/AUTOMATION_80_PERCENT_MODEL.md`
- `docs/QUICKSTART_DAY_ONE.md`
- `docs/VIDEO_TUTORIAL_SCRIPT_DE.md`

## Test

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

GitHub Actions Run `29157416433` hat auf Head `6b380f574c3d390987d7f0eac72ce3778f5c64ec` vollständig bestanden:

- Evidence-Preflight
- 62 Node-Vertrags- und Regressionstests
- 8 Python-Recovery-Tests
- LR3-, LR4- und LR5.1-Ricco-Verträge
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
- Übungsabschlüsse werden `TRAINING ONLY`
- Produktionsmodus setzt kreative Stufen auf `HUMAN REVIEW`
- gesperrte Folgestufen können nicht übersprungen werden
- Fortschritt und Notizen überleben Browser-Reload
- Desktop und Mobile besitzen keinen horizontalen Overflow
- Ricco-Vertrag und Ausführungssperren bleiben erhalten
- Timingexport nutzt ausschließlich `sourceBoundCandidateLine`
- automatische kreative Freigabe bleibt `false`
- automatische Episodenfreigabe bleibt `false`

## Negative Evidenz

1. Run `29157240294` scheiterte vor Produkttests am Evidence-Parser, weil die Pflichtbestätigungen im PR-Text nicht wortgleich dem Repository-Vertrag entsprachen.
2. Run `29157316012` erreichte die Produktverträge und scheiterte an zwei konkreten Regressionen:
   - zu enge Wortlautprüfung für die menschliche finale Episodenfreigabe
   - fehlende bestehende UI-Vertragsüberschrift `Visual-, Set- und Voice-Locks`
3. Beide Ursachen wurden minimal korrigiert. Run `29157416433` bestand danach vollständig.

Die roten Läufe bleiben Bestandteil der Auditspur und werden nicht als erfolgreiche Produktprüfung dargestellt.

## Artefakte

- `studio-app/src/ProductionAcademy.tsx`
- aktualisierte `studio-app/src/App.tsx`
- aktualisierte `studio-app/src/styles.css`
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
- aktualisierte CI

CI-Artefakt:

```text
Name: comic-lr5-production-academy-proof
Artifact-ID: 8249856559
Digest: sha256:51575477c876cf2af8bbacb0213edb2078e076712d93b2bdb97dd284f573da4e
```

Enthalten:

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

## Sichtprüfung

Desktop-Screenshot SHA-256:

```text
372d2c01013a8875fa57ab1daec4d24af229bee5535e76ea5bd2d3d4aaf301df
```

Mobile-Screenshot SHA-256:

```text
feace53b80bdffc1fd209489e9069be38e44a96c45296c45efbf9bcc32d7f605
```

Sichtbar geprüft wurden:

- klare Hauptnavigation mit `Serie starten`
- sichtbarer aktueller Schritt
- Fortschritt 0 bis 12
- Übungs- und Produktionsmodus
- Anfänger- und Profi-Erklärung
- Pflicht-Ergebnisse
- Werkzeuge
- Gate-Typ
- Arbeitsnotiz/Blocker
- Morgen-Tagesplan
- Rollen und Stop-Regeln
- unveränderte LR5.1-Ricco-Sperren
- kein horizontaler Overflow bei 1440×1000 und 390×844

Im Produktionsmodus zeigt die Series Bible nach Einreichung ausschließlich `HUMAN REVIEW`, niemals `APPROVED`.

## Aktueller Status

`PROVEN`

Der Produktionsmodus ist technisch einsatzbereit und anfängerbedienbar. LR5 selbst bleibt offen, solange reale Character-, Location- und Voice-Master fehlen. Die Academy ist eine Produktions- und Lernschicht, keine kreative Freigabemaschine.

## Nicht behauptet

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
- 80 Prozent KI-Unterstützung ist ein Zielbetriebsmodell nach stabilen Masters und keine sofortige Zeitersparnisgarantie

## Pflichtbestätigungen

- [x] Scope auf `Pagebabe/comic` begrenzt
- [x] Canon und autorisierende Quelle geprüft
- [x] Regressionstest oder begründete Nichtanwendbarkeit dokumentiert
- [x] Keine unbelegte Visual-, Voice-, Canon- oder Finalfreigabe
- [x] Nicht behauptete Ergebnisse ausdrücklich benannt
- [x] Sichtprüfung oder verbindlicher Prüfplan vorhanden
