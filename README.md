# Comic Factory · Recovery Line

Repository für eine wiederholbare Comic- und Motion-Comic-Produktion.

## Aktueller Wahrheitsstatus

```text
Produktarchitektur:        RECOVERY
Dashboard:                 öffentlich erreichbar
Studio Foundation:         öffentlich bewiesen
Studio-Route:              /comic/studio/
Neutraler Produktionsloop: öffentlich bewiesen
Selected-Pilot-Fire-Test:  öffentlich bewiesen
LR0 Truth Reset:           geschlossen
LR1 Pilotentscheidung:     geschlossen
LR2 Studio Foundation:     geschlossen
LR3 Produktionsloop:       geschlossen
LR4 Das-Zimmer-Fire-Test:  geschlossen
ausgewählter Pilot:        DAS ZIMMER
aktives Gate:              LR5 VISUAL-, SET- UND VOICE-LOCKS
Tracking:                  Issue #82
Evidence-Abdeckung:        partiell und quellgebunden, keine Prozentzahl
Character-Master:          0/4
Location-Master:           0/4
freigegebene Stimmen:      0/3
fertige Episode:           nein
```

## Aktuelle Autorität und Abschlussbelege

- `project/truth-state.json`
- `project/line-reset-closure.json`
- `project/pilot-decision-record.json`
- `project/studio-foundation-closure.json`
- `project/lr3-production-loop-closure.json`
- `project/lr4-selected-pilot-closure.json`
- `project/lr4-selected-pilot-source-inventory.json`

Menschenlesbare Audits:

- `docs/TRUTH_AUDIT_2026-07-11.md`
- `docs/LINE_RESET_CLOSURE_AUDIT_2026-07-11.md`
- `docs/PILOT_DECISION_RECORD_2026-07-11.md`
- `docs/STUDIO_FOUNDATION_RECOVERY_2026-07-11.md`
- `docs/LR3_MINIMAL_PRODUCTION_LOOP.md`
- `docs/LR4_SELECTED_PILOT_FIRE_TEST.md`
- `docs/PRODUCTION_APP_RECOVERY_PLAN.md`

Tracking:

- Issue #82 · LR5 Visual-, Set- und Voice-Locks
- Issue #76 · LR4 nach öffentlichem Abschluss zu schließen
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
Control → Studio → Prompt Queue → Import → Review → QA → Lettering
→ Package → Zustand tatsächlich löschen → Restore
```

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

LR3 bestätigt den neutralen technischen Loop ohne Bildbytes, externe Ausführung oder kreative Freigabe.

### LR4 Selected-Pilot-Fire-Test

`Das Zimmer` wurde als quellengebundenes Metadatenpaket durch denselben technischen Pfad geführt. Dialog-, Timing-, Panel-, Figuren- und Ortsdaten blieben `REVIEW_REQUIRED`.

```text
PR #81
→ geprüfter Head a55a24e24bdae0bbf2b980f2842f57f0653092ca
→ CI 29152706460 PASS
→ Merge 63021f49152dee7375578537be13dafd65685391
→ Pages 29152807415 PASS
→ 8 Panels · 10 Dialogkandidaten · 45,5 Sekunden
→ 9/9 Stationen
→ tatsächliche Zustandslöschung
→ DELETE + RESTORE HASH MATCH
→ Zustandshash 97b8216fbb11059a5f8fa0e3748ea8fa1e03706e15174c307ffe9ce84ca8c2cf
→ Package-Hash b6d2c8814dfc5cc558c5d7dd81113e71eafc51f531515fd7b4e9e8ec5a2ad196
→ 0 Bildbytes · 0 externe Ausführung · 0 kreative Freigaben
```

Öffentliche Route:

`https://pagebabe.github.io/comic/studio/#pilot-fire-test`

LR4 bestätigt Transport, Wiederherstellbarkeit, Quellenbindung und Manipulationsschutz. Es bestätigt keine Dialogqualität, kein finales Timing, keine visuellen Master, keine Stimmen und keine fertige Episode.

## Aktives Gate: LR5 Visual-, Set- und Voice-Locks

Issue #82 führt jetzt die ersten echten kreativen Master durch eine kontrollierte, menschliche Review-Kette.

Reihenfolge:

1. Prüfkriterien und Quellenbindung festlegen
2. Ricco als ersten Character-Master-Kandidaten erzeugen und sichtbar reviewen
3. Basti, Jule und Don Miau einzeln locken
4. Hausfassade, Riccos Zimmer, Flur und Küche einzeln locken
5. Ricco-, Basti- und Jule-Stimmen einzeln locken
6. LR5 erst nach vollständigem öffentlichen Gegenbeweis schließen

## Was weiterhin nicht gebaut oder freigegeben ist

- reale Character-Master
- reale Location-Master
- freigegebene Stimmen
- finale Dialogfassung
- finales Timing
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
LR4 Das-Zimmer-Fire-Test                ✓ öffentlich bewiesen
LR5 Visual-, Set- und Voice-Locks       aktiv · Issue #82
LR6 erster echter Pilot                 blockiert
```

## Stop-Regeln

- ausschließlich `Pagebabe/comic`
- kein Blind-Merge des Archivbranches
- kein Growth OS oder Social Posting
- kein Massenrendern vor sichtbar geprüftem ersten Master-Kandidaten
- keine automatische Character-, Set- oder Voice-Freigabe
- technische Tests erzeugen keine kreative Freigabe
- keine Final- oder Produktionsreife ohne sichtbaren Gegenbeweis

## Live

Dashboard: `https://pagebabe.github.io/comic/`  
Studio: `https://pagebabe.github.io/comic/studio/`
