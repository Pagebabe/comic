# Comic Factory · Cast-Scope

Status: `CAST_SCOPE_SEPARATED_REVIEW_REQUIRED`  
Maschinenlesbare Quelle: `project/cast-canon-v1.json`  
Ausgewählter Pilot: `Das Zimmer`

## Verbindliche Trennung

Im Repository gelten zwei unterschiedliche, gleichzeitig gültige Ebenen:

1. **Serienuniversum, Legacy- und Assetbestand: 13 dokumentierte Figuren**
2. **Aktiver Produktionscast für `Das Zimmer`: Ricco, Basti Prenzl, Jule und Don Miau**

Der 13er-Bestand ist nicht der aktive Pilotcast. Der Vierer-Cast ist keine ungültige Variante und wird weder gelöscht noch durch den Legacybestand ersetzt.

## Maschinenlesbare Bereiche

`project/cast-canon-v1.json` führt die Ebenen ausdrücklich getrennt:

- `seriesUniverse`
- `activePilotCast`
- `legacyAssetInventory`
- `approvedVisualMasters`

Zusätzlich bleiben die Approval-Listen für Character-, Location- und Voice-Master leer.

## Serienuniversum

Die 13 dokumentierten Datensätze sind:

1. Rico Bassmann
2. Falk Reuter
3. Sami
4. Madame Rita
5. Kira
6. Olli
7. DJ Krätze
8. DJ Nebel
9. Sven Null
10. Mutti
11. Kralle
12. Möpse
13. Flitz

Diese Liste beschreibt den vorhandenen Serien-, Legacy- und Assetbestand. Sie behauptet keine aktuelle Pilotbesetzung und keine visuelle Freigabe.

## Aktiver Pilotcast

Für den ausgewählten Pilot `Das Zimmer` bleiben aktiv:

- Ricco
- Basti Prenzl
- Jule
- Don Miau

Die Pilotentscheidung ist in `project/pilot-decision-record.json` und `project/truth-state.json` gebunden. Detailkanon, Referenzbilder, Character-Master, Location-Master und Voice-Master bleiben eigene menschliche Reviewentscheidungen.

## Historische Beziehungen

Folgende Beziehungen sind als historische Mappings dokumentiert, aber nicht automatisch fusioniert:

- `char_ricco` referenziert `char_rico`
- `char_basti` referenziert `char_falk`
- `char_don_miau` referenziert `char_kralle`
- Jule besitzt keine bestätigte Legacy-Zuordnung; dieser Nullzustand bleibt ausdrücklich sichtbar

IDs bleiben getrennt und kollisionsfrei. Ein Mapping ist kein Merge und keine Designfreigabe.

## Asset- und Freigabestatus

```text
Serienuniversum: 13
Aktiver Pilotcast: 4
Legacy-Produktionssheets: 9
Legacy-LoRA-Sheets: 6
Geprüfte Referenzbilder: 0
Approved Visual Masters: 0
Character-Master: 0/4
Location-Master: 0/4
Voice-Master: 0/3
```

Produktions- oder LoRA-Sheets sind dokumentierter Bestand. Sie gelten nicht als Visual Master. Der M1-Life-Sign bleibt ausschließlich Technikbeweis.

## Stop-Regeln

- keine automatische Figurenfusion
- keine automatische Character-, Visual-, Location- oder Voice-Master-Freigabe
- keine Bildgenerierung
- kein Batch
- kein LoRA-Training
- keine Growth-OS-Integration
- kein Live Publishing
