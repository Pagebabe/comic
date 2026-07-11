# Comic Factory · Recovery Line

Repository für eine wiederholbare Comic- und Motion-Comic-Produktion.

## Aktueller Wahrheitsstatus

```text
Produktarchitektur:       RECOVERY
aktuelles main:           Audit-/Status-Shell
Produktionsapp:           im Archiv erhalten, noch nicht zurückgeführt
LR0 Truth Reset:          geschlossen
LR1 Pilotentscheidung:    geschlossen
ausgewählter Pilot:       DAS ZIMMER
aktives Gate:             LR2 STUDIO FOUNDATION
Tracking:                 Issue #45
Evidence-Abdeckung:       partiell und quellgebunden, keine Prozentzahl
Character-Master:         0/4
Location-Master:          0/4
freigegebene Stimmen:     0/3
fertige Episode:          nein
```

Maschinenlesbare Wahrheit:

- `project/truth-state.json`
- `project/canon-candidates.json`
- `project/pilot-decision-packet.json`
- `project/pilot-decision-record.json`
- `project/line-reset-closure.json`

Menschenlesbare Prüfung:

- `docs/TRUTH_AUDIT_2026-07-11.md`
- `docs/LINE_RESET_CLOSURE_AUDIT_2026-07-11.md`
- `docs/PILOT_DECISION_PACKET_2026-07-11.md`
- `docs/PILOT_DECISION_RECORD_2026-07-11.md`
- `docs/PRODUCTION_APP_RECOVERY_PLAN.md`

Tracking:

- Issue #45 · LR2 Studio Foundation retten
- Issue #38 · LR1 Pilotentscheidung, nach Deploy zu schließen
- Issue #11 · aktueller Pages-Beweis

## Menschliche Pilotentscheidung

Der Projektinhaber bestätigte am 11. Juli 2026 die ausdrücklich formulierte Auswahl:

```text
Das Zimmer auswählen
```

mit:

```text
ok
```

Damit ist `Das Zimmer` als Pilotlinie ausgewählt. `Der Solidarpreis` bleibt nachvollziehbar als `ARCHIVED_NOT_SELECTED` erhalten.

Die Entscheidung genehmigt nicht automatisch jede alte Dialogzeile, Character-Bible, Bildidee, Stimme oder die 45,5 Sekunden als unveränderliches Finaltiming. Diese Bestandteile behalten eigene Review-Gates.

## Abgeschlossener Line Reset

LR0 wurde durch folgende Beweiskette geschlossen:

```text
PR #37
→ CI 29133307545 PASS
→ Merge 47b513c31d5326efdf5bd8c81e835233f97b6b47
→ Pages 29143665894 PASS
→ öffentlicher Runtime- und Screenshot-Beweis
```

Der Abschluss beweist nur den ehrlichen Recovery-Stand. Er rettet die Produktionsapp noch nicht und genehmigt keine Bilder oder Stimmen.

## Was tatsächlich funktioniert

- GitHub-Pages-Dashboard
- sichere Browser- und Proxy-Director-Kommandos
- technischer M1-Medienrender mit MP4, Ton und Untertiteln
- Timing- und SRT-Export für das ausgewählte Pilot-Ausgangsmaterial
- Read-only-Asset-Recovery und strenger PNG-Inspector
- CI, Pages-Deployment und Desktop-/Mobil-Screenshots

Der M1-Clip beweist nur den technischen Medienpfad. Figur, Raum und Stimme sind Platzhalter.

## Aktives Gate: LR2 Studio Foundation retten

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

Der Branch wird nicht blind gemergt. In LR2 wird zuerst nur die neutrale Vite-/React-Grundlage mit einer getesteten Studio-Route atomar zurückgeführt. Kandidatenmaterial darf dabei nicht still als vollständig finaler Canon übernommen werden.

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
LR1 Pilotentscheidung                   ✓ Das Zimmer ausgewählt
LR2 Studio Foundation retten            aktiv
LR3 minimalen Studio-bis-Restore-Loop   blockiert
LR4 realer Fire Test                    blockiert
LR5 Visual-, Set- und Voice-Locks       blockiert
LR6 erster echter Pilot                 blockiert
```

## Stop-Regeln

- kein Growth OS, Social Posting oder neue Plattformarchitektur
- keine neue Story oder Bildgenerierung vor getesteter Studio-Foundation
- kein Blind-Merge des Archivbranches
- kein Visual- oder Voice-Lock aus Textdateien ableiten
- Pilotauswahl nicht mit vollständiger Detailfreigabe verwechseln
- keine Final- oder Produktionsreife ohne sichtbaren Gegenbeweis
- Änderungen dieser Linie nur in `Pagebabe/comic`

## Live-Stand

Dashboard:

`https://pagebabe.github.io/comic/`

Ein Online-Deploy beweist nur den ausgelieferten technischen Stand. Er beweist weder eine vollständige Produktionsapp noch fertige Visuals, Stimmen oder Episode.
