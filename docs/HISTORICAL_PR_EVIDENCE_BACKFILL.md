# Historischer PR-Beweisketten-Backfill

Status: `COVERAGE CLOSED`

Repository: `Pagebabe/comic`

## Umfang

- 25 Pull Requests geprüft
- 1 Vor-PR-Basis geprüft
- 26 historische Einheiten terminal klassifiziert
- 0 offene oder schwebende Zustände
- 100 % historische Abdeckung innerhalb des definierten Repository-Scopes

GitHub-Issues und Pull Requests teilen sich dieselbe Nummernfolge. Die fehlenden Nummern zwischen den unten aufgeführten PRs sind daher keine fehlenden Pull Requests.

## Klassifikationen

- `proven`: 15
- `disproven`: 1
- `historically_unverifiable`: 2
- `superseded`: 8

## Verbindliche Lesart

Der Backfill beweist nicht, dass jede frühere Idee richtig oder jede historische Laufzeit noch reproduzierbar ist. Er beweist, dass jede gefundene Entwicklungsstufe einen eindeutigen terminalen Status, Quellen, Grenzen und eine heutige Einordnung besitzt.

## Einzelprüfung

| Einheit | Titel | Status | Kernergebnis |
|---|---|---|---|
| Vor-PR | Vor-PR-Basis und frühe lokale Entwicklung | `historically_unverifiable` | Die Existenz der frühen Arbeit ist durch Git- und PR-Spuren belegt, ihre damalige Funktionsfähigkeit und vollständige Sichtprüfung aber nicht rückwirkend reproduzierbar. |
| PR #1 | Add backend adapters and Ricco generation queue | `superseded` | Die Linie wurde bewusst nicht gemergt, predatiert Canon-, M1R- und Evidence-First-Gates und wurde als historische Referenz geschlossen. |
| PR #3 | Verify and harden Comic Factory runtime | `historically_unverifiable` | Code- und Testspuren sind vorhanden, aber die zentrale Behauptung einer ausgeführten sicheren Vercel-Anwendung ist für den historischen Commit nicht vollständig geschlossen. |
| PR #4 | Make Comic Factory dashboard independently reachable | `proven` | Der zentrale Pages- und Browser-Director-Pfad besteht heute weiter und wird commitgebunden veröffentlicht und sichtbar gegengeprüft. |
| PR #5 | Add verifiable proof for every dashboard deployment | `superseded` | Das Prinzip blieb erhalten, die konkrete Implementierung wurde durch PR #6, #29 und #30 ersetzt und verschärft. |
| PR #6 | Report the actual GitHub Pages deployment outcome | `proven` | Der Outcome-Wächter existiert weiterhin und liefert den commitgebundenen öffentlichen Deploymentstatus. |
| PR #8 | Record verified runtime status and trigger final hosting check | `superseded` | Der einmalige Trigger erfüllte seinen Zweck und wurde durch den dauerhaften automatischen Pages-Nachweis ersetzt. |
| PR #10 | Trigger verified Pages deployment after activation | `superseded` | Der Aktivierungsschritt war einmalig; die dauerhafte Beweisfunktion liegt heute bei Pages- und Runtime-Workflows. |
| PR #12 | Build the first production-ready M1 character pack | `disproven` | Die Bezeichnung production-ready war falsch. Riccos Ganzkörperform, Rucksack, Tupperware-Anker, helle Sneaker und weitere Pflichtmerkmale fehlten. |
| PR #13 | Render, validate and publish the first Ricco life-sign clip | `proven` | Die technische Pipeline wird weiterhin deterministisch in CI gerendert und validiert. |
| PR #14 | Recover full Comic Factory canon, cast library and production planning | `proven` | Inventarzahlen, Quellenhierarchie und Stop-Regeln werden maschinenlesbar geprüft und veröffentlicht. |
| PR #16 | Closed accidental duplicate PR | `superseded` | Keine eigenständige Entwicklungsstufe; durch PR #14 vollständig ersetzt. |
| PR #17 | Closed accidental comparison PR | `superseded` | Kein Produktbeitrag; historischer Prozessfehler mit terminaler Schließung. |
| PR #18 | Add a proven read-only local asset recovery scanner | `proven` | Scanner, Ausschlussregeln und Tests bestehen weiterhin. |
| PR #19 | Lock the four core text character bibles | `proven` | Alter, Rolle, Sprache und Visual-Pending-Status werden maschinenlesbar geschützt. |
| PR #20 | Add recovery candidate shortlist analyzer | `superseded` | Der erste Rankingansatz war technisch reproduzierbar, aber fachlich zu breit und wurde durch strengere Filter ersetzt. |
| PR #21 | Harden visual recovery and inspect ComfyUI PNG metadata | `superseded` | Die Metadatensuche war noch zu großzügig, weil generische Ortsbegriffe und Negative-Prompt-Wörter falsche Treffer ermöglichten. |
| PR #22 | Add strict positive-prompt Comic PNG inspector | `proven` | Der V2-Filter trennt positive und negative Promptzweige und akzeptiert null Kandidaten als gültiges Ergebnis. |
| PR #23 | Lock visual preproduction while image generation is paused | `proven` | Briefs, Verbote, Ansichten und menschliche Freigabepflicht werden maschinenlesbar erzwungen. |
| PR #24 | Lock the eight-panel EP001 animatic blueprint | `proven` | Panelzahl, Dauer, Dialogquellen, Figuren, Orte und Renderblockade werden geprüft. |
| PR #25 | Export the neutral EP001 timing and subtitle package | `proven` | Der Export ist deterministisch und behauptet ausdrücklich keine Stimme oder fertiges Animatic. |
| PR #26 | Slow the two dense EP001 subtitle cues | `proven` | Messwert und Grenzwert sind öffentlich und werden in CI hart geprüft. |
| PR #27 | Replace the broken character grid with a production cockpit | `proven` | Die heutige Runtime-Sichtprüfung bestätigt die reparierte Karten- und Cockpitstruktur. |
| PR #28 | Add mandatory retroactive evidence-chain auditing | `proven` | Der Audit bildet die historische Claim-Ebene ab und blockiert unbelegte Visual-/Voice-/Finalclaims. |
| PR #29 | Close the evidence chain with terminal coverage and public visual proof | `proven` | Die Beweiskettenabdeckung wurde terminal geschlossen, ohne unfertige Produktassets als fertig zu markieren. |
| PR #30 | Make evidence chain the priority-zero merge gate | `proven` | Der PR bestand seinen eigenen Evidence-Packet-Check und sämtliche Regressionen. |

