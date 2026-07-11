# 01 · Installation, erster Start und täglicher Ablauf

## Unterstützter V1-Betrieb

- Node.js 20 oder neuer
- Git
- moderner Chromium-basierter Browser
- VS Code oder gleichwertiger Editor
- macOS, Linux oder Windows

## Repository per Maus öffnen

1. VS Code starten.
2. Menü **File → Open Folder…** wählen.
3. den Ordner `comic` auswählen.
4. im Explorer prüfen, ob `studio-app`, `project`, `docs`, `tests` und `scripts` sichtbar sind.
5. Menü **Terminal → New Terminal** wählen.

## Installation und Prüfung

```bash
npm --prefix studio-app ci
npm --prefix studio-app run build
npm test
```

## Erwartetes Ergebnis

- Installation verwendet das vorhandene Lockfile.
- Studio baut ohne TypeScript-Fehler.
- Node- und Recovery-Tests sind grün.
- Root-, Truth-, LR3-, LR4- und LR5.1-Verträge bestehen.

## Lokales Studio starten

```bash
npm --prefix studio-app run dev
```

Die Terminalausgabe zeigt die lokale URL. Diese URL im Browser öffnen. Keine URL aus Erinnerung erfinden, Menschen haben bereits DNS erfunden, damit das nicht nötig ist.

## Tagesstart

1. GitHub öffnen.
2. aktive Issues lesen.
3. prüfen, ob ein Deploy-Blocker offen ist.
4. `main`-Stand und Arbeitsbranch notieren.
5. Dashboard und Studio öffnen.
6. nur am aktiven Gate arbeiten.
7. vor jeder Ausführung Quellen, Limit und Kosten prüfen.

## Tagesende

1. geänderte Dateien prüfen.
2. Tests ausführen.
3. Build ausführen.
4. sichtbaren Desktop- und Mobilzustand prüfen.
5. Status ehrlich dokumentieren.
6. Blocker und nächste Aktion notieren.
7. keine ungeprüfte Datei als Master markieren.

## Branch-Disziplin

- `main` enthält nur geprüfte und öffentlich gegengeprüfte Arbeit.
- kreative Arbeit läuft auf einem benannten Gate-Branch.
- Operator- und Dokumentationsarbeit darf kreative Gates nicht umgehen.
- Growth OS bleibt auf seiner isolierten Shadow-Linie.
- kein Blind-Merge aus Archiv- oder Parallelbranches.

## Typische Fehler

### `npm ci` schlägt fehl

- Node-Version prüfen.
- sicherstellen, dass `studio-app/package-lock.json` existiert.
- Lockfile nicht spontan neu erzeugen.
- exakten Fehler dokumentieren.

### Build ist rot

- erste echte TypeScript- oder Importfehlermeldung lesen.
- keine zehn anderen Dateien vorsorglich ändern.
- nur belegten Fehler korrigieren.
- gesamten Build erneut ausführen.

### Tests sind rot

- fehlschlagenden Testnamen notieren.
- prüfen, ob Implementierung oder Test veraltet ist.
- keine roten Tests überspringen.
- kein Merge vor vollständigem Grün.

## Setup-Abnahme

Bestanden, wenn eine frische unterstützte Maschine:

- das Repository öffnen kann,
- gelockte Abhängigkeiten installiert,
- Studio baut,
- Tests ausführt,
- lokalen Guided Mode öffnet,
- keinen undokumentierten Schritt benötigt.

Bis dieser Drill beobachtet wurde, bleibt Readiness-Gate PR1 `PARTIAL`.