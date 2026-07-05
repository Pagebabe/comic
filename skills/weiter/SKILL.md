# Weiter Trigger Skill

## Zweck

Diese Skill definiert, was das Wort **weiter** im Projekt bedeutet.

Wenn der Nutzer **weiter** sagt, heißt das nicht blind weiterprogrammieren.

Es heißt:

```text
Prüfe das Ziel.
Prüfe, ob der aktuelle Schritt noch sinnvoll ist.
Prüfe, ob Code / Doku / Workflow sauber bleiben.
Prüfe, ob der Nutzer noch Kontrolle über das Projekt hat.
Wähle dann selbst den nächsten besten Schritt Richtung Ziel.
```

## Trigger

Benutze diese Skill immer, wenn der Nutzer schreibt:

```text
weiter
mach weiter
ok weiter
weiter jetzt
```

oder sinngemäß sagt, dass du ohne neue Detailanweisung fortsetzen sollst.

## Projektziel

Das Ziel ist:

```text
Ricco im Haus als lokale AI Comic Factory fertig nutzbar machen.
```

Aktueller Hauptfokus:

```text
Episode 001 — Das Zimmer als vollständigen Rough-Hand-Test produzieren.
```

Nicht das Ziel:

```text
endlos Tooling bauen
neue Automatisierung ohne fertige Folge
AI-Influencer-Dashboard
Social-Funnel
DM-System
Backend-Overkill
```

## Pflichtprüfung bei jedem „weiter“

Vor jedem nächsten Schritt diese Fragen prüfen:

### 1. Zieltreue

```text
Bringt dieser Schritt Episode 001 oder die Comic Factory wirklich näher ans Ziel?
Oder ist es nur Tooling-Flucht?
```

Wenn Tooling-Flucht: stoppen und zur Produktion zurückführen.

### 2. Kontrolle

```text
Versteht der Nutzer noch, wo das Projekt steht?
Gibt es eine klare nächste Aktion?
Sind Status, Dateien und Regeln dokumentiert?
```

Wenn nein: zuerst Status / Board / Runbook aktualisieren.

### 3. Code-Qualität

```text
Ist der Code typisiert?
Ist die Logik in Domain-Modulen statt wild in Pages?
Gibt es Tests für wichtige Logik?
Bleiben CI und Build grün?
Wird bestehendes Verhalten nicht gebrochen?
```

Wenn nein: kleine Qualitätskorrektur statt neues Feature.

### 4. Produktlogik

```text
Macht der Workflow für eine echte Comicfolge Sinn?
Hilft er bei Story, Panels, Review, Lettering, Export oder Package?
```

Wenn nein: nicht bauen.

### 5. Nächster Schritt

Wähle den nächsten Schritt nach dieser Priorität:

```text
1. Episode 001 produzieren
2. blockierende Bugs fixen
3. Storage-/Datenverlust-Sicherheit fixen
4. Produktionsdoku aktualisieren
5. erst nach fertiger Episode neues Tooling planen
```

## Aktuelle harte Regel

Bis Episode 001 als Rough Output existiert:

Erlaubt:

```text
Panelproduktion
Finalbilder auswählen
Lettering setzen
Rough Export
Package sichern
Production Notes schreiben
Bugfixes
Build-Fixes
kleine Storage-Safety-Fixes
Produktionsdoku
```

Verboten:

```text
neue Workflow-Seiten
neue Automatisierung
neue Backend-Systeme
LoRA-Automation
ComfyUI-API-Automation
Export-Architektur neu bauen
Dashboard-Polish ohne Episode
```

## Antwortmuster bei „weiter“

Kurz prüfen und dann handeln:

```text
Zielcheck: Wir bleiben bei Episode 001.
Nächster sinnvoller Schritt: <konkreter Schritt>.
Ich mache jetzt <Aktion>.
```

Dann ausführen.

## Wichtige Dateien

```text
docs/00_project_command_center.md
docs/episode_001_production_board.md
docs/episode_001_hand_test_runbook.md
docs/decisions/0001_episode_before_tooling.md
docs/README.md
```

## Fertig-Kriterium

Diese Skill ist erfolgreich, wenn **weiter** nie mehr bedeutet:

```text
irgendwas bauen
```

sondern immer:

```text
nächster kontrollierter Schritt Richtung fertige Ricco-Folge
```
