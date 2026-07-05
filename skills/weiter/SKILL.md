# Weiter Trigger Skill

## Zweck

Diese Skill definiert, was **weiter** im Ricco-Comic-Factory-Projekt bedeutet.

Wenn der Nutzer **weiter** sagt, heißt das nicht:

```text
blind weiterprogrammieren
neues Feature suchen
noch eine Seite bauen
noch mehr Tooling erzeugen
```

Es heißt:

```text
Ziel prüfen.
Kontrolle prüfen.
Qualität prüfen.
Projektstatus prüfen.
Nächsten besten Schritt Richtung fertige Episode wählen.
Dann handeln.
```

## Trigger

Benutze diese Skill immer, wenn der Nutzer schreibt:

```text
weiter
mach weiter
ok weiter
weiter jetzt
leg los
nächster Schritt
```

oder wenn der Nutzer sinngemäß sagt, dass du ohne neue Detailanweisung fortsetzen sollst.

## Oberstes Projektziel

Das Ziel ist nicht, eine perfekte App zu bauen.

Das Ziel ist:

```text
Ricco im Haus als lokale AI Comic Factory nutzbar machen,
indem zuerst Episode 001 als kompletter Rough-Hand-Test produziert wird.
```

Aktueller Hauptfokus:

```text
Episode 001 — Das Zimmer
8 Panels
rough comic / rough video
fertig vor perfekt
```

## Nicht-Ziele

Nicht wieder dahin abdriften:

```text
endlos Tooling bauen
neue Automatisierung ohne fertige Folge
AI-Influencer-Dashboard
Social-Funnel
DM-System
Backend-Overkill
LoRA-Automation vor brauchbarem Material
ComfyUI-Automation vor manuellem Pilot-Test
Dashboard-Polish ohne fertige Episode
```

---

# Pflichtablauf bei jedem „weiter“

## Schritt 1 — Zielcheck

Frage intern:

```text
Bringt der nächste Schritt Episode 001 näher an einen fertigen Rough Output?
```

Wenn ja:

```text
weiter mit Produktion
```

Wenn nein:

```text
nur erlauben, wenn es ein blockierender Bug, Build-Fehler, Storage-Safety-Fix oder Produktionsdoku ist
```

Wenn es nur Tooling-Flucht ist:

```text
nicht bauen
zur Episode-Produktion zurückführen
```

## Schritt 2 — Statuscheck

Prüfe die aktuelle Lage anhand dieser Dateien:

```text
docs/00_project_command_center.md
docs/episode_001_production_board.md
docs/episode_001_hand_test_runbook.md
docs/decisions/0001_episode_before_tooling.md
docs/README.md
```

Wenn unklar ist, wo das Projekt steht:

```text
zuerst Status kurz zusammenfassen
keinen neuen Umbau starten
```

## Schritt 3 — Qualitätscheck

Falls Code geändert werden soll, prüfe:

```text
Ist die Änderung wirklich nötig?
Ist sie klein genug?
Ist sie typisiert?
Bleibt Logik in Domain-/Lib-Modulen statt wild in Pages?
Gibt es Testabdeckung für wichtige Logik?
Bleiben CI und Build grün?
Wird bestehendes Verhalten nicht gebrochen?
```

Wenn diese Fragen nicht sauber beantwortet werden können:

```text
keinen größeren Code-Umbau machen
```

## Schritt 4 — Kontrollcheck

Prüfe:

```text
Hat der Nutzer noch Überblick?
Ist die nächste Aktion konkret?
Ist klar, welche Datei / Route / Panel betroffen ist?
Ist klar, wann der Schritt fertig ist?
```

Wenn nein:

```text
erst organisieren oder Board aktualisieren
```

## Schritt 5 — Entscheidung

Wähle genau eine nächste Aktion nach dieser Priorität:

```text
1. Episode 001 Panelproduktion
2. Finalbilder auswählen
3. Lettering setzen
4. Rough Export erzeugen
5. Package sichern
6. Production Notes schreiben
7. blockierenden Bug fixen
8. Build/CI reparieren
9. kleinen Storage-Safety-Fix machen
10. Produktionsdoku aktualisieren
```

Alles andere ist bis zur fertigen Episode grundsätzlich nachrangig.

---

# Harte Regel bis Episode 001 fertig ist

## Erlaubt

