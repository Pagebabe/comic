# LR5.1 Ricco · Ein-Kandidaten-Preflight

## Zweck

Dieser Preflight bereitet genau einen späteren Ricco-Review-Sheet-Lauf vor. Er erteilt keine Bildfreigabe, führt keinen Provider aus und erzeugt weder Bildbytes noch einen Master.

Aktueller Zustand:

- Vertrag: `CONTRACT_READY_REVIEW_REQUIRED`
- Preflight: `PREPARED_EXECUTION_BLOCKED`
- Kandidaten: `0/1`
- Bildgenerierung: aus
- Provider-Ausführung: aus
- Batch: aus
- LoRA: aus
- automatische Masterfreigabe: aus
- Artefakt: nicht vorhanden
- Manifest: nicht vorhanden

## Aktivierungsentscheidung

Nur der Projektinhaber darf exakt folgende Entscheidung dokumentieren:

```text
CONTRACT_APPROVED_FOR_ONE_CANDIDATE
```

Ein allgemeines „weiter“, ein grüner Test, ein Worker-Kommentar oder ein erfolgreiches Deployment ersetzt diese Entscheidung nicht.

Die Entscheidung erlaubt ausschließlich einen versionierten Review-Kandidaten. Sie genehmigt weder dessen Qualität noch einen Ricco-Master.

## Vor der Freigabe zulässig

```bash
node scripts/check_ricco_candidate_preflight.mjs
node --test --test-concurrency=1 tests/ricco-candidate-preflight.test.mjs
```

Diese Befehle lesen nur Repository-Dateien und prüfen den gesperrten Nullzustand.

## Ablauf nach einer späteren Freigabe

1. Freigabe mit Autor, Zeitpunkt und Evidence versioniert erfassen.
2. Generator, Version, Workflow und Ausführungs-ID vor dem Lauf festhalten.
3. Positive- und Negative-Prompt-Hashes aus dem bestehenden Vertrag berechnen.
4. Genau ein zusammenhängendes Ricco-Review-Sheet erzeugen.
5. Bild und Manifest unter den im Preflight definierten Pfaden speichern.
6. SHA-256, Abmessungen und MIME-Typ eintragen.
7. Zehn Reviewtests ausführen, davon neun blockierend.
8. Kandidat sichtbar in der LR5.1-Reviewroute prüfen.
9. Menschlich separat entscheiden: `APPROVED_MASTER`, `REVISION_REQUIRED` oder `REJECTED`.

## Ein-Kandidaten-Regel

Der Slot gehört zu `ricco-master-candidate-001` Version `0.1.0`. Ein zweiter Entwurf, ein automatischer Retry oder mehrere Stilvarianten sind kein zulässiger Ersatzlauf. Scheitert der Kandidat, wird er ehrlich als `REVISION_REQUIRED` oder `REJECTED` dokumentiert. Ein weiterer Kandidat benötigt eine neue versionierte Entscheidung.

## Stop-Regeln

- keine Bild-, GPU- oder Provider-Ausführung ohne exakte Eigentümerfreigabe
- kein Batch und keine Prompt-Lotterie
- kein LoRA-Training vor `APPROVED_MASTER`
- keine automatische Masterzuweisung
- keine parallele Set-, Voice-, weitere Figuren- oder Episodenproduktion
- keine erfundenen Artefaktpfade, Hashes, Tests oder Freigaben
- kein Growth OS und kein Live-Publishing in diesem Arbeitspaket

## Abnahme dieses Preflights

Der Preflight ist bestanden, wenn Checker und Tests zeigen:

- exakter Repository- und Gate-Scope
- Vertrag und Quelleninventar bleiben gebunden
- Freigabe ist nicht aufgezeichnet
- Kandidatenlimit bleibt `1`
- Kandidatenstand bleibt `0`
- alle Ausführungswege bleiben gesperrt
- Manifest-Vorlage enthält alle Pflichtfelder
- Review- und Human-Status bleiben `REVIEW_REQUIRED`
- keine Bildbytes, Provider-Ausführung oder Masterbehauptung existieren
