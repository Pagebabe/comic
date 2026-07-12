# Worker 2 Episode Proof Report

## Entscheidung

`EPISODE_PIPELINE_PROVEN`

Der vollständige technische Episode-1-Testlauf wurde auf dem Worker-Branch erfolgreich ausgeführt. Der Beweis verwendet ausschließlich neun synthetische PNG-Fixtures mit der Kennzeichnung `TEST ASSET ONLY`. Er erteilt keine kreative oder produktive Masterfreigabe.

## Beweisgrenze

```text
TECHNICAL EPISODE PIPELINE PROOF ONLY
NO CREATIVE APPROVAL
NO CHARACTER LOCK
NO LOCATION LOCK
NO STYLE LOCK
NO VOICE LOCK
NO EXTERNAL IMAGE GENERATION
NO MAIN MERGE
```

## Getestete Episode

- Serie: `Ricco im Haus`
- Episode: `ep_001`
- Folge: `1`
- Titel: `Das Zimmer`
- Panels: `8`
- Produktionsapp: `archive/legacy-comic-2026-07-10`
- gepinnter Archiv-Commit: `7266cf8df99ad811904933189666bbb827bd3ad1`
- geprüfter Implementierungs-Head: `bdc28eef0d39075dc6bfb4d72f7358bfe4054a2f`

Die abschließende Workflow-Bindung des aktuellen PR-Heads steht im Draft-PR #140. Ein Dokumentationscommit verändert keine Produktionslogik, erzeugt aber absichtlich erneut alle vorgeschriebenen Workflows.

## GitHub-Actions-Beweis des Implementierungs-Heads

- Spezialworkflow: `Worker 2 Episode 1 Production Proof`
- Run: `29187992153`
- Ergebnis: `success`
- allgemeine Comic Factory CI: `29187992151`
- Ergebnis: `success`
- Artefakt-ID: `8258614037`
- Artefaktname: `worker2-episode1-proof-c76a52c82d43c90fc37c155a3ea92e305f376605`
- Artefakt-Digest: `sha256:b80941e879805f4b3bcecb0b236e94dca9b9043797e6b6b7c36ae77209643e65`

## Vollständig geprüfte Prozesskette

```text
Story/Episode
→ acht Panels in Reihenfolge
→ acht sichtbare Panel-Prompts
→ fehlende Assets sichtbar 8/8
→ neun lokale PNG-Testbilder importiert
→ Reload-Persistenz
→ Panel 1 zuerst v1 gewählt
→ Panel 1 auf v2 gewechselt
→ exakt acht Finalbilder
→ QA 8/8, 0 Blocker, 0 Warnings
→ Export 8/8, 0 fehlend
→ Lettering-Vorschau mit acht Panels
→ Browser Print aufgerufen
→ echtes achtseitiges PDF erzeugt
→ Production Package heruntergeladen
→ Projekt in neuer Browserseite geöffnet
→ lokalen Review-Stand gelöscht
→ wieder 8 fehlende Finalbilder sichtbar
→ neun Varianten und acht Finals restauriert
→ normalisierter Package-Hash identisch
```

## Testergebnisse

