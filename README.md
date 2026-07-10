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

## Verifizierter Online-Stand

Dashboard:

`https://pagebabe.github.io/comic/`

Ein Stand gilt nur dann als veröffentlicht, wenn Issue #11 denselben Commit wie `proof/runtime-evidence.json` ausweist und die öffentlichen Screenshot-Hashes bestätigt sind.

## Beweiskettenabdeckung

Die Abdeckung umfasst:

- 9 Arbeitsregeln
- 15 Hauptbehauptungen
- 24 terminal klassifizierte Einträge
- 100 % Beweiskettenabdeckung

Das bedeutet nicht, dass alle Produktionsassets fertig sind.

Öffentliche Beweise:

- `project/evidence-chain.json` · historischer Ledger
- `project/evidence-policy-rules.json` · aktive Priority-0-Regeln
- `project/evidence-closure.json` · 100-%-Closure-Manifest
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