## Kritische Korrekturen

### PR #12

Die Behauptung eines `production-ready` Character-Packs ist widerlegt. Die vier SVGs bleiben technische Platzhalter und dürfen nicht als Figuren-Master erscheinen.

### PR #20 und #21

Die beiden ersten Recovery-Auswertungen waren fachlich zu breit. PR #20 wurde durch strengere Zielprüfung ersetzt; PR #21 wurde nach einem falschen 20-Bilder-Influencerpaket durch den positiven Promptprüfer aus PR #22 ersetzt.

### PR #1

Die 244-Commit-Backend-Linie wurde nie gemergt und ist durch die heutige Canon-, M1R- und Evidence-First-Linie ersetzt. Sie bleibt ausschließlich historische Ideenquelle.

### PR #3

Code- und Testspuren sind vorhanden. Die zentrale damalige Vercel-Laufzeitbehauptung besitzt jedoch keinen heute unabhängigen, commitgebundenen Deployment- und Sichtbeweis. Der Status ist deshalb ehrlich `historically_unverifiable`.

## Aktive Linie

Die aktive, beweisbare Produktionslinie beginnt mit dem GitHub-Pages-Pfad, wird durch Canon-Recovery, Text-Bibles, Visual-Preproduction, Animatic- und Timingverträge fortgeführt und durch RULE-009 vor jedem zukünftigen Merge geschützt.

Maschinenlesbarer Ledger:

`project/historical-pr-evidence.json`

Validator:

`scripts/check_historical_pr_evidence.mjs`

## Zusätzlich geschlossener Deploy-Beweis-Vorfall

`INC-004-deploy-proof-overwrite`: Der unabhängige Pages-Outcome-Wächter überschrieb den ausführlichen Issue-#11-Beweis nach erfolgreichen Deploys mit einer kürzeren Fassung. Der Erfolgsfall erkennt jetzt einen bereits aktuellen Rich-Proof und lässt ihn unverändert. Nur fehlende oder veraltete Beweise erhalten noch den Fallback-Text.
