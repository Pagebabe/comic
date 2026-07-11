# Comic Factory Operator-Readiness

Status: `TECHNICAL_WORKFLOW_READY · OVERALL_READY_FALSE`

Tracking: #101, #95, #102

## Was bewiesen ist

Die Production Academy ist auf Commit `f5db2947177baa6cac617d0d501609a3ad8387b9` öffentlich ausgeliefert und mit GitHub-Pages-Run `29158037952` technisch gegengeprüft.

Bewiesen sind:

- zwölf sequenzielle Produktionsstufen
- Training- und Produktionsmodus
- sichtbare Human-Gates
- lokaler Resume-Zustand
- Desktop- und Mobilpfad
- technische QA-, Recovery-, Timing-, Export- und Handoff-Wege
- unveränderte LR3-, LR4- und LR5.1-Sicherheitsgrenzen

Das bedeutet: Eine Person kann den technischen Produktionsablauf geführt bedienen.

Es bedeutet nicht: Figuren, Sets, Stimmen oder eine Episode seien kreativ fertig.

## Readiness-Matrix

| Gate | Status | Grenze |
|---|---|---|
| 1. Installation reproduzierbar | `IN_PROGRESS` | CI-Installation ist bewiesen, frischer unabhängiger M1-Pro-Installationslauf fehlt |
| 2. Anfänger-Onboarding | `PROVEN` | technischer Guided Mode, keine kreative Freigabe |
| 3. Canon- und Freigabegrenzen | `PROVEN` | Human-Gates und Sperren sichtbar |
| 4. Character-/Set-/Voice-Workflow | `PROVEN` | geführt, aber Master weiterhin 0 |
| 5. Episode-Workflow | `PROVEN` | geführt, aber fertige Episode weiterhin 0 |
| 6. QA und sichtbare Reviews | `PROVEN` | Reviews vorhanden, keine automatische Freigabe |
| 7. Backup, Delete und Restore | `PROVEN` | technischer Zustands- und Package-Restore |
| 8. Fehlerdiagnose und Recovery | `PROVEN` | Scanner, Tests und Bedienhilfe vorhanden |
| 9. Export und Übergabe | `PROVEN` | technische source-bound Kandidaten, keine finale Episode |
| 10. Externe Nullwissen-Abnahme | `EXTERNAL_INPUT_REQUIRED` | reale unabhängige Testperson fehlt |

Maschinenlesbare Wahrheit: `project/operator-readiness.json`

## Aktuelle kreative Wahrheit

- Pilot: `Das Zimmer`
- aktives Gate: `LR5.1`
- Ricco-Vertrag: `CONTRACT_READY_REVIEW_REQUIRED`
- Ricco-Kandidaten: `0/1`
- Bildgenerierung: gesperrt
- Character-Master: `0/4`
- Location-Master: `0/4`
- Voice-Master: `0/3`
- fertige Episode: `0`
- Growth OS in `main`: nein
- Live-Publishing: nein

## Nächste erlaubte Linien

### Autonom ausführbar

1. frischen Installationsbeweis vorbereiten und ausführen
2. Nullwissen-Abnahmepaket vollständig bereitstellen
3. Evidence-Reporter-Kollision aus #103 technisch lokalisieren und absichern
4. alle Statusdateien und Checker regressionssicher halten

### Menschliche Entscheidung erforderlich

Issue #88 benötigt ausdrücklich:

```text
CONTRACT_APPROVED_FOR_ONE_CANDIDATE
```

Erst danach darf genau ein source-bound, versionierter Ricco-Kandidat erzeugt werden. Diese Entscheidung genehmigt keinen Master, keinen Batch und kein LoRA-Training.

## Abschlussgrenze

`overallReady` bleibt `false`, solange mindestens eines gilt:

- Installation nicht unabhängig bewiesen
- externe Nullwissen-Abnahme fehlt
- Reporter-Kollision offen
- kreative Master fehlen
- keine vollständige Pilotepisode existiert

Ein technischer Guided Mode ist ein starkes Fundament. Er ist nicht dieselbe Sache wie eine bewiesene professionelle Serienproduktion. Menschen lieben diese beiden Zustände zu vermischen, weshalb sie hier getrennt und maschinenlesbar geführt werden.
