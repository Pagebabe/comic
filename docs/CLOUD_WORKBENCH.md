# Comic Factory Cloud Workbench

## Zweck

Die Cloud-Werkbank läuft vollständig in GitHub Codespaces. Der lokale Mac darf ausgeschaltet sein. Editor, Terminal, Git, Tests, Studio-Build und Vorschau laufen im Browser.

Verbindlicher Startbranch:

```text
workbench/current-main
```

Dieser Branch wurde direkt vom bewiesenen `main`-Commit erstellt:

```text
0870a489339928220dcd536b9e055bd16aadd13e
```

## Vom Handy starten

1. Im Browser `github.com/Pagebabe/comic` öffnen.
2. Bei Bedarf die Desktop-Webseite anfordern.
3. **Code** öffnen.
4. Register **Codespaces** wählen.
5. **New with options** wählen.
6. Branch `workbench/current-main` auswählen.
7. Codespace erstellen und im Browser öffnen.

Beim ersten Start führt Codespaces automatisch aus:

```bash
bash scripts/cloud_workbench_setup.sh
```

Erwarteter Abschluss:

```text
CLOUD_WORKBENCH_READY
```

## Studio starten

Im Codespaces-Terminal:

```bash
npm --prefix studio-app run dev
```

GitHub leitet Port `3100` automatisch weiter. In der Port-Ansicht **Comic Factory Studio** öffnen.

## Sauber weiterentwickeln

Nicht dauerhaft direkt auf `workbench/current-main` entwickeln. Für jedes Arbeitspaket einen neuen Branch erstellen:

```bash
git fetch origin
git switch workbench/current-main
git pull --ff-only origin workbench/current-main
git switch -c worker/<kurzer-aufgabenname>
```

Nach der Änderung:

```bash
git status --short
npm test
npm run build:studio
git add <gezielte-dateien>
git commit -m "<typ>: <klare beschreibung>"
git push -u origin HEAD
gh pr create --base main --fill
```

Keine unkontrollierten Sammel-Commits und kein `git add .`, wenn lokale oder erzeugte Dateien im Arbeitsbaum liegen.

## Werkbank wieder auf Main synchronisieren

Erst nachdem der eigene PR gemergt und `main` grün ist:

```bash
git fetch origin
git switch workbench/current-main
git merge --ff-only origin/main
git push origin workbench/current-main
```

Bei einem Fast-Forward-Fehler nichts erzwingen. Einen neuen Branch direkt von `origin/main` erstellen oder den Konflikt als eigenes Arbeitspaket behandeln.

## Grenzen

Codespaces besitzt nur Repository- und explizit hochgeladene Dateien. Es besitzt keinen Zugriff auf:

- `/Users/fuhrer/...` auf dem ausgeschalteten Mac;
- die lokale Photos Library;
- lokale ComfyUI-Modelle oder Outputs;
- ChatGPT File Library-Dateien;
- lokale Secrets, sofern sie nicht ausdrücklich als Codespaces Secret eingerichtet wurden.

Issue #155 bleibt deshalb ein separater lokaler Assetreview. Normale Softwareentwicklung, Tests, Pull Requests und GitHub-Pages-Arbeit können vollständig in der Cloud erfolgen.

## Sicherheitsregeln

```text
NO_FORCE_PUSH
NO_RESET_HARD
NO_GIT_CLEAN
NO_AUTOMATIC_STASH
NO_AUTOMATIC_MAIN_COMMIT
NO_AUTOMATIC_MERGE
NO_LOCAL_ASSET_ASSUMPTIONS
```

## Schnelle Bearbeitung ohne Terminal

Für eine kleine Textänderung kann `github.dev` verwendet werden. Auf einer GitHub-Dateiseite die Taste `.` drücken oder die Repository-Adresse mit `github.dev` öffnen. Dieser Modus hat jedoch kein echtes Terminal und führt keine vollständigen Tests aus. Für belastbare Entwicklung Codespaces verwenden.
