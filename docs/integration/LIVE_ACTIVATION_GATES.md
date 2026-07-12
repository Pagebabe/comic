# Live Activation Gates

Status: `LIVE_READY = BLOCKED`

Dieses Dokument beschreibt ausschließlich spätere Voraussetzungen. Es aktiviert nichts.

## Aktueller technischer Sperrzustand

Alle sieben Gates müssen exakt im folgenden Zustand bleiben:

| Gate | Erforderlicher aktueller Wert |
|---|---|
| Ausführungsmodus | `shadow` |
| Live-Publishing | `false` |
| OAuth autorisiert | `false` |
| verbundene Plattformkonten | `0` |
| menschliche Live-Freigabe | `false` |
| Kill Switch | `LIVE_PUBLISHING_DISABLED` |
| Publishing Adapter | `ABSENT` |

Die Adapterlogik vergleicht die vollständige Gate-Struktur kanonisch. Jede Abweichung endet fail-closed in `LIVE_GATE_VIOLATION` und erzeugt keinen Shadow- oder Live-Plan.

## Mehrfachsperren

Live-Publishing darf später niemals von einem einzelnen Boolean abhängen. Eine Aktivierung benötigt mindestens getrennte Nachweise für:

1. genehmigtes Plattformkonto je Plattform
2. OAuth- und Secret-Management außerhalb des Repositories
3. Provider-Sandbox und Rate-Limit-Beweis
4. produktiven append-only Event Store
5. Idempotenz und Retry-Beweis gegen reale Provider-Semantik
6. Policy- und Rechtefreigabe je Asset
7. menschliche Live-Freigabe je Kampagne oder freigegebenem Automationslevel
8. aktiven Kill Switch und Incident-Runbook
9. Audit-Logging für Request, Response, Plattform-ID und Löschpfad
10. separaten, autorisierten Live-PR mit Rollback- und Beobachtungsplan

## Späterer Onboarding-Prozess, nicht ausführen

```text
Account-Inventar erstellen
→ Plattform und Eigentümer verifizieren
→ minimale OAuth-Scopes festlegen
→ Secrets in genehmigtem Secret Store hinterlegen
→ Provider-Sandbox testen
→ Dry Run ohne Veröffentlichung
→ menschliche Abnahme
→ ein einzelner kontrollierter Pilotpost
→ Plattformbeleg und Analytics prüfen
→ Incident- und Löschweg testen
→ erst danach begrenzte Automationsstufe freigeben
```

## Nicht zulässig

- Tokens im Repository
- automatische Account-Erstellung
- automatische Kommentare oder Community-Antworten
- globale Live-Freigabe für alle Plattformen
- Aktivierung durch Umgebungsvariable ohne zweite und dritte Sperre
- Wiederverwendung eines Shadow-Beweises als Live-Beweis
- Behauptung realer Reichweite aus synthetischen Analytics

## Erforderliche spätere Entscheidung

Live darf erst in einem separaten Arbeitspaket bewertet werden. Dieses Worker-Paket endet absichtlich bei:

```text
SHADOW_RELEASE_READY
LIVE_READY = BLOCKED
```
