# Worker 1 · Canon Lock Abschlussbericht

Repository: `Pagebabe/comic`  
Branch: `worker/canon-lock`  
Pull Request: `#138`  
Status: `READY_FOR_REVIEW_NOT_MERGED`

## Exakter getesteter Commit-Hash

```text
1cdada9ea8a5c10f3b4488f634dbee1c51232a99
```

Dieser Hash bezeichnet den vollständig implementierten und durch alle drei Pflichtworkflows geprüften Stand **vor dem Hinzufügen dieses Abschlussberichts**. Der Bericht selbst erzeugt technisch einen nachfolgenden Branch-Commit; dessen finaler Head wird im Pull Request und in der Worker-Rückgabe ausgewiesen. So wird kein unmöglicher selbstreferenzieller Commit-Hash behauptet.

## Ausgangslage

Im Repository existierten zwei konkurrierende Cast-Wahrheiten:

1. ein belegter Bestand von 13 aktiven Figuren mit neun Produktionssheets und sechs LoRA-Trainingssheets;
2. ein stark in Pilot-, Visual- und LR5-Dateien verwendeter Vierer-Cast aus Ricco, Basti Prenzl, Jule und Don Miau.

Das Produktions-Cockpit zeigte zuvor weiterhin `0/4`, behandelte Ricco als primären aktiven Figurenblock und spiegelte den vorhandenen 13er-Bestand nicht wider. Gleichzeitig durfte der Vierer-Cast nicht gelöscht werden, weil er Bestandteil des ausgewählten Piloten `Das Zimmer`, der Visual-Preproduction und historischer Recovery-/Mapping-Verträge ist.

Der M1-Clip war bereits als Technikbeweis vorhanden, durfte aber nicht als Character Lock oder Visual Master interpretiert werden.

## Gefundene Datenquellen

| Quelle | Gefundener Inhalt | Verwendung nach Konsolidierung |
|---|---|---|
| `project/canon.json` | Pilot-/Serienkanon, `legacyCharacters: 13`, neun Produktionssheets, sechs LoRA-Sheets, vier Pilotfiguren | historische und konzeptionelle Quelle, nicht alleinige Hauptcast-Autorität |
| `project/canon-candidates.json` | ausgewählter Pilot `Das Zimmer` und Vierer-Cast | Pilotquelle, Variantenbestand |
| `project/character-production-sheets.json` | exakt neun versionierte Character-Production-Sheets | verbindliche Quelle für vorhandene Produktionssheet-Records |
| `project/lora-training-sheets.json` | exakt sechs versionierte LoRA-Trainingssheets | verbindliche Quelle für vorhandene LoRA-Records |
| `project/visual-preproduction.json` | Visual-Briefs für Ricco, Basti Prenzl, Jule und Don Miau | Variantenquelle, keine Masterfreigabe |
| `project/legacy-asset-mapping-contract.json` | Mappings `char_rico -> char_ricco`, `char_falk -> char_basti`, `char_kralle -> char_don_miau` | historischer Migrationsnachweis, weiterhin Review Required |
| `project/production-cockpit-v1.json` | alter Cockpitvertrag mit Vierer-Zielwerten | auf belegten Bestand umgestellt |
| `project/lr5-ricco-master-contract.json` | Ricco-Reviewvertrag, Kandidatenlimit und gesperrte Ausführung | unverändert als Varianten-/Reviewroute erhalten |

## Konflikte

### 1. Rico Bassmann gegen Ricco

`char_rico` und `char_ricco` werden nicht automatisch zusammengeführt. Das historische Mapping bleibt dokumentiert, aber beide IDs bleiben kollisionsfrei erhalten.

### 2. Falk Reuter gegen Basti Prenzl

`char_falk` und `char_basti` bleiben getrennte Records. Das Mapping wird nicht als endgültige Designentscheidung ausgegeben.

### 3. Kralle gegen Don Miau

`char_kralle` und `char_don_miau` bleiben getrennt. Der Mappingvertrag ist Migrationsbeleg, keine automatische Figurenfusion.

### 4. Jule

Jule ist Teil der Pilotvariante, aber nicht Teil des bestätigten 13er-Hauptkanons. Eine spätere Aufnahme oder Zuordnung bleibt menschliche Designentscheidung.

### 5. Dashboard gegen Datenbestand

Das Cockpit zeigte Vierer-Zielwerte, obwohl neun Produktionssheets, sechs LoRA-Sheets und 13 aktive Figuren belegt waren. Die Zähler wurden auf eine neue gemeinsame Kanonquelle gebunden.

### 6. Technikbeweis gegen Character Lock

