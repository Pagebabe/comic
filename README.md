# Comic Factory · Recovery Line

Repository für eine wiederholbare Comic- und Motion-Comic-Produktion.

## Aktueller Wahrheitsstatus

```text
Produktarchitektur:       RECOVERY
aktuelles main:           Audit-/Status-Shell
Produktionsapp:           im Archiv erhalten, noch nicht zurückgeführt
aktives Gate:             LR1 PILOTENTSCHEIDUNG
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
- `project/line-reset-closure.json`

Menschenlesbare Prüfung:

- `docs/TRUTH_AUDIT_2026-07-11.md`
- `docs/LINE_RESET_CLOSURE_AUDIT_2026-07-11.md`
- `docs/PRODUCTION_APP_RECOVERY_PLAN.md`

Tracking:

- Issue #38 · LR1 Pilotentscheidung
- Issue #36 · LR0 geschlossen
- Issue #11 · aktueller Pages-Beweis

## Abgeschlossener Line Reset

LR0 wurde durch folgende Beweiskette geschlossen:

```text
PR #37
→ CI 29133307545 PASS
→ Merge 47b513c31d5326efdf5bd8c81e835233f97b6b47
→ Pages 29143665894 PASS
→ öffentlicher Runtime- und Screenshot-Beweis
```

Der Abschluss beweist nur den ehrlichen Recovery-Stand. Er wählt keinen Pilot, rettet die Produktionsapp noch nicht und genehmigt keine Bilder oder Stimmen.

## Was tatsächlich funktioniert

- GitHub-Pages-Dashboard
- sichere Browser- und Proxy-Director-Kommandos
- technischer M1-Medienrender mit MP4, Ton und Untertiteln
- Timing- und SRT-Export für vorhandenes Kandidatenmaterial
- Read-only-Asset-Recovery und strenger PNG-Inspector
- CI, Pages-Deployment und Desktop-/Mobil-Screenshots

Der M1-Clip beweist nur den technischen Medienpfad. Figur, Raum und Stimme sind Platzhalter.

## Was gerettet wird

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

Der Branch wird nicht blind gemergt. Funktionen werden nach der Pilotentscheidung atomar zurückgeführt und jeweils gebaut, getestet und sichtbar geprüft.

## Aktives Gate: LR1 Pilotentscheidung

Mindestens zwei echte Pilotlinien existieren:

1. `Das Zimmer` mit vorhandenem Acht-Panel-Kandidatenmaterial
2. `Der Solidarpreis` als externer Sechs-Panel-Plan, dessen Originalquelle wieder eingebracht werden muss

Aktuell ist kein Pilot ausgewählt. Dateimenge, Commitanzahl und grüne Tests dürfen die menschliche kreative Entscheidung nicht ersetzen.

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

Die alten Evidence-Dateien bleiben historische Audit-Artefakte. Aktuelle Autorität ist `project/truth-state.json`.

## Verbindliche Reihenfolge

```text
LR0 Truth Reset                         ✓ geschlossen
LR1 Pilotentscheidung                   aktiv
LR2 Studio Foundation retten            blockiert
LR3 minimalen Studio-bis-Restore-Loop   blockiert
LR4 realer Fire Test                    blockiert
LR5 Visual-, Set- und Voice-Locks       blockiert
LR6 erster echter Pilot                 blockiert
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
