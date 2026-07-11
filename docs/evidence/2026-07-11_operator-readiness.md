# Evidence Packet · Operator-Readiness und Projektwahrheit

Status: `PROVEN_PR_PREFLIGHT · PUBLIC_DEPLOY_PENDING`

Tracking: #101, #102, #95, #103

Pull Request: #104

## Behauptung

Der Operator-Readiness-Vertrag bildet den Projektstand ohne kreative Übertreibung ab:

- 8 von 10 technischen Readiness-Gates: `PROVEN`
- unabhängige Installation: `IN_PROGRESS`
- externe Nullwissen-Abnahme: `EXTERNAL_INPUT_REQUIRED`
- technischer Workflow: bereit
- kreative Produktion: nicht bereit
- Gesamtfreigabe: `false`
- Reporter-Incident #103: offen und blockierend für die finale Operations-Closure

## Autorisierende Ausgangsevidence

- Academy-Merge: `f5db2947177baa6cac617d0d501609a3ad8387b9`
- Academy-Pages-Run: `29158037952`
- Academy-Pages-Artefakt: `8250021563`
- Academy-Pages-Digest: `sha256:8125b33061f2a603cae9b60803d7c54059460296c2325f6870f940f9948ffd3c`
- aktueller PR-Zielbranch enthält außerdem Security-/Rights-Commit `0057a617dd9aa8bd3c7e103ccef616aa380fa10c`

## Negativer Lauf

Run `29159045765` auf Head `edb33b00008704ec7152ed0912ffe96faa17017e` endete rot.

Nachgewiesene Ursache:

```text
[ACADEMY_PAGES_ARTIFACT:STATUS_VALUE] publicly_proven_production_enablement_ready
```

Der neue Statuswert war im Readiness-Vertrag korrekt, aber die bestehenden Academy-Pages- und Public-Checker erwarteten noch den alten Status `proven_production_enablement_ready`.

Dieser Lauf widerlegt nicht die Readiness-Daten. Er beweist eine echte Vertragsdrift zwischen Statusdatei und öffentlicher Beweiskette.

## Korrektur

Gemeinsam aktualisiert wurden:

- `scripts/check_academy_pages_artifact.mjs`
- `scripts/check_public_academy_evidence.mjs`
- `.github/workflows/pages.yml`

Die Prüfer verlangen jetzt zusätzlich:

- Academy-Statusschema 2
- 8/10 Readiness-Gates
- Installation `IN_PROGRESS`
- Nullwissen-Gate `EXTERNAL_INPUT_REQUIRED`
- `overallReady=false`
- Ricco `0/1`
- Character-, Location-, Voice- und Episodenstand jeweils null
- Reporter-Incident #103 weiterhin `OPEN`

## Positiver Lauf

Run `29159224113` auf Head `8b11e20533e18518f1ed2e00b4f64f5725dea6c7` war vollständig grün.

Bestanden:

- PR-Evidence-Preflight
- 69 Node-Tests einschließlich Readiness-Negativtests
- 8 Python-Recovery-Tests
- Truth-, Evidence-, LR3-, LR4-, LR5.1-, Academy- und Readiness-Checker
- Studio-Build
- Dashboard-, Studio- und Academy-Browser-Smoke
- bestehender Pages-Artefaktvertrag
- erweiterter Academy-/Readiness-Pages-Artefaktvertrag
- Syntaxprüfung des öffentlichen Readiness-Checkers
- EP001-Timingexport
- read-only Asset Scanner
- technischer M1-Render

CI-Artefakt:

```text
Artifact-ID: 8250332534
Digest: sha256:106fc0ee0425f98312c53708dbfe7463b0fa1da8fcfcf4762cb4b6c2e0edb144
```

## Readiness-Report

```json
{
  "status": "pass",
  "provenGateCount": 8,
  "requiredGateCount": 10,
  "technicalWorkflowReady": true,
  "productionCreativeReady": false,
  "externalNoviceAcceptanceComplete": false,
  "overallReady": false,
  "activeCreativeGate": "LR5.1",
  "riccoCandidates": 0,
  "characterMastersApproved": 0,
  "locationMastersApproved": 0,
  "voiceMastersApproved": 0,
  "finishedEpisodes": 0,
  "openOperationalRisks": 1
}
```

## Sichtprüfung

Die bestehenden Academy-Screenshot-Hashes blieben unverändert:

```text
Desktop: 372d2c01013a8875fa57ab1daec4d24af229bee5535e76ea5bd2d3d4aaf301df
Mobil:   feace53b80bdffc1fd209489e9069be38e44a96c45296c45efbf9bcc32d7f605
```

Der erzeugte Pages-Artefaktchecker bestätigte:

- 12 Academy-Stufen
- 8/10 Readiness-Gates
- `overallReady=false`
- keine kreative oder finale Episodenfreigabe
- Desktop und Mobil ohne unzulässigen Überlauf

## Nicht bewiesen

- keine unabhängige Neuinstallation
- keine externe Nullwissen-Testperson
- keine Lösung für Incident #103
- kein Ricco-Kandidat
- keine Character-, Location- oder Voice-Master
- keine fertige Episode
- keine Growth-OS-Integration
- kein Live-Publishing

## Nächster Beweis

Dieser Dokumentationshead muss die vollständige PR-CI erneut bestehen. Nach Merge muss der öffentliche Pages-Workflow Readiness-JSON, Statusdokument, Nullwissen-Protokoll und die unveränderten Academy-/LR5.1-Grenzen auf dem exakten Merge-Commit prüfen.
