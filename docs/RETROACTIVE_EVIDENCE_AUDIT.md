# Rückwirkender Entwicklungs- und Beweisketten-Audit

Status: `ACTIVE · HISTORIC CLAIMS CLASSIFIED · VISUAL CORRECTION REQUIRED`

Repository: `Pagebabe/comic`

Audit-Basis: Commit `ae53a67a2736d198c821a96026236d25c9f21c19`

## Verbindliche Beweisregel

Ab jetzt und rückwirkend für jede größere Projektbehauptung:

```text
Behauptung
→ belastbare Quelle
→ ausführbarer Test
→ erzeugtes oder vorhandenes Artefakt
→ Deployment- oder Laufbeweis
→ sichtbare Gegenprüfung
→ erst dann Status BEWIESEN
```

Fehlt ein Glied, lautet der Status nicht `bewiesen`, sondern:

- `partially_proven`
- `unproven`
- `reclassified`
- `superseded`

Die maschinenlesbare Wahrheit liegt in [`project/evidence-chain.json`](../project/evidence-chain.json). Der CI-Prüfer liegt in [`scripts/check_evidence_chain.mjs`](../scripts/check_evidence_chain.mjs).

## Rückwirkendes Ergebnis

### Bewiesen

1. **Dashboard öffentlich erreichbar**
   - GitHub Pages, Outcome-Wächter und Proof-Issue sind vorhanden.
   - Der Deploy-Beweis enthält URL, Commit, Workflow und Zeitstempel.

2. **M1-Technikpipeline funktioniert**
   - reproduzierbarer Viersekunden-Render
   - MP4, H.264, AAC, 1080×1920, 30 fps
   - FFprobe- und Renderbericht
   - ausdrücklich kein Character-, Set- oder Voice-Lock

3. **Legacy-Bestand ist als Datenbibliothek erhalten**
   - 13 Figuren
   - 9 Character Production Sheets
   - 6 LoRA Sheets
   - weitere Story-, Location- und Produktionsverträge

4. **Vier Text-Bibles sind gesperrt**
   - Ricco
   - Basti Prenzl
   - Jule
   - Don Miau

5. **Visual Preproduction ist vorbereitet**
   - vier Character-Briefs
   - vier Location-Briefs
   - Ansichten, Expressions, Posen, Identitätsanker, Verbote und Approval Gates

6. **EP001-Blueprint steht**
   - genau acht Panels
   - genau 45,5 Sekunden
   - ausschließlich gesperrte Figuren, Orte und Dialogzeilen

7. **Timing- und SRT-Paket besteht das Pacing-Gate**
   - zehn Cues
   - maximal 17 Zeichen pro Sekunde
   - gemessener Höchstwert 16,61
   - keine automatische Voice- oder Canon-Freigabe

## Teilbewiesen

### Lokales Recovery-Ergebnis

Der lokale Lauf meldete:

- 6.047 untersuchte Dateien
- 183 breite Kandidaten vor Filterung
- 0 Lesefehler
- nach strenger Prüfung 0 vertrauenswürdige Character- oder Location-Master
- ein 20-Bilder-Reviewpaket bestand ausschließlich aus fremden fotorealistischen Influencerbildern und wurde vollständig verworfen

Die Werkzeuge und ihre Tests sind im Repository reproduzierbar. Der vollständige lokale Bericht bleibt wegen absoluter Pfade und privater Bestandsdaten absichtlich außerhalb von Git. Deshalb ist der konkrete 6.047-Dateien-Lauf für Dritte nicht vollständig aus dem Repository reproduzierbar.

### Repository-Isolation

Das Comic-Repository enthält Stop-Regeln und Tests gegen fremde Projektpfade. Aus dem Verlauf eines einzelnen Repositories lässt sich jedoch nicht kryptografisch beweisen, dass niemals irgendein anderes Repository verändert wurde. Die Aussage `Chris Fact Radar blieb unberührt` bleibt daher eine dokumentierte und technisch geschützte Arbeitsregel, aber kein global vollständig beweisbarer historischer Fakt ohne unabhängigen Zugriff auf alle betroffenen Repositories.

