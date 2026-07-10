# Comic Factory Verification Report

Stand: 2026-07-10

## Ziel

Nicht nur Dateien ablegen, sondern nachweisen, welche Teile des Comic-Factory-Leitstands tatsächlich funktionieren und welche externen Gates noch offen sind.

## Bewiesen

- Repository-Neustart liegt auf `main`.
- Legacy-Code bleibt im Archivbranch erhalten.
- Aktive Produktionslinie ist M1 `Lebenszeichen`.
- Projektzustand enthält vier Figuren und acht Meilensteine.
- Genau ein Meilenstein ist aktiv.
- Dashboard-Dateien, relative GitHub-Pages-Pfade und Projektdateien werden statisch geprüft.
- Node-Syntaxprüfung ist grün.
- Bot-Befehle `/status`, `/next`, `/characters`, `/plan`, `/task` und `/render` sind getestet.
- Falsche Zugangsschlüssel werden blockiert.
- Schreibaktionen ohne Admin-Schlüssel werden blockiert.
- Provider-URLs verwenden eine explizite HTTPS-Allowlist.
- LLM- und GitHub-Aufrufe sind mit kontrollierten Mock-Antworten getestet.
- Browser-Fallback erzeugt bestätigbare GitHub-Issue-Entwürfe und führt keine versteckten Schreibaktionen aus.
- GitHub CI ist für die Runtime-Härtung und den Browser-Fallback grün.

## Externe Gates

### GitHub Pages

Der Workflow veröffentlicht das statische Dashboard. Ein unabhängiger `workflow_run`-Wächter erstellt danach automatisch genau eines dieser Issues:

- `[DEPLOY PROOF] Comic Factory Dashboard online`
- `[DEPLOY BLOCKER] Comic Factory Dashboard not online`

Erst das erzeugte Issue gilt als Hostingbeweis.

### Echtes LLM

Noch nicht abschließend bewiesen, weil dafür ein echter API-Key, eine konkrete Modell-ID und ein Providerlauf benötigt werden. Unit- und Integrationstests beweisen das Protokoll, nicht die Verfügbarkeit eines fremden Anbieters.

### Automatische GitHub-Schreibaktionen

Der sichere Serverpfad ist implementiert und getestet. Für den echten Live-Test werden ein Bot-Proxy, `COMIC_ADMIN_KEY`, `GITHUB_TOKEN` und `GITHUB_REPOSITORY` benötigt. Ohne Proxy bleibt der sichtbare GitHub-Issue-Entwurf als sicherer Fallback aktiv.

### Medienproduktion

Noch nicht bewiesen. Nächstes Produktgate ist Test A: Ricco spricht drei bis fünf Sekunden mit Blickbewegung, Blinzeln, Mundbewegung, verständlichem Ton, Untertitel und MP4-Export.

## Aktuelles Urteil

Der Leitstand und seine Sicherheitslogik sind technisch geprüft. Das Hosting wird durch den Pages-Outcome-Wächter maschinenlesbar bewertet. Die eigentliche Comicproduktion beginnt erst nach dem Hostingbeweis und endet nicht bei einem hübschen Dashboard.
