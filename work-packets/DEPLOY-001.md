# DEPLOY-001 · Comic Director online aktivieren

## Ziel

Vercel mit dem neuen `main`-Stand verbinden und die privaten Environment Variables setzen.

## Definition of Done

- Dashboard ist über eine stabile Vercel-URL erreichbar.
- `/status` antwortet.
- eine freie LLM-Anfrage antwortet.
- `/task Online-Test` erzeugt mit Admin-Schlüssel ein GitHub-Issue.
- ohne Admin-Schlüssel bleibt die Schreibaktion blockiert.

## Verbotener Scope

- keine neuen Dashboard-Funktionen
- keine Render-Worker
- keine weiteren Provider
- keine Secrets im Repository
