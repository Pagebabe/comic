# Comic Factory · Asset Gap Report

Verbindliche Quelle: `project/cast-canon-v1.json`  
Status: `ASSET_REVIEW_REQUIRED`

## Zusammenfassung

| Bereich | Vorhanden | Erwartet | Fehlend | Verifiziert/Freigegeben |
|---|---:|---:|---:|---:|
| Hauptkanon-Figuren | 13 | 13 | 0 | 13 Namen/IDs bestätigt |
| Produktionssheets | 9 | 13 | 4 | 9 versionierte Records |
| LoRA-Trainingssheets | 6 | 13 | 7 | 6 versionierte Records |
| Referenzbilder | 0 verified | 13 | 13 unverified | 0 |
| Trusted Visual Masters | 0 | 13 | 13 | 0 |
| Pilotvarianten | 4 erhalten | 4 | 0 | 0 als Hauptkanon freigegeben |

## Fehlende Produktionssheets

Für folgende Figuren existiert kein verknüpfter Record in `project/character-production-sheets.json`:

- `char_kira` · Kira
- `char_olli` · Olli
- `char_kraetze` · DJ Krätze
- `char_mutti` · Mutti

Erlaubter nächster Schritt: vorhandene Quellen suchen und verifizieren. Keine Prompt-, Rollen- oder Designdetails erfinden.

## Fehlende LoRA-Trainingssheets

Für folgende Figuren existiert kein verknüpfter Record in `project/lora-training-sheets.json`:

- `char_rita` · Madame Rita
- `char_kira` · Kira
- `char_olli` · Olli
- `char_kraetze` · DJ Krätze
- `char_mutti` · Mutti
- `char_moepse` · Möpse
- `char_flitz` · Flitz

Ein fehlendes LoRA-Sheet beweist weder einen fehlenden Datensatz auf dem lokalen Rechner noch die Abwesenheit trainierter Modellbytes. Bis zur verifizierten Quelle bleibt der Status `missing`.

## Referenzbild-Lücken

Für keine der 13 Figuren ist in der verbindlichen Cast-Quelle ein belastbarer Referenzbildpfad bestätigt. Deshalb gilt für alle:

```text
referenceImages.status = unverified
```

Sichtbare Screenshots, Dashboard-Thumbnails, alte Renderings oder File-Library-Belege dürfen als Suchanker dienen, aber nicht automatisch als Masterquelle.

## Visual-Master-Lücken

Aktueller Stand:

```text
trustedVisualMasters = 0
```

Weder Produktionssheets noch LoRA-Sheets noch Pilot-Visual-Briefs erteilen einen Character Lock.

## M1-Technikclip

`m1-life-sign` bleibt:

```text
technical_proof_not_character_lock
```

Der Clip beweist nur die technische Pipeline. Er genehmigt keine Figur, kein Design, keine Stimme und keinen Master.

## Variantenkonflikt

Der Vierer-Cast

- Ricco
- Basti Prenzl
- Jule
- Don Miau

ist in Pilot-, Canon- und Visual-Preproduction-Dateien stark vertreten. Das ist ein historischer Datenkonflikt, kein Grund zum Löschen.

Behandlung:

- Daten bleiben erhalten.
- IDs bleiben getrennt.
- Dashboard markiert den Bestand als Pilotvariante.
- Mappings bleiben Review Required.
- Keine automatische Umbenennung oder Zusammenführung.

## Offene Designentscheidungen

1. Sollen Rico Bassmann und Ricco langfristig zwei getrennte Figuren bleiben oder später menschlich zusammengeführt werden?
2. Sollen Falk Reuter und Basti Prenzl getrennte Figuren bleiben?
3. Sollen Kralle und Don Miau getrennte Katzenfiguren bleiben?
4. Welche Rolle hat Jule im 13er-Hauptkanon, falls sie später aufgenommen werden soll?
5. Welche vorhandenen Bilddateien dürfen als Referenzbilder dienen?
6. Welche Qualitätsprüfung ist für einen echten Visual Master erforderlich?
7. Für welche Figuren ist LoRA überhaupt nötig, statt nur möglich?

Diese Entscheidungen bleiben ausdrücklich offen. Der Worker-Auftrag trifft sie nicht stellvertretend.

## Stop-Regeln

- keine Bildgenerierung
- kein Training
- kein Batch
- keine automatische Masterfreigabe
- kein Löschen historischer Daten
- keine Growth-OS- oder Publishing-Änderung
