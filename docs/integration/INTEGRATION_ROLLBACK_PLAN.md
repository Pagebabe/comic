# Integration Rollback Plan

Status: fail closed. Kein direkter Merge nach `main` ist durch dieses Dokument autorisiert.

## Rehearsal-Beweis

Der aktuelle Wegwerf-Worktree-Lauf bestätigt für alle Varianten:

```text
clean_after_rollback = true
source_worktree_clean_after = true
direct_main_merge_performed = false
pushes_performed = 0
force_pushes_performed = 0
```

## Betriebsregel

1. Integration ausschließlich auf einem frischen Branch vom verifizierten Main-Head.
2. Jeden Worker nur über den gepinnten finalen SHA übernehmen.
3. Nach jedem Integrationsblock vollständige Regression ausführen.
4. Bei Konflikt Merge abbrechen und Konfliktdateien dokumentieren.
5. Keine pauschalen `ours`- oder `theirs`-Auflösungen.
6. Kein Force-Push, keine History-Umschreibung und keine Branch-Löschung.
7. Ein fehlgeschlagener Integrationsbranch wird über normalen Revert oder einen neuen Branch ersetzt.
8. `main` bleibt unverändert, bis Combined Regression, Fresh Install, Browser, Recovery, Evidence und Rollback grün sind und ein Mensch freigibt.

## Aktuelle bekannte Stopstelle

```text
package.json
```

Sie entsteht beim Übergang von Current Main zur alten MKT0-/PR-131-Linie. Die Reparatur gehört auf einen separaten Current-main-MKT0-Reintegrationsbranch.

## Stop-Kriterien

- gebundener Head hat sich verändert,
- Main-Head hat sich verändert,
- unerwartete Konfliktdatei,
- schmutziger Worktree nach Abort oder Reset,
- fehlgeschlagene Regression,
- fehlendes Artefakt oder Digest,
- fehlende menschliche Main-Freigabe.

Jedes Stop-Kriterium setzt den Zustand auf blockiert. Grün bleibt schließlich eine technische Aussage und kein Stimmungsbild.
