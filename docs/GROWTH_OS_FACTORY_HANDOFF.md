# Comic Growth OS · Factory-to-Growth Shadow Handoff

Status: `MKT1-001 IMPLEMENTED · SYNTHETIC PROOF PENDING · LIVE AND MAIN INTEGRATION BLOCKED`

Tracking: Issue #130  
Basis: `feature/mkt0-growth-os-rebased`  
Modus: `shadow`

## Zweck

Der Handoff-Vertrag definiert die spätere, kontrollierte Übergabe einer ausdrücklich freigegebenen Comic-Factory-Episode an den isolierten Growth OS. Er ist kein Live-Connector und kein Merge in die Produktionslinie.

Bis eine reale, menschlich freigegebene Pilotepisode existiert, verarbeitet die Implementierung ausschließlich synthetische Fixtures.

## Eingangsvertrag

Ein Factory-Export enthält:

- unveränderliche Projekt-, Serien-, Episoden- und Export-IDs
- Contract- und Schema-Version
- Titel und Dauer
- Package-, Canon- und Evidence-Referenzen
- genau ein Master-Video
- optionale Untertitel-, Thumbnail- und Transcript-Assets
- SHA-256, MIME-Typ, Bytegröße und Provenienz je Asset
- menschliche Produktionsfreigabe
- getrennte Rechtezustände für Visuals, Musik, Stimmen und Fremdmaterial
- Content-Tags, Warnungen und Sensitivitätsmarker

## Zustände

```text
WAITING_FOR_FACTORY_EXPORT
INVALID_EXPORT
RIGHTS_REVIEW_REQUIRED
PRODUCTION_APPROVAL_REQUIRED
HASH_MISMATCH
READY_FOR_SHADOW_INGEST
SHADOW_INGESTED
QUARANTINED
```

`LIVE_READY`, `PUBLISHED`, `APPROVED_MASTER` und `CANON_APPROVED` sind keine Handoff-Zustände.

## Entscheidungsreihenfolge

1. Fehlt der Export, bleibt das System `WAITING_FOR_FACTORY_EXPORT`.
2. Struktur-, Schema-, Provenienz- oder Referenzfehler ergeben `INVALID_EXPORT`.
3. Abweichende beobachtete SHA-256-Werte ergeben `HASH_MISMATCH`.
4. Doppelte Export-IDs oder Package-Hashes werden `QUARANTINED`.
5. Technische Platzhalter und sensible Inhalte werden `QUARANTINED`.
6. Fehlende menschliche Produktionsfreigabe ergibt `PRODUCTION_APPROVAL_REQUIRED`.
7. Unbekannte oder eingeschränkte Rechte ergeben `RIGHTS_REVIEW_REQUIRED`.
8. Nur vollständig gültige Eingaben werden `READY_FOR_SHADOW_INGEST`.

Auch `READY_FOR_SHADOW_INGEST` erlaubt ausschließlich einen read-only Ingest-Plan. Publishing bleibt false.

## Referenzsicherheit

Erlaubt sind nur:

```text
fixture://
studio-export://
```

Blockiert werden:

- HTTP- und HTTPS-Referenzen
- `file://`
- Pfad-Traversal
- technische SVG-Platzhalter
- Dashboard- und Testvisuals
- fehlende Asset-Provenienz

Der Validator liest und schreibt keine referenzierten Assetbytes.

## Synthetischer Check

```bash
npm run test:growth-handoff
npm run growth:handoff-check
```

Der Offline-Check erzeugt:

```text
output/growth-os/mkt1-factory-handoff.json
output/growth-os/mkt1-factory-handoff.html
```

Der HTML-Report ist statisch, escaped, CSP-geschützt und enthält weder Scripts noch externe Requests.

## Harte Grenzen

- kein Merge in `main`
- keine reale Pilotepisode behauptet
- kein Netzwerk, OAuth, Secret oder Provider
- kein echtes Scheduling oder Publishing
- keine Datei wird kopiert, verschoben, gelöscht oder ausgeführt
- keine Canon-, Figuren-, Set-, Voice-, Panel- oder Episodenmutation
- keine automatische Produktions-, Rechte- oder Masterfreigabe
- Human Gates, Kill Switch und Incident Lockdown bleiben bindend

## Was ein grüner Test beweist

- der Vertrag ist deterministisch
- bekannte Fehler enden fail-closed
- Hashes, Provenienz, Approval und Rechte werden getrennt geprüft
- ein gültiger synthetischer Export erzeugt einen Shadow-Ingest-Plan
- Live-Aktionen und Mutationen bleiben ausgeschlossen

## Was ein grüner Test nicht beweist

- keine reale Factory-Integration
- keine echte Pilotepisode
- keine produktive Datenbank
- kein Provider oder Plattformkonto
- keine OAuth-Freigabe
- keine reale Rechteprüfung
- keine Live-Readiness
- keine reale Marketingperformance
