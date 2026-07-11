# Comic Factory · Recovery Line

Repository für eine wiederholbare Comic- und Motion-Comic-Produktion.

## Aktueller Wahrheitsstatus

```text
Produktarchitektur:       RECOVERY
Dashboard:                öffentlich erreichbar
Studio Foundation:        öffentlich bewiesen
Studio-Route:             /comic/studio/
Neutraler Produktionsloop: öffentlich bewiesen
LR0 Truth Reset:          geschlossen
LR1 Pilotentscheidung:    geschlossen
LR2 Studio Foundation:    geschlossen
LR3 Produktionsloop:      geschlossen
ausgewählter Pilot:       DAS ZIMMER
aktives Gate:             LR4 SELECTED-PILOT-FIRE-TEST
Tracking:                 Issue #76
Evidence-Abdeckung:       partiell und quellgebunden, keine Prozentzahl
Character-Master:         0/4
Location-Master:          0/4
freigegebene Stimmen:     0/3
fertige Episode:          nein
```

## Aktuelle Autorität und Abschlussbelege

- `project/truth-state.json`
- `project/line-reset-closure.json`
- `project/pilot-decision-record.json`
- `project/studio-foundation-closure.json`
- `project/lr3-production-loop-closure.json`
- `project/studio-foundation-status.json`
- `project/studio-foundation-inventory.json`
- `project/lr3-production-loop-inventory.json`

Menschenlesbare Audits:

- `docs/TRUTH_AUDIT_2026-07-11.md`
- `docs/LINE_RESET_CLOSURE_AUDIT_2026-07-11.md`
- `docs/PILOT_DECISION_RECORD_2026-07-11.md`
- `docs/STUDIO_FOUNDATION_RECOVERY_2026-07-11.md`
- `docs/LR3_MINIMAL_PRODUCTION_LOOP.md`
- `docs/PRODUCTION_APP_RECOVERY_PLAN.md`

Tracking:

- Issue #76 · LR4 Selected-Pilot-Fire-Test für Das Zimmer
- Issue #60 · LR3 nach öffentlichem Abschluss zu schließen
- Issue #11 · aktueller Pages-Beweis

## Geschlossene Beweisketten

### LR0 Truth Reset

```text
PR #37
→ CI 29133307545 PASS
→ Merge 47b513c31d5326efdf5bd8c81e835233f97b6b47
→ Pages 29143665894 PASS
→ öffentlicher Runtime- und Screenshot-Beweis
```

### LR1 Pilotentscheidung

`Das Zimmer` wurde ausdrücklich menschlich ausgewählt. `Der Solidarpreis` bleibt als `ARCHIVED_NOT_SELECTED` erhalten. Die Auswahl genehmigt nicht automatisch jede Dialogzeile, Bible, Bildidee, Stimme oder das 45,5-Sekunden-Timing.

### LR2 Studio Foundation

```text
Archiv: archive/legacy-comic-2026-07-10
→ Inventur mit Archiv-Blob-SHAs
→ isolierter Vite-/React-/TypeScript-Slice
→ PR #59
→ CI 29148650720 PASS
→ Merge 18d0c34b81db781305941c0e9f34c308ac5c8b76
→ Pages 29148728164 PASS
→ öffentlicher /studio/-Browser-Smoke
→ Desktop- und Mobil-Hashvergleich PASS
```

### LR3 neutraler Produktionsloop

```text
Control
→ Studio
→ Prompt Queue
→ Import
→ Review
→ QA
→ Lettering
→ Package
→ Zustand tatsächlich löschen
→ Restore
```

Beweiskette:

```text
PR #74
→ CI 29150833651 PASS
→ Merge 0226b80ae36457c95efb2e4dbbb0546623d274ae
→ Pages 29150875221 PASS
→ 9/9 Stationen
→ DELETE + RESTORE PASS
→ Zustandshash 39266debc49b4374be25bad2d58747b240492630486c18828694737df198cc70
→ Package-Hash 011e7c0f60c5523ebc21c8b589af9adb5bfee8615b14ef5baef933d266ee9a9e
```

Der LR3-Beweis bestätigt den neutralen technischen Loop ohne Bildbytes, externe Ausführung oder kreative Freigabe. Er bestätigt ausdrücklich nicht das ausgewählte Pilotpaket.

Öffentliche Route:

`https://pagebabe.github.io/comic/studio/#loop`

## Aktives Gate: LR4 Selected-Pilot-Fire-Test

Issue #76 führt jetzt exakt das ausgewählte `Das Zimmer`-Paket durch den bewiesenen Transportpfad. Alle übernommenen Dialog-, Timing-, Panel- und Bible-Daten bleiben Kandidaten beziehungsweise `REVIEW_REQUIRED`.

LR4 muss beweisen:

- eindeutige Quellenbindung an die ausgewählte Pilotlinie
- Import und technische Review
- QA ohne kreative Freigabe
- technisches Lettering
- deterministischen Package-Export
- tatsächliche Zustandslöschung
- hashgleichen Restore
- Desktop-, Mobil- und öffentlichen Pages-Gegenbeweis

## Was weiterhin nicht gebaut oder freigegeben ist

- ausgewählter-Pilot-Fire-Test
- externer Prompt- oder ComfyUI-Aufruf
- reale Bildgenerierung
- Character- oder Location-Master
- freigegebene Stimmen
- fertige Episode
- automatische Veröffentlichung
- Growth OS

## Evidence First

```text
Behauptung
→ unabhängige Quelle
→ Test
→ Artefakt oder ausdrücklich nicht anwendbar
→ Lauf- oder Deployment-Beweis
→ sichtbare Gegenprüfung
→ ehrlicher Status
```

Der historische 100-Prozent-Wert bleibt ein begrenzter Snapshot bis PR #30 und keine aktuelle Vollständigkeitsbehauptung.

## Verbindliche Reihenfolge

```text
LR0 Truth Reset                         ✓ geschlossen
LR1 Pilotentscheidung                   ✓ Das Zimmer ausgewählt
LR2 Studio Foundation                   ✓ öffentlich bewiesen
LR3 neutraler Studio-bis-Restore-Loop   ✓ öffentlich bewiesen
LR4 Das-Zimmer-Fire-Test                aktiv · Issue #76
LR5 Visual-, Set- und Voice-Locks       blockiert
LR6 erster echter Pilot                 blockiert
```

## Stop-Regeln

- ausschließlich `Pagebabe/comic`
- kein Blind-Merge des Archivbranches
- kein Growth OS oder Social Posting
- keine Bildgenerierung vor öffentlichem LR4-Abschluss
- technische Tests erzeugen keine kreative Freigabe
- keine Final- oder Produktionsreife ohne sichtbaren Gegenbeweis

## Live

Dashboard: `https://pagebabe.github.io/comic/`  
Studio: `https://pagebabe.github.io/comic/studio/`
