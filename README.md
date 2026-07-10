# Comic Factory · Director Dashboard

Neustart der Comic Factory als online erreichbarer Produktionsleitstand.

## Was bereits funktioniert

- Dashboard mit Meilensteinen, Figurenstatus und M1-Arbeitsliste
- LLM-gestützter Comic Director für Figuren, Story-Arcs, Folgen, Drehbücher und Produktionspläne
- feste Steuerbefehle: `/status`, `/next`, `/characters`, `/plan`
- kontrollierte GitHub-Schreibaktionen: `/task` und `/render`
- kein freier Shellzugriff
- Browserwerte für Provider bleiben nur in der Sitzung
- CI prüft den Projektzustand

## Vercel-Umgebungsvariablen

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
- `/task` und `/render` benötigen einen Admin-Schlüssel.
- Renderbefehle registrieren zunächst nur GitHub-Aufträge.
- Keine freie Shell, keine automatische Veröffentlichung, keine unkontrollierte GPU-Ausführung.

## Archiv

Der frühere Comic-Stand bleibt im Branch `archive/legacy-comic-2026-07-10`.
