# Comic Factory · Character Inventory

Quelle: `project/cast-canon-v1.json`  
Stand: `CANON_LOCKED_ASSET_REVIEW_REQUIRED`

## Aktiver Hauptkanon

| ID | Name | Status | Produktionssheet | LoRA-Sheet | Referenzbilder | Visual Master |
|---|---|---|---|---|---|---|
| `char_rico` | Rico Bassmann | confirmed_active_canon | present | present | unverified | missing |
| `char_falk` | Falk Reuter | confirmed_active_canon | present | present | unverified | missing |
| `char_sami` | Sami | confirmed_active_canon | present | present | unverified | missing |
| `char_rita` | Madame Rita | confirmed_active_canon | present | missing | unverified | missing |
| `char_kira` | Kira | confirmed_active_canon | missing | missing | unverified | missing |
| `char_olli` | Olli | confirmed_active_canon | missing | missing | unverified | missing |
| `char_kraetze` | DJ Krätze | confirmed_active_canon | missing | missing | unverified | missing |
| `char_dj_nebel` | DJ Nebel | confirmed_active_canon | present | present | unverified | missing |
| `char_sven_null` | Sven Null | confirmed_active_canon | present | present | unverified | missing |
| `char_mutti` | Mutti | confirmed_active_canon | missing | missing | unverified | missing |
| `char_kralle` | Kralle | confirmed_active_canon | present | present | unverified | missing |
| `char_moepse` | Möpse | confirmed_active_canon | present | missing | unverified | missing |
| `char_flitz` | Flitz | confirmed_active_canon | present | missing | unverified | missing |

## Variantenbestand

| ID | Name | Status | Historische Beziehung | Quellen |
|---|---|---|---|---|
| `char_ricco` | Ricco | variant_not_approved_main_canon | Mapping zu `char_rico`, Review Required | `canon.json`, `canon-candidates.json`, `visual-preproduction.json`, Mappingvertrag |
| `char_basti` | Basti Prenzl | variant_not_approved_main_canon | Mapping zu `char_falk`, Review Required | `canon.json`, `canon-candidates.json`, `visual-preproduction.json`, Mappingvertrag |
| `char_jule` | Jule | variant_not_approved_main_canon | unverified | `canon.json`, `canon-candidates.json`, `visual-preproduction.json` |
| `char_don_miau` | Don Miau | variant_not_approved_main_canon | Mapping zu `char_kralle`, Review Required | `canon.json`, `canon-candidates.json`, `visual-preproduction.json`, Mappingvertrag |

## Produktionssheet-Inventar

Quelle: `project/character-production-sheets.json`

| Record-ID | Zugeordnete Figur | Status |
|---|---|---|
| `char_rico` | Rico Bassmann | vorhanden |
| `char_falk` | Falk Reuter | vorhanden |
| `char_sami` | Sami | vorhanden |
| `char_rita` | Madame Rita | vorhanden |
| `char_dj_nebel` | DJ Nebel | vorhanden |
| `char_sven_null` | Sven Null | vorhanden |
| `char_kralle` | Kralle | vorhanden |
| `char_moepse` | Möpse | vorhanden |
| `char_flitz` | Flitz | vorhanden |

Gesamt: **9**

## LoRA-Trainingssheet-Inventar

Quelle: `project/lora-training-sheets.json`

| Record-ID | Zugeordnete Figur | Trigger | Status |
|---|---|---|---|
| `char_rico` | Rico Bassmann | `rgbrico` | vorhanden |
| `char_falk` | Falk Reuter | `rgbfalk` | vorhanden |
| `char_sami` | Sami | `rgbsami` | vorhanden |
| `char_kralle` | Kralle | `rgbkralle` | vorhanden |
| `char_dj_nebel` | DJ Nebel | `rgbnebel` | vorhanden |
| `char_sven_null` | Sven Null | `rgbsvennull` | vorhanden |

Gesamt: **6**

## Nutzung im Dashboard

Das Dashboard lädt `project/cast-canon-v1.json` direkt und zeigt:

- alle 13 Hauptkanon-Figuren als einzelne Inventarkarten
- Produktionssheet-Status pro Figur
- LoRA-Sheet-Status pro Figur
- Referenzbildstatus pro Figur
- vier Varianten in einem getrennten Variantenblock
- Zähler für Hauptkanon, Varianten, Produktionssheets, LoRA-Sheets und Visual Masters

## Nutzung im Produktionsworkflow

- Hauptkanon-Figuren sind die Serienbestandsquelle.
- Varianten bleiben als Pilotmaterial prüfbar.
- Produktions- und LoRA-Sheets sind Planungs-/Trainingsdaten, keine Masterfreigabe.
- Figuren ohne Sheet bleiben sichtbar und werden nicht aus Listen entfernt.
- `missing` und `unverified` sind gültige Zustände und dürfen nicht durch erfundene Details ersetzt werden.
