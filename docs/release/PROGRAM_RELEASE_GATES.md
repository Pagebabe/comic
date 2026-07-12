# Comic Factory · Program Release Gates

Kontrollschicht: `PROGRAM_EVIDENCE_GATE_READY`  
Gesamtprogramm: `PROGRAM_FACTORY_INTEGRATION_PROVEN_MAIN_BLOCKED`

## Grün

- Worker 1 Canon/Cast einzeln bewiesen und in Factory-Branch integriert
- Worker 2 technischer Episode-Pfad einzeln bewiesen und in Factory-Branch integriert
- kombinierter Factory-Head `eb07bc9ab5536d89ccc01ccccbd5aaeabf82d3b3`
- Comic Factory CI, Fresh Install, Operator Recovery und Episode-1-Proof auf kombiniertem Head grün
- aktuelle Merge-Rehearsal mit sauberen Rollbacks grün

## Nicht grün

- Factory-Branch ist nicht nach `main` gemergt
- MKT0 ist nicht gegen Current Main reintegriert
- PR #131 und PR #139 bleiben auf isolierter Growth-Linie
- lokaler Assetscan fehlt
- Character 0/4
- Location 0/4
- Voice 0/3
- echte Pilotepisode fehlt
- Live-Aktivierung verboten

## Nächste Gates

1. Program Evidence auf dem aktuellen Factory-Stand grün bestätigen.
2. Lokalen read-only Assetscan auf dem echten Mac ausführen.
3. Reale Assetkandidaten menschlich prüfen.
4. Master versioniert freigeben.
5. Echte Pilotepisode produzieren und wiederholen.
6. MKT0 separat auf Current Main reintegrieren.
7. Erst danach Growth Shadow und begrenzten Live-Pilot prüfen.

Kein einzelnes grünes Teilstück darf Main-, Master- oder Live-Freigabe erzeugen.
