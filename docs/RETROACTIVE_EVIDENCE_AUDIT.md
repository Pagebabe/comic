# Rückwirkender Entwicklungs- und Beweisketten-Audit

Status: `CLOSED · 100% COVERAGE · FULL PR BACKFILL · FIVE INCIDENTS CLOSED`

Repository: `Pagebabe/comic`

## Verbindliche Beweisregel

```text
Behauptung
→ belastbare Quelle
→ ausführbarer Test
→ erzeugtes oder vorhandenes Artefakt
→ Deployment- oder Laufbeweis
→ sichtbare Gegenprüfung
→ terminaler Status
```

Die Claim- und Regelaufnahme liegt in `project/evidence-chain.json`.  
Die terminale Klassifikation liegt in `project/evidence-closure.json`.  
Der vollständige PR-Backfill liegt in `project/historical-pr-evidence.json`.  
Die Incident-Beweise liegen unter `project/incidents/`.

## Ergebnis

```text
Arbeitsregeln:                  9/9 erfasst
Hauptbehauptungen:             16/16 erfasst
Gesamteinträge:                25
Terminal klassifiziert:        25
Historische Pull Requests:     25
Vor-PR-Basis:                   1
Historische Einheiten:         26
Offene historische Zustände:   0
Geschlossene Vorfälle:         5
Beweiskettenabdeckung:         100%
Offene Audit-Schwebezustände:  0
```

`100 %` bedeutet vollständige Evidenzabdeckung. Es bedeutet nicht, dass alle geplanten Produktionsassets fertig sind.

## Historischer Backfill

Alle gefundenen Pull Requests wurden anhand ihrer Metadaten, tatsächlichen Dateiliste, heutigen Artefakte, Tests und Deploymentgrenzen geprüft. GitHub-Issues und Pull Requests teilen sich dieselbe Nummernfolge. Fehlende Nummern sind deshalb keine verlorenen Pull Requests.

```text
proven:                     15
superseded:                  8
historically_unverifiable:   2
disproven:                   1
pending:                     0
```

Details: `docs/HISTORICAL_PR_EVIDENCE_BACKFILL.md`.

## Bewiesener Stand

- öffentliches Dashboard und Pages-Deployment
- deterministische M1-Medienpipeline
- gerettete Legacy-Bibliothek
- vier gesperrte Text-Bibles
- vier Character- und vier Location-Briefs
- EP001-Blueprint mit acht Panels und 45,5 Sekunden
- Timing-/SRT-Paket unter 17 Zeichen pro Sekunde
- schreibgeschützter Recovery-Prozess
- aktuelles Dashboard ohne sichtbare Character-Platzhalter
- Priority-0-Evidence-Packet-Gate vor jedem neuen Merge
- vollständige terminale Klassifikation aller 25 gefundenen Pull Requests und der Vor-PR-Basis

## Widerlegt

PR #12 behauptete ein `production-ready` Character-Pack. Diese Aussage ist `disproven`. Die SVGs erfüllen die gesperrten Figurenpläne nicht und bleiben technische Testassets.

## Ersetzte Linien

- PR #1: nicht gemergte 244-Commit-Backend-Linie
- PR #5, #8 und #10: frühe beziehungsweise einmalige Deployment-Beweis- und Triggerstufen
- PR #16 und #17: versehentliche Vergleichs- und Duplikat-PRs
- PR #20 und #21: zu breite Recovery-Auswertungen, ersetzt durch PR #22

## Nachweislich noch nicht gebaut

```text
Character-Masterreferenzen: 0/4
Location-Masterreferenzen:  0/4
freigegebene Stimmen:        0/3
Animatic-Panelbilder:        0/8
fertige Episode 001:         NEIN
```

Diese Einträge sind terminal als `not_yet_built` klassifiziert und bleiben Produktionsaufgaben.

## Historisch nicht vollständig beweisbar

- Vor-PR-Basis: damalige Laufzeit und vollständige Sichtprüfung nicht commitgebunden rekonstruierbar
- PR #3: Code und Tests vorhanden, historischer Vercel-Lauf ohne unabhängigen heutigen Sichtbeweis
- globale Repository-Isolation: ein einzelnes Repository kann kein universelles historisches Negativ beweisen
- CI vor Einführung des CI-Gates: kann nicht rückwirkend durch eine damals nicht vorhandene CI laufen

## Geschlossene Prozessvorfälle

- `INC-001`: unfreigegebene Character-SVGs · `closed_verified_by_runtime_visual_proof`
- `INC-002`: versehentliche PRs #16 und #17 · `closed_without_merge`
- `INC-003`: alter Backend-Entwurf PR #1 · `closed_superseded`
- `INC-004`: Rich-Deploy-Beweis wurde vom Outcome-Wächter verkürzt · `closed_preserve_rich_proof`
- `INC-005`: statische Evidence-Überschrift zeigte 23/23 trotz Runtime-Wert 25/25 · `closed_verified_by_runtime_visual_proof`

### INC-005-Beweiskette

Fehlerbeweis:

- Commit `ed889faafb92ec359c3dea7008a9c27ae8ac15fb`
- Pages-Workflow `29128868065`
- Runtime 25/25, sichtbare Überschrift 23/23
- manuelle Gegenprüfung: FAIL

Korrekturbeweis:

- Commit `24e63b3208bcb0e36e4b521d0c449a9d0dc994cb`
- Pages-Workflow `29129271039`
- `driftSafeEvidenceHeadingPresent: true`
- `staleEvidenceCountPresent: false`
- Desktop und Mobil manuell geprüft
- manuelle Gegenprüfung: PASS

Der Fehler wurde nicht aus dem Verlauf entfernt. FAIL und PASS bleiben beide dokumentiert.

## Laufzeitbeweis bei jedem Deploy

Der Pages-Workflow erzeugt:

- `proof/runtime-evidence.json`
- `proof/dashboard-desktop.png`
- `proof/dashboard-mobile.png`

Geprüft werden unter anderem:

- 25/25 Evidence-Einträge
- 25 historische Pull Requests plus eine Vor-PR-Basis
- null offene historische Zustände
- fünf terminal geschlossene Vorfälle
- vier Kerncast-Karten und vier Kennzeichnungen `VISUAL OFFEN`
- null sichtbare Character-Porträts
- kein horizontaler Überlauf
- driftfeste Evidence-Überschrift
- Abwesenheit des alten 23/23-Texts
- Commit- und Screenshot-Hash-Gleichheit nach öffentlichem Deploy

## Dauerhafte Entwicklungsregel

Jede weitere sichtbare Änderung wird erst dann als bewiesen geführt, wenn Quelle, Test, Artefakt, Deploy und sichtbare Gegenprüfung geschlossen sind. Nicht gebaute Ergebnisse bleiben ehrlich `not_yet_built`.
