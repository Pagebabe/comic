# Comic Factory · Legacy-Asset-Mapping-Vertrag

Status: `CONTRACT_DEFINED_REVIEW_REQUIRED`

Tracking: Issue #125  
Lokaler Inventarlauf: Issue #123

## Zweck

Der Vertrag ordnet Metadaten aus dem lokalen Asset-Recovery-Scan dem ausgewählten Pilotprojekt `Das Zimmer` zu. Er verschiebt, kopiert, importiert oder startet keine Quelldatei und erteilt keine kreative Freigabe.

## Verbindliche Figuren-Zuordnungen

| Legacy-ID | Aktuelle Canon-ID | Status |
| --- | --- | --- |
| `char_rico` | `char_ricco` | explizit, `REVIEW_REQUIRED` |
| `char_falk` | `char_basti` | explizite Projektentscheidung, `REVIEW_REQUIRED` |
| `char_kralle` | `char_don_miau` | explizite Projektentscheidung, `REVIEW_REQUIRED` |

Für `char_jule` existiert keine Legacy-Zuordnung in den historischen Produktionssheets. Es wird deshalb keine erfunden.

Diese Legacy-IDs bleiben Supportbestand und erhalten keine automatische Pilotzuordnung:

- `char_sami`
- `char_rita`
- `char_dj_nebel`
- `char_sven_null`
- `char_moepse`
- `char_flitz`

Jede unbekannte ID endet bei:

```text
LEGACY_SUPPORT_UNMAPPED
REVIEW_REQUIRED
```

## Aktueller Pilotcast

Der ausgewählte Pilot `pilot-das-zimmer` führt:

- `char_ricco` · Ricco
- `char_basti` · Basti Prenzl
- `char_jule` · Jule
- `char_don_miau` · Don Miau

Die vier Location-Namen werden aus `project/canon-candidates.json` übernommen. Der Vertrag erfindet keine Location-IDs aus Slugs oder Dateinamen.

## Assetklassen

Die Migrationsschicht muss mindestens unterscheiden:

- Bild
- Video
- Audio
- echte Modellbytes
- LoRA-Trainingsplan
- LoRA-Datensatzmitglied
- Review- oder Manifestdatei
- unklassifiziert

Dateiendungen wie `.safetensors`, `.ckpt`, `.pt`, `.pth` oder `.onnx` beweisen nur Modellbytes. Sie beweisen nicht automatisch, dass eine Datei eine trainierte, funktionierende oder projektzugehörige LoRA ist.

## Reihenfolge der Klassifikation

```text
MODEL_BYTES
→ REVIEW_OR_MANIFEST
→ LORA_TRAINING_PLAN
→ LORA_DATASET_MEMBER
→ VIDEO
→ AUDIO
→ IMAGE
→ UNCLASSIFIED
```

Die Reihenfolge verhindert unter anderem, dass ein `.safetensors`-Modell wegen seines Ordnernamens als Trainingsplan oder ein Recovery-JSON als allgemeines Asset behandelt wird.

## Sicherheitsgrenzen

Verboten sind:

- Quelldateien starten oder Modelle laden
- Quelldateien kopieren, verschieben, umbenennen oder importieren
- unbekannte Character-IDs erraten
- Preview-Screenshots automatisch als Masterquelle einstufen
- Location-IDs aus Dateinamen erfinden
- `APPROVED_MASTER` ohne explizite menschliche Entscheidung setzen

Jede Ausgabezeile bleibt:

```text
reviewStatus: REVIEW_REQUIRED
sourceExecuted: false
sourceCopied: false
automaticMasterApproval: false
```

Gesamtergebnis:

```text
AUTOMATIC_MASTER_APPROVALS: 0
```

## Prüfung

```bash
npm run test:legacy-asset-mapping-contract
npm run check:legacy-asset-mapping-contract
```

Der Checker bindet den Vertrag an:

- `project/canon-candidates.json`
- `project/lr5-ricco-master-source-inventory.json`
- `project/character-production-sheets.json`

Damit müssen alle neun historischen Character-IDs entweder explizit gemappt oder ausdrücklich als unmapped Supportbestand geführt werden.

## Noch nicht bewiesen

- Der lokale Assetscan aus Issue #123 wurde noch nicht zurückgegeben.
- Keine trainierte LoRA wurde durch diesen Vertrag gefunden oder geprüft.
- Kein Bild, Set, Voice-Asset oder Modell ist freigegeben.
- Kein Visual-Master ist durch diesen Vertrag entstanden.
- Die Episode ist nicht produktionsbereit.
