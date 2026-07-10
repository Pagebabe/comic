# Comic Factory · Director Dashboard

Neustart der Comic Factory als online erreichbarer Produktionsleitstand.

## Verifizierter Online-Stand

Dashboard:

`https://pagebabe.github.io/comic/`

Der GitHub-Pages-Workflow erzeugt nach jedem Deployment ein maschinenlesbares Proof- oder Blocker-Issue. Ein Hosting-Stand gilt nur mit diesem Nachweis als freigegeben.

## Was bereits funktioniert

- Dashboard mit Meilensteinen, echten Figurenporträts und M1-Arbeitsliste
- LLM-gestützter Comic Director für Figuren, Story-Arcs, Folgen, Drehbücher und Produktionspläne
- feste Steuerbefehle: `/status`, `/next`, `/characters`, `/plan`
- kontrollierte GitHub-Schreibaktionen: `/task` und `/render`
- Browser-Fallback ohne freie Shell
- Browserwerte für Provider bleiben nur in der Sitzung
- CI prüft Projektzustand, Figurenassets und M1-Produktionsvertrag

## Aktive Produktionslinie

**M1 · Ricco Lebenszeichen**

Eine kontrollierte 3–5-Sekunden-Szene mit Ricco, einem Satz, Blickbewegung, Blinzeln, einfachem Mundsystem, Untertitel und MP4-Export.

Verbindliche Unterlagen:

- `docs/M1_PRODUCTION_BRIEF.md`
- `series/ricco-im-haus/characters/ricco/character.json`
- `series/ricco-im-haus/episodes/m1-life-sign/scene.json`

## Optionaler Bot-Proxy

Für serverseitige LLM- und GitHub-Schreibfunktionen können auf einem sicheren Hostinganbieter folgende Variablen gesetzt werden:

```text
COMIC_ACCESS_KEY=...
COMIC_ADMIN_KEY=...
GITHUB_TOKEN=...
GITHUB_REPOSITORY=Pagebabe/comic
LLM_API_KEY=...
LLM_BASE_URL=https://provider.example/v1
LLM_MODEL=model-id
```

Alternativ können LLM-Providerwerte pro Browser-Sitzung eingegeben werden. Für GitHub-Schreibaktionen bleiben serverseitige Secrets Pflicht.

## Sicherheitsmodell

- Das LLM darf beraten und Inhalte entwerfen.
- Projektänderungen erfolgen nur über explizite Befehle.
- `/task` und `/render` benötigen einen Admin-Schlüssel oder eine sichtbare GitHub-Bestätigung.
- Renderbefehle registrieren zunächst nur GitHub-Aufträge.
- Keine freie Shell, keine automatische Veröffentlichung, keine unkontrollierte GPU-Ausführung.

## Archiv

Der frühere Comic-Stand bleibt im Branch `archive/legacy-comic-2026-07-10`.
