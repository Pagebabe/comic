# M1R Asset Recovery Checklist

## Ziel

Vorhandene visuelle Character Sheets, Location Sheets, Panelvarianten, Reviewpakete und Produktionsassets finden, ohne Dateien zu verändern, zu verschieben oder zu löschen.

Der alte Projektstand zeigt eindeutig, dass textliche Sheets und Import-/Review-Pipelines vorhanden waren. Die tatsächlichen Bilddateien lagen wahrscheinlich lokal und wurden absichtlich nicht vollständig in Git gespeichert.

## Sicherheitsregeln

- nur lesen und inventarisieren
- kein `git clean`
- kein `rm`
- kein `git reset --hard`
- kein Verschieben oder Umbenennen
- keine neuen Bilder erzeugen, bevor die Suche abgeschlossen ist
- Chris Fact Radar niemals durchsuchen oder verändern

## Bekannter lokaler Projektpfad

Frühere Logs verwendeten:

```text
~/comic
```

Vor Ausführung prüfen:

```bash
cd ~/comic
pwd
git remote -v
git branch --show-current
git status --short
```

Erwarteter Remote:

```text
Pagebabe/comic
```

## Schritt 1 – Bild- und Medieninventar im Projekt

```bash
cd ~/comic

mkdir -p _recovery_reports

find . -type f \
  \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.webp' -o -iname '*.svg' -o -iname '*.psd' -o -iname '*.kra' -o -iname '*.mp4' -o -iname '*.mov' -o -iname '*.wav' -o -iname '*.mp3' \) \
  -not -path './node_modules/*' \
  -not -path './.git/*' \
  | sort > _recovery_reports/all-media-files.txt

wc -l _recovery_reports/all-media-files.txt
sed -n '1,240p' _recovery_reports/all-media-files.txt
```

## Schritt 2 – wahrscheinliche Sheet- und Referenzdateien

```bash
find . -type f \
  \( -iname '*character*' -o -iname '*sheet*' -o -iname '*turnaround*' -o -iname '*reference*' -o -iname '*ref*' -o -iname '*pose*' -o -iname '*expression*' -o -iname '*location*' -o -iname '*background*' \) \
  -not -path './node_modules/*' \
  -not -path './.git/*' \
  | sort > _recovery_reports/sheet-and-reference-candidates.txt

sed -n '1,260p' _recovery_reports/sheet-and-reference-candidates.txt
```

## Schritt 3 – bekannte Produktionsordner prüfen

```bash
for dir in \
  outputs \
  public/generated \
  public/assets \
  generated \
  assets \
  review \
  exports \
  backups
  do
    echo "===== $dir ====="
    if [ -d "$dir" ]; then
      find "$dir" -type f | sort | sed -n '1,300p'
    else
      echo "NICHT VORHANDEN"
    fi
  done | tee _recovery_reports/known-production-folders.txt
```

## Schritt 4 – Package-, Manifest- und Reviewdaten

```bash
find . -type f \
  \( -iname '*.json' -o -iname '*.md' -o -iname '*.txt' -o -iname '*.csv' \) \
  -not -path './node_modules/*' \
  -not -path './.git/*' \
  | while read -r file; do
      if grep -Eqi 'character|turnaround|reference|generated|review|selected|final|asset|panel_00|ricco|rico|basti|falk|jule|miau|kralle' "$file" 2>/dev/null; then
        echo "$file"
      fi
    done \
  | sort > _recovery_reports/manifests-and-package-candidates.txt

sed -n '1,300p' _recovery_reports/manifests-and-package-candidates.txt
```

## Schritt 5 – Git ignorierte und ungetrackte Dateien anzeigen

```bash
git status --short --ignored \
  | sed -n '1,300p' \
  | tee _recovery_reports/git-untracked-and-ignored.txt
```

Nur anzeigen. Nichts hinzufügen oder löschen.

## Schritt 6 – benachbarte Backups und alte Comicordner suchen

```bash
find "$HOME" -maxdepth 4 -type d \
  \( -iname '*comic*' -o -iname '*ricco*' -o -iname '*rico*' \) \
  -not -path '*/node_modules/*' \
  -not -path '*/Library/*' \
  2>/dev/null \
  | sort > ~/comic/_recovery_reports/nearby-comic-folders.txt

sed -n '1,240p' ~/comic/_recovery_reports/nearby-comic-folders.txt
```

Danach in gefundenen Backupordnern nur Mediennamen inventarisieren.

## Schritt 7 – Browser- und Package-Backups

Suche nach früher exportierten Produktionspaketen:

```bash
find "$HOME/Downloads" "$HOME/Desktop" "$HOME/Documents" -type f \
  \( -iname '*ricco*.json' -o -iname '*comic*.json' -o -iname '*package*.json' -o -iname '*review*.json' \) \
  2>/dev/null \
  | sort > ~/comic/_recovery_reports/downloaded-package-candidates.txt

sed -n '1,240p' ~/comic/_recovery_reports/downloaded-package-candidates.txt
```

Browser-LocalStorage wird nicht automatisch verändert. Falls ein alter lokaler Comic-Factory-Build noch geöffnet werden kann, zuerst dessen eingebaute Package-Export-Funktion verwenden.

## Schritt 8 – Bericht statt Dateichaos

Nach der Suche werden nur diese Reports zurückgegeben:

```text
_recovery_reports/all-media-files.txt
_recovery_reports/sheet-and-reference-candidates.txt
_recovery_reports/known-production-folders.txt
_recovery_reports/manifests-and-package-candidates.txt
_recovery_reports/git-untracked-and-ignored.txt
_recovery_reports/nearby-comic-folders.txt
_recovery_reports/downloaded-package-candidates.txt
```

Keine großen Bildordner blind in Git committen.

## Klassifizierung jedes Fundes

Jeder Fund erhält später genau einen Status:

- `CANON_CANDIDATE`
- `USEFUL_VARIANT`
- `LEGACY_REFERENCE`
- `PRODUCTION_OUTPUT`
- `BROKEN_OR_DUPLICATE`
- `UNKNOWN_REVIEW_REQUIRED`

## Definition of Done

Die Recovery ist bestanden, wenn:

- alle lokalen Comic-/Ricco-Projektordner inventarisiert wurden
- Outputs und `public/generated` geprüft wurden
- ignorierte Dateien geprüft wurden
- Package- und Review-JSONs geprüft wurden
- Backups und Downloads geprüft wurden
- gefundene visuelle Sheets mit Pfad, Vorschau und Status erfasst wurden
- fehlende Assets ausdrücklich als fehlend dokumentiert sind
- keine Datei während der Suche verändert oder gelöscht wurde
