# Rückwirkender Entwicklungs- und Beweisketten-Audit

Status: `CLOSED · 100% COVERAGE · FULL PR BACKFILL · PRODUCT WORK STILL OPEN`

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

Die Claim- und Regelaufnahme liegt in [`project/evidence-chain.json`](../project/evidence-chain.json).  
Die terminale Klassifikation liegt in [`project/evidence-closure.json`](../project/evidence-closure.json).  
Der vollständige PR-Backfill liegt in [`project/historical-pr-evidence.json`](../project/historical-pr-evidence.json).  
Die ausführbaren Validatoren liegen in [`scripts/check_evidence_chain.mjs`](../scripts/check_evidence_chain.mjs) und [`scripts/check_historical_pr_evidence.mjs`](../scripts/check_historical_pr_evidence.mjs).

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
Beweiskettenabdeckung:         100%
Offene Audit-Schwebezustände:  0
```

`100 %` bedeutet vollständige Evidenzabdeckung. Es bedeutet nicht, dass alle geplanten Produktionsassets fertig sind.

## Terminale Zustände

- `proven`: innerhalb des definierten Scopes bewiesen
- `disproven`: widerlegt
- `not_yet_built`: nachweislich noch nicht gebaut
- `historically_unverifiable`: historische Grenze kann prinzipiell nicht vollständig rekonstruiert werden
- `superseded`: kontrolliert durch eine neuere Linie ersetzt

## Vollständiger historischer Backfill

Alle gefundenen Pull Requests wurden anhand ihrer Metadaten, tatsächlichen Dateiliste, heutigen Artefakte, Tests und Deploymentgrenzen geprüft. GitHub-Issues und Pull Requests teilen sich dieselbe Nummernfolge. Fehlende Nummern sind daher keine verlorenen Pull Requests.

Zusammenfassung der 26 Einheiten:

```text
proven:                     15
superseded:                  8
historically_unverifiable:   2
disproven:                   1
pending:                     0
```

Der detaillierte Bericht liegt in [`docs/HISTORICAL_PR_EVIDENCE_BACKFILL.md`](HISTORICAL_PR_EVIDENCE_BACKFILL.md).

## Bewiesen

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

### Die vier SVGs seien die geplanten Figuren

Diese Aussage aus PR #12 ist `disproven`.

Das Ricco-SVG erfüllt unter anderem nicht:

- Ganzkörpersilhouette
- übergroßen Rucksack
- blauen Tupperware-Anker
- zu neue helle Sneaker
- kanonische Körperhaltung

Die SVGs bleiben ausschließlich technische Testassets und werden nicht mehr als Character-Identität angezeigt.

## Ersetzte Linien

- PR #1: nicht gemergte 244-Commit-Backend-Linie
- PR #5, #8 und #10: frühe beziehungsweise einmalige Deployment-Beweis- und Triggerstufen
- PR #16 und #17: versehentliche Vergleichs- und Duplikat-PRs
- PR #20 und #21: zu breite Recovery-Auswertungen, ersetzt durch den strikten V2-Filter aus PR #22

## Nachweislich noch nicht gebaut

```text
Character-Masterreferenzen: 0/4
Location-Masterreferenzen:  0/4
freigegebene Stimmen:        0/3
Animatic-Panelbilder:        0/8
fertige Episode 001:         NEIN
```

Diese Einträge sind nicht offen oder vergessen. Sie sind terminal als `not_yet_built` klassifiziert und bleiben Produktionsaufgaben.

## Historisch nicht vollständig beweisbar

### Vor-PR-Basis

Die Existenz früher lokaler Arbeit ist durch Git- und PR-Spuren belegt. Ihre damalige Funktionsfähigkeit, Laufzeit und vollständige Sichtprüfung lassen sich heute nicht commitgebunden rekonstruieren.

### PR #3 · frühere Vercel-Runtime

Code-, Test- und Konfigurationsspuren sind vorhanden. Für den damaligen Commit fehlt jedoch ein heute unabhängiger Deployment- und Screenshot-Beweis. Der historische Runtime-Claim ist deshalb `historically_unverifiable`, nicht nachträglich grün gefärbt.

### Globale Repository-Isolation

Der Comic-Verlauf kann die eigenen Änderungen und Schutzregeln beweisen. Aus einem einzelnen Repository lässt sich jedoch nicht kryptografisch beweisen, dass historisch niemals irgendein anderes Repository verändert wurde. Diese Grenze ist als `historically_unverifiable` geschlossen dokumentiert. Für aktuelle und künftige Arbeit gilt weiterhin die harte Scope-Regel `Pagebabe/comic`.

### CI vor Einführung des CI-Gates

Ältere Arbeit kann nicht rückwirkend durch eine damals noch nicht vorhandene CI laufen. Diese Grenze ist terminal klassifiziert, statt nachträglich erfunden zu werden.

## Geschlossene Prozessvorfälle

- `INC-001`: unfreigegebene Character-SVGs · `closed_verified_by_runtime_visual_proof`
- `INC-002`: versehentliche PRs #16 und #17 · `closed_without_merge`
- `INC-003`: alter Backend-Entwurf PR #1 · `closed_superseded`
- `INC-004`: Rich-Deploy-Beweis wurde vom Outcome-Wächter verkürzt · `closed_preserve_rich_proof`

Der Outcome-Wächter erkennt jetzt einen bereits aktuellen ausführlichen Issue-#11-Beweis und überschreibt ihn nicht mehr mit einer schwächeren Kurzfassung.

## Laufzeitbeweis bei jedem Deploy

Der Pages-Workflow erzeugt aus dem exakten Deployment-Artefakt:

- `proof/runtime-evidence.json`
- `proof/dashboard-desktop.png`
- `proof/dashboard-mobile.png`

Geprüft werden unter anderem:

- 25/25 Evidence-Einträge
- 25 historische Pull Requests plus eine Vor-PR-Basis
- null offene historische Zustände
- exakt vier Kerncast-Karten
- exakt vier Kennzeichnungen `VISUAL OFFEN`
- null sichtbare Character-Porträts
- kein horizontaler Überlauf auf Desktop und Mobil
- sichtbarer 100-%-Coverage-Status
- Commit-Gleichheit zwischen Runtime-Manifest und Deploy
- SHA-256-Gleichheit der öffentlich erneut geladenen Screenshots

Issue #11 gilt erst nach diesen Prüfungen als Deployment-Beweis.

## Dauerhafte Entwicklungsregel

Jede weitere sichtbare Änderung wird erst dann als bewiesen geführt, wenn Quelle, Test, Artefakt, Deploy und sichtbare Gegenprüfung geschlossen sind. Ein nicht gebautes Ergebnis wird nicht als Fehler des Audits behandelt, sondern ehrlich als `not_yet_built` geführt.
