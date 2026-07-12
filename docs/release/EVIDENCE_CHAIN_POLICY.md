# Comic Factory · Evidence Chain Policy

## 1. Autorität

Die zentrale maschinenlesbare Quelle ist:

```text
project/program-evidence-manifest.json
```

Das Schema ist:

```text
project/schemas/program-evidence-manifest-v1.schema.json
```

Berichte, PR-Beschreibungen und Chat-Zusammenfassungen sind Quellen, aber niemals alleinige Release-Autorität.

## 2. Evidence-Reihenfolge

Für einen abgeschlossenen Worker müssen mindestens gemeinsam stimmen:

1. Worker-ID und Rolle;
2. Branch;
3. exakter 40-stelliger Git-Commit-SHA;
4. Pull-Request-Nummer, Basisbranch und Zustand;
5. Abschlussbericht und darin erwarteter Status;
6. verlangte Repository-Artefakte am exakten Commit;
7. CI-Run-IDs und erfolgreiche Conclusions;
8. Workflow-Artefakt-IDs und SHA-256-Digests;
9. Abhängigkeiten;
10. Non-Claims und harte Aktivierungssperren.

Ein fehlendes Element stoppt fail-closed.

## 3. Kanonische SHA-256-Berechnung

Das Integrity-Feld hasht sich nicht selbst. Die Berechnung lautet:

1. Manifest tief kopieren.
2. Oberstes Feld `integrity` entfernen.
3. Objektschlüssel auf jeder Ebene lexikografisch sortieren.
4. Arrayreihenfolge unverändert lassen.
5. Als kompaktes UTF-8-JSON ohne zusätzliche Leerzeichen serialisieren.
6. SHA-256 berechnen.
7. Ergebnis unter `integrity.manifest_sha256` speichern.

Aktueller Hash:

```text
1a23bbfa6505fe76a9c5ed204ed1d2df93609ba2cad5e105c4f528fd87b930c3
```

## 4. Fail-Closed-Regeln

Die Kontrollschicht lehnt mindestens ab:

- unbekannte Schema-Version;
- falschen oder manipulierten Commit-SHA;
- ungültigen Manifest-Hash;
- fehlenden Bericht;
- fehlendes Repository-Artefakt;
- fehlenden CI-Run;
- fehlenden oder falschen Artefakt-Digest;
- widersprüchlichen Workerstatus;
- behaupteten Merge eines offenen PRs;
- fehlenden Worker 2;
- Worker 2 als fertig ohne Abschlussbericht;
- Worker 3 ohne PR #131;
- doppelte Worker-ID;
- doppelte Branch-Zuordnung;
- `main_merge_allowed: true`;
- `live_activation_allowed: true`;
- OAuth, Publishing, Netzwerk oder Plattformkonten als aktiv;
- Release-Ready-Status trotz Pending-Gate.

## 5. Repository-Referenzprüfung

Der CI-Workflow lädt die exakten Evidence-Branches als read-only Git-Refs und prüft:

```text
git rev-parse <branch-ref>
git cat-file -e <head>:<artifact-path>
git show <head>:<report-path>
```

Dadurch wird nicht nur Dateitext im Kontrollbranch geprüft. Die Artefakte müssen tatsächlich am angegebenen Worker-Commit existieren.

## 6. Änderungen

Jede Evidence-Aktualisierung benötigt:

- neue belegte Plattformdaten;
- aktualisiertes Manifest;
- neu berechneten Manifest-Hash;
- vollständige Positiv- und Negativtests;
- neuen statischen Workflow-Beweis;
- menschliches Review.

Werte dürfen nicht aus PR-Titeln geschätzt werden. Pending bleibt Pending, bis die vereinbarte Abschluss-Evidence vorliegt.

## 7. Unveränderliche Sicherheitsgrenzen

Diese Evidence-Schicht darf keine Produktfunktion ausführen oder verändern. Insbesondere bleiben verboten:

- Main-Merge;
- Live-Publishing;
- OAuth;
- Plattformkonten;
- Secret-Nutzung oder Secret-Schreibzugriffe;
- Canon-, Figuren-, Episoden- oder Dashboard-Mutation;
- automatisierte Marketing- oder Community-Aktionen.
