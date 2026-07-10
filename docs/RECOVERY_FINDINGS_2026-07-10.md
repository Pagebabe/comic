# Lokale Asset-Recovery · geprüfter Befund vom 10. Juli 2026

Status: `PARTIALLY_PROVEN · PRIVATE INVENTORY NOT COMMITTED`

## Ausgeführter Lauf

Der lokale Read-only-Scanner und die nachfolgenden Analyzer wurden im Comic-Repository ausgeführt.

Gemeldete Zahlen:

```text
untersuchte Dateien:          6.047
breite Kandidaten vor Filter: 183
Lesefehler:                   0
Duplikatgruppen:              216
```

Der erste breite Analyzer bewertete 136 Dateien als mögliche visuelle Kandidaten. Die anschließende strenge Prüfung zeigte, dass diese Treffer überwiegend aus fremden Downloads, APK-Grafiken, Telegram-Exporten, allgemeinen Dokumenten und technischen Platzhaltern bestanden.

## Sichtprüfung

Aus 67 generisch benannten ComfyUI-PNGs wurde ein begrenztes Reviewpaket mit 20 Bildern erzeugt.

Ergebnis der menschlichen Sichtprüfung:

```text
Comic-Assets:                 0
Character-Master:             0
Location-Master:              0
unrelated/rejected:          20
```

Die Bilder zeigten eine fremde fotorealistische Influencer-Figur, teilweise mit NSFW-Inhalten. Sie wurden vollständig aus der Comic-Factory-Auswahl ausgeschlossen.

## Folgerung

- Keine vorhandene visuelle Ricco-, Basti-, Jule- oder Don-Miau-Masterreferenz wurde bewiesen.
- Keine vorhandene Masterreferenz für Hausfassade, Riccos Zimmer, Flur oder Gemeinschaftsküche wurde bewiesen.
- Die vier SVG-Porträts im Repository bleiben technische Platzhalter.
- Der visuelle Produktionspfad beginnt deshalb später kontrolliert mit Riccos Silhouetten und Character Sheet.

## Datenschutz- und Reproduzierbarkeitsgrenze

Die vollständigen Recovery-Reports liegen unter `_recovery_reports/` und sind absichtlich durch `.gitignore` ausgeschlossen. Sie enthalten lokale absolute Pfade und privaten Dateibestand.

Dadurch sind folgende Teile öffentlich reproduzierbar:

- Scanner-Code
- Analyzer-Code
- Sicherheitsregeln
- synthetische Tests
- Filterlogik
- Status `0 freigegebene Master`

Nicht öffentlich reproduzierbar ist der exakte private 6.047-Dateien-Bestand. Deshalb bleibt der konkrete lokale Lauf im Evidence Ledger `partially_proven` und wird nicht fälschlich zu einem vollständig öffentlichen Beweis hochgestuft.
