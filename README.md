# Comic Factory · Line Reset

Repository für eine wiederholbare Comic- und Motion-Comic-Produktion.

## Aktueller Wahrheitsstatus

```text
Produktarchitektur:       RECOVERY
aktuelles main:           Audit-/Status-Shell
Produktionsapp:           im Archiv erhalten, noch nicht zurückgeführt
Pilot-Canon:              DECISION_REQUIRED
Evidence-Abdeckung:       partiell und quellgebunden, keine Prozentzahl
Character-Master:         0/4
Location-Master:          0/4
freigegebene Stimmen:     0/3
fertige Episode:          nein
```

Maschinenlesbare Wahrheit:

- `project/truth-state.json`
- `project/canon-candidates.json`

Menschenlesbare Prüfung:

- `docs/TRUTH_AUDIT_2026-07-11.md`
- `docs/PRODUCTION_APP_RECOVERY_PLAN.md`

Tracking:

- GitHub Issue #36 · Line Reset

## Was tatsächlich funktioniert

- GitHub-Pages-Dashboard
- sichere Browser- und Proxy-Director-Kommandos
- technischer M1-Medienrender mit MP4, Ton und Untertiteln
- Timing- und SRT-Export für vorhandenes Kandidatenmaterial
- Read-only-Asset-Recovery und strenger PNG-Inspector
- CI, Pages-Deployment und Desktop-/Mobil-Screenshots

Der M1-Clip beweist nur den technischen Medienpfad. Figur, Raum und Stimme sind Platzhalter.

## Was verloren ging und gerettet wird

Die frühere Vite-/React-Produktionsapp wurde aus `main` entfernt. Sie ist im Branch erhalten:

```text
archive/legacy-comic-2026-07-10
```

Dort existieren unter anderem:

- Ricco Control
- Ricco Studio
- Prompt Queue
- ComfyUI-Produktionsplanung
- Asset Import
- Image Review
- QA
- Lettering
- Package Export
- Restore

Der Branch wird nicht blind gemergt. Funktionen werden atomar zurückgeführt und jeweils gebaut, getestet und sichtbar geprüft.

## Canon-Konflikt

Mindestens zwei echte Pilotlinien existieren:

1. `Das Zimmer` mit vorhandenem Acht-Panel-Kandidatenmaterial
2. `Der Solidarpreis` als externer Sechs-Panel-Plan, dessen Originalquelle wieder eingebracht werden muss

Aktuell ist kein Pilot ausgewählt. Vorhandene Bibles, Visual-Briefs, Blueprint und Timingdaten von `Das Zimmer` bleiben wiederverwendbares Kandidatenmaterial, aber kein endgültig freigegebener Canon.

## Evidence First, korrigiert

Die frühere Aussage `100 % Beweiskettenabdeckung` wurde zurückgezogen. Der alte Ledger war ein statischer Snapshot einer fest ausgewählten Liste bis PR #30 und kein dynamischer Beweis der vollständigen Repository-Historie.

Ab jetzt gilt ohne Prozentkosmetik:

```text
Behauptung
→ unabhängige Quelle
→ Test
→ Artefakt oder ausdrücklich nicht anwendbar
→ Lauf- oder Deployment-Beweis
→ sichtbare Gegenprüfung
→ ehrlicher Status
```

Die alten Dateien bleiben als historische Audit-Artefakte erhalten:

- `project/evidence-chain.json`
- `project/evidence-closure.json`
- `project/historical-pr-evidence.json`

Sie sind nicht mehr die aktuelle Projektwahrheit. Diese Rolle hat `project/truth-state.json`.

## Verbindliche Reihenfolge

```text
LR0 Truth Reset
→ LR1 Pilotentscheidung
→ LR2 Produktionsapp retten
→ LR3 ausgewählten Pilot durch Studio und Package führen
→ LR4 Character-, Set- und Voice-Locks
→ LR5 erster echter Pilot
```

## Stop-Regeln

- kein Growth OS, Social Posting oder neue Plattformarchitektur
- keine neue Story oder Figur vor der Pilotentscheidung
- kein Blind-Merge des Archivbranches
- kein Visual- oder Voice-Lock aus Textdateien ableiten
- keine Final-, Canon- oder Produktionsreife ohne sichtbaren Gegenbeweis
- Änderungen dieser Linie nur in `Pagebabe/comic`

## Live-Stand

Dashboard:

`https://pagebabe.github.io/comic/`

Ein Online-Deploy beweist nur den ausgelieferten technischen Stand. Er entscheidet weder Canon noch Produktreife.
