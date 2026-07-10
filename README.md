# Comic Factory · Production Dashboard

Produktionsleitstand für die Serie **Ricco im Haus** und den Pilot **Episode 001 · Das Zimmer**.

## Oberste Entwicklungsregel

`RULE-009 · Evidence First · Priority 0`

```text
Behauptung
→ Quelle
→ Test
→ Artefakt
→ Deployment oder Laufbeweis
→ sichtbare Gegenprüfung
→ terminaler Status
```

Kein Pull Request darf ohne vollständiges Evidence Packet grün werden. Die Beweiskette hat Vorrang vor Geschwindigkeit, Komfort und sichtbarem Fortschritt.

Verbindliche Richtlinie:

`docs/EVIDENCE_FIRST_POLICY.md`

## Rückwirkend aufgearbeitete Historie

Der historische Backfill umfasst:

- 25 gefundene Pull Requests
- 1 Vor-PR-Basis
- 26 historische Einheiten
- 0 offene historische Zustände
- 100 % terminale historische Klassifikation

GitHub-Issues und Pull Requests teilen sich dieselbe Nummernfolge. Fehlende Nummern zwischen den geprüften PRs sind deshalb keine verlorenen Pull Requests.

Maschinenlesbar:

`project/historical-pr-evidence.json`

Menschenlesbar:

`docs/HISTORICAL_PR_EVIDENCE_BACKFILL.md`

## Verifizierter Online-Stand

Dashboard:

`https://pagebabe.github.io/comic/`

Ein Stand gilt nur dann als veröffentlicht, wenn Issue #11 denselben Commit wie `proof/runtime-evidence.json` ausweist, der historische Ledger öffentlich abrufbar ist und die Screenshot-Hashes bestätigt sind.

## Beweiskettenabdeckung

Die Abdeckung umfasst:

- 9 Arbeitsregeln
- 16 Hauptbehauptungen
- 25 terminal klassifizierte Einträge
- 25 historisch geprüfte Pull Requests
- 1 Vor-PR-Basis
- 100 % Beweiskettenabdeckung

Das bedeutet nicht, dass alle Produktionsassets fertig sind.

Öffentliche Beweise:

- `project/evidence-chain.json` · Claim- und Regel-Ledger
- `project/evidence-policy-rules.json` · aktive Priority-0-Regeln
- `project/evidence-closure.json` · 100-%-Closure-Manifest
- `project/historical-pr-evidence.json` · vollständiger historischer PR-Backfill
- `proof/runtime-evidence.json` · Commit, Browserchecks und Screenshot-Hashes
- `proof/dashboard-desktop.png` · Desktop-Gegenprüfung
- `proof/dashboard-mobile.png` · Mobil-Gegenprüfung

## Bewiesener Stand

- Dashboard und GitHub-Pages-Deployment
- technische M1-Medienpipeline
- gerettete Legacy-Bibliothek
- vier gesperrte Text-Bibles
- vier Character- und vier Location-Briefs
- achtteiliger EP001-Blueprint mit 45,5 Sekunden
- Timing-/SRT-Paket unter 17 Zeichen pro Sekunde
- schreibgeschützter Asset-Recovery-Prozess
- Evidence-Packet-Gate vor jedem Pull-Request-Merge
- vollständiger Backfill aller gefundenen PR-Entwicklungsstufen

## Historische Korrekturen

- PR #12 ist `disproven`: Die SVGs waren keine production-ready Figuren.
- PR #1 ist `superseded`: Die 244-Commit-Backend-Linie wurde nie gemergt.
- PR #3 ist `historically_unverifiable`: Code und Tests sind vorhanden, der damalige Vercel-Lauf besitzt aber keinen heutigen commitgebundenen Sichtbeweis.
- PR #20 und PR #21 sind `superseded`: Die Recovery-Filter waren zu breit und wurden durch PR #22 ersetzt.
- PR #16 und PR #17 sind ohne Merge geschlossen.
- Der Pages-Outcome-Wächter darf den ausführlichen Issue-#11-Beweis nicht mehr mit einer Kurzfassung überschreiben.

## Noch nicht gebaut

- Character-Master: 0/4
- Location-Master: 0/4
- freigegebene Stimmen: 0/3
- freigegebene Animatic-Panelbilder: 0/8
- fertige Episode: nein

Die vorhandenen Character-SVGs sind ausschließlich technische Testassets. Sie sind keine Figurenporträts und keine Masterreferenzen.

## Aktive Produktionslinie

Bildgenerierung ist pausiert. Sobald sie wieder verfügbar ist, bleibt Ricco das einzige erste visuelle Ziel:

```text
Ricco-Silhouette
→ Character Sheet
→ sichtbare Prüfung
→ menschliche Freigabe
→ erst danach weitere Figuren
```

Keine neue Figur, keine neue Pilotstory, keine parallele Plattformarchitektur und kein Canon-Render vor freigegebenen Character- und Set-Referenzen.
