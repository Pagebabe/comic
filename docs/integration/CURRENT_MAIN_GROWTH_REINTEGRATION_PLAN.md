# Current-Main Growth Reintegration Plan

## Status

`PLANNED · BLOCKED UNTIL IMPLEMENTED`

## Ziel

Die veraltete Growth-Linie wird nicht direkt nach `main` gemergt. Stattdessen werden ausschließlich die bewiesenen Shadow-Handoff-Bausteine auf einen neuen Branch ab aktuellem `main` portiert.

## Gebundene Quellen

- `main`: `b58534d0a737b1d01834628177e1090de027de61`
- PR #131: `9573757dbd9b39858ebae2b37337d2728a3455e4`
- PR #139: `c8c0adcef30645142190c19d8fbc6903fe177ae7`
- Evidence PR #141: `d52c3ca681e8285c8425014b1bbce33dff11aaba`
- Merge-Rehearsal PR #142: `efbeb4a6468ca77aac6412e50ea9e606df313f14`

## Problem

Die aktuelle Merge-Rehearsal beweist:

- Worker 1 und Worker 2 sind auf aktuellem `main` konfliktfrei komponierbar.
- PR #131 und die alte MKT0-Linie kollidieren in `package.json`.
- Die Growth-Linie liegt 344 Commits hinter `main`.

Ein normaler Merge würde veraltete Repository-Wahrheit und unnötige Historie einschleppen.

## Verbindliche Strategie

1. Neuer Branch ab aktuellem `main`.
2. Kein Merge der alten Growth-Historie.
3. Portierung nur der bewiesenen Growth-/Shadow-Artefakte.
4. `package.json` und Lockfiles aus aktuellem `main` bleiben Autorität.
5. Fehlende Scripts werden minimal und konfliktfrei ergänzt.
6. Keine OAuth-, Netzwerk-, Plattformkonto- oder Publishing-Aktivierung.
7. Keine Canon-, Master- oder Produktfreigabe.
8. Vollständige CI, Shadow-Tests, Fresh Install und Merge-Rehearsal.
9. Rollback-Beweis vor jeder Integrationsfreigabe.

## Zu portierende Kandidaten

Aus PR #131:

- `.github/workflows/growth-handoff.yml`
- `growth-os/contracts/factory-handoff-v1.json`
- `growth-os/handoff.mjs`
- `growth-os/handoff-check.mjs`
- `tests/growth-os-handoff.test.mjs`
- `growth-os/evidence/MKT1-001.md`

Aus PR #139:

- `.github/workflows/studio-mkt0-shadow-integration.yml`
- `growth-os/contracts/studio-mkt0-handoff-v1.schema.json`
- `growth-os/studio-mkt0-integration.mjs`
- `growth-os/studio-mkt0-integration-fixture.mjs`
- `growth-os/studio-mkt0-integration-check.mjs`
- `tests/growth-os-studio-mkt0-integration.test.mjs`
- `docs/integration/LIVE_ACTIVATION_GATES.md`
- `docs/integration/MKT0_MERGE_MAP.md`

Die Liste ist vor Portierung gegen die tatsächlichen Diffs zu prüfen. Nicht blind kopieren.

## Grün-Definition

- neuer Branch basiert exakt auf aktuellem `main`;
- keine alte Growth-Historie gemergt;
- alle portierten Dateien dokumentiert;
- `package.json`-Konflikt gelöst, ohne Main-Scripts zu entfernen;
- Growth Factory Handoff grün;
- Studio MKT0 Shadow Integration grün;
- Comic Factory CI grün;
- Fresh Install grün;
- aktuelle Merge-Rehearsal grün;
- Quell-Worktree sauber;
- Rollback bewiesen;
- `main_merge_allowed=false`;
- `live_activation_allowed=false`.

## Nicht behauptet

- kein Live-Publishing;
- kein OAuth;
- keine Plattformkonten;
- keine echte Pilotepisode;
- keine Masterfreigaben;
- keine Produktionsreife.
