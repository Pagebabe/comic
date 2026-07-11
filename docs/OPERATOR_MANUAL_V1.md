# Comic Factory Operator-Handbuch V1

Status: `GUIDE_READY_FOR_PUBLIC_ACCEPTANCE`  
Tracking: Issue #95  
Kreatives Gate: LR5.1 · Issue #88  
Repository: `Pagebabe/comic`

## Zweck

Dieses Handbuch führt eine Person ohne Comic-, Animations- oder Softwareerfahrung durch Comic Factory. Es beschreibt Bedienung, Freigaben, Fehlergrenzen, Recovery und Übergabe. Es macht das System nicht automatisch produktionsreif und erteilt keine kreative Freigabe.

## Aktueller ehrlicher Stand

`2/10 CLOSED_VERIFIED · 6 PARTIAL · 2 OPEN`

Maschinenlesbare Quelle: `project/production-readiness-v1.json`

## Kapitel

1. [Start, Begriffe und aktueller Status](operator/00_START_HERE.md)
2. [Installation, erster Start und täglicher Ablauf](operator/01_SETUP_AND_DAILY_FLOW.md)
3. [Master- und Episodenproduktion](operator/02_PRODUCTION_PIPELINE.md)
4. [QA, Fehler, Restore, Export und Übergabe](operator/03_QA_RECOVERY_EXPORT.md)
5. [Nullwissen-Abnahme und 10/10-Regel](operator/04_ACCEPTANCE.md)
6. [Videoanleitung-Drehbuch](VIDEO_TUTORIAL_SCRIPT_V1.md)

## Guided Mode

Nach öffentlicher Veröffentlichung:

`https://pagebabe.github.io/comic/studio/#guided`

Der Guided Mode nutzt `project/operator-guide-v1.json` und führt dieselben Schritte aus wie dieses Handbuch.

## Verbindliche Grundregel

```text
Quelle → Implementierung → Test → Artefakt → Laufbeweis → sichtbare Gegenprüfung → menschliche Freigabe
```

## Was nie automatisch erlaubt wird

- Bildgenerierung ohne aktives Freigabegate
- Batch-Rendering
- LoRA-Training
- automatische Masterfreigabe
- Episodeproduktion mit ungeprüften Assets
- Growth-OS-Livebetrieb oder Publishing
- 10/10-Behauptung vor zehn geschlossenen Readiness-Gates

## Fünf Pflichtbegriffe

- **Quelle:** belegtes Dokument, Entscheidung oder freigegebenes Asset.
- **Kandidat:** noch nicht freigegebenes Ergebnis, Status `REVIEW_REQUIRED`.
- **Master:** menschlich freigegebenes, versioniertes Referenzasset mit Quelle und Hash.
- **Gate:** kontrollierte Prüfgrenze vor dem nächsten Produktionsschritt.
- **Beweiskette:** Quelle, Test, Artefakt, Laufbeweis, sichtbare Gegenprüfung und ehrlicher Status.

Ein hübsches Bild ist kein Master. Ein grüner technischer Test ist ebenfalls kein Master.