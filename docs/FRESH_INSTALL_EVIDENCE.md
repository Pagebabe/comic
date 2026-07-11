# Evidence Packet · P0.2 Fresh-Install-Drill

Status: `AUTOMATED_DRILL_PROVEN · SECOND_PERSON_PENDING · PR1_PARTIAL`

Tracking: Issue #115  
Programm: Issue #101  
Readiness: Issue #95  
Pull Request: #116

## Behauptung

Der geprüfte Pull-Request-Stand kann aus einem isolierten temporären Clone ohne vorbestehende Dependencies oder Build-Artefakte installiert, mit seinen Projektwahrheitsdaten ausgestattet, gebaut, über den installierten Vite-Preview-Server gestartet und auf Desktop sowie Mobil geprüft werden.

Dieser Beweis schließt PR1 nicht. Eine beobachtete Installation durch eine zweite Person auf einer frischen unterstützten Maschine bleibt erforderlich.

## Quelle

- `project/fresh-install-contract.json`
- `project/production-readiness-v1.json`
- `docs/FRESH_INSTALL_DRILL.md`
- `docs/NOVICE_ACCEPTANCE_PROTOCOL.md`
- `scripts/fresh_install_drill.mjs`
- `.github/workflows/fresh-install-drill.yml`

## Negative Evidence

### Lauf 29164219409

- Ergebnis: `FAIL`
- Artefakt: `8251684967`
- Digest: `sha256:7a10fd8e32d2398257850a343d104800140d3b187695706da1531b1b392c6762`
- Befund: Build wurde durch ein vorab angelegtes Zielverzeichnis nicht an der erwarteten lokalen Route bereitgestellt.
- Folge: Packaging korrigiert und `index.html` vor Serverstart geprüft.

### Lauf 29164323675

- Ergebnis: `FAIL`
- Artefakt: `8251713677`
- Digest: `sha256:6d728d81905728b11dcd9809dedab7f3c49dafa16b44fa16b014f75c5841ed8b`
- Befund: Der eigene Static-Server lieferte die React-App nicht zuverlässig sichtbar aus.
- Folge: eigener Server entfernt; installierter Vite-Preview-Pfad eingeführt.

### Lauf 29164785728

- Ergebnis: `FAIL`
- Artefakt: `8251838920`
- Digest: `sha256:2b8c2af68e136e86e7eb72e7d657ad2131947581bc20481b3dc1f97714346959`
- geprüfter Merge-Commit: `7b9fdd6ac9201e681b38b4582610d34f5e23ed86`
- Befund: Vite startete, aber das Studio blieb ohne seine über `../project/` geladenen Wahrheitsdateien im Ladepfad.
- Folge: Pflichtdaten aus `project/` werden in das Preview-Artefakt übernommen und vor dem Browserlauf einzeln geprüft.

## Positiver Laufbeweis

### Fresh Install Drill 29164969887

- Ergebnis: `SUCCESS`
- geprüfter Merge-Commit: `79496acdf31ae6a6d2f4d302d27d6f02f8ac6830`
- Branch-Head: `f0092ff7aa2ffb0b7fcee04a9f6008243125d20d`
- Artefakt: `8251886079`
- Digest: `sha256:ee7ac373958ea3c3684687f438b5402a66ed5de0f6ce5d389341e2285d3e2bd5`
- Runner: Ubuntu 24.04 · x64
- Node: `v20.20.2`
- npm: `10.8.2`
- Git: `2.54.0`
- Gesamtdauer: rund 45 Sekunden
- sauberer Vorzustand: 5/5 Felder `false`
- exakter Commit-Match: `true`
- Pflichtschritte: 14/14 `PASS`
- Browserbelege: 9 Dateien mit SHA-256
- temporärer Clone nach Abschluss entfernt

Geprüft wurden:

- Locked Dependency Install
- Playwright Chromium Install
- TypeScript-/Vite-Build
- Projektwahrheitsdaten-Staging
- direkter Vite-Preview-Erststart
- Studio Desktop und Mobil
- Production Academy Desktop und Mobil
- Readiness Desktop und Mobil
- LR3 Delete/Restore Hash Match
- LR4 Delete/Restore Hash Match
- LR5.1 weiterhin `0/1`, `REVIEW_REQUIRED` und Ausführung gesperrt

### Comic Factory CI 29164969868

- Ergebnis: `SUCCESS`
- derselbe PR-Head
- Evidence-, Truth-, Recovery-, Academy-, Readiness-, Browser-, Pages-Artefakt-, Timing- und technischer Renderpfad bestanden

## Sichtprüfung

Die erzeugten Desktop- und Mobilbilder zeigen:

- keine horizontale Überläufe
- Studio, Academy und Readiness vollständig erreichbar
- `2/10 CLOSED_VERIFIED · 7 PARTIAL · 1 OPEN`
- Production Ready: nein
- Beginner Ready: nein
- kreative Freigabe: nein
- Bildgenerierung: gesperrt
- Growth OS: getrennt
- Ricco-Kandidaten: `0/1`

## Aktueller Status

`AUTOMATED_DRILL_PROVEN_SECOND_PERSON_PENDING`

PR1 bleibt `PARTIAL`. Der automatisierte technische Anteil ist bewiesen. Der verbleibende Nachweis ist eine beobachtete Ausführung durch eine zweite Person auf einer frischen unterstützten Maschine.

## Nicht behauptet

- keine Anfänger-Abnahme
- keine Produktionsreife
- keine kreative Freigabe
- kein Character-, Location- oder Voice-Master
- keine fertige Episode
- keine Growth-OS-Integration
- kein Live-Publishing

## Pflichtbestätigungen

- [x] Scope auf `Pagebabe/comic` begrenzt
- [x] negative Läufe und Ursachen erhalten
- [x] positiver Lauf an Commit, Artefakt und Digest gebunden
- [x] Desktop- und Mobil-Gegenprüfung vorhanden
- [x] PR1 bleibt ohne zweite Person `PARTIAL`
- [x] keine unbelegte Produktions- oder Kreativfreigabe