Der M1-Life-Sign bleibt ausdrücklich `technical_proof_not_character_lock`. Er erteilt keine Design-, Character-, Voice- oder Masterfreigabe.

## Getroffene Entscheidungen

1. `project/cast-canon-v1.json` ist die neue maschinenlesbare Cast-Autorität.
2. Der aktive Hauptkanon enthält exakt 13 Figuren:
   - Rico Bassmann
   - Falk Reuter
   - Sami
   - Madame Rita
   - Kira
   - Olli
   - DJ Krätze
   - DJ Nebel
   - Sven Null
   - Mutti
   - Kralle
   - Möpse
   - Flitz
3. Der Vierer-Cast bleibt vollständig erhalten und erhält den Status `variant_not_approved_main_canon`.
4. Aktive und Varianten-IDs bleiben getrennt und kollisionsfrei.
5. Neun vorhandene Produktionssheets und sechs vorhandene LoRA-Sheets werden exakt gegen ihre Quelldateien verknüpft.
6. Fehlende Verknüpfungen werden als `missing` geführt.
7. Nicht verifizierte Referenzbilder werden als `unverified` geführt.
8. Trusted Visual Masters bleiben `0`.
9. Das Cockpit lädt die Kanonquelle direkt und zeigt alle 13 Figuren sowie vier Varianten getrennt.
10. Historische LR4-, LR5-, Foundation- und Readiness-Marker bleiben sichtbar, damit bestehende Recovery- und Proof-Verträge nicht verloren gehen.
11. Marketing-, Growth-OS- und Publishing-Module wurden nicht verändert.
12. Bildgenerierung, Batch, LoRA-Training und automatische Masterfreigabe bleiben gesperrt.

## Asset-Inventar

### Produktionssheets vorhanden: 9

- `char_rico`
- `char_falk`
- `char_sami`
- `char_rita`
- `char_dj_nebel`
- `char_sven_null`
- `char_kralle`
- `char_moepse`
- `char_flitz`

### Produktionssheets fehlend: 4

- `char_kira`
- `char_olli`
- `char_kraetze`
- `char_mutti`

### LoRA-Trainingssheets vorhanden: 6

- `char_rico`
- `char_falk`
- `char_sami`
- `char_kralle`
- `char_dj_nebel`
- `char_sven_null`

### LoRA-Trainingssheets fehlend: 7

- `char_rita`
- `char_kira`
- `char_olli`
- `char_kraetze`
- `char_mutti`
- `char_moepse`
- `char_flitz`

### Visuelle Freigaben

- verifizierte Referenzbilder: `0`
- Trusted Visual Masters: `0`
- automatische Freigaben: `0`

## Geänderte Dateien

### Neue Kanon- und Dokumentationsdateien

- `project/cast-canon-v1.json`
- `docs/canon/CAST_CANON.md`
- `docs/canon/CHARACTER_INVENTORY.md`
- `docs/canon/ASSET_GAP_REPORT.md`
- `docs/reports/WORKER_1_CANON_REPORT.md`

### Dashboard und Studio

- `project/production-cockpit-v1.json`
- `studio-app/src/App.tsx`
- `studio-app/src/ProductionCockpit.tsx`
- `studio-app/src/production-cockpit.css`
- `studio-app/package.json`

### Tests und Prüfer

- `scripts/check_cast_canon.mjs`
- `scripts/check_production_cockpit.mjs`
- `scripts/check_cockpit_pages_artifact.mjs`
- `tests/cast-canon.test.mjs`
- `tests/production-cockpit.test.mjs`
- `studio-app/tests/production-cockpit-smoke.mjs`
- `package.json`
- `.github/workflows/ci.yml`

## Testergebnisse auf dem getesteten Implementierungs-Commit

Getesteter Head:

```text
1cdada9ea8a5c10f3b4488f634dbee1c51232a99
```

### Comic Factory CI

Run: `29184182615`  
Ergebnis: `success`

| Abnahme | Ergebnis |
|---|---|
| PR Evidence Packet | success |
| `npm run lint` | success |
| `npm run typecheck` | success |
| `npm test` | success |
| `npm run build` | success |
| Desktop-/Mobile-Browserregression | success |
| Pages-/Cockpit-Artefaktprüfung | success |
| EP001-Timingexport | success |
| read-only Asset-Scanner | success |
| M1-Technikbeweis | success |

Artefakt:

```text
ID: 8257446067
Name: comic-ui1-production-cockpit-proof
Digest: sha256:82c8c54ac1493fa08f03809b78c515e692e61b5bfee932eae26e6f59b01f098d
```

### Fresh Install Drill

Run: `29184182603`  
Ergebnis: `success`

