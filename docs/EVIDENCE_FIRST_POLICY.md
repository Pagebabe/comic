# Comic Factory · Evidence First Policy

Status: `ACTIVE · PRIORITY 0 · MERGE-BLOCKING · RETROACTIVE`

Repository: `Pagebabe/comic`

## Oberste Regel

Die Beweiskette hat Vorrang vor Geschwindigkeit, Komfort, sichtbarem Fortschritt und kreativer Begeisterung.

```text
Behauptung
→ Quelle
→ Test
→ Artefakt
→ Deployment oder Laufbeweis
→ sichtbare Gegenprüfung
→ ehrlicher Status
```

Fehlt ein Glied, darf die betroffene Behauptung nicht als bewiesen, fertig, freigegeben oder kanonisch dargestellt werden.

## Geltungsbereich

Diese Regel gilt für:

- Code und Konfiguration
- Canon- und Storyentscheidungen
- Character- und Location-Visuals
- Stimmen, Audio und Musik
- Animatic- und Episodenbilder
- Render und Export
- Dashboard-Status
- Deployment
- Recovery und Migration
- Dokumentation und Produktionspläne
- jede neue Pull-Request-Änderung
- jede rückwirkend gefundene Entwicklungsstufe

## Pflicht vor jedem Pull Request

Jeder Pull Request muss ein vollständiges Evidence Packet enthalten:

1. konkrete Behauptung
2. autorisierende Quelle
3. ausführbarer Test
4. erzeugtes oder referenziertes Artefakt
5. Deployment- oder Laufbeweis
6. sichtbare Gegenprüfung oder verbindlicher Prüfplan
7. aktueller ehrlicher Status
8. ausdrücklich nicht behauptete Ergebnisse
9. bestätigter Repository-Scope

Die CI blockiert Pull Requests mit fehlenden, leeren oder offensichtlich provisorischen Abschnitten.

## Rückwirkende Pflicht

Die Beweiskette gilt nicht nur ab ihrer Einführung. Frühere Arbeit wird rückwirkend in einen terminalen Zustand überführt:

```text
proven
| disproven
| historically_unverifiable
| superseded
```

Dabei gilt:

- fehlende historische Belege werden nicht erfunden,
- falsche frühere Behauptungen werden als `DISPROVEN` markiert,
- ersetzte Entwicklungswege werden `SUPERSEDED`,
- prinzipiell nicht mehr rekonstruierbare Zustände werden `HISTORICALLY_UNVERIFIABLE`,
- keine historische Einheit bleibt offen oder in einem Schwebezustand.

Der vollständige Backfill liegt in:

- `project/historical-pr-evidence.json`
- `docs/HISTORICAL_PR_EVIDENCE_BACKFILL.md`
- `scripts/check_historical_pr_evidence.mjs`

Der geprüfte Umfang umfasst 25 Pull Requests und eine Vor-PR-Basis, insgesamt 26 historische Einheiten.

## Zulässige Statuswerte

Terminal:

- `PROVEN`
- `DISPROVEN`
- `NOT_YET_BUILT`
- `HISTORICALLY_UNVERIFIABLE`
- `SUPERSEDED`

Vor einem noch ausstehenden Main-/Pages-Deploy ist zusätzlich erlaubt:

- `PENDING_DEPLOY`

`PENDING_DEPLOY` ist kein grüner Endstatus. Nach dem Deploy muss Runtime-Beweis oder Blocker-Issue den Zustand terminal schließen.

## Stop-Regeln

- Kein Merge bei roter CI.
- Kein Pull Request ohne vollständiges Evidence Packet.
- Kein Visual-Master ohne menschliche Sichtprüfung.
- Kein Canon-Status aus Dateiname, Prompt oder automatischem Score.
- Kein fertiger Status für technische Platzhalter.
- Kein Verschweigen dauerhaft unbeweisbarer Historie.
- Kein offener Status im historischen Backfill.
- Kein Zugriff auf andere Repositories während Comic-Arbeit.
- Keine Behauptung über Chris Fact Radar ohne unabhängigen Audit dieses Repositories.
- Kein Überschreiben eines ausführlichen commitgebundenen Deploy-Beweises mit einer schwächeren Kurzfassung.

## Reihenfolge bei Konflikten

```text
Beweiskette
> Canon
> Sicherheit und Repository-Isolation
> reproduzierbare Tests
> Produktionsqualität
> Geschwindigkeit
> Komfort
```

Ein schneller Schritt mit offener Beweiskette ist kein Fortschritt, sondern späteres Aufräumen mit besserem Marketing.
