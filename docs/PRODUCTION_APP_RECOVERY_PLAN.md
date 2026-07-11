# Comic Factory · Produktionsapp-Rettungsplan

Status: `ACTIVE PLAN · LR1 HUMAN DECISION REQUIRED`

Rettungsquelle: `archive/legacy-comic-2026-07-10`  
Aktuelle Autorität: `project/truth-state.json`  
Aktives Tracking: Issue #38

## Ziel

Die frühere Produktionsschleife wird gezielt zurückgeführt, ohne den Archivbranch blind auf `main` zu kippen und ohne Kandidatenmaterial automatisch zum Canon zu erklären.

## Zielarchitektur

Während der Rettung:

```text
/                   ehrlicher Status- und Recovery-Leitstand
/studio/             schrittweise wiederhergestellte Produktionsapp
project/             gemeinsame maschinenlesbare Projektwahrheit
proof/               Lauf- und Sichtbeweise
```

Nach bestandenem Fire Test:

```text
/                   Produktionsapp
/status/             kleiner Wahrheits- und Systemstatus
```

Die Übergangsroute `/studio/` darf nicht zu einer dauerhaften zweiten Produktarchitektur werden.

## Nicht übernehmen

- Growth OS
- Social Posting
- neue Backend-Umbauten
- Supabase-Zwang
- ungeprüfte ComfyUI-Automation
- alte Canon-Locks ohne menschliche Auswahl
- technische SVG-Porträts als Figurenmaster
- alle Archivdateien in einem einzigen Merge

## Einheitliche Rettungsreihenfolge

### LR0 · Truth Reset · abgeschlossen

Geliefert:

- `project/truth-state.json`
- `project/canon-candidates.json`
- bereinigte README und öffentliche Statusseite
- keine aktuelle Prozentbehauptung
- post-deploy Closure unter `project/line-reset-closure.json`

Beweis:

- PR #37
- CI `29133307545`
- Merge `47b513c31d5326efdf5bd8c81e835233f97b6b47`
- Pages `29143665894`

### LR1 · Pilotentscheidung · aktiv

Vor jeder produktspezifischen Rettung wird genau eine Pilotlinie menschlich ausgewählt.

Kandidaten:

1. `Das Zimmer`
2. `Der Solidarpreis`

Gate:

- neutrale Gegenüberstellung vorhanden
- Quellenlage und offene Evidenz sichtbar
- explizite menschliche Auswahl dokumentiert
- exakt ein Kandidat aktiv
- der andere Kandidat archiviert, nicht gelöscht
- keine Bild-, Voice- oder Episodenfreigabe aus der Auswahl abgeleitet

### LR2 · Studio Foundation retten

Erst nach LR1 gezielt aus dem Archiv übernehmen:

- Vite-/React-Grundgerüst
- `src/main.tsx`
- `src/App.tsx`
- neutrales Routing
- gemeinsame Typen
- Basislayout
- `/studio/`-Route

Noch nicht übernehmen:

- alle Seiten auf einmal
- Backendadapter
- ComfyUI-Runner
- ungeprüfte Produktionsdaten als Canon

Gate:

- `npm ci`
- TypeScript-Build
- Vite-Build
- Playwright-Smoke-Test
- öffentliche `/studio/`-Route
- Statusroute bleibt funktionsfähig

### LR3 · Minimalen Studio-bis-Restore-Loop retten

In dieser Reihenfolge:

1. Control
2. Studio
3. Prompt Queue
4. Asset Import
5. Image Review
6. QA Gate
7. Lettering
8. Production Package
9. Restore

Jede Stufe ist ein eigener Pull Request. Die nächste beginnt erst nach Build, Test und sichtbarer Prüfung der vorherigen.

Gate:

```text
ausgewähltes EpisodePackage
→ Paneldaten
→ Prompt-Export
→ Testbild importieren
→ Review speichern
→ QA blockiert oder besteht korrekt
→ Lettering Preview
→ Package exportieren
→ Browserzustand löschen
→ Package erfolgreich wiederherstellen
```

### LR4 · Realer Fire Test

Ein vollständiger Test mit Platzhalterbildern, aber echter App-Funktion:

- gewähltes EpisodePackage laden
- Panels und Prompts anzeigen
- Testbilder importieren
- Varianten bewerten
- Finalbildstatus auswählen
- QA ausführen
- Lettering prüfen
- Package exportieren
- Browserzustand löschen
- Package wiederherstellen
- einfachen Video- oder PDF-Export erzeugen

Platzhalter dürfen Funktion beweisen, aber keine visuelle Qualität oder Canon-Freigabe.

### LR5 · Visual-, Set- und Voice-Locks

Erst nach bestandenem Fire Test:

- Character-Master
- Location-Master
- Stimmen
- Animatic-Panelbilder

Jede Freigabe benötigt eine sichtbare menschliche Prüfung.

### LR6 · Erster echter Pilot

Erst jetzt:

- ausgewählten Pilot mit freigegebenen Assets produzieren
- vollständige Episode exportieren
- technische, kreative und sichtbare QA abschließen

## Dateiregeln

- Archivdateien werden kopiert und angepasst, nicht direkt zum Canon erklärt.
- Jede gerettete Datei nennt Archivpfad oder Quellcommit im PR.
- Große Sammel-PRs sind verboten.
- Entfernte Funktionen werden in einer Recovery-Matrix geführt.
- Kein Test darf nur eine selbstgeschriebene Prozentzahl prüfen.
- Kandidatendaten und Produktionscode bleiben getrennt, bis LR1 abgeschlossen ist.

## Recovery-Matrix

| Funktion | Archiv vorhanden | main aktuell | Ziel |
| --- | ---: | ---: | --- |
| Studio Foundation | ja | nein | LR2 |
| Control | ja | nein | LR3.1 |
| Studio | ja | nein | LR3.2 |
| Prompt Queue | ja | nein | LR3.3 |
| Asset Import | ja | nein | LR3.4 |
| Image Review | ja | nein | LR3.5 |
| QA | ja | nein | LR3.6 |
| Lettering | ja | nein | LR3.7 |
| Package | ja | nein | LR3.8 |
| Restore | ja | nein | LR3.9 |
| M1 Technikrender | nein in gleicher Form | ja | behalten |
| Read-only Recovery | nein in gleicher Form | ja | behalten |
| Evidence-PR-Gate | nein | ja | vereinfacht behalten |

## Definition of Done der Rettung

Die Produktionsapp ist erst gerettet, wenn ein Nutzer im Browser ohne Shellwissen:

1. den ausgewählten Pilot öffnet,
2. Panels und Prompts sieht,
3. Testbilder importiert,
4. Varianten bewertet,
5. Finalbilder auswählt,
6. QA ausführt,
7. Lettering prüft,
8. ein Package exportiert,
9. den Zustand löscht,
10. das Package erfolgreich wiederherstellt.

Bis dahin lautet der Produktstatus `PRODUCTION_APP_RECOVERY_IN_PROGRESS`.