| Gate | Status |
|---|---|
| Contract-Test | PASS |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm test` | PASS |
| `npm run build` | PASS |
| Browser-Prozesskette | PASS |
| Artefaktprüfung | PASS |
| Allgemeine Comic Factory CI | PASS |

## Artefakte und Hashes

| Artefakt | SHA-256 |
|---|---|
| `episode1-run-manifest.json` | `60ab0ec6651631853eaae74296dbc64cf974b50d93fa9816247f3beec11320e9` |
| `episode1-production-package.json` | `7e2c7d27f6d404ac590142482074c355a8c824c726485df035b5148f68b29c6c` |
| `episode1-lettering-preview.pdf` | `aa467003da941f8af2ca4bd715d6d7ddf34e4950b0f87bed25e078d8dbe585ae` |
| `episode1-reconstruction-proof.json` | `5dca08d48e067420442bf1b685c423513834db529164d5fffc0e91285a812b6e` |
| `episode1-proof-summary.json` | `701faa98e1641257f10bafa862658ead5c13acd9c08b39193b62960b97a72edc` |
| `episode1-qa-pass.png` | `81324bfca0c24de217d3c4f950bce74392b2c432e0004d368152ec040ebb7151` |
| `episode1-export-ready.png` | `3e6d7be4de747b643edefb533397cbed82a6b7b3fb789d937893797953cfb6f7` |
| `episode1-lettering-preview.png` | `f9b940c05a4cac4dec0e2d722edd108d4648c141070f29b09b23873b8933613b` |

PDF-Prüfung:

- Header: `%PDF-1.4`
- Seiten: `8`
- Bytes: `58201`
- visuell geprüft: acht Seiten, je ein Panel in korrekter Reihenfolge, keine leere oder abgeschnittene Seite

## Restore-Beweis

```text
Original normalized SHA-256:
0beb4e51c2d4eb007e57fd84104cc5ace8c16d0996deb11f2093b435ea2302fe

Reconstructed normalized SHA-256:
0beb4e51c2d4eb007e57fd84104cc5ace8c16d0996deb11f2093b435ea2302fe

HASH MATCH: true
Stored images after restore: 9
Final images after restore: 8
Export ready after restore: true
```

## Reparierte Proof-Blocker

1. Der Contract-Test verlangte die wörtliche Zeichenfolge `git worktree add --detach`, während der sichere Runner `git -C "$ROOT" worktree add --detach` verwendet. Die Assertion prüft jetzt weiterhin einen detached Worktree, akzeptiert aber das explizite Arbeitsverzeichnis.
2. Der Proof-Linter suchte Router-Objektsyntax, obwohl die archivierte App Hash-Routen in einem `switch` registriert. Der Linter prüft jetzt acht konkrete Route-Komponenten-Paare.
3. Unpräzise Playwright-Textlocators zählten Elternelemente zusätzlich zu Statuslabels. Die Assertions sind auf exakte Preview-Statusfelder begrenzt.
4. Der Browserproof läuft gegen den gebauten Vite-Preview statt gegen Reacts StrictMode-Dev-Doppelmount.
5. Nach dem Auswahlwechsel werden Karten anhand des Dateinamens neu aufgelöst, weil die App ausgewählte Varianten korrekt an den Listenanfang sortiert.
6. Review-Notizen behalten die Testdateinamen, damit Auswahl und Artefaktspur eindeutig bleiben.

Kein Produktcode der archivierten App wurde geändert. Kein Gate wurde entfernt oder gelockert.

## Bekannte Produktionsgrenzen

### Speicherung

Der geprüfte Archivstand speichert lokale Bilder als Data-URLs in `localStorage` unter `ricco-studio-images-v1`, nicht als IndexedDB-Blobs. Kleine Testbilder funktionieren; reale hochauflösende Produktionsbilder können Browser-Quota-Grenzen erreichen. Ein Speicherumbau war nicht Teil dieses Auftrags.

### PDF

Die Exportseite prüft Reihenfolge und Bereitschaft. Die PDF-Ausgabe erfolgt über die Lettering-Seite und Browser Print. Der Proof ruft den vorhandenen Print-Button auf und erzeugt zusätzlich mit Chromium ein echtes PDF derselben Seite.

### Prompts

Die acht Panel-Prompts werden sichtbar erzeugt. Sie sind kein eigener persistenter Browserdatensatz; das Package rekonstruiert sie deterministisch aus dem vorhandenen Code-Seed.

## Nicht behauptet

- keine echte externe Bildgenerierung
- keine kreative Bildqualität
- kein Character-, Location-, Style- oder Voice-Lock
- keine finale Dialogfreigabe
- keine echte fertige Pilotepisode
- keine Produktionsreife der gesamten Serie
- keine Änderung an Worker-1-Kanonquellen
- keine Änderung an Growth OS
- kein Merge nach `main`
- kein Force-Push

## Scope

Nur Proof-, Test-, Workflow- und Dokumentationsdateien auf `worker/episode1-proof`. PR #140 bleibt Draft.
