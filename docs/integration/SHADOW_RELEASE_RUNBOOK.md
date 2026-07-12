# MKT0 Shadow Release Runbook

Status: `SHADOW ONLY · NO LIVE EXECUTION`

## Voraussetzungen

- Node.js 20 oder neuer
- Branch enthält PR #131 / MKT1-001 Factory-Handoff
- keine OAuth-Secrets
- keine Plattformkonten
- keine Live-Provider
- ausschließlich synthetische Fixtures oder später separat autorisierte Studio-Exports

## Verbindlicher Prüflauf

```bash
node --check growth-os/studio-mkt0-integration.mjs
node --check growth-os/studio-mkt0-integration-fixture.mjs
node --check growth-os/studio-mkt0-integration-check.mjs
node -e "JSON.parse(require('node:fs').readFileSync('growth-os/contracts/studio-mkt0-handoff-v1.schema.json','utf8'))"
npm run test:growth-integration
npm run growth:integration-check
npm run test:growth
npm test
```

Die isolierte Growth-Linie definiert keine konventionellen `lint`, `typecheck`- oder `build`-Scripts. Der CI-Workflow protokolliert diese Abweichung in `output/growth-os/conventional-script-availability.json`, statt einen nicht vorhandenen Gate-Erfolg zu behaupten.

## Erwartete Artefakte

```text
output/growth-os/studio-mkt0-shadow-integration.json
output/growth-os/studio-mkt0-shadow-integration.html
output/growth-os/conventional-script-availability.json
```

Der JSON- und HTML-Beweis muss mindestens ausweisen:

- `READY_FOR_SHADOW`
- `SHADOW_INGESTED`
- `DUPLICATE_IGNORED`
- `INTEGRITY_FAILURE`
- `LIVE_GATE_VIOLATION`
- `PLATFORM_SCOPE_BLOCKED`
- `PRODUCTION_BRIEF_READY`
- `publishing_executed: false`
- `network_used: false`
- `oauth_used: false`
- `social_accounts_connected: false`

## Shadow-End-to-End-Ablauf

1. Synthetisches Studio-Paket erstellen.
2. Struktur und Pflichtfelder validieren.
3. Paket- und Asset-SHA-256 prüfen.
4. Produktionsstatus prüfen.
5. QA-Status prüfen.
6. Policy-Status prüfen.
7. menschliche Freigabe prüfen.
8. Plattformumfang prüfen.
9. Shadow-Variantenpläne erzeugen.
10. `SHADOW_INGESTED` protokollieren.
11. Duplikat erneut einspeisen und ohne zweiten Plan verwerfen.
12. synthetisches Analytics-Ergebnis in ein eingeschränktes Produktionsbriefing übersetzen.
13. bestätigen, dass Canon- und Produktionsmutation weiterhin verboten sind.

## Fehlerbehandlung

| Zustand | Reaktion |
|---|---|
| `INVALID_PACKAGE` | Paket zurück an Studio; keine Teilverarbeitung |
| `INTEGRITY_FAILURE` | Quarantäne und menschliche Prüfung |
| `PRODUCTION_NOT_COMPLETE` | Produktion abschließen; kein Marketingpaket |
| `QA_BLOCKED` | QA korrigieren und neu exportieren |
| `HUMAN_REVIEW_REQUIRED` | menschliche Freigabe mit Evidence nachholen |
| `POLICY_BLOCKED` | Policy-Verstoß lösen; keine Umgehung |
| `PLATFORM_SCOPE_BLOCKED` | Plattformumfang reduzieren oder separat genehmigen |
| `DUPLICATE_IGNORED` | nichts erneut planen |
| `LIVE_GATE_VIOLATION` | sofortiger Stop; Gates auf vollständig blockiert zurücksetzen |

## Stop-Regeln

Der Lauf ist abzubrechen, sobald eines davon zutrifft:

- ein Job enthält `publish_allowed: true`
- Netzwerk oder OAuth wird angefordert
- ein Konto oder Secret wird benötigt
- eine echte Plattformaktion wird vorbereitet
- Canon oder Produktionsdaten sollen automatisch verändert werden
- ein Duplikat erzeugt einen zweiten Job
- ein Hashfehler wird nur als Warnung behandelt

## Wiederholung und Recovery

Der Check ist deterministisch. Gleiches Paket plus gleicher Zeitparameter erzeugt denselben Report. Wiederholte Events werden über Event-ID und Paket-Hash abgefangen. Es gibt keine externe Nebenwirkung, die zurückgerollt werden müsste. Falls der Artefaktlauf fehlschlägt, werden ausschließlich die generierten Dateien unter `output/growth-os/` verworfen und der Check erneut ausgeführt.
