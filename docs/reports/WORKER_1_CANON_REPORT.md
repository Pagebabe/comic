# Worker 1 · Canon- und Cast-Korrektur

Repository: `Pagebabe/comic`  
Branch: `worker/canon-lock`  
Draft-PR: `#138`

## Korrigierter Konflikt

Der erste Stand von PR #138 erklärte den dokumentierten 13er-Legacybestand zum aktiven Hauptcast und stufte Ricco, Basti Prenzl, Jule und Don Miau als nicht genehmigte Pilotvariante ab. Das widersprach der ausgewählten Pilotlinie `Das Zimmer`, `project/truth-state.json`, `project/pilot-decision-record.json`, `project/canon.json`, `project/canon-candidates.json` sowie Issues #82 und #88.

## Ergebnis

Die Daten werden jetzt in vier maschinenlesbaren Bereichen getrennt:

- `seriesUniverse`: 13 dokumentierte Serien-, Legacy- und Assetdatensätze
- `activePilotCast`: Ricco, Basti Prenzl, Jule und Don Miau für `Das Zimmer`
- `legacyAssetInventory`: 13 Figuren, 9 Produktionssheets, 6 LoRA-Sheets
- `approvedVisualMasters`: leer

Zusätzlich bleiben Character-, Location- und Voice-Approval-Listen leer. Geprüfte Referenzbilder bleiben bei null.

## Bewahrte Projektwahrheiten

- `Das Zimmer` bleibt ausgewählter Pilot.
- LR5.1 und Issue #88 bleiben das aktive Produktionsgate.
- Der nächste mögliche Übergang bleibt eine ausdrückliche Projektinhaberentscheidung für genau einen Ricco-Review-Kandidaten.
- Diese Entscheidung wäre keine Bild- oder Masterfreigabe.
- M1 bleibt Technikbeweis.
- Growth OS und Live Publishing bleiben getrennt.

## Nicht automatisch entschieden

- keine Fusion von Rico und Ricco
- keine Fusion von Falk und Basti Prenzl
- keine Fusion von Kralle und Don Miau
- keine erfundene Legacy-Zuordnung für Jule
- keine Referenzbildfreigabe
- kein Character-, Visual-, Location- oder Voice-Master

## Prüfvertrag

Die Tests prüfen insbesondere:

- exakt 13 Serienuniversum-Datensätze
- exakt 4 aktive Pilotfiguren
- eindeutige IDs in und zwischen beiden Scopes
- explizite Serienuniversum-Referenz je Pilotfigur
- unveränderte Pilotentscheidung
- 0 geprüfte Referenzbilder
- leere Master-Approval-Listen
- unveränderte Growth-OS- und Publishing-Grenzen
- Desktop- und Mobile-Cockpit ohne horizontalen Überlauf

Der erste Browserlauf deckte auf Mobile 115 px horizontalen Überlauf auf. Die langen Cast-Statuswerte wurden danach responsiv gehärtet; der Fresh-Install-Drill bestätigte die Korrektur. Der finale Comic-Factory-CI-Lauf muss denselben Zustand noch vollständig beweisen.

Die endgültigen Run-IDs, der geprüfte Head-SHA und das Ergebnis aller Gates werden im Draft-PR und in der Worker-Rückgabe geführt. Der Bericht behauptet keine noch nicht ausgeführte Prüfung.
