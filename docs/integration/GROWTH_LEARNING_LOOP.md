# Growth Learning Loop → Studio

Status: `SHADOW RECOMMENDATION LOOP · HUMAN DECISION REQUIRED`

## Ziel

Analytics darf die nächste Produktion informieren, aber weder Canon noch Produktionsdaten automatisch verändern. Das System erzeugt ein nachvollziehbares Briefing, keinen kreativen Autopiloten mit Größenwahn.

## Datenfluss

```text
Shadow-Variantenplan
→ synthetisches oder autorisiert importiertes Performance-Snapshot
→ Datenqualitätsprüfung
→ robuste Vergleichsbasis
→ Winner / Outlier / Baseline / Underperformer
→ regelbasierte Empfehlungen
→ PRODUCTION_BRIEF_REGISTERED
→ Studio-Briefing mit Episode- und Assetbezug
→ menschliche Annahme, Ablehnung oder Änderung
```

## Bestehende Growth-OS-Basis

`growth-os/analytics.mjs` liefert:

- Hold Rate nach drei Sekunden
- Completion Rate
- Share Rate
- Save Rate
- Kommentarquote
- Follower-Konversion
- Watch Ratio
- Rewatch Rate
- Produktionseffizienz
- robuste Baselines
- Winner-, Outlier- und Underperformer-Klassifikation
- regelgebundene Empfehlungen
- `PRODUCTION_BRIEF_REGISTERED`

Der neue Adapter verwendet den bestehenden `buildDirectionPackage`-Pfad und bindet dessen Produktionsbriefing zurück an:

- `project_id`
- `episode_id`
- `asset_id`
- `source_analysis_id`

## Ausgabeformat

Ein gültiges Briefing enthält:

```text
state = PRODUCTION_BRIEF_READY
priority = HIGH oder NORMAL
recommendations = regelbasierte Empfehlungscodes
canon_change_allowed = false
production_mutation_allowed = false
human_review_required = true
integrity_sha256 = deterministischer Briefing-Hash
```

Verbindliche Einschränkungen:

- `NO_CANON_CHANGE_WITHOUT_HUMAN_APPROVAL`
- `NO_AUTOMATIC_PRODUCTION_MUTATION`
- `SHADOW_RECOMMENDATION_ONLY`

## Beispiel aus dem synthetischen Fixture

Ein synthetisch als `WINNER` bewerteter Clip erzeugt unter anderem:

- `CREATE_FOLLOW_UP`
- `STRENGTHEN_SERIES_AND_CHARACTER_SIGNAL`
- `NO_CANON_CHANGE_WITHOUT_HUMAN_APPROVAL`

Das ist eine Testanweisung für die nächste redaktionelle Entscheidung, keine Erlaubnis, Figuren, Story oder Veröffentlichungen automatisch umzubauen.

## Human-in-the-loop

Das Studio muss für jedes Briefing eine spätere Entscheidung erfassen:

- `ACCEPTED_FOR_EXPERIMENT`
- `MODIFIED_FOR_EXPERIMENT`
- `REJECTED`
- `PARKED_INSUFFICIENT_EVIDENCE`

Diese Entscheidungsfunktion ist nicht Teil dieses Workers. Bis sie separat implementiert und bewiesen ist, bleibt das Briefing read-only.

## Datenwahrheit

Synthetische Fixtures dürfen nur Logik beweisen. Sie dürfen nicht für reale Aussagen verwendet werden zu:

- Reichweite
- Wachstum
- Followern
- Plattformperformance
- optimalen Postingzeiten
- Gewinnerformaten im echten Markt

Reale Learnings erfordern später autorisierte Plattformimporte mit dokumentierter Provenienz. OAuth und Plattformkonten bleiben in diesem Worker gesperrt.

## Qualitäts- und Stop-Regeln

Kein Briefing darf erzeugt oder übernommen werden, wenn:

- Analytics-Daten den Status `HOLD` haben
- keine robuste oder erlaubte Fallback-Basis existiert
- Provenienz fehlt
- die Empfehlung eine Canon- oder Produktionsmutation verlangt
- Plattformdaten synthetisch sind, aber als real dargestellt werden
- die menschliche Studio-Entscheidung fehlt

## Rückkopplungsgrenze

Der Learning Loop endet hier:

```text
PRODUCTION_BRIEF_READY
```

Er beginnt nicht automatisch eine neue Episode, ändert keine Figur und stößt keine Veröffentlichung an.
