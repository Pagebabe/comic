# 03 · QA, Fehler, Restore, Export und Übergabe

## Technische QA

Prüfe vor jedem Export:

- Auflösung
- Seitenverhältnis
- Framerate
- Codec
- Audioformat
- Lautheit
- Untertitel
- Abspieldauer
- Dateigröße
- fehlende Dateien

Jedes Kriterium erhält `PASS`, `REVISION_REQUIRED` oder `REJECTED`. Stille Warnungen zählen nicht als bestanden.

## Kreative QA

Prüfe sichtbar:

- Figurenidentität
- Gesicht, Körper, Kleidung und Requisiten
- Setgeometrie und Farbpalette
- Continuity
- Dialogqualität
- Timing
- emotionale Lesbarkeit
- Soundwirkung
- Untertitellesbarkeit

Ein technischer Pass ersetzt keine kreative Freigabe.

## Evidence-QA

Jede wichtige Behauptung braucht:

- Quelle
- Test
- Artefakt
- Lauf- oder Deployment-Beweis
- sichtbare Gegenprüfung
- ehrlichen Status

## Häufige Fehler und sichere Reaktion

### Studio lädt nicht

1. Netzwerk prüfen.
2. GitHub-Pages-Workflow prüfen.
3. offenes Deploy-Blocker-Issue suchen.
4. Browser-Konsole öffnen.
5. Pfad zu `truth-state.json` prüfen.
6. nicht mit einem alten Screenshot weiterarbeiten.

### Build schlägt fehl

1. erste echte Fehlermeldung lesen.
2. betroffene Datei notieren.
3. nur den belegten Fehler korrigieren.
4. Build komplett wiederholen.

### Test schlägt fehl

1. Testname notieren.
2. prüfen, ob Implementierung oder Test veraltet ist.
3. keinen Test überspringen.
4. keinen Merge durchführen.
5. vollständige Regression erneut ausführen.

### Hash stimmt nicht

Mögliche Ursachen:

- Package verändert
- falsche Version geladen
- nicht-kanonische Serialisierung
- versteckte Zustandsänderung
- falsche Quelldatei

Nicht manuell überschreiben. Ursache finden und Package neu beweisen.

### Kandidat sieht falsch aus

- `REVISION_REQUIRED` oder `REJECTED` setzen
- Ablehnungsgrund dokumentieren
- Quellen und Version beibehalten
- keinen zweiten Kandidaten starten, bevor die Entscheidung vollständig ist

### Provider fällt aus

- Job stoppen
- keine Endlosschleife
- Kostenlimit schützen
- Eingaben und Fehler dokumentieren
- später kontrolliert neu starten

### Datei oder Asset fehlt

- Manifest prüfen
- letzte bewiesene Version bestimmen
- keine ähnlich benannte Datei improvisieren
- Recovery aus Package oder Git durchführen

## Backup vor Änderungen

- Git-Status sauber
- Branchname notiert
- Basiscommit notiert
- keine Secrets im Repository
- wichtige Artefakte außerhalb des Arbeitszustands gesichert
- Restore-Weg bekannt

## Recovery-Reihenfolge

1. Fehler eingrenzen.
2. letzten bewiesenen Commit bestimmen.
3. neuen isolierten Branch erstellen.
4. fehlende Quelle oder Datei wiederherstellen.
5. keinen Archivbranch blind mergen.
6. Tests ausführen.
7. Desktop und Mobil prüfen.
8. öffentlichen Beweis erst nach grünem Merge aktualisieren.

## Exportpaket

Ein vollständiges Übergabepaket enthält:

- Mastervideo
- Untertitel
- Audio-Stems, falls erforderlich
- EpisodePackage
- Assetmanifest
- Versionsmanifest
- Reviewprotokoll
- QA-Bericht
- SHA-256-Hashes
- bekannte Einschränkungen
- Kontakt und nächste Aktion

## Dateinamen

Verwende stabile Namen:

`series_episode_asset_version_status.ext`

Beispiel:

`ricco-im-haus_ep001_master_v001_review-required.mp4`

Nicht verwenden:

`final_final_neu2_wirklichfinal.mp4`

## Übergabe-Abnahme

- alle Dateien stammen aus derselben Version
- Hashes stimmen
- Medien lassen sich öffnen
- Untertitel passen
- Reviewentscheidungen sind enthalten
- bekannte Einschränkungen sind sichtbar
- Restore wurde geprüft
- keine ungeklärte kreative Freigabe

## Growth-OS-Grenze

Growth OS bleibt `SHADOW_RELEASE_READY`, nicht `LIVE_READY`.

Verboten ohne separaten Integrations-Gate:

- Live-Publishing
- OAuth
- Provider-Credentials
- Remote-Scheduler
- Marketing-Automation in `main`

Runbook- und Failure-Safety-Muster dürfen übernommen werden. Laufzeit und Code bleiben getrennt.