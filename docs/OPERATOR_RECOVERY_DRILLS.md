# Comic Factory · Operator Failure Lab

Status: `AUTOMATED FAILURE LAB DEFINED · OPERATOR OBSERVATION STILL REQUIRED`

Tracking: Issue #118  
Programm: Issue #101  
Readiness: Issue #95  
Gate: `PR8 · Fehlerdiagnose und Recovery geführt`

## Ziel

Das Failure Lab übersetzt bekannte technische Fehler in feste, überprüfbare Recovery-Pläne. Es verändert keine echten Projektdaten, beendet keine unbekannten Prozesse und führt keine heruntergeladenen Shellskripte aus.

Unbekannte Fehler werden nicht geraten. Sie enden immer bei:

```text
HUMAN_ESCALATION_REQUIRED
```

## Vor dem Arbeiten: Operator Doctor

```bash
npm run doctor
```

Der Doctor prüft ausschließlich lesend:

- Node-Version
- npm
- Git
- Root- und Studio-Package
- Studio-Lockfile
- Truth State
- Academy-Vertrag
- Readiness-Datei

Bei einem bekannten Blocker zeigt er einen versionierten Recovery-Plan. Er repariert nichts selbst.

## Automatisierte Drills

```bash
npm run drill:operator-recovery
```

Erzeugte Artefakte:

```text
output/operator-recovery/operator-recovery-report.json
output/operator-recovery/operator-recovery-report.html
```

Der HTML-Report ist statisch, besitzt eine restriktive Content-Security-Policy und lädt keine externen Ressourcen.

## Fehlerklassen

### Voraussetzungen

- `NODE_UNSUPPORTED`
- `GIT_MISSING`

### Installation

- `STUDIO_LOCKFILE_MISSING`
- `FRESH_CLONE_CONTAMINATED`
- `NPM_INSTALL_FAILED`

### Build und Daten

- `STUDIO_BUILD_FAILED`
- `PROJECT_TRUTH_MISSING`

### Laufzeit und Browser

- `PREVIEW_PORT_IN_USE`
- `PREVIEW_START_FAILED`
- `BROWSER_SMOKE_TIMEOUT`

### Integrität, Recovery und Export

- `HASH_MISMATCH`
- `RESTORE_PACKAGE_INVALID`
- `EXPORT_MISSING`

### Unbekannt

Jeder andere Code wird als `UNKNOWN` behandelt. Es gibt keine Kommandos, keinen Retry und keine automatische Reparatur.

## Severity

| Stufe | Bedeutung |
| --- | --- |
| `SEV1` | Integrität, Wahrheit oder Restore betroffen. Sofort stoppen und menschlich prüfen. |
| `SEV2` | Installation, Build oder Browser blockiert. Evidence sichern und gezielt korrigieren. |
| `SEV3` | begrenzter lokaler Betriebsfehler. Nur bewiesene sichere Wiederholung erlaubt. |

## Einzige automatische Aktion

Nur `PREVIEW_PORT_IN_USE` darf als `SAFE_RETRY_ALLOWED` klassifiziert werden. Dabei wird kein Prozess beendet. Das System wählt lediglich einen anderen freien lokalen Port.

Alle anderen bekannten Fehler verlangen Human Review. Unbekannte Fehler verlangen Human Escalation.

## Sichere Kommandos

Die Recovery-Pläne dürfen ausschließlich diese Kommandos nennen:

```text
node --version
npm --version
git --version
npm --prefix studio-app ci
npm --prefix studio-app run build
npm run drill:fresh-install
npm run test:recovery
npm run test:readiness
npm run check
```

Das Lab führt diese Hinweise nicht automatisch aus. Die Liste verhindert, dass Diagnosecode plötzlich zum Shell-Orchestrator mutiert, weil Menschen irgendwo das Wort „Agent“ benutzt haben.

## Verboten

Unter anderem blockiert:

- `rm -rf`
- `sudo`
- Netzwerkdownload mit direkter Shellpipe
- `git reset --hard`
- `git clean -fd`
- unbekannte Prozesse mit Gewalt beenden
- destruktive Datenbankkommandos
- automatische kreative Freigabe
- automatisches Löschen von Projekt- oder Nutzerdaten

## Recovery-Ablauf für Menschen

1. Arbeit stoppen.
2. Fehlercode und Logs sichern.
3. `npm run doctor` ausführen.
4. Fehlerkarte im JSON- oder HTML-Report öffnen.
5. Severity und Stop-Regel lesen.
6. Nur die genannten sicheren Prüfungen ausführen.
7. Nach einer Korrektur denselben ursprünglichen Test wiederholen.
8. Vorher-/Nachher-Evidence speichern.
9. Unbekannte oder wiederkehrende Fehler eskalieren.

## Beobachtete Abnahme

Der automatisierte Drill kann den technischen Anteil von PR8 beweisen. PR8 bleibt trotzdem `PARTIAL`, bis eine echte Testperson:

- mindestens einen vorbereiteten Anfängerfehler erlebt,
- den Fehler ohne undokumentierte Hilfe einordnet,
- die Stop-Regel korrekt befolgt,
- den sicheren Recovery-Plan ausführt,
- den ursprünglichen Test erneut besteht,
- keine Daten oder Freigabegrenzen verletzt.

Der Beobachter dokumentiert jede Hilfe. Ein LLM darf nicht als unabhängige Testperson eingetragen werden. Wir könnten das behaupten, aber dann wäre das Audit nur Rollenspiel mit JSON.

## Nicht bewiesen

Ein grünes Failure Lab beweist nicht:

- Anfängerreife
- Produktionsreife
- echte Operator-Recovery
- kreative Master
- eine fertige Episode
- Growth-OS-Integration
- Live-Publishing
