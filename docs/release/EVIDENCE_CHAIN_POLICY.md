# Comic Factory · Evidence Chain Policy

## Autorität

Die maschinenlesbare Programmautorität ist:

```text
project/program-evidence-manifest.json
```

Chat-Zusammenfassungen, PR-Titel und einzelne grüne Checks ersetzen dieses Manifest nicht.

## Grün-Regel

Grün benötigt gleichzeitig:

1. exakten Commit-SHA,
2. beobachteten Git-Ref,
3. passenden PR- und Mergezustand,
4. erfolgreichen Pflichtworkflow,
5. prüfbares Artefakt mit Digest,
6. saubere Ancestry oder reproduzierbare Merge-Rehearsal,
7. dokumentierte Grenzen und Nichtbehauptungen.

## Integrationszustände

`merged: true` ist ohne Zielbranch unvollständig. Deshalb wird unterschieden:

```text
MERGED_TO_FACTORY_INTEGRATION
MERGED_TO_MAIN
```

PR #138 und PR #140 sind nur in `integration/factory-final-heads` integriert. PR #144 ist offen, Draft und nicht nach `main` gemergt.

## Fail-closed

- geänderter Head setzt Evidence auf blockiert;
- fehlende Ancestry setzt Evidence auf blockiert;
- unbekannter PR-Zustand ist nicht grün;
- technischer Test ist keine kreative Freigabe;
- lokaler Assetscan gilt nur nach realem Mac-Lauf;
- Growth-Konflikt `package.json` darf nicht mit pauschalem `ours` oder `theirs` gelöst werden.

## Schutzgrenzen

- kein automatischer Canon- oder Master-Lock
- kein Main-Merge ohne aktuelle Evidence und menschliche Freigabe
- kein Growth im Factory-Branch
- kein Live-Publishing ohne Shadow-Beweis, Human Gate, Kill Switch und Rollback
- keine Testassets als echte Produktionsassets

## Nächste Linie

```text
aktuelle Factory Evidence
→ lokaler Assetscan
→ menschliche Masterfreigaben
→ echte Pilotepisode
→ Current-main MKT0 Reintegration
→ Growth Shadow
→ begrenzter Live-Pilot
```
