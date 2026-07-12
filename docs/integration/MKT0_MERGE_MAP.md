# MKT0 Merge Map

Stand: 12. Juli 2026

## Tatsächlicher Git-Stand

| Linie | Commit / Zustand |
|---|---|
| `main` | `b58534d0a737b1d01834628177e1090de027de61` |
| gemeinsamer Merge-Base | `6ea5b2ab22079ea9083bccaef14c19be9306ae72` |
| `feature/mkt0-growth-os-rebased` | MKT0-Abschlussbasis `4b4673f2d068e3b8c1e007daf1cda763d9836ed3` |
| Vergleich MKT0 gegen `main` | 91 Commits voraus, 344 Commits zurück, Status `diverged` |
| PR #131 Head | `9573757dbd9b39858ebae2b37337d2728a3455e4` |
| PR #131 GitHub-Merge-Commit gegen MKT0-Basis | `645d749bf448919eed5fd3977dad14e2bc6b4f9d` |
| Worker-Branch | `worker/mkt0-shadow-integration`, auf PR-#131-Head aufgebaut |

Die isolierte Growth-Linie darf deshalb nicht direkt und blind nach `main` gemergt werden. Ein grüner Growth-Test löst keine 344 Commits Branch-Drift durch spirituelle Energie.

## Bereits vorhandene MKT0-Bestandteile

Die Basis `feature/mkt0-growth-os-rebased` enthält MKT0-001 bis MKT0-010, darunter:

- Shadow-Kern
- Daten- und Event-Store-Verträge
- Analytics und Growth Radar
- Signal- und Empfehlungssystem
- Campaign-, Kalender- und Workflow-Orchestrator
- read-only Cockpit
- Operations, Security, Backup, Restore und Incident Readiness
- Connector Contracts und Provider Sandbox
- integrierte Shadow Runtime und Replay
- finalen Shadow-Release-Check

PR #131 ergänzt darüber:

- Factory-to-Growth-Handoff
- Produktions- und Rechtefreigaben
- Asset-Provenienz und SHA-256
- Duplikat- und Placeholder-Sperren
- Shadow-Ingest-Plan

Dieser Worker ergänzt darüber:

- konkreten Studio-/QA-/Marketing-Paketvertrag
- Plattform-, Format-, Caption-, Hook- und Veröffentlichungsfenster
- Policy- und Human-Review-Gates
- zweifache Idempotenz
- mehrfache Live-Sperren
- Shadow-End-to-End-Beweis
- Growth-Briefing zurück ans Studio

## Verbindliche Merge-Reihenfolge

### Stufe 1: bestehende Handoff-Abhängigkeit

```text
PR #131
feature/mkt1-001-factory-handoff
→ feature/mkt0-growth-os-rebased
```

PR #131 muss zuerst geprüft und gemergt werden. Dieser Worker importiert `handoff.mjs` und baut bewusst auf dessen Vertrag auf.

### Stufe 2: Worker-Integration

```text
worker/mkt0-shadow-integration
→ feature/mkt0-growth-os-rebased
```

Nach Merge von PR #131 wird der Worker-PR auf die aktualisierte MKT0-Linie retargetet oder neu basiert. Kein Force-Push ist nötig; ein sauberer Merge oder Rebase in einem kontrollierten Integrationsschritt genügt.

### Stufe 3: spätere aktuelle Produktionslinie

```text
aktualisierte isolierte Growth-Linie
→ separater Integrationsbranch von aktuellem main
→ vollständige Konfliktauflösung
→ aktuelle App-, Studio-, Recovery- und Growth-Gates
→ menschliche Review
→ erst danach möglicher Merge nach main
```

Diese Stufe ist nicht Teil dieses Workers. Wegen der dokumentierten Divergenz muss sie als eigenes Integrationspaket mit aktueller `main`-Basis ausgeführt werden.

## Konfliktrisiko

Hohes Risiko:

- `package.json`
- GitHub-Workflows
- Truth-/Evidence-Regeln
- aktuelle Recovery- und Operator-Gates

Niedriges Risiko:

- neue Dateien unter `growth-os/studio-mkt0-*`
- neues Schema unter `growth-os/contracts/`
- neue Integrationstests
- Dokumente unter `docs/integration/`

## Stop-Regeln

- kein Direktmerge dieses Branches nach `main`
- kein Löschen bestehender MKT0-Branches
- kein Force-Push
- keine Konfliktauflösung durch Verwerfen aktueller `main`-Änderungen
- keine Behauptung, PR #131 sei bereits gemergt
- keine Live-Aktivierung während der Branch-Integration
