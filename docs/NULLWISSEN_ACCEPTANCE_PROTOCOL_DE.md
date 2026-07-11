# Nullwissen-Abnahmeprotokoll für Comic Factory

Status: `EXTERNAL_INPUT_REQUIRED`

Tracking: #95, #101, #102

## Zweck

Dieses Protokoll prüft, ob eine Person ohne Vorwissen Comic Factory installieren, verstehen und sicher bedienen kann, ohne kreative Freigaben, Trainingszustände oder technische Beweise falsch zu interpretieren.

Der Test ist nur gültig, wenn die Testperson:

- nicht am Projekt mitgearbeitet hat
- die Repository-Struktur vorher nicht kennt
- keine mündlichen Zusatzanweisungen erhält, die nicht im Produkt oder Handbuch stehen
- nicht dieselbe Person ist, die den geprüften Workflow entwickelt hat

## Rollen

### Testperson

Bedient das System ausschließlich über die dokumentierten Wege und beschreibt laut, was sie erwartet und versteht.

### Beobachter

Greift nicht helfend ein. Erfasst Zeiten, Fehlversuche, Missverständnisse, blockierende Stellen und sichtbare Systemreaktionen.

### Freigabeverantwortlicher

Bewertet nach dem Lauf die Evidence. Diese Rolle darf nicht während des Tests coachen.

## Testumgebung

Pflichtangaben:

- Datum und Uhrzeit
- Testperson-ID oder Pseudonym
- Betriebssystem und Version
- Gerät und Arbeitsspeicher
- Browser und Version
- Repository-Commit
- verwendete öffentliche oder lokale URL
- Ausgangszustand der Anwendung
- bekannte Vorinstallationen

Secrets, private Konten und personenbezogene Daten werden nicht in die Evidence aufgenommen.

## Stop-Regeln

Der Test wird sofort als `FAIL` oder `BLOCKED` markiert, wenn:

- die Testperson versteckte Shell-Befehle benötigt, die nicht dokumentiert sind
- eine kreative Freigabe automatisch gesetzt wird
- Training als Produktionsfreigabe erscheint
- ein Character-, Location-, Voice- oder Episodenstatus ohne menschliche Entscheidung auf freigegeben springt
- Bildgenerierung oder externe Provider ohne ausdrückliche Freigabe starten
- horizontale Überläufe einen Pflichtschritt unbedienbar machen
- ein Fehler keine verständliche Rückkehr- oder Recovery-Option besitzt

## Ablauf

### Teil A · Installation und Start

1. Repository anhand des Handbuchs beschaffen.
2. Voraussetzungen prüfen.
3. Abhängigkeiten installieren.
4. Studio starten.
5. Academy-Route öffnen.

Zu erfassen:

- Dauer bis zur sichtbaren Academy
- jeder fehlgeschlagene Schritt
- jede nicht dokumentierte Voraussetzung
- jede manuelle Hilfe

Abnahme:

- `PASS`, wenn die Testperson ohne undokumentierte Hilfe die Academy erreicht
- `FAIL`, wenn ein dokumentierter Schritt falsch oder unvollständig ist
- `BLOCKED`, wenn externe Infrastruktur den Lauf verhindert

### Teil B · Systemverständnis

Die Testperson erklärt in eigenen Worten:

- Unterschied zwischen Training und Produktion
- Bedeutung von `HUMAN REVIEW`
- warum Ricco aktuell `0/1` Kandidaten besitzt
- warum technische Renderbeweise keine Character-Master sind
- wann Growth OS und Live-Publishing erlaubt wären

Abnahme:

Mindestens vier von fünf Antworten müssen fachlich korrekt sein. Die Frage zu kreativen Freigaben ist zwingend korrekt zu beantworten.

### Teil C · Geführter Trainingslauf

1. Training starten.
2. Stufen sequenziell öffnen.
3. Notizen eingeben.
4. Seite neu laden.
5. Resume prüfen.
6. Fortschritt exportieren.

Abnahme:

- exakt zwölf Stufen sichtbar
- Folgestufen bleiben vor Abschluss gesperrt
- Reload erhält den Zustand
- Training erteilt keine Produktionsfreigabe

### Teil D · Produktionsmodus und Human-Gates

1. Produktionsmodus öffnen.
2. Character-, Location-, Voice-, Script- und Episode-Gates betrachten.
3. versuchen, eine harte Freigabe ohne menschliche Entscheidung zu überspringen.

Abnahme:

- Überspringen wird verhindert oder sichtbar als nicht freigegeben markiert
- kein Masterstatus verändert sich
- keine Bild-, Batch-, LoRA- oder Provideraktion startet

### Teil E · Fehler und Recovery

Mindestens zwei kontrollierte Fehlerfälle:

- ungültiger oder fehlender lokaler Fortschrittszustand
- fehlendes oder absichtlich nicht bereitgestelltes optionales Artefakt

Die Testperson muss anhand der Oberfläche oder Dokumentation erklären können:

- was fehlgeschlagen ist
- was erhalten blieb
- wie der sichere nächste Schritt lautet
- wann sie stoppen und einen Incident erfassen soll

### Teil F · Export und Handoff

1. technischen Fortschritt exportieren.
2. Handoff-Vorlage öffnen.
3. erklären, welche Felder noch menschliche Freigabe benötigen.

Abnahme:

Der Export darf nicht als fertige Episode oder finale kreative Freigabe erscheinen.

## Bewertungsmatrix

| Bereich | Gewicht | Pflicht |
|---|---:|---|
| Installation und Start | 20 | ja |
| Systemverständnis | 20 | ja |
| Trainingslauf | 15 | ja |
| Produktions-Human-Gates | 20 | ja |
| Fehler und Recovery | 15 | ja |
| Export und Handoff | 10 | ja |

Gesamtergebnis:

- `PASS`: mindestens 85 Punkte, kein Pflichtbereich rot
- `CONDITIONAL_PASS`: 75 bis 84 Punkte, keine Sicherheitsverletzung
- `FAIL`: unter 75 Punkte oder ein Pflichtbereich rot
- `BLOCKED`: Test konnte aus externer Ursache nicht vollständig laufen

Eine Sicherheitsverletzung kann nicht durch gute Punkte in anderen Bereichen ausgeglichen werden. Zahlen sind keine Ablassbriefe.

## Evidence Packet

Pflichtdateien oder Nachweise:

- ausgefülltes Testprotokoll
- Commit-SHA
- Start- und Endzeit
- Desktop-Screenshot der Academy
- Mobile-Screenshot oder 375-Pixel-Prüfung
- exportierter Academy-Fortschritt
- Liste aller Hilfestellungen
- Liste aller Fehler und Recovery-Schritte
- finale Bewertung mit Begründung
- Bestätigung, dass keine kreative oder externe Aktion ausgelöst wurde

## Zulässiger Abschluss

Gate 10 darf nur auf `PROVEN` gesetzt werden, wenn:

- eine echte unabhängige Testperson den vollständigen Lauf durchgeführt hat
- das Evidence Packet vollständig ist
- der geprüfte Commit eindeutig ist
- alle Sicherheitsgrenzen erhalten blieben
- Ergebnisse öffentlich oder repositorygebunden nachvollziehbar dokumentiert sind

Ein simuliertes LLM, ein Unit-Test und der Entwickler selbst zählen nicht als externe Nullwissen-Testperson.
