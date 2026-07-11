# LR4 Selected-Pilot-Fire-Test · Das Zimmer

## Zweck

LR4 bindet den menschlich ausgewählten Pilot `pilot-das-zimmer` an den bereits bewiesenen technischen Produktionspfad:

`Control → Studio → Prompt Queue → Import → Review → QA → Lettering → Package → Zustand löschen → Restore`

Der Test beweist Transport, deterministischen Export, echte Zustandslöschung und hashgleiche Wiederherstellung. Er erteilt keine kreative Freigabe.

## Autorität

Die Pilotauswahl autorisiert nur Identität und Planungsrichtung. Sie autorisiert nicht automatisch:

- jede vorhandene Dialogzeile,
- die vier Figurenbibles als finalen Canon,
- die 45,5-Sekunden-Fassung als finales Timing,
- Character- oder Location-Master,
- Stimmen,
- eine fertige Episode oder Produktionsreife.

Darum werden alle Dialog-, Timing-, Panel-, Figuren- und Ortsdetails im ausführbaren LR4-Paket als `REVIEW_REQUIRED` geführt.

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

`studio-app/src/selected-pilot-loop.mjs` erzeugt einen deterministischen `SelectedPilotEpisodePackage`-Kandidaten. Das Paket enthält:

- die ausgewählte Pilotidentität,
- sieben genaue Quellenpfade und Blob-SHAs,
- acht Metadatenassets ohne Bildbytes,
- acht technische Transportreviews,
- technische QA-Ergebnisse,
- zehn Untertitelkandidaten,
- ausschließlich falsche kreative Freigabefelder,
- einen kanonischen SHA-256-Zustandshash,
- einen SHA-256-Packagehash.

## Fire-Test

Der Test muss nachweisen:

1. Das Paket wird deterministisch erzeugt.
2. Der Produktionszustand existiert vor der Löschung.
3. Der Produktionszustand wird tatsächlich aus `localStorage` entfernt.
4. Das Package bleibt erhalten.
5. Ein manipuliertes Package wird abgewiesen.
6. Der Restore erzeugt denselben kanonischen Zustandshash wie vor der Löschung.
7. Alle neun Stationen stehen anschließend auf `passed`.
8. Alle Detailfelder bleiben `REVIEW_REQUIRED`.
9. Alle kreativen Freigaben bleiben `false`.

## Browser-Gegenprüfung

Desktop und Mobil führen sowohl den geschlossenen LR3-Regressionstest als auch den LR4-Kandidatenpfad aus. Das Runtime-Manifest darf während dieses Implementierungs-PRs nur melden:

- `selectedPilotFireTestCandidatePassed: true`
- `selectedPilotFireTestPassed: false`

Die erste Aussage ist ein technischer Kandidatenbeweis. Die zweite verhindert, dass der Implementierungs-PR sich selbst öffentlich schließt. Für einen LR4-Abschluss sind weiterhin grüner CI-Lauf, Merge des exakt geprüften Heads, GitHub-Pages-Deploy, öffentlicher Browserlauf und separater Closure-Record erforderlich.

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
