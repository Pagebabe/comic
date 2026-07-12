# Comic Factory · Worker Acceptance Matrix

Maschinenquelle: `project/program-evidence-manifest.json`

| Paket | PR | Head | Abnahme | Ziel | Main |
|---|---:|---|---|---|---|
| Canon/Cast | #138 | `1bb4df874d8e2a36fd32fbad19074ed629ec922d` | `CANON_CAST_SEPARATION_PROVEN` | in Factory integriert | nein |
| Episode-Pipeline | #140 | `e8b8e348120ad527abe7a33caab9f56b6627f8c2` | `EPISODE_PIPELINE_PROVEN` | in Factory integriert | nein |
| Factory kombiniert | #144 | `eb07bc9ab5536d89ccc01ccccbd5aaeabf82d3b3` | `FACTORY_INTEGRATION_PROVEN` | Draft gegen Main | blockiert |
| MKT0 Shadow | #139 | `c8c0adcef30645142190c19d8fbc6903fe177ae7` | isoliert bewiesen | durch #131 und Current-Main-Reintegration blockiert | nein |
| Factory-to-Growth | #131 | `9573757dbd9b39858ebae2b37337d2728a3455e4` | isoliert bewiesen | alte Growth-Linie | nein |

## Grenzen

- Die beiden geschlossenen Worker-PRs wurden nur in `integration/factory-final-heads` gemergt.
- PR #144 bleibt Draft und ungemergt.
- Worker 2 beweist Technik mit synthetischen Testassets, keine echte Folge.
- Growth ist nicht Teil des Factory-Heads.
- Master- und Live-Freigaben bleiben null beziehungsweise verboten.
