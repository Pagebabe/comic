# Comic Factory · Evidence Chain Policy

## Autorität

Die maschinenlesbare Programmautorität ist:

```text
project/program-evidence-manifest.json
```

PR-Titel, Chat-Zusammenfassungen und Screenshots allein sind keine Freigabe.

## Grün-Regel

Grün benötigt gleichzeitig:

1. exakten Commit-SHA,
2. erfolgreichen Pflichtworkflow,
3. prüfbares, nicht abgelaufenes Artefakt mit Digest,
4. passenden offenen/ungemergten PR-Zustand,
5. dokumentierte Nichtbehauptungen,
6. aktuelle nachgelagerte Integrationsbeweise.

Ändert sich ein gebundener Head, werden Evidence Gate und Merge Rehearsal ungültig.

## Fail-closed

Unbekannt, veraltet oder nicht ausgeführt bedeutet blockiert. Ein technischer Test ersetzt keine kreative oder menschliche Freigabe.

## Schutzgrenzen

- kein direkter Merge nach `main`
- kein automatischer Canon- oder Master-Lock
- kein Live-Publishing ohne Shadow-Beweis, Human Gate, Kill Switch und Rollback
- lokaler Assetscan muss auf dem echten Mac ausgeführt werden
- Worker-2-Testassets dürfen niemals als echte Pilotassets klassifiziert werden

## Nächste Linie

```text
aktuelle Evidence
→ aktuelle Merge Rehearsal
→ kontrollierter Integrationsbranch
→ kombinierte Regression und Rollback
→ lokaler Assetscan
→ menschliche Masterfreigaben
→ echte Pilotepisode
→ Growth Shadow
→ begrenzter Live-Pilot
```
