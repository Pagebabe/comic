# Comic Factory · Produktionsapp-Rettungsplan

Status: `PLANNED · NOT YET IMPLEMENTED`

Quelle: `archive/legacy-comic-2026-07-10`

Ziel: Die echte Produktionsschleife zurückholen, ohne den Archivbranch blind auf `main` zu kippen und ohne den aktuellen Wahrheits- und Deploy-Schutz zu verlieren.

## Zielarchitektur

Während der Rettung:

```text
/                  ehrlicher Status- und Recovery-Leitstand
/studio/            schrittweise wiederhergestellte Produktionsapp
project/            gemeinsame maschinenlesbare Projektwahrheit
proof/              Lauf- und Sichtbeweise
```

Nach bestandenem Fire Test:

```text
/                  Produktionsapp
/status/            kleiner Wahrheits- und Systemstatus
```

Das ist eine Übergangsstruktur, keine dauerhafte zweite Produktarchitektur.

## Nicht übernehmen

- Growth OS
- Social Posting
- neue Backend-Umbauten
- Supabase-Zwang
- ungeprüfte ComfyUI-Automation
- alte Canon-Locks ohne menschliche Auswahl
- technische SVG-Porträts als Figurenmaster
- alle Archivdateien in einem einzigen Merge

## Rettungsreihenfolge

### R0 · Truth Reset

Lieferung:

- `project/truth-state.json`
- `project/canon-candidates.json`
- bereinigte README und öffentliche Statusseite
- keine aktuelle Prozentbehauptung

Gate:

- Desktop und Mobil zeigen Canon `DECISION_REQUIRED`
- Produktionsapp wird korrekt als im Archiv erhalten bezeichnet
- keine Final- oder Produktionsreife wird behauptet

### R1 · Studio Foundation

Aus dem Archiv gezielt übernehmen:

- Vite-/React-Grundgerüst
- `src/main.tsx`
- `src/App.tsx`
- Routing
- gemeinsame Typen
- Basislayout

Noch nicht übernehmen:

- alle Seiten
- Backendadapter
- ComfyUI-Runner
- alte Produktionsdaten als Canon

Gate:

- `npm ci`
- TypeScript-Build
- Vite-Build
- eine Playwright-Smoke-Route
- öffentliche `/studio/`-Seite

### R2 · Minimaler Produktionsloop

In dieser Reihenfolge zurückführen:

1. Ricco Control
2. Ricco Studio
3. Prompt Queue
4. Asset Import
5. Image Review
6. QA Gate
7. Lettering
8. Production Package
9. Restore

Jede Stufe ist ein eigener Pull Request. Die nächste Stufe beginnt erst nach Build, Test und sichtbarer Prüfung der vorherigen.

Gate für R2:

```text
Story candidate
→ Panel data
→ Prompt export
→ Testbild importieren
→ Review speichern
→ QA blockiert oder besteht korrekt
→ Lettering Preview
→ Package exportieren
→ Browserzustand löschen
→ Package wiederherstellen
```

### R3 · Canon Adapter

Erst nach menschlicher Pilotwahl:

- ausgewählten Pilot in ein neutrales `EpisodePackage` übertragen
- nicht ausgewählten Kandidaten archivieren, nicht löschen
- Character-, Location- und Dialogue-IDs vereinheitlichen
- keine Bild- oder Voice-Freigabe aus Textdaten ableiten

Gate:

- exakt ein ausgewählter Pilot
- Quellenlink zur Entscheidung
- Kandidatendaten bleiben nachvollziehbar
- Studio zeigt keine zweite aktive Episodenwirklichkeit

### R4 · Realer Fire Test

Ein vollständiger lokaler Test mit Platzhalterbildern, aber echter App-Funktion:

- acht oder sechs Panels entsprechend der gewählten Episode
- Import und Review
- QA
- Lettering
- Package Export
- Restore
- einfacher Video- oder PDF-Export

Platzhalter dürfen Funktion beweisen, aber keine visuelle Qualität oder Canon-Freigabe.

### R5 · Visual Production

Erst jetzt:

- Character-Master
- Location-Master
- Stimmen
- Animatic-Panelbilder
- erster echter Pilot

## Dateiregeln

- Archivdateien werden kopiert und angepasst, nicht direkt zum Canon erklärt.
- Jede gerettete Datei nennt ihren Archivpfad oder Quellcommit im PR.
- Große Sammel-PRs sind verboten.
- Entfernte Funktionen werden in einer Recovery-Matrix geführt.
- Kein Test darf nur eine selbstgeschriebene Prozentzahl prüfen.

## Recovery-Matrix

| Funktion | Archiv vorhanden | main aktuell | Ziel |
| --- | ---: | ---: | --- |
| Control | ja | nein | R2.1 |
| Studio | ja | nein | R2.2 |
| Prompt Queue | ja | nein | R2.3 |
| Asset Import | ja | nein | R2.4 |
| Image Review | ja | nein | R2.5 |
| QA | ja | nein | R2.6 |
| Lettering | ja | nein | R2.7 |
| Package | ja | nein | R2.8 |
| Restore | ja | nein | R2.9 |
| M1 Technikrender | nein in gleicher Form | ja | behalten |
| Read-only Recovery | nein in gleicher Form | ja | behalten |
| Evidence-PR-Gate | nein | ja | vereinfachen und behalten |

## Definition of Done der Rettung

Die Produktionsapp ist erst gerettet, wenn ein Nutzer im Browser ohne Shellwissen:

1. einen ausgewählten Pilot öffnet,
2. Panels und Prompts sieht,
3. Testbilder importiert,
4. Varianten bewertet,
5. Finalbilder auswählt,
6. QA ausführt,
7. Lettering prüft,
8. ein Package exportiert,
9. den Zustand löscht,
10. das Package erfolgreich wiederherstellt.

Bis dahin lautet der Status `PRODUCTION_APP_RECOVERY_IN_PROGRESS`.
