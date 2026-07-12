# Program Conflict Matrix

Quelle: reproduzierbare Git-Rehearsal gegen `main@b58534d0a737b1d01834628177e1090de027de61` mit den finalen Worker-Heads vom 12. Juli 2026.

## Gemessene Sequenzen

| Sequenz | Erfolgreiche Schritte | Exakter Stopppunkt | Konfliktdateien | Rollback |
|---|---|---|---|---|
| A | Worker 1, finaler Worker 2 | PR #131 | `package.json` | sauber |
| B | keine | PR #131 | `package.json` | sauber |
| C | Worker 1, finaler Worker 2 | MKT0 | `package.json` | sauber |

Geprüfte Heads:

```text
Worker 1: 1bb4df874d8e2a36fd32fbad19074ed629ec922d
Worker 2: e8b8e348120ad527abe7a33caab9f56b6627f8c2
MKT0:     4b4673f2d068e3b8c1e007daf1cda763d9836ed3
PR #131:  9573757dbd9b39858ebae2b37337d2728a3455e4
Worker 3: c8c0adcef30645142190c19d8fbc6903fe177ae7
```

## Statische und dynamische Matrix

| Paar oder Paket | Beobachtung | Rehearsal-Ergebnis | Erforderliche Maßnahme |
|---|---|---|---|
| aktuelles `main` ↔ Worker 1 | Worker 1 basiert direkt auf aktuellem Main | konfliktfrei | Exakten Head verwenden und kombinierte Regression ausführen. |
| Worker 1 ↔ finaler Worker 2 | getrennte Proof-/Canon-Dateien | konfliktfrei | Factory-only Integrationsbranch erstellen. |
| aktuelles `main` ↔ finaler Worker 2 | Worker 2 basiert direkt auf aktuellem Main | nach Worker 1 konfliktfrei | Technischen Beweis übernehmen, ohne kreative Freigabe abzuleiten. |
| Factory-Paket ↔ PR #131 | `package.json` | echter Konflikt in Sequenz A | PR #131 nicht direkt integrieren; Growth gegen heutigen Main neu zusammensetzen. |
| aktuelles `main` ↔ PR #131 | alte Growth-Abstammung und `package.json` | echter Konflikt in Sequenz B | Direkter Merge verboten. |
| Factory-Paket ↔ MKT0 | `package.json` | echter Konflikt in Sequenz C | Current-Main-MKT0-Reintegrationsbranch erstellen. |
| MKT0 ↔ PR #131 | Abstammungsbeziehung | geordnete Abhängigkeit | PR #131 muss nach dem neu integrierten MKT0 portiert werden. |
| PR #131 ↔ Worker 3 | Abstammungsbeziehung | geordnete Abhängigkeit | Worker 3 muss zuletzt auf die aktualisierte PR-#131-Linie gesetzt werden. |

## Datei-spezifische Regel für `package.json`

Niemals die komplette Datei mit `--ours` oder `--theirs` übernehmen.

Der Integrationsverantwortliche muss:

1. mit dem aktuellen Main-Scriptbestand beginnen;
2. alle Canon-, Cockpit-, Recovery-, Fresh-Install-, Evidence- und Studio-Build-Gates bewahren;
3. Growth-, Factory-Handoff- und Studio-MKT0-Scripts einzeln hinzufügen;
4. jede hinzugefügte, entfernte oder umbenannte Scriptzeile dokumentieren;
5. `npm test` und `npm run build:studio` ausführen;
6. Growth-spezifische Tests und Workflows zusätzlich ausführen;
7. die Merge-Rehearsal nach der expliziten Zusammensetzung wiederholen.

Die aktuelle Main-Linie definiert keine konventionellen Root-Scripts namens `lint`, `typecheck` oder `build`. Sie dürfen daher weder als fehlgeschlagen noch als bestanden erfunden werden.

## Worker-2-Grenze

`EPISODE_PIPELINE_PROVEN` bedeutet nicht:

- echte Pilotepisode,
- kreative Bildfreigabe,
- Character Lock,
- Location Lock,
- Style Lock,
- Voice Lock,
- Produktionsreife.

## Evidence

```text
Program Merge Rehearsal Run: 29189672482
Head: ba7f5aef7b74e572de47028ca8c45ccfcf6f1a4d
Artifact ID: 8259114038
Artifact digest: sha256:6b357cc5f4ba0a24f3f733b378b37eba9c0939c97da4b02682c59cfe8ed5cbf8
Artifact JSON SHA-256: 41c4fb05292cce6391b066aec0fd62d7728df79822ed293a6dd77adf3a5025f2
```

Das Artefakt bestätigt außerdem:

```text
all_final_worker_heads_pinned = true
worker_2_final_status = EPISODE_PIPELINE_PROVEN
source_worktree_clean_after = true
direct_main_merge_performed = false
pushes_performed = 0
force_pushes_performed = 0
```
