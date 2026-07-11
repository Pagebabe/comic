# Comic Factory · Nullwissen-Abnahmeprotokoll

Status: `READY_TO_EXECUTE · NOT YET PASSED`

Tracking: Issue #95  
Academy: Issue #94  
Kreatives Gate: LR5.1 · Issue #88

## Ziel

Dieses Protokoll prüft, ob eine Person ohne Projekt-, Comic-, Animations- oder Softwarevorkenntnisse Comic Factory sicher bedienen und die Freigabegrenzen verstehen kann.

Automatisierte Tests beweisen technische Bedienbarkeit. Sie beweisen nicht, dass ein Anfänger das System ohne undokumentierte Hilfe versteht.

## Testperson

Die Testperson darf:

- Browser und normale Desktop-Anwendungen bedienen
- lesen und einfache Formulare ausfüllen

Die Testperson soll nicht:

- an Comic Factory mitgearbeitet haben
- Repository- oder Gate-Struktur kennen
- vorher interne Erklärungen erhalten haben

## Beobachter

Der Beobachter darf nur eingreifen, wenn:

- Sicherheit oder Datenverlust droht
- die Testperson ausdrücklich Hilfe anfordert

Jede Hilfe wird notiert. Undokumentierte Hilfe macht die Abnahme ungültig.

## Testumgebung

Dokumentiere:

- exakten Commit
- Datum und Uhrzeit
- Betriebssystem
- Browser und Version
- Gerät
- frische oder bereits verwendete Maschine
- öffentlich oder lokal verwendete Route

## Zwölf Pflichtaufgaben

1. Dashboard öffnen und aktives Gate nennen.
2. Production Academy öffnen und Training/Echtmodus unterscheiden.
3. Quelle, Kandidat, Master und Gate erklären.
4. erklären, warum `TRAINING ONLY` keine Produktionsfreigabe ist.
5. LR5.1 Ricco öffnen und Quellen, Konflikte sowie Kandidatenzahl nennen.
6. `CONTRACT_APPROVED_FOR_ONE_CANDIDATE` als notwendige Entscheidung nennen.
7. LR3 Delete/Restore erklären.
8. LR4 Transportbeweis und offene Detailreviews erklären.
9. eine Produktionsvorlage öffnen und Pflicht-Ergebnisse nennen.
10. vollständiges Übergabepaket aufzählen.
11. Growth-OS-Trennung erklären.
12. 10/10-Regel korrekt erklären.

Maschinenlesbare Vorlage: `project/novice-acceptance-template.json`

## Bewertung

- **12/12 ohne undokumentierte Hilfe:** fachlicher Lauf bestanden
- **10–11:** UI oder Dokumentation korrigieren und erneut testen
- **unter 10:** Academy nicht anfängerreif
- **Sicherheitsgrenze verletzt:** sofortiger Abbruch

## Zusätzliche Beobachtungen

Dokumentiere:

- Dauer jeder Aufgabe
- Stellen mit Zögern
- falsch verstandene Begriffe
- nicht auffindbare Links
- unklare Stop-Regeln
- technische Fehler
- vorgeschlagene Verbesserungen

## Nach dem Lauf

1. Record vollständig ausfüllen.
2. zweite Person prüft Record und Bildschirmbelege.
3. Befunde werden in einem isolierten Branch korrigiert.
4. CI und Desktop-/Mobil-Browser laufen erneut.
5. gegebenenfalls neuer Anfänger-Lauf.
6. separater Closure-PR bindet Commit, Record, Tests und öffentlichen Beweis.

## Was ein bestandener Lauf nicht beweist

- keine Character-, Location- oder Voice-Master
- keine fertige Episode
- keine kreative Qualität auf TV-Niveau
- keine Growth-OS-Livefreigabe
- keine automatische kreative Freigabe

## 10/10-Regel

`10/10 PRODUCTION_READY` ist erst erlaubt, wenn alle zehn Gates in `project/production-readiness-v1.json` `CLOSED_VERIFIED` sind. Ein bestandener Anfänger-Lauf schließt nur die Onboarding- und Acceptance-Lücke. Reale Master und eine vollständige geprüfte Episode bleiben weiterhin erforderlich.