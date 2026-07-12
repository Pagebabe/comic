# Worker 2 Episode Proof Report

## Entscheidung

`EPISODE_PIPELINE_BLOCKED`

Diese Entscheidung ist vorläufig und absichtlich fail-closed. Der Browserlauf, die vier geforderten npm-Gates, das PDF, das Production Package und der Restore-Hash müssen erst in GitHub Actions vollständig grün vorliegen. Danach wird dieser Bericht mit den exakten Lauf-, Artefakt- und Commitdaten aktualisiert.

## Getestete Episode

- Serie: `Ricco im Haus`
- Episode: `ep_001`
- Folge: `1`
- Titel: `Das Zimmer`
- Panels: `8`
- produktionsreifste vorhandene Quelle: `archive/legacy-comic-2026-07-10`
- gepinnter Archiv-Commit: `7266cf8df99ad811904933189666bbb827bd3ad1`

## Vollständige Prozesskette

```text
Story/Episode
→ Panels in Reihenfolge
→ acht Panel-Prompts
→ neun lokale PNG-Testbilder
→ Image Review
→ Panel-1-Auswahl v1
→ Austausch auf v2
→ exakt acht Finalbilder
→ QA
→ Export Gate
→ Lettering-Vorschau
→ Browser Print / PDF
→ Production Package
→ Projekt erneut öffnen
→ lokalen Stand löschen
→ Package Restore
→ normalisierter Package-Hashvergleich
```

## Erfolgreich statisch geprüft

- vorhandene Episode `ep_001 · Das Zimmer`
- acht vorhandene Panels
- vorhandener Prompt Builder
- vorhandene Bulk-Upload-Seite
- vorhandene Image-Review-Auswahl mit exklusivem Final pro Panel
- vorhandenes QA-Gate
- vorhandenes Export-Gate
- vorhandene Lettering-Vorschau mit `window.print()`
- vorhandener Package-Download
- vorhandener Package-Restore
- isolierter Worktree-Runner ohne Reset oder Löschung des Worker-Branches

## Noch praktisch zu beweisen

- vollständiger Browserlauf
- Reload-Persistenz
- Auswahlwechsel
- 8/8 QA und Export
- tatsächliches PDF
- tatsächlicher Package-Download
- Löschen und Restore
- identischer normalisierter Package-Hash
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`

## Gefundene Defekte und Abweichungen

### D1 · Auftragsannahme widerspricht geprüftem Archivcode

Der Auftrag nennt echte Blobs in IndexedDB. Der geprüfte Produktionsapp-Commit speichert lokale Bilddateien als Data-URLs in `localStorage` unter `ricco-studio-images-v1`.

Auswirkung:

- kleine Testbilder sind technisch testbar
- große reale Produktionsbilder können Browser-Quota-Grenzen erreichen
- IndexedDB-Blob-Persistenz ist mit diesem Commit nicht bewiesen

Behandlung:

- kein verdeckter Speicherumbau in Worker 2
- kleine deterministische PNG-Fixtures
- ehrliche Dokumentation im Manifest und Handbuch
- separate spätere Migration erforderlich, falls reale Bilder die Quota überschreiten

### D2 · Exportseite erzeugt selbst keine PDF-Datei

`RiccoExport` prüft Reihenfolge und Bereitschaft. Die PDF-Ausgabe erfolgt über `RiccoLettering` und Browser Print.

Behandlung:

- vorhandenen Print-Button praktisch aufrufen
- zusätzlich echtes PDF mit Chromium aus derselben Lettering-Seite erzeugen
- keine Behauptung eines eingebauten serverseitigen PDF-Exports

### D3 · Promptstatus ist UI-Zustand

Die acht generierten Prompts werden in `RiccoStudio` angezeigt, aber nicht als eigener persistenter Browserdatensatz gespeichert. Das Production Package rekonstruiert sie deterministisch aus dem Code-Seed.

Behandlung:

- Promptanzeige im Browser prüfen
- Package-Inhalt prüfen
- keine erfundene Promptpersistenz behaupten

## Behobene Defekte

Noch keine Änderung am Produktcode. Worker 2 repariert nur Blocker, die im praktischen Lauf tatsächlich auftreten. Der bisherige Umfang ergänzt Proof-Runner, Testdatensatz, Dokumentation und fail-closed Artefaktprüfung.

## Nicht lösbare externe Abhängigkeiten

- echte kreative Bildgenerierung
- kreative Character-/Location-/Style-Abnahme
- möglicher Produktionsspeicherumbau auf IndexedDB

Diese Schritte werden nicht simuliert. Der M1-Clip ist kein Character Lock.

## Testbilder

Neun deterministische PNG-Fixtures werden im Lauf erzeugt. Jede finale Review-Notiz beginnt mit `TEST ASSET ONLY`. Sie beweisen ausschließlich Dateitransport, Persistenz, Review, Auswahl, Export und Restore.

## Exportbeweis

Nach erfolgreichem Lauf erwartet:

- `episode1-lettering-preview.pdf`
- `episode1-production-package.json`
- `episode1-reconstruction-proof.json`
- `episode1-proof-summary.json`
- QA-, Export- und Lettering-Screenshots

## Testergebnisse

| Gate | Status |
|---|---|
| `npm run lint` | PENDING |
| `npm run typecheck` | PENDING |
| `npm test` | PENDING |
| `npm run build` | PENDING |
| Artefaktprüfung | PENDING |

## Geänderte Dateien

Nur Worker-2-Proofdateien:

- `docs/production/EPISODE_1_PRODUCTION_RUN.md`
- `docs/production/EPISODE_1_ACCEPTANCE_CHECKLIST.md`
- `docs/production/MANUAL_IMAGE_GENERATION_HANDOFF.md`
- `docs/production/EXPORT_AND_RESTORE_PROOF.md`
- `docs/reports/WORKER_2_EPISODE_PROOF_REPORT.md`
- `testdata/episode1/episode1-test-dataset.json`
- `tests/episode1-proof/episode1-production.spec.ts`
- `tests/episode1-proof/episode1.playwright.config.ts`
- `tests/episode1-proof-contract.test.mjs`
- `scripts/episode1-proof/episode1ProofLint.mjs`
- `scripts/prepare_episode1_proof_workspace.mjs`
- `scripts/run_episode1_production_proof.sh`
- `scripts/verify_episode1_proof_artifacts.mjs`
- `.github/workflows/episode1-production-proof.yml`

Nicht geändert:

- Cast- und Figurendaten
- Worker-1-Kanonquellen
- Dashboard-Quellen
- Produktionsapp im Archiv
- `main`

## Exakter Commit-Hash

`PENDING_FINAL_PROOF_COMMIT`

Der endgültige Hash wird nach grünem Lauf als letzter Dokumentationscommit eingetragen. Es erfolgt kein Merge nach `main` und kein Force-Push.