### Aktuelle Dashboard-Optik

PR #27 wurde per CI und GitHub Pages bewiesen. Das bestätigt Dateien, Datenverträge und Deployment. Eine neue menschliche Screenshot-Gegenprüfung nach diesem Deploy fehlt noch. Deshalb ist die Aussage `visuell sauber` nur teilbewiesen.

## Rückwirkend reklassifiziert

### PR #12: „production-ready M1 character pack“

PR #12 führte vier SVG-Porträts ein und beschrieb sie zu stark als produktionsbereite Figurenassets.

Der spätere Canon-Audit zeigt:

- Ricco benötigt eine schlanke Ganzkörpersilhouette.
- Rucksack und Kopfhörer müssen sofort lesbar sein.
- Der blaue Tupperware-Deckel ist ein Identitätsanker.
- Zu neue helle Sneaker gehören zum Design.
- Influencer-, Actionhelden- und Hochglanzwirkung sind verboten.

Das bestehende Ricco-SVG zeigt lediglich einen generischen Kopf mit Jacke und Kopfhörern. Rucksack, Körperhaltung, Tupperware, Sneaker und Ganzkörpersilhouette fehlen.

**Entscheidung:**

- Die SVGs bleiben technische Testassets.
- Sie sind keine Character-Master.
- Sie dürfen im Live-Character-Board nicht mehr als Figurenrepräsentation erscheinen.
- Bis echte Master existieren, zeigt das Board nur Identitätsanker, Verbote und `VISUAL OFFEN`.

Vorfall-ID: `INC-001-unapproved-character-portraits`

## Unbewiesen

Die folgenden Aussagen sind ausdrücklich nicht erfüllt:

```text
Character-Masterreferenzen: 0/4
Location-Masterreferenzen:  0/4
freigegebene Stimmen:        0/3
echte Animatic-Panelbilder:  0/8
fertige Episode 001:         NEIN
```

Der vorhandene M1-Clip ist nur ein technischer Pipelinebeweis.

## Historische Prozessvorfälle

### INC-001 · Unfreigegebene Character-Porträts

Technische SVGs wurden zu stark beschrieben und sichtbar als Figuren eingesetzt. Korrektur: aus dem Character Board entfernen, Evidence Gate ergänzen.

### INC-002 · Versehentliche PRs #16 und #17

Ein Vergleichs-PR und ein doppelter Recovery-PR wurden versehentlich erstellt. Beide wurden ohne Merge geschlossen. Künftige Regel: ein isolierter Branch und ein PR pro Änderung.

### INC-003 · Veralteter Backend-Entwurf PR #1

PR #1 umfasst 244 Commits und stammt aus einer früheren Architekturphase. Er ist nicht mit dem heutigen Canon- und Produktionsgate synchron. Er bleibt nur historische Referenz und darf nicht in die aktive Linie gemerged werden. Nach Merge dieses Audits wird er als superseded geschlossen.

## Pflicht-Audit vor jeder sichtbaren Änderung

Vor jedem neuen Dashboard-Status, Bild, Render oder Produktionsartefakt werden diese Fragen beantwortet:

1. Welche konkrete Behauptung wird sichtbar gemacht?
2. Welche Canon- oder Quelldatei erlaubt sie?
3. Welcher Test prüft sie?
4. Welches Artefakt beweist sie?
5. Welcher Lauf oder Deploy beweist die Ausführung?
6. Wurde das Ergebnis sichtbar oder menschlich gegengeprüft?
7. Welche Lücke bleibt offen?
8. Ist der angezeigte Status exakt so vorsichtig wie die schwächste Stelle der Kette?

## Stop-Regel

Eine offene Beweiskette blockiert den grünen Status, aber nicht zwingend die gesamte Entwicklung. Die Arbeit darf weitergehen, sofern der Status ehrlich bleibt:

```text
OPEN
PARTIAL
UNPROVEN
RECLASSIFIED
BLOCKED
```

`PROVEN` ist ausschließlich bei geschlossener Kette erlaubt.