```text
Panelproduktion
Prompt-Nutzung für Panel 1-8
Bildvarianten erzeugen
Bildvarianten importieren
Finalbilder auswählen
Rating / Continuity / Notizen setzen
Lettering setzen
Screenshots / PDF / MP4 rough exportieren
Package JSON sichern
Production Notes schreiben
Bugfixes
Build-Fixes
kleine Storage-Safety-Fixes
Produktionsdoku
```

## Verboten

```text
neue Workflow-Seiten
neue Automatisierung
neue Backend-Systeme
neue LoRA-Automation
neue ComfyUI-API-Automation
neue Export-Architektur
neuer Dashboard-Polish
neue große Refactors
neues Feature ohne direkten Episode-001-Nutzen
```

## Ausnahme

Eine technische Änderung ist nur erlaubt, wenn sie eine der folgenden Bedingungen erfüllt:

```text
App startet nicht
Build ist rot
CI ist rot
Datenverlust droht
Image Review kann nicht genutzt werden
Package/Restore verhindert Sicherung
Lettering verhindert Rough Output
```

---

# Entscheidungsbaum

Bei „weiter“ entscheide so:

```text
Ist Episode 001 komplett exportiert?
  Nein → Was fehlt?
    Keine 8 final images → Panelproduktion / Image Review
    Keine Lettering-Overlays → Lettering
    Kein Rough Export → Screenshots/PDF/MP4
    Kein Package → Package sichern
    Keine Notes → Production Notes schreiben
  Ja → Dann erst neue technische Verbesserungen planen
```

Wenn ein Bug blockiert:

```text
kleinsten Fix machen
CI/Build prüfen
zur Episode zurückkehren
```

Wenn der Nutzer eine neue Feature-Idee gibt:

```text
prüfen, ob sie für Episode 001 zwingend nötig ist
falls nein: in Post-Hand-Test-Ideen parken
nicht sofort bauen
```

---

# Antwortmuster bei „weiter“

Kurz, kontrolliert, mit Entscheidung:

```text
Zielcheck: Episode 001 ist noch nicht fertig.
Status: <was fehlt konkret>.
Nächster sinnvoller Schritt: <eine konkrete Aktion>.
Ich mache jetzt <Aktion>.
```

Wenn der nächste Schritt kein Code ist:

```text
Ich produziere / organisiere jetzt den nächsten Panel-Schritt statt neues Tooling zu bauen.
```

Wenn der nächste Schritt Code sein muss:

```text
Das ist erlaubt, weil <Bug/Build/Storage/Review/Package blockiert>.
Ich halte den Fix klein und prüfe danach CI/Build.
```

---

# Pflicht-Output nach jedem größeren Schritt

Am Ende kurz melden:

```text
Was wurde geändert?
Welche Datei/Route/Panel ist betroffen?
Warum bringt es das Ziel weiter?
Was ist der nächste Schritt?
Ist CI/Build relevant und grün?
```

Bei Produktionsschritten:

```text
Welches Panel?
Wie viele Varianten?
Final gewählt: ja/nein
Lettering: ja/nein
Noch offen?
```

---

# Aktuelle Projekt-Dateien

## Steuerung

```text
docs/00_project_command_center.md
docs/README.md
docs/decisions/0001_episode_before_tooling.md
```

## Episode 001 Produktion

```text
docs/episode_001_production_board.md
docs/episode_001_hand_test_runbook.md
docs/episode_001_panel_cards.md
```

## Relevante App-Routen

```text
#/ricco-control
#/ricco-studio
#/ricco-prompt-queue
#/ricco-generation-queue
#/ricco-comfy-m1
#/ricco-image-review
#/ricco-qa
#/ricco-lettering
#/ricco-package
#/ricco-storage
```

## GitHub-Arbeitsauftrag

```text
Issue #2 — Produce Episode 001 hand-test before more tooling
```

---

# Qualitätsmaßstab

Die Skill ist erfolgreich, wenn **weiter** nie mehr bedeutet:

```text
irgendwas bauen
```

sondern immer:

```text
nächster kontrollierter Schritt Richtung fertige Ricco-Folge
```

Der höchste Qualitätsmaßstab ist nicht:

```text
mehr Features
```

sondern:

```text
fertige Episode
sauberer Workflow
keine Tooling-Flucht
Nutzer behält Kontrolle
```
