# Comic Factory · Program Release Gates

Kontrollschicht: `PROGRAM_EVIDENCE_GATE_READY`  
Gesamtprogramm: `PROGRAM_RELEASE_BLOCKED_PENDING_INTEGRATION`

## Aktuell bewiesen

- Worker 1 Canon/Cast: finaler Head gebunden und CI/Fresh-Install/Recovery grün
- Worker 2 Episode-Pipeline: technischer End-to-End-Pfad mit Testassets bewiesen
- Worker 3 MKT0 Shadow: isolierte Shadow-Linie bewiesen

## Weiter blockiert

- PR #131 ungemergt
- Gesamtintegration nicht auf finalen Heads bewiesen
- lokaler Assetscan nicht ausgeführt
- Character 0/4
- Location 0/4
- Voice 0/3
- echte Pilotepisode nicht bewiesen
- Main-Merge und Live-Aktivierung verboten

## Übergangsregel

Ein nächster Zustand ist erst erlaubt, wenn #142 mit den finalen Heads neu erfolgreich ist. Danach folgt ein separater Integrationsbranch mit kombinierter CI, Fresh Install, Browser, Recovery und Rollback.

Kein einzelner Worker-Erfolg darf das Programm auf releasebereit setzen.
