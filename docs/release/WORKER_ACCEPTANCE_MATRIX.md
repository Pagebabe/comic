# Comic Factory · Worker Acceptance Matrix

Maschinenquelle: `project/program-evidence-manifest.json`

| Worker | Rolle | Branch / Head | PR | Bericht | CI / Artefakte | Abhängigkeit | Abnahme | Merge | Live |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Canon Lock | `worker/canon-lock` / `b891d36c32c2a38badcfb897f46e6f1a29f13e70` | #138, offen, Draft, nicht gemergt | `docs/reports/WORKER_1_CANON_REPORT.md` vorhanden | 3 erfolgreiche Runs, 3 verifizierte Digests | keine | `READY_FOR_REVIEW_NOT_MERGED` | nein | nein |
| 2 | Episode-1-End-to-End-Beweis | `null` / `null` bis akzeptierter Abschlussbericht | `null` | fehlt | fehlt | Abschlussbericht erforderlich | `PENDING` | nein | nein |
| 3 | Studio → MKT0 Shadow Integration | `worker/mkt0-shadow-integration` / `c8c0adcef30645142190c19d8fbc6903fe177ae7` | #139, offen, nicht gemergt | `docs/reports/WORKER_3_MKT0_INTEGRATION_REPORT.md` vorhanden | 3 erfolgreiche Runs, 3 verifizierte Digests | PR #131 offen und ungemergt | `MKT0_INTEGRATION_MERGE_READY`, aber Dependency Gate offen | nein | nein |

## Worker 1

Akzeptiert wurden:

- Branch- und Head-Bindung;
- offener, ungemergter PR #138 gegen `main`;
- Abschlussbericht mit Status `READY_FOR_REVIEW_NOT_MERGED`;
- drei erfolgreiche Workflows;
- drei GitHub-Artefakte mit SHA-256-Digest;
- verlangte Repository-Artefakte am exakten Worker-Head.

Nicht akzeptiert wurden Main-Merge, Live-Aktivierung, Episode-Fertigstellung oder visuelle Masterfreigaben.

## Worker 2

Worker 2 bleibt absichtlich unvollständig:

```text
branch = null
head_sha = null
pull_request = null
report_path = null
status = PENDING
verified = false
```

Ein inzwischen sichtbarer Entwurfsstand ersetzt den vom Auftrag verlangten echten Abschlussbericht nicht. Unbekannte Finalwerte werden deshalb nicht aus einem Draft abgeleitet.

## Worker 3

Akzeptiert wurden:

- Branch- und Head-Bindung;
- offener, ungemergter PR #139;
- Abschlussbericht mit Status `MKT0_INTEGRATION_MERGE_READY`;
- drei erfolgreiche Workflows;
- drei verifizierte Workflow-Artefakte;
- harte Live-, OAuth-, Konto-, Netzwerk-, Canon- und Produktionssperren.

Nicht erfüllt ist die Merge-Abhängigkeit:

```text
PR #131
feature/mkt1-001-factory-handoff
9573757dbd9b39858ebae2b37337d2728a3455e4
PROVEN_NOT_MERGED
```

Darum bleibt Worker 3 trotz fachlicher Merge-Readiness technisch `merge_allowed = false`.

## Gesamtentscheidung

```text
PROGRAM_EVIDENCE_GATE_READY
PROGRAM_RELEASE_BLOCKED_PENDING_WORKER_2
```