Der isolierte Klon, die locked Installation, der Build und der Browserdrill wurden erfolgreich ausgeführt.

Artefakt:

```text
ID: 8257439421
Name: comic-fresh-install-proof-f4bc92eb7262612bd396e1d785ddde3ea1bcd716
Digest: sha256:ad2392f6f95286bfb0862eb34bcaea0e9e3cc037ba3fc7d9b4f2ade0fb555ef8
```

### Operator Recovery Drill

Run: `29184182611`  
Ergebnis: `success`

Artefakt:

```text
ID: 8257432562
Name: comic-operator-recovery-proof-f4bc92eb7262612bd396e1d785ddde3ea1bcd716
Digest: sha256:39efaff298ee1a46a74c976a25f18ac7dfedbb1d0a563483a6f006d55235527e
```

## Sichtprüfung

Desktop und Mobile wurden anhand der erzeugten Cockpit-Screenshots und des Runtime-Evidence-Manifests geprüft.

Bestätigt:

- 13 sichtbare Hauptkanon-Karten
- vier sichtbare Pilotvarianten
- Zähler `13`, `4`, `9/13`, `6/13`, `0/13`
- 13 eindeutige aktive IDs
- vier eindeutige Varianten-IDs
- Produktionssheet-, LoRA- und Referenzstatus pro Figur sichtbar
- keine horizontalen Überläufe auf 1440 px oder 390 px
- keine externen Requests
- keine Buttons
- keine Bilder im Cockpit
- kein Canvas
- kein Iframe
- Bildgenerierung weiterhin aus
- Growth OS weiterhin getrennt
- keine Production-Ready- oder Masterfreigabe

Screenshot-Hashes:

```text
Desktop: a737625a412883f14326db9b3de9631b777c0737e370e8fc8cf2c718a07d6a0f
Mobile:  d1abf845dda4cf3a3aa2a84c637efab60b7174af1824c2f506f5856c18ca20d8
```

## Negative Evidenz und Korrekturen

### Erster CI-Lauf

Run `29183977096` stoppte vor der Implementierungsprüfung, weil zwei Pflichtbestätigungen im PR-Text nicht exakt dem Evidence-Vertrag entsprachen. Der PR-Text wurde korrigiert; kein Code- oder Kanon-Gate wurde abgeschwächt.

### Erster Fresh-Install-Lauf

Run `29183977111` scheiterte im Studio-Smoke, weil historische LR4-/LR5-/Foundation-Marker im neuen Cockpit nicht mehr sichtbar waren. Die Marker wurden als zusätzliche Beweisschicht wiederhergestellt. Der 13er-Kanon blieb unverändert.

### Zweiter vollständiger Testlauf

Run `29184078270` bestätigte bereits `lint` und `typecheck`, fand aber zwei ältere Source-Vertragstests, die historische Marker direkt in `App.tsx` erwarteten. Die Marker wurden sichtbar in den Expertenbereich aufgenommen. Tests wurden nicht entfernt und ihre Anforderungen nicht gelockert.

## Noch offene Designentscheidungen

1. Bleiben Rico Bassmann und Ricco langfristig getrennte Figuren oder werden sie später menschlich zusammengeführt?
2. Bleiben Falk Reuter und Basti Prenzl getrennt?
3. Bleiben Kralle und Don Miau getrennt?
4. Soll Jule später Teil des Hauptkanons werden?
5. Welche vorhandenen Bilddateien sind belastbare Referenzbilder?
6. Welche menschlichen Kriterien schließen einen echten Visual Master?
7. Für welche Figuren ist LoRA erforderlich und für welche nur optional?
8. Wo liegen gegebenenfalls lokale Altassets, die noch nicht versioniert und verifiziert wurden?
9. Sollen die vier fehlenden Produktionssheets neu erstellt oder aus Altbestand rekonstruiert werden?
10. Wie wird der bestehende Pilot `Das Zimmer` später auf Hauptkanon, Variantenkanon oder eine bewusste Parallelkontinuität abgebildet?

## Grenzen der Abgabe

Nicht behauptet werden:

- verifizierte Referenzbilder
- freigegebene Visual Masters
- trainierte oder geprüfte LoRA-Modellbytes
- automatische Figurenfusionen
- ein Character Lock durch den M1-Clip
- eine fertige Episode
- Production Readiness
- Growth-OS-Integration
- Live Publishing

## Übergabestatus

```text
READY_FOR_REVIEW_NOT_MERGED
```

Die Arbeit bleibt auf `worker/canon-lock`. Kein Merge nach `main`, kein Force-Push und kein stilles Löschen historischer Daten wurde durchgeführt.
