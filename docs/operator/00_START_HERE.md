# 00 · Start, Begriffe und aktueller Status

## Ziel

Nach diesem Kapitel kann der Operator den Projektstatus lesen und Quelle, Kandidat, Master, Gate und Beweiskette unterscheiden.

## Öffentliche Einstiege

- Dashboard: `https://pagebabe.github.io/comic/`
- Studio: `https://pagebabe.github.io/comic/studio/`
- Ricco-Vertrag: `https://pagebabe.github.io/comic/studio/#lr5-ricco`
- Guided Mode nach OPS1-Deploy: `https://pagebabe.github.io/comic/studio/#guided`

## Aktuelle Wahrheit

- LR0 bis LR4: öffentlich geschlossen
- LR5: aktiv
- LR5.1 Ricco: Vertrag öffentlich bewiesen, menschliche Vertragsfreigabe offen
- Ricco-Kandidaten: 0/1
- Character-Master: 0/4
- Location-Master: 0/4
- Voice-Master: 0/3
- fertige Episode: nein
- Growth OS: isolierter Shadow-Branch, nicht live

## Die fünf Begriffe

### Quelle

Eine Quelle ist ein belegtes Dokument, eine Entscheidung oder ein freigegebenes Asset. Eine alte Datei ist nicht automatisch aktuelle Autorität.

### Kandidat

Ein Kandidat darf geprüft, überarbeitet oder verworfen werden. Standardstatus: `REVIEW_REQUIRED`.

### Master

Ein Master benötigt ausdrückliche menschliche Freigabe, Version, Quellenbindung, Hash, Entscheider und Zeitstempel.

### Gate

Ein Gate blockiert den nächsten Schritt, bis definierte Kriterien bestanden sind.

### Beweiskette

```text
Behauptung
→ Quelle
→ Test
→ Artefakt
→ Lauf- oder Deployment-Beweis
→ sichtbare Gegenprüfung
→ ehrlicher Status
```

## Mausübung

1. Browser öffnen.
2. Dashboard aufrufen.
3. Aktives Gate lesen.
4. Studio öffnen.
5. LR5.1 Ricco öffnen.
6. Quellenzahl, Konfliktzahl und Kandidatenzahl notieren.
7. erklären, warum `EXECUTION BLOCKED` korrekt ist.

## Stop-Regeln

Nicht weiterarbeiten, wenn:

- ein Deploy-Blocker offen ist,
- der öffentliche Commit nicht zum aktuellen Beweis passt,
- Kandidat und Master verwechselt werden,
- Bildgenerierung ohne Gate-Freigabe angeboten wird,
- eine alte Quelle aktuellen Canon überschreiben soll.

## Abnahmefragen

- Welches Gate ist aktiv?
- Was unterscheidet Kandidat und Master?
- Warum ist Ricco 0/1?
- Was beweist LR4 und was beweist es nicht?
- Warum bleibt Growth OS getrennt?