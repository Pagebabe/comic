# Comic Factory · Recovery Line

Repository für eine wiederholbare Comic- und Motion-Comic-Produktion.

## Aktueller Wahrheitsstatus

```text
Produktarchitektur:       RECOVERY
Dashboard:                öffentlich erreichbar
Studio Foundation:        öffentlich bewiesen
Studio-Route:             /comic/studio/
Produktionsloop:           noch nicht gerettet
LR0 Truth Reset:          geschlossen
LR1 Pilotentscheidung:    geschlossen
LR2 Studio Foundation:    geschlossen
ausgewählter Pilot:       DAS ZIMMER
aktives Gate:             LR3 PRODUKTIONSLOOP
Tracking:                 Issue #60
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
- `project/studio-foundation-status.json`
- `project/studio-foundation-inventory.json`

Menschenlesbare Audits:

- `docs/TRUTH_AUDIT_2026-07-11.md`
- `docs/LINE_RESET_CLOSURE_AUDIT_2026-07-11.md`
- `docs/PILOT_DECISION_RECORD_2026-07-11.md`
- `docs/STUDIO_FOUNDATION_RECOVERY_2026-07-11.md`
- `docs/PRODUCTION_APP_RECOVERY_PLAN.md`

Tracking:

- Issue #60 · LR3 Produktionsloop retten
- Issue #45 · LR2 nach öffentlichem Abschluss zu schließen
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

Öffentliche Route:

`https://pagebabe.github.io/comic/studio/`

Der LR2-Beweis bestätigt:

- gelockter Vite-/React-/TypeScript-Build
- neutrale responsive Studio-Foundation
- Truth-State-Anbindung
- `Das Zimmer` als ausgewählter Pilot
- Desktop `1440 × 1000`, Überlauf `0 px`, Bilder `0`
- Mobil `390 × 844`, Überlauf `0 px`, Bilder `0`

Der Beweis bestätigt **nicht** den Produktionsloop.

## Aktives Gate: LR3 Produktionsloop retten

Issue #60 führt jetzt genau einen neutralen Testpfad:

```text
Control
→ Studio
→ Prompt Queue
→ Import
→ Review
→ QA
→ Lettering
→ Package
→ Zustand löschen
→ Restore
```

LR3 nutzt ein neutrales Test-EpisodePackage. LR4 führt denselben Fire Test später mit dem ausgewählten `Das Zimmer`-Paket aus. Damit werden technische Funktion und kreative Freigabe nicht wieder in denselben Topf geworfen, in dem Projekte gewöhnlich ungenießbar werden.

## Was weiterhin nicht gebaut oder freigegeben ist

- vollständige Produktionsorchestrierung
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
LR3 neutraler Studio-bis-Restore-Loop   aktiv
LR4 Das-Zimmer-Fire-Test                blockiert
LR5 Visual-, Set- und Voice-Locks       blockiert
LR6 erster echter Pilot                 blockiert
```

## Stop-Regeln

- ausschließlich `Pagebabe/comic`
- kein Blind-Merge des Archivbranches
- kein Growth OS oder Social Posting
- keine Bildgenerierung vor LR3 und LR4
- technische Tests erzeugen keine kreative Freigabe
- keine Final- oder Produktionsreife ohne sichtbaren Gegenbeweis

## Live

Dashboard: `https://pagebabe.github.io/comic/`  
Studio Foundation: `https://pagebabe.github.io/comic/studio/`
