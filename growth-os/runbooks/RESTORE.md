# Runbook · Restore Drill

Status: `DRY RUN ONLY · NO REAL RESTORE`

## Vorbedingungen

- Betriebsmodus ist `PAUSED` oder `INCIDENT_LOCKDOWN`
- globaler Kill Switch ist aktiv
- Backup-Manifest ist verifiziert
- Tenant- und Projekt-Scope stimmen
- Rollback-Punkt ist dokumentiert
- menschlicher Owner ist benannt

## Ablauf

1. Restore-Plan aus verifiziertem Manifest erzeugen.
2. nur `requiredForRestore`-Artefakte übernehmen.
3. Artefakte in deterministischer Reihenfolge prüfen.
4. Pfad, SHA-256 und Größe vergleichen.
5. Event-Kette und Scope verifizieren.
6. read-only Startup als geplanten Verifikationsschritt dokumentieren.
7. Ergebnis als `PASS` oder `FAILED` ausgeben.
8. Evidence Packet ergänzen.

## Fehlerstatus

- `MISSING`
- `HASH_MISMATCH`
- `SIZE_MISMATCH`

Jeder Fehler hält den Restore blockiert.

## Erfolgsstatus

`PASS` bedeutet ausschließlich, dass der synthetische Drill die bereitgestellten Metadaten erfolgreich geprüft hat. Es bedeutet nicht, dass ein produktives System wiederhergestellt wurde.

## Rollback

Der Rollback-Punkt muss vor jedem Restore-Versuch dokumentiert sein. Ein produktiver Restore benötigt später einen eigenen technischen Adapter, eine isolierte Umgebung und einen gesonderten Abnahmeprozess.

## Nicht erlaubt

- Restore im Modus `SHADOW`
- automatischer echter Restore
- Rückkehr in den Normalbetrieb ohne menschliche Abnahme
- Überschreiben der ursprünglichen Evidence
