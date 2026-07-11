# Runbook · Backup Manifest

Status: `LOCAL CONTRACT · NO REMOTE BACKUP`

## Ziel

Ein vollständiges, sortiertes und hashprüfbares Backup-Manifest erzeugen, ohne Daten oder Secrets in externe Systeme zu übertragen.

## Ablauf

1. Tenant, Projekt, Backup-ID, Source Commit und Erstellungszeit festlegen.
2. Artefaktliste vollständig erfassen.
3. Für jedes Artefakt Pfad, SHA-256, Größe, Retention-Klasse und Restore-Pflicht dokumentieren.
4. Pfade lexikografisch sortieren.
5. deterministische Restore-Reihenfolge vergeben.
6. Artefaktanzahl und Gesamtgröße berechnen.
7. Manifest-Hash erzeugen.
8. Manifest mit `verifyBackupManifest` gegenprüfen.
9. Evidence-Referenz auf den Checklauf dokumentieren.

## Pflichtartefakte

Mindestens erforderlich:

- append-only Eventdaten oder deren Export
- aktuelle Projektionen
- Konfigurations- und Regelversionen
- Evidence-Metadaten
- Restore-relevante Schemas

## Ablehnung

Das Manifest ist ungültig bei:

- doppeltem Pfad
- leerer Artefaktliste
- falschem oder fehlendem SHA-256
- falscher Restore-Reihenfolge
- inkonsistenter Größe oder Anzahl
- nicht passendem Manifest-Hash

## Retention

Jedes Artefakt muss genau einer expliziten Retention-Klasse zugewiesen sein. `LEGAL_HOLD` erlaubt keine automatische Löschung.

## Nicht erlaubt

- Secret-Werte im Manifest
- Behauptung eines Remote-Backups
- Erfolgsmeldung ohne Manifestprüfung
- automatische Datenlöschung nach Manifest-Erzeugung
