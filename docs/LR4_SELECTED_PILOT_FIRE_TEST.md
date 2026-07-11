# LR4 Selected-Pilot-Fire-Test · Das Zimmer

## Status

`CLOSED_VERIFIED`

LR4 wurde über folgende Kette abgeschlossen:

```text
PR #81
→ geprüfter Head a55a24e24bdae0bbf2b980f2842f57f0653092ca
→ CI 29152706460 PASS
→ Artefakt 8248611799
→ Merge 63021f49152dee7375578537be13dafd65685391
→ Pages 29152807415 PASS
→ öffentlicher Desktop- und Mobil-Browserlauf
→ Screenshot-Hashvergleich PASS
→ separater Abschluss project/lr4-selected-pilot-closure.json
```

## Zweck

LR4 bindet den menschlich ausgewählten Pilot `pilot-das-zimmer` an den bereits bewiesenen technischen Produktionspfad:

`Control → Studio → Prompt Queue → Import → Review → QA → Lettering → Package → Zustand löschen → Restore`

Der Test beweist Transport, deterministischen Export, echte Zustandslöschung, Manipulationsschutz und hashgleiche Wiederherstellung. Er erteilt keine kreative Freigabe.

## Autorität

Die Pilotauswahl autorisiert nur Identität und Planungsrichtung. Sie autorisiert nicht automatisch:

- jede vorhandene Dialogzeile,
- die vier Figurenbibles als finalen Canon,
- die 45,5-Sekunden-Fassung als finales Timing,
- Character- oder Location-Master,
- Stimmen,
- eine fertige Episode oder Produktionsreife.

Darum bleiben alle Dialog-, Timing-, Panel-, Figuren- und Ortsdetails im LR4-Paket `REVIEW_REQUIRED`.

## Gepinnte Quellen

| Quelle | Blob-SHA | Rolle |
|---|---|---|
| `project/pilot-decision-record.json` | `39011644e108d0a3c2dd8ddda41a5f2c74369b23` | menschliche Auswahl |
| `project/canon.json` | `8f1ab3fe5d4330b92f62c0c66315f4dc649f8648` | Plan und Grenzen |
| `project/ep001-animatic-blueprint.json` | `edbec4be2b3e9f72f60f95cef3178dcbce01ef1a` | 8 Panel-, Dialog- und Timingkandidaten |
| `project/merge-bibles/ricco.json` | `186ad510fd3a86d8dd3531f956eac6950f2ab929` | Figurenkandidat |
| `project/merge-bibles/basti-prenzl.json` | `47796c74416768d3fa89600b2bf1cf03db3aa70d` | Figurenkandidat |
| `project/merge-bibles/jule.json` | `d6907a39d10d7834f55d8c908cb672169d2aa770` | Figurenkandidat |
| `project/merge-bibles/don-miau.json` | `99a77ec4f43b3af8db6f01243c8952da037f4a47` | Figurenkandidat |

## Ausgewählter Testschnitt

- Pilot: `Das Zimmer`
- Panels: 8
- Kandidatendauer: 45,5 Sekunden
- Dialoghinweise: 10
- Figurenkandidaten: Ricco, Basti, Jule, Don Miau
- Ortskandidaten: Hausfassade, Riccos Zimmer, Flur, Küche
- Don Miau: keine menschliche Dialogzeile
- Bildbytes: 0
- externe Provider-, GPU- oder Netzwerkausführung: 0
- kreative Freigaben: 0

## Ausführbarer Vertrag

`studio-app/src/selected-pilot-loop.mjs` erzeugt einen deterministischen `SelectedPilotEpisodePackage`-Kandidaten mit:

- ausgewählter Pilotidentität,
- sieben Quellenpfaden und Blob-SHAs,
- acht Metadatenassets ohne Bildbytes,
- acht technischen Transportreviews,
- technischen QA-Ergebnissen,
- zehn Untertitelkandidaten,
- ausschließlich falschen kreativen Freigabefeldern,
- kanonischem SHA-256-Zustandshash,
- SHA-256-Packagehash.

## Verifizierte Ergebnisse

- Stationen: 9/9
- Zustand tatsächlich gelöscht: ja
- Package während der Löschung erhalten: ja
- Restore-Hash-Match: ja
- Zustandshash: `97b8216fbb11059a5f8fa0e3748ea8fa1e03706e15174c307ffe9ce84ca8c2cf`
- Package-Hash: `b6d2c8814dfc5cc558c5d7dd81113e71eafc51f531515fd7b4e9e8ec5a2ad196`
- Desktop-Überlauf: 0 px
- Mobil-Überlauf: 0 px
- Desktop-Screenshot-SHA: `3c9ed5df24fea84a2579c85ddb03e1ca423b88db8473e9e78c1e95cb2780fbbf`
- Mobil-Screenshot-SHA: `532ca527c65ac521d5dfdfd85a546f2784bb01637c656b425675cfaf4997a877`
- Bildbytes: 0
- externe Ausführung: 0
- kreative Freigaben: 0

## Runtime-Grenze

Während PR #81 meldete das Manifest korrekt:

- `selectedPilotFireTestCandidatePassed: true`
- `selectedPilotFireTestPassed: false`

Nach grünem CI, exaktem Merge, Pages-Deploy, öffentlichem Browserlauf und separatem Closure-Record meldet die aktuelle Abschlussprojektion:

- `selectedPilotFireTestCandidatePassed: true`
- `selectedPilotFireTestPassed: true`
- `selectedPilotFireTestClosureStatus: closed_verified`
- `activeGate: LR5`
- `activeTrackingIssue: 82`

`selectedPilotFireTestPassed: true` bedeutet ausschließlich: Der technische Fire Test ist öffentlich bestanden. Alle Detailfelder bleiben `REVIEW_REQUIRED`.

## Nicht bewiesen

- Dialogfreigabe
- finales Timing
- Figuren- oder Ortscanon
- Character- oder Location-Master
- Stimmen
- Bildkonsistenz
- fertige Episode
- Produktionsreife
- Publishing oder Growth OS

## Nächstes Gate

LR5 · Issue #82: Visual-, Set- und Voice-Locks.

LR5 beginnt mit genau einem source-bound, versionierten Ricco-Master-Kandidaten. Kein Massenrendern und keine automatische Masterfreigabe.
