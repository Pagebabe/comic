# Comic Factory · Program Release Gates

Status der Kontrollschicht: `PROGRAM_EVIDENCE_GATE_READY`  
Status des Gesamtprogramms: `PROGRAM_RELEASE_BLOCKED_PENDING_WORKER_2`

## Zweck

Diese Schicht bewertet ausschließlich Evidence, Abhängigkeiten und Release-Grenzen. Sie verändert keine Produkt-, Canon-, Episoden-, Dashboard-, Marketing- oder Publishing-Logik.

## Verbindlicher aktueller Zustand

| Gate | Zustand | Folge |
|---|---|---|
| Worker 1 Canon Lock | `READY_FOR_REVIEW_NOT_MERGED` | Evidence akzeptiert, kein Main-Merge autorisiert |
| Worker 2 Episode-1-Beweis | `PENDING` | Programmrelease hart blockiert |
| Worker 3 MKT0 Shadow Integration | `MKT0_INTEGRATION_MERGE_READY` | nur fachlicher Status, Zielmerge durch offenen PR #131 blockiert |
| PR #131 Factory Handoff | `PROVEN_NOT_MERGED` | Abhängigkeit vorhanden, aber noch nicht erfüllt |
| Main Merge | `false` | verboten |
| Live Activation | `false` | verboten |
| OAuth | `false` | verboten |
| Plattformkonten | `0` | keine Aktivierung |

## Einziger zulässiger Programmstatus

Solange Worker 2 keinen akzeptierten Abschlussbericht besitzt:

```text
PROGRAM_RELEASE_BLOCKED_PENDING_WORKER_2
```

Kein einzelner grüner Worker, kein grüner Workflow und kein vorhandener Artefakt-Digest darf diesen Zustand automatisch auf Release Ready setzen.

## Blockierende Gates

- `WORKER_2_FINAL_REPORT_MISSING`
- `WORKER_2_FINAL_HEAD_UNKNOWN`
- `WORKER_3_DEPENDENCY_PR_131_NOT_MERGED`
- `PROGRAM_INTEGRATION_NOT_PROVEN`
- `MAIN_MERGE_FORBIDDEN`
- `LIVE_ACTIVATION_FORBIDDEN`

## Worker-3-Reihenfolge

1. PR #131 bleibt als vorgelagerte Pflichtabhängigkeit gebunden.
2. Solange PR #131 offen und ungemergt ist, bleibt `dependencies[0].satisfied = false`.
3. Solange die Abhängigkeit nicht erfüllt ist, bleibt Worker 3 `merge_allowed = false`.
4. Ein Direktmerge von PR #139 nach `main` ist unabhängig vom technischen Workerstatus verboten.
5. Live-Aktivierung bleibt nach jeder späteren Integration ein separates menschliches Gate.

## Übergang in eine nächste Integrationsstufe

Eine spätere Änderung des Programmstatus erfordert mindestens:

1. echten Worker-2-Abschlussbericht;
2. finalen Worker-2-Branch, Head und PR;
3. terminale CI- und Artefakt-Evidence für Worker 2;
4. aktualisiertes, korrekt gehashtes Programmmanifest;
5. erfüllte Worker-3-Abhängigkeit oder ausdrücklich neu definierte Integrationslinie;
6. vollständigen erneuten Negativtest;
7. menschliche Release-Entscheidung.

Bis dahin gilt fail-closed.
