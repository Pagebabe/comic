# Comic Factory · Fresh-Install-Drill

Status: `AUTOMATED DRILL DEFINED · SECOND-PERSON OBSERVATION STILL REQUIRED`

Tracking: Issue #115  
Programm: Issue #101  
Readiness: Issue #95  
Gate: `PR1 · Installation und erster Start reproduzierbar`

## Zweck

Der Drill beweist, dass der exakte aktuelle Commit nicht nur in einem bereits benutzten Entwicklerordner funktioniert. Er erzeugt einen neuen temporären Clone, lehnt alte Dependencies und Build-Artefakte ab, installiert die gesperrten Studio-Abhängigkeiten, baut das Studio, startet den installierten Vite-Preview-Server und führt die vorhandenen Studio-, Academy- und Readiness-Browserprüfungen aus.

Ein grüner automatisierter Drill macht PR1 nicht automatisch `CLOSED_VERIFIED`. Dafür muss weiterhin eine zweite Person den Lauf auf einer unterstützten frischen Maschine beobachten.

## Voraussetzungen

- macOS oder Linux
- Git
- Node.js 20 oder neuer
- npm
- Internetzugang beim ersten Lauf für npm und Playwright Chromium
- ausreichend freier Speicher für einen temporären Clone, Dependencies und Browser

Für den reinen Studio-Installationsdrill sind keine API-Schlüssel, keine Cloud-Konten und keine Bildmodelle erforderlich.

## Ein Kommando

Im Repository-Ordner:

```bash
npm run drill:fresh-install
```

Der Quellordner wird nicht gelöscht oder zurückgesetzt. Der Drill arbeitet in einem neu erstellten temporären Verzeichnis und entfernt dieses nach Abschluss. Zum Debuggen kann der Clone behalten werden:

```bash
npm run drill:fresh-install -- --keep-temp
```

## Was tatsächlich ausgeführt wird

1. Node-, npm- und Git-Version erfassen.
2. Exakten aktuellen Commit bestimmen.
3. Repository ohne Hardlinks und ohne wiederverwendeten Checkout klonen.
4. Exakten Commit detached auschecken.
5. Vorhandene `node_modules`, `dist`, `output` oder `_site` als Kontamination ablehnen.
6. `npm --prefix studio-app ci` ausführen.
7. Playwright Chromium installieren.
8. `npm --prefix studio-app run build` ausführen.
9. Den gebauten Stand mit `npm --prefix studio-app run preview` auf einem freien lokalen Port starten.
10. Studio-Smoke auf Desktop und Mobil ausführen.
11. Academy-Smoke auf Desktop und Mobil ausführen.
12. Readiness-Smoke auf Desktop und Mobil ausführen.
13. Laufzeiten, Umgebung, Logs, Commitbindung und SHA-256-Werte der Browserbelege schreiben.

## Ergebnis

Maschinenlesbarer Report:

```text
output/fresh-install/fresh-install-report.json
```

Weitere Belege:

```text
output/fresh-install/logs/
output/fresh-install/proof/
```

Der Report muss enthalten:

- `status: PASS`
- identischen `sourceCommit` und `cloneCommit`
- ausschließlich `false` in `freshBeforeInstall`
- jeden Pflichtschritt mit `PASS`
- `firstStartServer: vite-preview`
- Plattform, Architektur, Node-, npm- und Git-Version
- gehashte Browserbelege
- weiterhin falsche Production-, Beginner-, Creative-, Image-Generation- und Growth-OS-Freigaben

## Fehlerbehandlung

Bei einem Fehler bleibt ein `FAIL`-Report mit dem letzten ausgeführten Schritt und getrennten stdout-/stderr-Logs zurück. Der Drill darf keinen Fehler als partiellen Erfolg umdeuten.

Typische Ursachen:

- Node älter als Version 20
- fehlendes `studio-app/package-lock.json`
- npm- oder Browserdownload nicht erreichbar
- Chromium-Systemabhängigkeiten fehlen
- Buildfehler
- Vite-Preview kann keinen freien lokalen Port öffnen
- lokaler Browser-Smoke erkennt eine Status- oder UI-Regression
- Clone enthält vor der Installation unerlaubte Altartefakte

## Zweite-Person-Abnahme

Für die spätere Schließung von PR1 muss eine Person, die nicht an der Implementierung beteiligt war, den Drill auf einer frischen unterstützten Maschine ausführen. Zu dokumentieren sind:

- Testperson und Beobachter
- Datum und Uhrzeit
- Betriebssystem und Gerät
- exakter Commit
- verwendetes Kommando
- Report und Workflow-Artefakt
- jede angeforderte Hilfe
- sichtbarer erster Start im Browser

Bis dieser Nachweis existiert, bleibt PR1 `PARTIAL`, selbst wenn alle automatisierten Läufe grün sind. Automatisierung kann viel, aber sie kann nicht glaubwürdig behaupten, ein unvorbereiteter Mensch zu sein. Menschen schaffen das schon selbst erstaunlich zuverlässig.

## Nicht bewiesen

Ein grüner Fresh-Install-Drill beweist nicht:

- Anfängerreife
- Production Readiness
- Character-, Location- oder Voice-Master
- kreative Qualität
- eine fertige Episode
- Growth-OS-Integration
- Live-Publishing
