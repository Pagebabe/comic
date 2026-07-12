# Comic Factory · Cast-Kanon

Status: `CANON_LOCKED_ASSET_REVIEW_REQUIRED`  
Maschinenlesbare Quelle: `project/cast-canon-v1.json`  
Repository: `Pagebabe/comic`

## Verbindliche Entscheidung

Der aktive Hauptkanon besteht aus **13 Figuren**:

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

Diese Liste ist die einzige Cast-Autorität für Dashboard-Zähler, Figureninventar und Asset-Lücken.

## Abgrenzung des Vierer-Casts

Die Figuren **Ricco**, **Basti Prenzl**, **Jule** und **Don Miau** bleiben vollständig erhalten, sind aber als

```text
variant_not_approved_main_canon
```

markiert. Sie stammen aus der ausgewählten Pilotlinie `Das Zimmer`, Visual-Preproduction und den LR5.1-Entwürfen. Die Pilotwahl ist keine automatische Freigabe dieses Casts als neuer Serienhauptkanon.

Die historischen Mappings

- `char_rico -> char_ricco`
- `char_falk -> char_basti`
- `char_kralle -> char_don_miau`

bleiben als Review- und Migrationsnachweis erhalten. Sie ersetzen keine Hauptkanon-ID.

## Quellenhierarchie

| Quelle | Verwendung | Autorität |
|---|---|---|
| `project/cast-canon-v1.json` | Hauptcast, Variantenstatus, Sheet-Verknüpfungen, Zähler | **verbindliche Cast-Quelle** |
| `project/character-production-sheets.json` | neun vorhandene Produktionssheets | verbindliche Asset-Quelle für vorhandene Records |
| `project/lora-training-sheets.json` | sechs vorhandene LoRA-Trainingssheets | verbindliche Asset-Quelle für vorhandene Records |
| `project/canon.json` | Serien-/Pilotmaterial und historischer Bestand | keine alleinige Hauptcast-Autorität |
| `project/canon-candidates.json` | Pilotentscheidung und Vierer-Cast | Pilotquelle, nicht Hauptcast-Autorität |
| `project/visual-preproduction.json` | vier Pilot-Visual-Briefs | Variantenquelle, keine Masterfreigabe |
| `project/legacy-asset-mapping-contract.json` | historische ID-Mappings | Review Required |

## ID-Regeln

- Aktive IDs und Varianten-IDs dürfen nicht kollidieren.
- Alle IDs verwenden `char_*` in `snake_case`.
- Fehlende Beziehungen werden nicht geraten.
- Der aktive Bestand behält die IDs `char_rico`, `char_falk` und `char_kralle`.
- Varianten verwenden eigene IDs: `char_ricco`, `char_basti`, `char_jule`, `char_don_miau`.

## Asset-Regeln

- Vorhanden bedeutet nur: Ein versionierter Sheet-Datensatz existiert.
- `missing` bedeutet: Keine verknüpfte Quelle vorhanden.
- `unverified` bedeutet: Hinweise oder Bilder können existieren, wurden aber nicht als belastbare Referenz verifiziert.
- Kein Produktionssheet, LoRA-Sheet oder Technikclip ist automatisch ein Visual Master.
- Der M1-Clip `m1-life-sign` bleibt ausschließlich `technical_proof_not_character_lock`.

## Sicherheitsgrenzen

Folgendes bleibt gesperrt:

- automatische Zusammenführung von Hauptkanon und Varianten
- automatische Masterfreigabe
- Bildgenerierung
- Batch-Produktion
- LoRA-Training
- Growth-OS-Integration
- Live Publishing

## Dashboard-Vertrag

Das Produktions-Cockpit zeigt verbindlich:

```text
Hauptkanon: 13
Varianten: 4
Produktionssheets: 9/13
LoRA-Sheets: 6/13
Trusted Visual Masters: 0/13
```

Die Werte werden gegen `project/cast-canon-v1.json` geprüft und dürfen nicht unabhängig gepflegt werden.
