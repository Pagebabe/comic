# LR3 · Minimaler Studio-bis-Restore-Produktionsloop

## Zweck

LR3 rettet nicht die komplette archivierte Produktionsapp. Es rettet genau einen vertikalen, reproduzierbaren und neutralen Testpfad:

`Control → Studio → Prompt Queue → Import → Review → QA → Lettering → Package → Restore`

Der Pfad beweist ausschließlich, dass kontrollierter Produktionszustand als deterministisches `EpisodePackage` transportiert, vollständig gelöscht und mit identischem SHA-256-Zustand wiederhergestellt werden kann.

## Autorisierende Linie

- Repository: `Pagebabe/comic`
- aktives Gate: LR3
- Tracking: Issue #60
- ausgewählter Pilot: `Das Zimmer`
- Pilotautorität: `project/pilot-decision-record.json`
- Archivquelle: `archive/legacy-comic-2026-07-10`
- Archivcommit: `7266cf8df99ad811904933189666bbb827bd3ad1`
- Quelleninventar: `project/lr3-production-loop-inventory.json`

Die Pilotreferenz bestätigt nur die Identität der Pilotlinie. Sie genehmigt keine alten Dialoge, Visuals, Stimmen oder Finaltimings.

## Warum dieser Slice

Die Archivquellen enthielten brauchbare Einzelideen, aber keinen streng verifizierten Restore-Vertrag:

- Prompt Queue trennte Vorbereitung von externer Generierung.
- Import und Review speicherten lokalen Zustand.
- QA kannte explizite Blocker.
- Lettering blieb eine eigene Schicht.
- Package exportierte JSON.
- Restore nahm JSON zurück, prüfte es aber nur als `valid-ish` und stellte primär Bildzustand wieder her.

LR3 übernimmt nur diese fachlichen Grenzen. Alte Storydaten, Bild-URLs, Datumsschwankungen und weiche Paketvalidierung werden nicht übernommen.

## Neutraler EpisodePackage-Vertrag

Der technische Test verwendet:

- exakt ein synthetisches Metadatenasset
- keine Bildbytes
- keine externe URL
- keine GPU- oder Netzwerkaktion
- eine manuelle Queue ohne Ausführung
- einen technischen Review ohne visuelle Freigabe
- QA mit harten Booleschen Checks
- den Overlaytext `LR3 TEST · KEIN CANON`
- kanonisch sortiertes JSON
- SHA-256 für Zustand und Gesamtpaket

Das Paket enthält weiterhin ausdrücklich:

- `detailCanon: false`
- `visualMaster: false`
- `voiceMaster: false`
- `finalEpisode: false`

## Gegenbeweis

Ein erfolgreicher Test muss diese Reihenfolge wirklich ausführen:

1. synthetisches Asset importieren
2. technischen Review dokumentieren
3. QA bestehen
4. technisches Lettering anwenden
5. EpisodePackage erzeugen
6. Paket- und Zustandshash speichern
7. lokalen Produktionszustand vollständig löschen
8. Package-Hash prüfen
9. Zustand wiederherstellen
10. wiederhergestellten Zustand erneut hashen
11. beide Zustandshashes vergleichen

Nur `HASH MATCH` schließt den technischen Gegenbeweis.

## Nicht bewiesen

- kein Character- oder Location-Master
- keine Bildgenerierung
- keine Stimme
- kein finaler Dialog
- kein vollständiger ausgewählter-Pilot-Fire-Test
- keine Produktionsreife
- keine fertige Episode
- keine Veröffentlichung

## Prozessvorfall

Vor der korrekten Branch-Erstellung wurden durch falsche Werkzeugwahl zwei leere Testdateien kurzzeitig direkt auf `main` erzeugt und sofort wieder entfernt. Der Netto-Dateistand blieb unverändert. Die Add- und Delete-Commits sind unter Issue #60 dokumentiert. Diese Historie wird nicht verschwiegen oder als Produktfortschritt gewertet.
