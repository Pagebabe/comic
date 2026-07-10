# Rückwirkender Entwicklungs- und Beweisketten-Audit

Status: `CLOSED · 100% COVERAGE · PRODUCT WORK STILL OPEN`

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

Die historische Detailaufnahme liegt in [`project/evidence-chain.json`](../project/evidence-chain.json).  
Die terminale Klassifikation liegt in [`project/evidence-closure.json`](../project/evidence-closure.json).  
Der ausführbare Validator liegt in [`scripts/check_evidence_chain.mjs`](../scripts/check_evidence_chain.mjs).

## Ergebnis

```text
Arbeitsregeln:               8/8 erfasst
Hauptbehauptungen:          15/15 erfasst
Gesamteinträge:             23
Terminal klassifiziert:     23
Beweiskettenabdeckung:      100%
Offene Audit-Schwebezustände: 0
```

`100 %` bedeutet vollständige Evidenzabdeckung. Es bedeutet nicht, dass alle geplanten Produktionsassets fertig sind.

## Terminale Zustände

- `proven`: innerhalb des definierten Scopes bewiesen
- `disproven`: widerlegt
- `not_yet_built`: nachweislich noch nicht gebaut
- `historically_unverifiable`: historische Grenze kann prinzipiell nicht vollständig rekonstruiert werden
- `superseded`: kontrolliert durch eine neuere Linie ersetzt

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

## Widerlegt

### Die vier SVGs seien die geplanten Figuren

Diese Aussage ist `disproven`.

Das Ricco-SVG erfüllt unter anderem nicht:

- Ganzkörpersilhouette
- übergroßen Rucksack
- blauen Tupperware-Anker
- zu neue helle Sneaker
- kanonische Körperhaltung

Die SVGs bleiben ausschließlich technische Testassets und werden nicht mehr als Character-Identität angezeigt.

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

### Globale Repository-Isolation

Der Comic-Verlauf kann die eigenen Änderungen und Schutzregeln beweisen. Aus einem einzelnen Repository lässt sich jedoch nicht kryptografisch beweisen, dass historisch niemals irgendein anderes Repository verändert wurde. Diese Grenze ist als `historically_unverifiable` geschlossen dokumentiert. Für aktuelle und künftige Arbeit gilt weiterhin die harte Scope-Regel `Pagebabe/comic`.

### CI vor Einführung des CI-Gates

Ab PR #3 ist das Merge-Gate nachvollziehbar. Ältere Arbeit kann nicht rückwirkend durch eine damals noch nicht vorhandene CI laufen. Auch diese Grenze ist terminal klassifiziert, statt nachträglich erfunden zu werden.

## Geschlossene Prozessvorfälle

- `INC-001`: unfreigegebene Character-SVGs · `closed_verified_by_runtime_visual_proof`
- `INC-002`: versehentliche PRs #16 und #17 · `closed_without_merge`
- `INC-003`: alter Backend-Entwurf PR #1 · `closed_superseded`

## Laufzeitbeweis bei jedem Deploy

Der Pages-Workflow erzeugt aus dem exakten Deployment-Artefakt:

- `proof/runtime-evidence.json`
- `proof/dashboard-desktop.png`
- `proof/dashboard-mobile.png`

Geprüft werden unter anderem:

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
