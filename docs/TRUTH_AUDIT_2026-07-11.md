# Comic Factory · Wahrheits-Audit vom 11. Juli 2026

Status: `AUDIT COMPLETE · LINE RESET REQUIRED`

Repository: `Pagebabe/comic`

## Auditregel

Dieser Audit bewertet nicht, ob Dateien intern konsistent sind. Er trennt:

```text
Behauptung
→ unabhängige Quelle
→ tatsächlicher Code oder Diff
→ Test
→ Laufartefakt
→ sichtbare Gegenprüfung
→ ehrlicher Status
```

Selbstgeschriebene Prozentzahlen, Ledger und Statusdateien sind Quellen über die Absicht des Systems. Sie sind kein unabhängiger Beweis ihrer eigenen Vollständigkeit.

## Hauptbefunde

### 1. Die frühere 100-Prozent-Aussage war überzogen

`project/historical-pr-evidence.json` und die zugehörigen Validatoren prüften eine fest eingetragene Liste bis PR #30. Spätere PRs #31, #32, #33 sowie der inzwischen geschlossene Draft-PR #35 lagen außerhalb dieser Liste.

Der damalige Wert bedeutete höchstens:

```text
100 Prozent der damals ausgewählten Ledger-Einträge wurden klassifiziert.
```

Er bedeutete nicht:

```text
100 Prozent der tatsächlichen und fortlaufenden Repository-Historie sind bewiesen.
```

Die aktuelle Projektwahrheit verwendet deshalb keine Prozentzahl.

### 2. Die frühere Produktionsapp wurde aus main entfernt

Commit `3979c65c4cc15f4ed4b7c72c92f559ace1c747ac` ersetzte die Vite-/React-Produktionsapp durch ein kleineres Director-Dashboard.

Aus `main` verschwanden unter anderem:

- Ricco Control und Ricco Studio
- Prompt Queue und ComfyUI-Produktionsplanung
- Asset Import und Image Review
- QA, Lettering und Export
- Production Package und Restore
- zahlreiche Frame-, Queue-, Review- und Assembly-Skripte

Der erhaltene Branch `archive/legacy-comic-2026-07-10` besitzt diese Produktionsbasis weiterhin. Er ist eine Rettungsquelle, aber nicht vollständig end-to-end verifiziert und darf nicht blind gemergt werden.

### 3. Der heutige main-Stand ist eine funktionierende Shell, nicht die vollständige Comic Factory

Belastbar vorhanden sind:

- GitHub-Pages-Dashboard
- sichere Director-Kommandos
- technischer M1-Medienrender
- Timing- und SRT-Export
- Read-only-Recovery-Werkzeuge
- Deployment-Screenshots

Nicht vorhanden ist der komplette frühere Produktionsloop von Studio über Review und QA bis Package und Restore.

### 4. Der Pilot-Canon ist nicht eindeutig autorisiert

Mindestens zwei reale Projektlinien existieren:

- `Das Zimmer`: acht Panels, Ricco, Basti Prenzl, Jule und Don Miau
- `Der Solidarpreis`: sechs Panels, Ricco, Vermieter und Mutter als Telefonstimme

Für `Das Zimmer` existiert deutlich mehr Repository-Material. Das beweist Wiederverwendbarkeit, aber keine abschließende menschliche Auswahl. Für `Der Solidarpreis` fehlt die ursprüngliche Quelle im aktuellen Git-Verlauf.

Die bisher als gesperrt bezeichneten Bibles, Visual-Briefs und das 45,5-Sekunden-Blueprint werden deshalb als Kandidatenmaterial weitergeführt.

### 5. Grüne Tests bewiesen überwiegend interne Vertragstreue

Die Tests bewiesen unter anderem, dass:

- das Dashboard seinen Daten folgt,
- der M1-Clip reproduzierbar ist,
- Recovery-Werkzeuge schreibgeschützt arbeiten,
- Timing-Daten konsistent exportiert werden,
- die selbst definierte Evidence-Datei ihren eigenen Regeln entspricht.

Sie bewiesen nicht automatisch, dass:

- die gewählte Produktarchitektur richtig war,
- die vollständige Produktionsfunktion erhalten blieb,
- der Pilot vom Nutzer endgültig freigegeben war,
- die Repository-Historie dynamisch vollständig erfasst wurde.

## Zurückgezogene Aussagen

Diese Aussagen dürfen nicht mehr als aktuelle Wahrheit verwendet werden:

- `Beweiskette 100 Prozent geschlossen`
- `vollständiger historischer PR-Backfill`
- `Das Zimmer ist endgültig ausgewählter Pilot`
- `vier Text-Bibles sind endgültig vom Nutzer freigegeben`
- `das aktuelle Dashboard ist die vollständige Comic Factory`
- `die Produktionspipeline wurde ohne Funktionsverlust verbessert`

## Belastbarer Ist-Zustand

| Bereich | Status |
| --- | --- |
| GitHub Pages | bewiesen online |
| aktuelles main | Audit-/Status-Shell, technisch funktionsfähig |
| frühere Produktionsapp | im Archiv erhalten, nicht vollständig verifiziert |
| Pilot-Canon | Entscheidung erforderlich |
| Character-Master | 0/4 |
| Location-Master | 0/4 |
| freigegebene Stimmen | 0/3 |
| fertige Episode | nein |
| Recovery-Bildfund | 0 belastbare Master im geprüften Bestand |
| Evidence-Abdeckung | partiell und quellgebunden, keine Prozentzahl |

## Konsequenz

Die verbindliche Reihenfolge lautet:

1. öffentlichen Wahrheitsstatus bereinigen,
2. Pilotentscheidung vorbereiten und menschlich treffen,
3. minimalen Produktionsloop atomar aus dem Archiv retten,
4. echten Fire Test ausführen,
5. erst danach visuelle und akustische Master erzeugen,
6. erst nach einer fertigen Folge über Growth oder zusätzliche Plattformen sprechen.

## Sicherheits- und Scope-Grenze

Dieser Audit und die Korrekturen betreffen ausschließlich `Pagebabe/comic`. Andere Repositories sind außerhalb des Scopes. Eine universelle historische Aussage, dass niemals ein anderes Repository verändert wurde, wird ausdrücklich nicht behauptet.
