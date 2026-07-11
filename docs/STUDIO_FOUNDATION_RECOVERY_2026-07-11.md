# LR2 Studio-Foundation-Rettung

Datum: 2026-07-11  
Repository: `Pagebabe/comic`  
Tracking: Issue #45

## Behauptung

Die neutrale Vite-/React-/TypeScript-Foundation der früheren Produktionsapp wird als kleiner, isolierter Slice unter `/studio/` zurückgeführt. Dieser Slice beweist Build, Routing, Truth-State-Anbindung und responsive Browserdarstellung. Er beweist noch keinen Produktionsloop.

## Quelle

Archivbranch:

```text
archive/legacy-comic-2026-07-10
commit 7266cf8df99ad811904933189666bbb827bd3ad1
```

Maschinenlesbare Inventur:

```text
project/studio-foundation-inventory.json
```

Die Inventur führt jeden geprüften Archivbestand mit Blob-SHA und Entscheidung auf. Der Dependency-Lock wird bytegleich wiederverwendet. Vite-Konfiguration, Einstieg und Shell werden nur dort angepasst, wo die neue Unterroute und der korrigierte Wahrheitsstand es erfordern.

## Gewählter atomarer Slice

Enthalten:

1. gelockter npm-Abhängigkeitsbaum
2. Vite-Build
3. React- und TypeScript-Einstieg
4. neutrale Studio-Route `/studio/`
5. Laden von `project/truth-state.json`
6. Laden von `project/studio-foundation-status.json`
7. Referenz auf den menschlich ausgewählten Pilot `Das Zimmer`
8. Desktop- und Mobil-Smoke-Test
9. öffentliche GitHub-Pages-Prüfung

Nicht enthalten:

- Ricco Control
- Produktions-Studio
- Prompt Queue
- ComfyUI-Planung
- Asset Import
- Image Review
- QA
- Lettering
- Package Export
- Restore
- Visual-, Set- oder Voice-Master
- Growth OS oder Publishing-Automation

## Warum nicht das ganze Archiv?

`src/App.tsx` des Archivs importiert 27 Seiten und damit fast den gesamten alten Produktionsstand. Ein vollständiges Zurückkopieren würde LR2 und LR3 vermischen, alte Kandidatenannahmen einschleppen und den geforderten Fire Test umgehen. Deshalb wird nur die technische Foundation zurückgeführt. Der eigentliche Studio-bis-Restore-Loop bleibt LR3.

## Beweiskette

```text
Archivbranch und Blob-SHAs
→ explizite Inventur
→ isolierter Recovery-Branch
→ npm ci mit archiviertem Lockfile
→ TypeScript- und Vite-Build
→ statische Vertragsprüfung
→ Desktop-Browser-Smoke
→ Mobil-Browser-Smoke
→ PR-CI
→ Merge auf geprüftem Head
→ GitHub-Pages-Deploy
→ öffentlicher Browser-Smoke
→ Screenshot-Hashes
→ LR2-Abschlussrecord
```

## Stop-Regeln

- kein Blind-Merge
- keine Produktionsseite aus dem Archiv ohne eigenes LR3-Arbeitspaket
- keine automatische Canon-, Visual- oder Voice-Freigabe
- keine Bildgenerierung
- keine fertige Episode behaupten
- kein Growth OS
- ausschließlich `Pagebabe/comic`

## Abschlussgrenze

LR2 darf erst geschlossen werden, wenn `/studio/` öffentlich erreichbar ist, Desktop und Mobil geprüft wurden, der öffentliche Commit dem Merge-Commit entspricht und der Abschluss in einem eigenen maschinenlesbaren Record dokumentiert wurde.
