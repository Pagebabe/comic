# 04 · Nullwissen-Abnahme und 10/10-Regel

## Warum diese Abnahme nötig ist

Ein System ist nicht anfängerfreundlich, weil seine Entwickler es bedienen können. Anfängerfreundlichkeit muss mit einer Person geprüft werden, die weder Repository, Architektur noch interne Abkürzungen kennt.

## Pflichtübung ohne kreative Ausführung

Die Testperson soll ohne Hilfe:

1. Dashboard öffnen.
2. aktives Gate nennen.
3. Studio öffnen.
4. Guided Mode starten.
5. Quelle, Kandidat, Master und Gate erklären.
6. LR3-Route öffnen und den Delete/Restore-Zweck erklären.
7. LR4-Route öffnen und acht Panels finden.
8. LR5.1 öffnen und 7 Quellen, 5 Konflikte und 0/1 Kandidaten nennen.
9. erklären, warum `EXECUTION BLOCKED` korrekt ist.
10. die Entscheidung nennen, die genau einen Kandidaten erlaubt.
11. erklären, warum Growth OS getrennt bleibt.
12. ein vollständiges Übergabepaket aufzählen.

## Bewertung

- 12/12 ohne undokumentierte Hilfe: Übung bestanden
- 10–11: Handbuch oder UI muss verbessert und erneut geprüft werden
- unter 10: Onboarding nicht anfängerreif

Die beobachtende Person dokumentiert:

- Datum
- Testperson
- verwendeten Commit
- verwendete Browser- und Betriebssystemversion
- benötigte Hilfe
- Missverständnisse
- Dauer
- Verbesserungsvorschläge
- Ergebnis

## Readiness-Gates

`project/production-readiness-v1.json` enthält zehn Gates:

1. Installation reproduzierbar
2. Nullwissen-Onboarding vollständig
3. Canon- und Freigabegrenzen verständlich
4. Character-, Set- und Voice-Workflow geführt
5. Episode-Workflow geführt
6. QA und sichtbare Reviews vollständig
7. Backup, Delete und Restore geprüft
8. Fehlerdiagnose und Recovery geführt
9. Export und Übergabe reproduzierbar
10. vollständiger Nullwissen-Abnahmelauf

## 10/10-Regel

`10/10 PRODUCTION_READY` darf nur behauptet werden, wenn:

- alle zehn Gates `CLOSED_VERIFIED` sind
- Quellen vorhanden sind
- automatische Tests bestehen
- Artefakte existieren
- Lauf- oder Deployment-Beweise vorhanden sind
- Desktop und Mobil sichtbar geprüft wurden
- kreative Freigaben von Menschen dokumentiert sind
- eine vollständige geprüfte Episode existiert
- ein Anfänger-Durchlauf beobachtet und bestanden wurde
- eine zweite Person den Release gegenprüft

## Aktueller Status

`2/10 CLOSED_VERIFIED · 6 PARTIAL · 2 OPEN`

Geschlossen:

- PR3 Canon- und Freigabegrenzen
- PR7 Backup, Delete und Restore

Offen oder teilweise:

- frische Installation
- Guided Mode und Anfängerprüfung
- echte Character-, Set- und Voice-Master
- vollständige Episode
- reale kreative QA
- endgültiger Export und Übergabe

## Release-Stop-Regeln

Kein Production-Ready-Label, wenn:

- ein Gate `OPEN` oder `PARTIAL` ist
- ein Master fehlt
- Episode nicht vollständig geprüft ist
- Hashes oder Restore fehlen
- Anfänger Hilfe außerhalb des Handbuchs braucht
- Growth OS ohne Integrations-Gate verbunden ist
- ein technischer Pass als kreative Freigabe verwendet wird

## Abschlussartefakt

Nach bestandener Abnahme wird ein versionierter Bericht angelegt:

`project/operator-acceptance/<date>-<commit>.json`

Er enthält Testperson, Umgebung, Fragen, Antworten, Hilfen, Dauer, Befunde, Korrekturen und Entscheidung. Erst ein separater Closure-PR darf PR2 oder PR10 schließen.