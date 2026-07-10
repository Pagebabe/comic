# Online-Aktivierung des Comic Director

## Ziel

Das Dashboard und der LLM-Director werden über Vercel online erreichbar.

## Einmalige Schritte

1. In Vercel ein neues Projekt aus `Pagebabe/comic` erstellen.
2. Branch `main` als Production Branch verwenden.
3. Folgende Environment Variables setzen:

```text
COMIC_ACCESS_KEY=<eigener Zugangsschlüssel>
COMIC_ADMIN_KEY=<eigener Admin-Schlüssel>
GITHUB_TOKEN=<GitHub Token mit Issues-Schreibrecht für Pagebabe/comic>
GITHUB_REPOSITORY=Pagebabe/comic
LLM_API_KEY=<API-Key des gewählten OpenAI-kompatiblen Providers>
LLM_BASE_URL=<Provider-URL mit /v1>
LLM_MODEL=<Modell-ID>
```

4. Neu deployen.
5. Dashboard öffnen und `/status` testen.
6. Freie Anfrage testen: `Plane drei kurze Folgeideen nach dem Pilot.`
7. `/task Online-Test` mit Admin-Schlüssel testen.

## Sicherheitsregeln

- Keys niemals in GitHub-Dateien eintragen.
- Keys niemals in Screenshots oder Chatnachrichten veröffentlichen.
- `GITHUB_TOKEN` nur mit minimal notwendigen Repository-Rechten erstellen.
- Schreibaktionen bleiben mit `COMIC_ADMIN_KEY` gesperrt.
