# Evidence Packet · Öffentlicher Production-Academy-Beweis

Status: `PROVEN_PR_PREFLIGHT · PUBLIC_DEPLOY_PENDING`

Tracking: Issue #94

Pull Request: #98

Base: `main@2bc92b50c9903eed69d778e802431eff200d0d4e`

Verified head: `1da9d9c2c7542d6d6c510ae23abf721951cc3406`

## Behauptung

Die GitHub-Pages-Pipeline ist so erweitert, dass die Production Academy nicht nur ausgeliefert, sondern vor und nach dem Deploy commitgebunden geprüft wird. Der öffentliche Beweis umfasst Vertrag, Status, zwölf sequenziell gesperrte Stufen, Training/Echtmodus, Resume, Desktop/Mobil-Screenshots und die unveränderten kreativen Human-Gates.

## Quelle

- Issue #94
- PR #97 und Merge `2bc92b50c9903eed69d778e802431eff200d0d4e`
- `docs/PRODUCTION_ACADEMY_EVIDENCE.md`
- `project/production-academy.json`
- `project/production-academy-status.json`

## Test

GitHub Actions Run `29157907138` hat auf Head `1da9d9c2c7542d6d6c510ae23abf721951cc3406` vollständig bestanden:

- Pull-Request-Evidence-Preflight
- alle bestehenden Truth-, Recovery-, LR3-, LR4-, LR5.1- und Academy-Verträge
- Studio-Build
- Dashboard-, Studio- und Academy-Browser-Smoke auf Desktop und Mobil
- bestehender Pages-Artefaktvertrag
- neuer Academy-Pages-Artefaktvertrag
- Syntaxprüfung des öffentlichen Academy-Live-Checkers
- EP001-Timingexport
- read-only Asset Scanner
- technischer M1-Render

Ausgeführte neue Prüfungen:

```bash
node scripts/check_academy_pages_artifact.mjs --site _site --expect-commit "$GITHUB_SHA"
node --check scripts/check_public_academy_evidence.mjs
```

## Artefakt

- `.github/workflows/ci.yml`
- `.github/workflows/pages.yml`
- `scripts/check_academy_pages_artifact.mjs`
- `scripts/check_public_academy_evidence.mjs`
- `docs/PRODUCTION_ACADEMY_PUBLIC_EVIDENCE.md`

Der PR-CI-Artefaktcheck hat dieselben Academy-Verträge und Screenshots geprüft, die später in das Pages-Artefakt aufgenommen werden.

## Deployment oder Laufbeweis

`PUBLIC_DEPLOY_PENDING`

Run `29157907138` beweist die PR- und Artefaktseite. Ein öffentlicher Laufbeweis entsteht erst nach Merge durch einen vollständig grünen `Deploy Comic Factory Dashboard`-Workflow auf dem Merge-Commit. Dieser Workflow muss die echte URL laden, den Academy-Smoke erneut ausführen und `scripts/check_public_academy_evidence.mjs` erfolgreich abschließen.

## Sichtprüfung

Der öffentliche Prüfer verlangt auf Desktop und Mobil:

- zwölf sichtbare Stufen
- elf anfänglich gesperrte Folgestufen
- Fortschritt `0/12`
- Training-Pfad mit `training_complete`
- Produktionspfad mit `review_required`
- Resume nach Reload
- höchstens zwei Pixel horizontalen Overflow
- keine kreative Freigabe
- keine finale Episodenfreigabe

Zusätzlich müssen Ricco-Kandidaten, Character-Master, Location-Master, Voice-Master und fertige Episoden weiterhin bei null bleiben. Bildgenerierung bleibt gesperrt.

## Aktueller Status

`PENDING_DEPLOY`

Die öffentliche Beweiskette ist implementiert und im PR geprüft. Sie ist erst nach dem echten Pages-Deploy auf dem finalen Merge-Commit vollständig `PROVEN`.

## Nicht behauptet

- kein öffentlicher Pages-Deploy dieses PRs ist bereits bewiesen
- keine Character-, Location-, Voice- oder Episodenfreigabe wird erteilt
- kein Ricco-Kandidat wird erzeugt
- keine Bild-, GPU-, Provider- oder LoRA-Ausführung wird aktiviert
- keine kreative Produktionsreife der Serie wird behauptet
- kein Growth OS wird integriert

## Repository-Scope

`Pagebabe/comic`

## Pflichtbestätigungen

- [x] Scope auf `Pagebabe/comic` begrenzt
- [x] Canon und autorisierende Quelle geprüft
- [x] Regressionstest oder begründete Nichtanwendbarkeit dokumentiert
- [x] Keine unbelegte Visual-, Voice-, Canon- oder Finalfreigabe
- [x] Nicht behauptete Ergebnisse ausdrücklich benannt
- [x] Sichtprüfung oder verbindlicher Prüfplan vorhanden
