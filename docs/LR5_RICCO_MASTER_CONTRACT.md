# LR5.1 · Ricco Visual-Master-Vertrag

## Status

`CONTRACT_READY_REVIEW_REQUIRED`

Aktiver Parent-Gate: LR5 · Issue #82  
Aktives Arbeitspaket: LR5.1 · Issue #88

Der öffentliche LR4-Abschluss ist bewiesen:

```text
PR #85
→ geprüfter Head 4e916987f5cfdbeb09e2c703824f703a79e2e9f7
→ CI 29153832657 PASS
→ Merge 56a4e9da2d9c0ed6d56fdfda42ba10113a6c476f
→ Pages 29154561431 PASS
→ LR4 CLOSED_VERIFIED
→ LR5 aktiv
```

## Zweck

LR5.1 definiert die Quellen, sichtbaren Prüfkriterien und harten Stop-Regeln für genau einen späteren Ricco-Visual-Master-Kandidaten.

Der aktuelle Stand enthält:

- 7 gepinnte Quellen
- 5 ausdrücklich aufgelöste Konflikte
- 5 Pflichtansichten
- 6 Pflicht-Expressions
- 4 Posen
- 10 Reviewtests
- 1 maximalen Kandidaten-Slot
- 0 Kandidaten
- 0 Bildbytes
- 0 externe Generatorausführungen
- 0 Character-Master

## Quellenhierarchie

### Primär

- `project/truth-state.json`
- `project/pilot-decision-record.json`
- `project/merge-bibles/ricco.json`
- `project/visual-preproduction.json`

### Historische Sekundärquellen

- `project/character-production-sheets.json`
- `project/lora-training-sheets.json`

Diese Dateien bleiben Herkunftsbelege, enthalten aber veraltete Werte wie `char_rico`, teilweise 20 Jahre und alte Stilformulierungen. Sie dürfen die aktuellen Primärquellen nicht überschreiben.

### Kein Masterinput

- `assets/characters/ricco.svg`

Das SVG ist ein Dashboard-Platzhalter. Es ist kein Visual-Master und keine visuelle Autorität.

## Aufgelöste Konflikte

| Feld | Historisch | Aktuell | Entscheidung |
|---|---|---|---|
| Character-ID | `char_rico` | `char_ricco` | aktuelle ID |
| Alter | 20 | 24 | aktuelles Alter |
| Visualstatus | implizit generation-ready | visual pending | kein Master vorhanden |
| Stilprompt | benannte Stilphrase | beschreibende Originalmerkmale | benannte Stilphrase verwerfen |
| Dashboard-SVG | sichtbarer Platzhalter | keine Masterquelle | aus Masterinput ausschließen |

## Review-Sheet

Genau ein kohärentes Sheet soll später enthalten:

- Frontansicht, Ganzkörper
- Dreiviertelansicht links, Ganzkörper
- linkes Profil, Ganzkörper
- Rückenansicht, Ganzkörper
- schwarze Silhouette
- sechs Expressions
- vier Posenstudien
- identisches Gesicht, Körper, Outfit, Props und Palette

## Gebundene Identifikatoren

- 24-jähriger junger erwachsener Mann
- offenes, leicht müdes Gesicht
- große ehrliche Augen
- dunkle leicht unordentliche Haare
- schwarze Kopfhörer um den Hals
- übergroßer Rucksack
- blauer Tupperware-Deckel
- schlichter Hoodie oder verwaschene Trainingsjacke
- zu neue helle Sneaker
- schlanke, leicht nach vorn gezogene überforderte Haltung

## Stilgrenze

Verwendet werden nur beschreibende, originale Produktionsmerkmale:

- limitierte 2D-Animation
- dicke schwarze Konturen
- einfache wiederholbare Formen
- flache kontrollierte Farbflächen
- leicht übergroßer Kopf, Hände und Augenbrauen
- klare Silhouette
- schmutzige urbane Neutralfarben mit kontrollierten Neonakzenten

Nicht erlaubt:

- direkte Imitation einer bestehenden Serie, eines Studios oder Künstlers
- Fotorealismus
- Anime
- glossy 3D
- Influencer-Gesicht
- Luxusmode
- Actionheld-Anatomie
- Gangsterlook
- voller Bart
- zufällige Outfitwechsel
- lesbarer Text, Logos, Wasserzeichen oder Sprechblasen

## Blockierende Reviewtests

1. Identitätskonsistenz
2. Silhouettenlesbarkeit
3. Outfit- und Prop-Konsistenz
4. Expressionsbereich
5. Charakterrichtung
6. Animationsfähigkeit
7. technische Integrität
8. Text- und Markensicherheit
9. Originalitätsgrenze

Die Palette bleibt zusätzlich `REVIEW_REQUIRED`.

## Ausführungsgrenze

Bildgenerierung ist noch nicht erlaubt.

Benötigte menschliche Entscheidung:

`CONTRACT_APPROVED_FOR_ONE_CANDIDATE`

Danach darf genau ein Review-Sheet erzeugt werden. Der Kandidat bleibt auch dann `REVIEW_REQUIRED`.

Zulässige spätere menschliche Entscheidungen:

- `APPROVED_MASTER`
- `REVISION_REQUIRED`
- `REJECTED`

Automatische Tests können niemals `APPROVED_MASTER` setzen.

## Noch nicht bewiesen

- Riccos visuelle Qualität
- Identitätskonsistenz in einem erzeugten Sheet
- Palette
- Masterfreigabe
- LoRA-Reife
- andere Figuren
- Sets
- Stimmen
- Episodenreife

## Nächster kontrollierter Schritt

1. Contract und sichtbare Reviewroute durch CI und Pages beweisen.
2. Menschliche Vertragsfreigabe dokumentieren.
3. Genau einen versionierten Kandidaten erzeugen.
4. Kandidat gegen alle Tests sichtbar reviewen.
5. Erst danach menschliche Masterentscheidung dokumentieren.
