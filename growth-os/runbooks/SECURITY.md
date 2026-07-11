# Runbook · Security and Secret Hygiene

Status: `SHADOW CONTRACT · NO SECRET VALUES`

## Grundregeln

- Secret-Werte gehören weder ins Repository noch in Reports, Fixtures, Issues oder Evidence Packets.
- Das Inventar speichert ausschließlich Secret-Namen, Pflichtstatus, Zustand, letzte Rotation und verantwortliche Rolle.
- Öffentliche Aktionen und Live-Connectoren bleiben deaktiviert.
- Jeder mögliche Secret-Leak wird mindestens als Security Incident behandelt.

## Secret-Status

- `PRESENT`
- `MISSING_REQUIRED`
- `MISSING_OPTIONAL`
- `ROTATION_DUE`
- `DISABLED`

`MISSING_REQUIRED` blockiert Readiness. `ROTATION_DUE` erzeugt eine Warnung. Kein Status enthält oder bestätigt den tatsächlichen Secret-Wert.

## Verdacht auf Offenlegung

1. Incident anlegen.
2. bei möglichem aktiven Credential mindestens SEV1 prüfen.
3. globalen Kill Switch aktivieren.
4. betroffene Module deaktivieren.
5. Secret außerhalb des Repositories rotieren oder deaktivieren.
6. Git-Historie und Outputs auf Metadaten prüfen, ohne den Wert erneut zu verbreiten.
7. Evidence-Referenzen dokumentieren.
8. Readiness erst nach menschlicher Prüfung neu bewerten.

## Datenschutz

- keine Community-Rohtexte im Operations-Output
- keine persönlichen Profile
- keine E-Mail-, Telefon- oder URL-Rohdaten
- keine Kontakte oder OAuth-Tokens
- Retention und Legal Hold explizit anwenden

## Audit

Lokale Audit-Anchor-Manifeste enthalten ausschließlich Event-Hashes und Root-Hash. Eine externe Verankerung wird erst nach eigenem Connector-, Credential- und Evidence-Prozess aktiviert.

## Nicht erlaubt

- Secret-Werte zu Testzwecken committen
- echte Tokens in synthetischen Fixtures verwenden
- fehlende Secrets durch Platzhalter vortäuschen
- Lockdown automatisch aufheben
- Sicherheitswarnungen als reines Logging behandeln
