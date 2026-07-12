# Comic Marketing Agency · Prelaunch

Tracking: Issue #158

## Zweck

Dieses Paket verbindet die vorhandene Growth-OS-Shadow-Linie mit der Serie **Ricco im Haus** und dem ausgewählten Pilot **Das Zimmer**. Es bereitet die Marketingarbeit vollständig vor, ohne Plattformkonten, Netzwerk, OAuth, Live-Metriken oder Publishing zu aktivieren.

## Was vorbereitet ist

- Markenpositionierung und Brand-Grenzen
- vier ausdrücklich unvalidierte Zielgruppenhypothesen
- sechs source-bound Content-Säulen
- vier providerneutrale Plattformadapter
- fünf Kampagnenphasen von Vorbereitung bis Lernzyklus
- sieben geplante Launch-Assetrollen
- Copy-Templates und verbotene Leistungsbehauptungen
- KPI- und Datenqualitätsvertrag
- acht Marketingjobs mit null aktiven Jobs
- Human-, Rechte-, Brand-, Plattform- und Live-Gates

## Aktuelle Wahrheit

```text
MARKETING_MODE=shadow
APPROVED_EPISODES=0
APPROVED_MARKETING_ASSETS=0
PLATFORM_ACCOUNTS=0
LIVE_METRICS=0
ACTIVE_MARKETING_JOBS=0
NETWORK_CALLS=0
PUBLISHING_ACTIONS=0
PAID_SPEND_EURO=0
AUTOMATIC_APPROVALS=0
```

## Positionierung

**Ricco im Haus** ist eine deutschsprachige vertikale animierte Social-Comedy. Ein kaputtes Berliner Haus dient als Mikrokosmos für Wohnen, Szene-Doppelmoral, Musik, Clubs und moderne Absurditäten. Ricco ist die ehrliche und leicht überforderte Publikumsperspektive.

Die Marketingagentur darf diese Positionierung erklären und strukturieren. Sie darf keine neuen Charaktereigenschaften, Dialoge, Beziehungen, Episodenhandlungen oder visuellen Master erfinden.

## Content-System

Die sechs vorbereiteten Säulen sind:

1. Ricco gegen Berliner Normalität
2. Bastis solidarische Geschäftsmodelle
3. Jules Hausordnungslogik
4. Don Miau urteilt
5. Haus Nr. 13 als Serienmaschine
6. nachweisbare Arbeit der Comic Factory

Für den ersten echten 28-Tage-Zyklus werden später genau vier Säulen durch Menschen ausgewählt. Marketingdaten dürfen eine Auswahl empfehlen, aber niemals Canon oder Produktion automatisch ändern.

## Plattformen

Vorbereitet sind Shadow-Templates für:

- TikTok
- Instagram Reels
- YouTube Shorts
- Instagram Static beziehungsweise Carousel

Der interne Master bleibt 1080 × 1920 im Verhältnis 9:16. Exakte aktuelle Plattformlimits werden erst bei Aktivierung gegen offizielle Dokumentation geprüft. Diese Verträge verewigen absichtlich keine möglicherweise veralteten Plattformregeln.

## Kampagnenphasen

```text
P0 Vorbereitung                 ACTIVE_SHADOW_ONLY
P1 Asset Assembly               BLOCKED
P2 Shadow Launch Review         BLOCKED
P3 Limited Live Pilot           BLOCKED_SEPARATE_AUTHORIZATION_REQUIRED
P4 Learning Cycle               BLOCKED_NO_LIVE_DATA
```

Ein echter Post benötigt mindestens:

- freigegebenes EpisodePackage mit SHA-256
- 4/4 Character-Master und 4/4 Location-Master
- freigegebenes Audio, Transkript und Untertitel
- Rechte- und Musikprüfung
- Plattformadapterprüfung
- Brand- und Accessibility-Review
- Rollbackplan und geprüften Kill Switch
- separate menschliche Live-Freigabe

## Messvertrag

Vor dem ersten echten Datenrückfluss bleiben alle Baselines unbekannt. Deshalb enthält das Paket keine erfundenen Zielwerte für Reichweite, Follower, Completion oder Umsatz.

Nach einem separat freigegebenen Live-Pilot werden mindestens geprüft:

- Impressions und qualifizierte Views
- durchschnittliche Wiedergabezeit
- Completion und Retention Curve
- Rewatches
- Shares und Saves
- Kommentare und negatives Feedback
- Profilbesuche und zuordenbare Follows

Reviews erfolgen nach 72 Stunden, 7 Tagen und 28 Tagen. Ein einzelner Post oder eine einzelne Kennzahl darf keine automatische Richtungsänderung auslösen.

## Aktivierung

```text
#155 lokaler Ricco-Review
→ #153 menschliche Sichtentscheidung
→ Character-/Location-/Voice-Gates
→ freigegebenes EpisodePackage
→ Rechte-, Brand- und Plattformprüfung
→ genau ein Shadow-Launch-Paket
→ separates Live-Issue
→ genau ein menschlich freigegebener Testpost
→ verifizierter Metrics-Rückfluss
```

## Prüfkommandos

```bash
npm run growth:marketing-check
npm run test:growth-marketing
npm run growth:check
npm test
```

## Nicht behauptet

- keine reale Kampagne ist aktiv
- keine Plattform ist verbunden
- keine Marketingwirkung ist gemessen
- keine Episode ist veröffentlicht
- kein Budget wurde ausgegeben
- keine Community-Antwort wurde automatisiert
- kein Publishing ist autorisiert
- keine Zielgruppe ist validiert
- kein Follower- oder Reichweitenziel ist bewiesen
