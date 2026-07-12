# Episode 1 Production Run

## Zweck

Dieser Lauf beweist den vorhandenen lokalen Produktionsworkflow an der bestehenden Episode `ep_001` **„Das Zimmer“**. Er beweist Transport, Persistenz, Review, Auswahl, QA, Lettering, PDF, Package und Restore. Er beweist **keine** kreative Qualität und erteilt keinen Character-, Location- oder Style-Lock.

## Ausführungsquelle

- Repository: `Pagebabe/comic`
- Worker-Branch: `worker/episode1-proof`
- vorhandene Produktionsapp: `archive/legacy-comic-2026-07-10`
- fest gepinnter Archiv-Commit: `7266cf8df99ad811904933189666bbb827bd3ad1`
- Start: `npm run dev`
- Port: `3100`
- Testepisode: `ep_001 · Folge 1 · Das Zimmer`
- Panels: `8`

Der Runner materialisiert die Archiv-App in einem **separaten detached Git-Worktree**. Der aktuelle Branch, Worker 1, Cast-, Figuren- und Dashboard-Daten werden nicht verändert.

## Testbilder

Der Lauf erstellt neun kleine deterministische PNG-Testbilder:

- Panel 1: zwei Varianten, damit Auswahl und Austausch praktisch geprüft werden.
- Panels 2 bis 8: jeweils eine Variante.

Jede Review-Notiz trägt `TEST ASSET ONLY`. Die Bilder sind farbige technische Fixtures. Sie ersetzen keine echte Bildproduktion und dürfen nicht als Character Lock, Set Lock, Style Lock oder kreativer Reviewpass interpretiert werden.

## Praktische Prozesskette

| Nr. | Übergang | Ausführung | Beweis |
|---:|---|---|---|
| 1 | Story/Episode laden | UI `#/ricco-studio` | `ep_001`, Titel „Das Zimmer“ |
| 2 | Szenen/Panelreihenfolge prüfen | UI | Panel 1 bis 8 in numerischer Reihenfolge |
| 3 | Panel-Prompts erzeugen | UI-Schaltfläche `Alle Prompts erzeugen` | `8/8 Prompts generated` |
| 4 | Fehlende Assets erkennen | UI `#/ricco-export` | `8 fehlend`, acht sichtbare `MISSING`-Zustände |
| 5 | Bilddateien importieren | UI `#/ricco-bulk-upload` | neun lokale PNG-Dateien gespeichert |
| 6 | Reload-Persistenz prüfen | Browser-Reload | neun Bilder und Previews bleiben sichtbar |
| 7 | Erstes Finalbild wählen | UI `#/ricco-image-review` | Panel 1 Variante v1 = FINAL |
| 8 | Auswahl ändern | UI | Panel 1 v2 = FINAL, v1 wieder VARIANT |
| 9 | Restliche Finals wählen | UI | exakt ein Finalbild je Panel, `8/8` |
| 10 | QA prüfen | UI `#/ricco-qa` | 0 Blocker, 0 Warnings, 8/8 OK |
| 11 | Exportbereitschaft prüfen | UI `#/ricco-export` | Exportbereit, 0 fehlend |
| 12 | Lettering-Vorschau öffnen | UI `#/ricco-lettering` | acht Bilder und Dialoge in Panelreihenfolge |
| 13 | Print/PDF aufrufen | vorhandene UI-Schaltfläche | `window.print()` wird ausgelöst |
| 14 | PDF erzeugen | Chromium-Druckengine | valides `%PDF`-Artefakt |
| 15 | Produktionspaket exportieren | UI `#/ricco-package` | heruntergeladene JSON-Datei |
| 16 | Projekt schließen/öffnen | neue Seite im selben Browserprofil | Exportstatus bleibt bereit |
| 17 | lokalen Stand löschen | UI `#/ricco-restore` | Export fällt korrekt auf acht fehlende Assets zurück |
| 18 | Package wiederherstellen | UI | neun Bilder und acht Finals restauriert |
| 19 | Package rekonstruieren | UI | normalisierter SHA-256 entspricht Originalpackage |

## Ausführung

```bash
bash scripts/run_episode1_production_proof.sh
```

Der Runner führt innerhalb des isolierten Archiv-Worktrees exakt aus:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Erwartete Artefakte

Unter `output/episode1-proof/`:

- `episode1-run-manifest.json`
- `episode1-production-package.json`
- `episode1-lettering-preview.pdf`
- `episode1-reconstruction-proof.json`
- `episode1-proof-summary.json`
- `episode1-qa-pass.png`
- `episode1-export-ready.png`
- `episode1-lettering-preview.png`
- Befehls- und Installationslogs

## Bekannte technische Wahrheit

Die geprüfte Archiv-App speichert lokale Bilddateien als Data-URLs unter `ricco-studio-images-v1` in `localStorage`. Im geprüften Archivcode wurde **keine IndexedDB-Blob-Implementierung** gefunden. Der Test nutzt absichtlich kleine PNGs und dokumentiert diese Abweichung. Eine Migration auf IndexedDB wäre ein separates Arbeitspaket und wurde hier nicht eingeschmuggelt.

## Manueller Produktionsschritt

Echte Bildgenerierung bleibt extern und manuell. Übergabeformat, Dateinamen und Rückkehr in den lokalen Workflow stehen in `MANUAL_IMAGE_GENERATION_HANDOFF.md`.

## Stop-Regeln

- keine Änderungen an kanonischen Figuren- oder Cast-Daten
- kein Dashboard-Umbau
- keine Provider-, ComfyUI-, n8n-, Supabase- oder Qdrant-Erweiterung
- keine Behauptung eines Character Locks
- der M1-Clip ist kein Character Lock
- kein Merge nach `main`
