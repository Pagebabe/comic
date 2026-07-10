# Online Deployment

Zielplattform ist Vercel, weil Dashboard und sichere Serverless-API benötigt werden.

## Einmalige Einrichtung

1. Vercel-Projekt mit `Pagebabe/comic` verbinden.
2. Production Branch auf `main` setzen.
3. Umgebungsvariablen aus der README hinterlegen.
4. Deployment ausführen.
5. `/status`, freie LLM-Frage und Test-Issue prüfen.

## Pflichtprüfung

- Dashboard lädt ohne Schlüssel.
- LLM-Zugang ist geschützt.
- Schreibaktionen ohne Admin-Schlüssel werden blockiert.
- API-Schlüssel erscheinen nicht im Repository.
