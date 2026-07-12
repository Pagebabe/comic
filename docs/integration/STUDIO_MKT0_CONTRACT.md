# Studio → Quality Control → MKT0 Shadow Contract

Status: `IMPLEMENTED · SYNTHETIC SHADOW PROOF · LIVE BLOCKED`

Repository: `Pagebabe/comic`  
Branch: `worker/mkt0-shadow-integration`  
Maschinenvertrag: `growth-os/contracts/studio-mkt0-handoff-v1.schema.json`

## Zweck

Dieser Vertrag ist die einzige Adaptergrenze zwischen einem freigegebenen Comic-Studio-Paket und dem isolierten Comic Growth OS. Er erzeugt ausschließlich Shadow-Pläne und append-only Shadow-Ereignisse. Er veröffentlicht nichts, verbindet keine Konten und verändert weder Canon noch Produktionsdaten.

## Verbindliche Statuskette

```text
PRODUCTION_COMPLETE
→ AUTO_QA außerhalb dieses Adapters
→ QA_PASSED oder HUMAN_REVIEW_REQUIRED
→ Studio-MKT0-Paket
→ READY_FOR_SHADOW
→ SHADOW_INGESTED
→ synthetische oder autorisiert importierte Analytics
→ PRODUCTION_BRIEF_READY
→ menschliche Studio-Entscheidung
```

## Pflichtfelder

| Feld | Bedeutung |
|---|---|
| `project_id` | stabiles Projekt |
| `episode_id` | stabile Episode |
| `asset_id` | freigegebenes Übergabeasset |
| `production_status` | muss `PRODUCTION_COMPLETE` sein |
| `qa_status` | muss `QA_PASSED` sein; `HUMAN_REVIEW_REQUIRED` stoppt |
| `approved_platforms` | Teilmenge aus TikTok, Instagram Reels, YouTube Shorts |
| `format` | Formattyp, Seitenverhältnis und Dauer |
| `caption_base` | redaktionelle Ausgangsbasis, keine fertige Live-Caption |
| `hook_variants` | eindeutig identifizierte Hook-Varianten |
| `publishing_window` | Zeitzone sowie frühestes und spätestes Shadow-Fenster |
| `policy_status` | muss `PASSED` sein |
| `human_review_status` | explizite menschliche Freigabe mit Evidence |
| `version` | Paketversion |
| `created_at` | ISO-Zeitstempel |
| `integrity` | SHA-256 über das kanonische Paket ohne Integrity-Feld |

Zusätzlich enthält das Paket `event_id`, `contract_id`, `mode` und vollständige Asset-Provenienz. `asset_id` muss mit `asset.id` übereinstimmen.

## Erlaubte Plattformen und Formate

Plattformen:

- `tiktok`
- `instagram_reels`
- `youtube_shorts`

Formate:

- `short_video`
- `carousel_video`

Seitenverhältnisse:

- `9:16`
- `1:1`
- `4:5`
- `16:9`

Eine angeforderte Plattform außerhalb von `approved_platforms` endet in `PLATFORM_SCOPE_BLOCKED`.

## Entscheidungszustände

- `INVALID_PACKAGE`: Struktur oder Referenz ungültig.
- `INTEGRITY_FAILURE`: Paket- oder Asset-Hash stimmt nicht.
- `PRODUCTION_NOT_COMPLETE`: Produktion nicht abgeschlossen.
- `QA_BLOCKED`: QA nicht bestanden.
- `HUMAN_REVIEW_REQUIRED`: QA oder explizite Freigabe offen.
- `POLICY_BLOCKED`: Policy-Gate nicht bestanden.
- `PLATFORM_SCOPE_BLOCKED`: Plattform nicht freigegeben.
- `DUPLICATE_IGNORED`: Event-ID oder Paket-Hash bereits verarbeitet.
- `LIVE_GATE_VIOLATION`: mindestens eine Live-Sperre wurde gelockert.
- `READY_FOR_SHADOW`: Shadow-Plan darf erzeugt werden.
- `SHADOW_INGESTED`: Plan wurde nur im Shadow-Zustand protokolliert.

## Idempotenz

Zwei unabhängige Schlüssel verhindern Doppelverarbeitung:

1. `event_id`
2. berechneter Paket-SHA-256

Ein Duplikat erzeugt keinen zweiten Shadow-Plan und erst recht keine Veröffentlichung. Es wird ausschließlich als `STUDIO_MKT0_DUPLICATE_IGNORED` protokolliert.

## Referenzsicherheit

Erlaubte Schemes:

```text
fixture://
studio-export://
```

Verboten:

- HTTP und HTTPS
- `file://`
- Pfad-Traversal
- Netzwerkzugriff
- OAuth
- Secret-Schreibzugriffe
- Assetkopien oder Produktionsmutationen

## Shadow-Ausgabe

Jeder Plattformjob enthält zwingend:

```text
execution_mode = shadow
action = PLAN_VARIANT_ONLY
publish_allowed = false
network_allowed = false
oauth_allowed = false
account_required = false
```

Ein grüner Vertrag beweist die Adapterlogik. Er beweist keine reale Pilotepisode, keine realen Accounts, keine Plattformrechte und keine Live-Marketingperformance.
