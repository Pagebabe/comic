# Comic Growth OS · MKT0-008 Connector Contracts

Status: `IMPLEMENTED LOCALLY · PENDING REPOSITORY CI · OFFLINE SANDBOX ONLY`

Tracking: Issue #67

## Zweck

MKT0-008 definiert eine einheitliche Connector-Schicht zwischen dem bewiesenen Shadow-Orchestrator und späteren externen Providern. Das Modul plant, normalisiert und simuliert Integrationen, führt aber keine Netzwerk- oder Plattformaktion aus.

Vorbereitete Provider-Slots:

- Postiz
- Meta
- TikTok
- YouTube

Diese Slots sind Vertrags- und Sandboxobjekte. Sie sind kein Beweis, dass eine konkrete Provider-API, App-Freigabe oder OAuth-Verbindung funktioniert.

## Zustände

### Auth

```text
UNCONFIGURED
DISCONNECTED
SANDBOX_READY
BLOCKED
EXPIRED
```

`SANDBOX_READY` erlaubt ausschließlich deterministische Offline-Planung und Simulation. Ein Live-Zustand existiert nicht.

### Aktionen

```text
PLANNED_SHADOW
SIMULATED
```

Kein Connector-Vertrag enthält `LIVE`, `EXECUTED` oder eine vergleichbare öffentliche Aktion.

## Capability-Matrix

Mögliche Fähigkeiten:

```text
PUBLISH
STATUS
METRICS
COMMENTS
REPLIES
WEBHOOKS
```

Jeder Provider deklariert nur die Fähigkeiten, die der Slot unterstützen soll. Nicht deklarierte Fähigkeiten werden abgelehnt. Selbst deklarierte Fähigkeiten sind nicht ausführbar, solange kein späterer autorisierter Runtime-Beweis existiert.

## Secret-Regeln

Secret-Anforderungen enthalten ausschließlich:

- Namen
- Pflichtstatus
- Zustandsstatus

Zulässige Zustände:

```text
MISSING
AVAILABLE
EXPIRED
BLOCKED
NOT_REQUIRED
```

`AVAILABLE` bedeutet nur, dass eine spätere Runtime-Konfiguration erwartet oder außerhalb des Repositorys bestätigt wurde. Kein Wert wird gespeichert, ausgegeben oder gehasht.

Verboten:

- Access Tokens
- Client Secrets
- Passwörter
- Authorization Header
- API Keys
- Private Keys
- echte Account-, Channel-, Page- oder Profile-IDs

Provider- und Accountreferenzen verwenden ausschließlich `sandbox_*`-Aliase.

## Request-Plan

Ein Request-Plan enthält:

- Tenant und Projekt
- Provider und Sandbox-Alias
- Capability
- erlaubte Methode
- relativen Sandbox-Pfad
- kanonischen Payload-Hash
- deterministischen Idempotenzschlüssel
- Zeitpunkt
- Zustand `PLANNED_SHADOW`

Harte Regeln:

- kein absoluter URL
- kein Endpoint-Host
- kein HTTP-Aufruf
- keine Credential-Werte
- nur zur Capability passende Methode
- Connector muss `SANDBOX_READY` sein
- nicht unterstützte Capability wird abgelehnt

## Idempotenz

Der Schlüssel wird aus Tenant, Projekt, Provider, Alias, Capability, Methode, Pfad, Payload-Hash, Seed und Shadow-Modus gebildet.

Ein bereits registrierter Schlüssel erzeugt:

```text
IDEMPOTENT_DUPLICATE
```

Es erfolgt keine zweite Simulation oder Ausführung.

## Rate-Limit-Vertrag

Der Vertrag verwendet explizite Eingaben:

- Limit
- bisherige Nutzung
- angeforderte Einheiten
- Fensterbeginn
- Fensterlänge
- `asOf`

Mögliche Entscheidungen:

```text
ALLOW_SHADOW_PLAN
BACKOFF
BLOCK_INVALID_BUDGET
```

Auch `ALLOW_SHADOW_PLAN` erlaubt keine Netzwerkaktion. Backoff und Reset-Zeit sind deterministisch.

## Fehlerklassifikation

```text
RETRYABLE
AUTH
RATE_LIMIT
VALIDATION
PERMANENT
UNKNOWN
```

Die Klassifikation ist ein Planungs- und Triagevertrag, kein Beweis einer echten Providerantwort.

## Normalisierte Envelopes

Vorhanden sind:

- Publish Envelope
- Status Envelope
- Metric Envelope
- Community Envelope

Alle Envelopes:

- enden in `SIMULATED`
- enthalten nur Sandbox-Aliase
- enthalten Provenienz
- enthalten keine Credentials
- enthalten keine echten Account-IDs
- enthalten keine Community-Rohtexte oder persönlichen Profile

## Webhook-Vertrag

Geprüft werden:

- Event-ID
- Replay
- Ereigniszeit
- Empfangszeit
- maximales Alter
- erlaubter Future Skew
- simulierte Signaturklassifikation

Replays, alte Events und zu weit zukünftige Events werden abgelehnt. Eine simuliert gültige Signatur ist kein kryptografischer Runtime-Beweis.

## Provider-Sandbox

Die Sandbox nimmt einen `PLANNED_SHADOW`-Plan und eine synthetische Fixture entgegen. Das Ergebnis endet bei:

```text
SIMULATED
networkUsed: false
executionPerformed: false
liveActionPerformed: false
```

## Portfolio-Readiness

Die Projektion zeigt:

- Gesamtzahl der Slots
- sandboxbereite Slots
- blockierte Slots
- Live-Readiness immer `0`
- Provider-Runtime nicht verifiziert
- Netzwerk nicht verifiziert

## Harte Sicherheitsgrenzen

- kein HTTP, DNS oder Socket
- kein OAuth
- keine echten Provider-Endpunkte
- keine Secret-Werte
- keine realen Account-IDs
- kein Publishing, Reply, Delete oder DM
- kein Metrics- oder Community-Import
- kein automatisches Hochstufen aus `SANDBOX_READY`
- keine Plattformbehauptung ohne offiziellen Runtime-Beweis
- kein Merge in `main` während der Recovery-Stop-Regel

## Ausführbare Prüfung

```bash
node growth-os/connectors-check.mjs
node --test --test-concurrency=1 tests/growth-os-connectors.test.mjs
npm run test:growth
npm test
```

Offline-Artefakt:

```text
output/growth-os/mkt0-connector-sandbox.json
```

Das Artefakt enthält ausschließlich synthetische Fixtures.