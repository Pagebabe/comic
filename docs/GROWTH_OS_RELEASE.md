# Comic Growth OS · MKT0-010 Finaler Shadow Release

Status: `IMPLEMENTED LOCALLY · PENDING REPOSITORY CI · SHADOW RELEASE ONLY`

Tracking: Issue #87

## Abschlussziel

MKT0-010 beendet den lokalen Marketing-Systembau mit einem deterministischen Release-Candidate für MKT0-001 bis MKT0-009.

Der Abschluss unterscheidet zwei Zustände:

```text
SHADOW_RELEASE_READY
LIVE_READY
```

`SHADOW_RELEASE_READY` bedeutet:

- alle neun Module sind vorhanden und als `PROVEN` dokumentiert
- alle Evidence-Pakete sind hashprüfbar
- Runtime, Replay, Failure-Szenarien und Cockpit sind lokal reproduzierbar
- der Postgres-/RLS-Vertrag ist statisch vollständig
- Release-Report und Aktivierungscheckliste sind erzeugbar
- Netzwerk, OAuth und Live-Aktionen bleiben deaktiviert

`LIVE_READY` ist ein separater Zustand und bleibt blockiert, bis sämtliche externen Gates mit menschlich verifizierter Evidence bestanden wurden.

## Release-Manifest

Das Manifest enthält:

- Release-ID und Regelversion
- festen Generierungszeitpunkt
- Correlation-ID
- MKT0-001 bis MKT0-009
- Modulregelversionen
- Modulstatus
- CI-/Evidence-Referenz
- Artefaktpfade und SHA-256-Hashes
- Blocker
- kanonischen Manifest-Hash

Fehlende, doppelte, unerwartete oder nicht bewiesene Module blockieren den Release.

## Evidence-Verifikation

Jedes Modul wird mindestens an sein Evidence Packet gebunden:

```text
growth-os/evidence/MKT0-001.md
a...
growth-os/evidence/MKT0-009.md
```

Fehlende Dateien, abweichende Hashes oder ein manipuliertes Manifest führen zu einem harten Fehler.

## Persistenz-Readiness

Der lokale Persistenzvertrag prüft `growth-os/sql/001_growth_os_foundation.sql` auf:

- Schema `growth_os`
- 13 erforderliche Tabellen
- append-only Event-Schutz
- aktivierte Row Level Security
- Tenant-Grenze über `app.tenant_id`
- erzwungenen Shadow-Modus

Ein bestandener Check bedeutet nur `PROVEN_LOCAL_CONTRACT`.

Nicht bewiesen sind:

- Remote-Migration
- produktive Datenbank
- Cross-Tenant-RLS-Laufzeitprüfung
- Performance, Skalierung und Hochverfügbarkeit

## Produktive Gates

Die Deployment-Matrix enthält 17 getrennte Gates:

1. Remote-Datenbank
2. Migration-Dry-Run
3. RLS-Tenant-Isolation
4. Authentication
5. Managed Secret Store
6. Queue Worker
7. Scheduler Runtime
8. Provider OAuth und App-Freigaben
9. echte Webhook-Signaturprüfung
10. Remote Backup
11. echter Restore Drill
12. Observability
13. externe Alarmierung
14. externer Audit Anchor
15. signiertes Security Review
16. menschliche Live-Aktivierung
17. Integration in `main`

Jedes Gate besitzt eine Owner-Rolle. Kein Gate darf automatisch abgeschlossen werden.

Ein externes Gate kann nur `PROVEN_EXTERNAL` werden, wenn folgende Felder gemeinsam vorliegen:

- Evidence-Referenz
- Zeitstempel
- `verifiedByHuman: true`

Secret-Werte sind auch in Gate-Evidence verboten.

## Failure-Szenarien

Der Release-Check prüft:

- Kill Switch
- Auth nicht bereit
- Rate Limit
- Webhook Replay
- Manifest-Manipulation
- unzureichende Metrics
- RLS-Fehler
- Restore-Fehler

Jeder Pfad endet in `SAFE_*` und führt keine externe Aktion aus.

## Release-Artefakte

```text
output/growth-os/mkt0-final-release.json
output/growth-os/mkt0-final-release.html
```

Der HTML-Report ist:

- read-only
- responsive
- HTML-escaped
- mit restriktiver CSP versehen
- ohne Scripts, Formulare, Tracker, externe Fonts oder Netzwerkzugriffe

## Ausführbare Prüfung

```bash
node growth-os/release-check.mjs
node --test --test-concurrency=1 tests/growth-os-release.test.mjs
npm run test:growth
npm run growth:check
npm test
```

## Abschlussgrenze

Nach grüner CI darf das System als `SHADOW_RELEASE_READY` bezeichnet werden.

Es darf nicht als produktiv, live-fähig oder plattformverbunden bezeichnet werden, solange die 17 externen Gates nicht vollständig mit menschlich verifizierter Evidence bestanden sind.

`main` bleibt während der Studio-Recovery-Stop-Regel unverändert.
