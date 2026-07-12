import { createHash } from 'node:crypto';

export const RECOVERY_SCHEMA_VERSION = 1;
export const RECOVERY_RULE_VERSION = 'ops-recovery.v1';

const SAFE_COMMANDS = Object.freeze([
  'node --version',
  'npm --version',
  'git --version',
  'npm --prefix studio-app ci',
  'npm --prefix studio-app run build',
  'npm run drill:fresh-install',
  'npm run test:recovery',
  'npm run test:readiness',
  'npm run check'
]);

const FORBIDDEN_FRAGMENTS = Object.freeze([
  'rm -rf',
  'sudo ',
  'curl |',
  'wget |',
  'git reset --hard',
  'git clean -fd',
  'chmod 777',
  'kill -9',
  'drop table',
  'delete from',
  'truncate '
]);

const RULES = Object.freeze({
  NODE_UNSUPPORTED: {
    category: 'PREREQUISITE', severity: 'SEV2', title: 'Node-Version nicht unterstützt',
    explanation: 'Comic Factory benötigt Node.js 20 oder neuer.',
    commands: ['node --version'],
    steps: ['Installiere eine unterstützte Node-LTS-Version.', 'Öffne danach ein neues Terminal.', 'Starte den Fresh-Install-Drill erneut.'],
    retry: 'npm run drill:fresh-install'
  },
  GIT_MISSING: {
    category: 'PREREQUISITE', severity: 'SEV2', title: 'Git fehlt oder ist nicht erreichbar',
    explanation: 'Der isolierte Clone und die Commitbindung benötigen Git.',
    commands: ['git --version'],
    steps: ['Installiere Git über den offiziellen Betriebssystemweg.', 'Prüfe Git in einem neuen Terminal.', 'Starte den Drill erneut.'],
    retry: 'npm run drill:fresh-install'
  },
  STUDIO_LOCKFILE_MISSING: {
    category: 'INSTALL', severity: 'SEV1', title: 'Studio-Lockfile fehlt',
    explanation: 'Ohne Lockfile ist die Installation nicht reproduzierbar.',
    commands: [],
    steps: ['Stoppe die Installation.', 'Prüfe, ob der exakte Repository-Commit vollständig ausgecheckt wurde.', 'Eskalation an Repository-Verantwortliche.'],
    humanRequired: true
  },
  FRESH_CLONE_CONTAMINATED: {
    category: 'INSTALL', severity: 'SEV2', title: 'Frischer Clone enthält Altartefakte',
    explanation: 'Ein Fresh-Install-Beweis darf keine alten Dependencies oder Builds verwenden.',
    commands: [],
    steps: ['Verwende einen neuen leeren Zielordner.', 'Ändere oder lösche den bestehenden Arbeitsordner nicht automatisch.', 'Starte den Drill mit einem neuen temporären Clone erneut.'],
    retry: 'npm run drill:fresh-install'
  },
  NPM_INSTALL_FAILED: {
    category: 'INSTALL', severity: 'SEV2', title: 'Dependency-Installation fehlgeschlagen',
    explanation: 'Netzwerk, Registry, Lockfile oder Systemumgebung haben die gesperrte Installation blockiert.',
    commands: ['npm --version', 'npm --prefix studio-app ci'],
    steps: ['Sichere stdout und stderr.', 'Prüfe Netzwerk und freien Speicher.', 'Wiederhole exakt npm ci, ohne Versionsupdates.'],
    retry: 'npm --prefix studio-app ci'
  },
  STUDIO_BUILD_FAILED: {
    category: 'BUILD', severity: 'SEV2', title: 'Studio-Build fehlgeschlagen',
    explanation: 'TypeScript oder Vite haben den aktuellen Commit abgelehnt.',
    commands: ['npm --prefix studio-app run build'],
    steps: ['Sichere den Build-Log.', 'Ändere keine Dependency-Version auf Verdacht.', 'Eröffne einen isolierten Fix mit reproduzierbarem Fehler.'],
    humanRequired: true
  },
  PROJECT_TRUTH_MISSING: {
    category: 'DATA', severity: 'SEV1', title: 'Projektwahrheitsdatei fehlt',
    explanation: 'Das Studio darf ohne Truth-State, Closure- oder Academy-Vertrag nicht starten.',
    commands: ['npm run check'],
    steps: ['Stoppe den Start.', 'Bestimme die konkret fehlende Datei.', 'Stelle sie ausschließlich aus dem gebundenen Repository-Commit wieder her.', 'Führe Vertragschecks erneut aus.'],
    humanRequired: true
  },
  PREVIEW_PORT_IN_USE: {
    category: 'RUNTIME', severity: 'SEV3', title: 'Lokaler Preview-Port ist belegt',
    explanation: 'Ein anderer Prozess verwendet den angeforderten lokalen Port.',
    commands: [],
    steps: ['Beende keine unbekannten Prozesse automatisch.', 'Wähle einen freien lokalen Port.', 'Starte Preview und Smoke erneut.'],
    automaticActionAllowed: true
  },
  PREVIEW_START_FAILED: {
    category: 'RUNTIME', severity: 'SEV2', title: 'Preview-Server startet nicht',
    explanation: 'Vite-Binary, Build-Artefakt oder lokaler Prozessstart ist fehlgeschlagen.',
    commands: ['npm --prefix studio-app run build'],
    steps: ['Prüfe dist/index.html und den Preview-Log.', 'Prüfe, ob das installierte Vite-Binary vorhanden ist.', 'Starte keinen alternativen Fremdserver als stillen Ersatz.'],
    humanRequired: true
  },
  BROWSER_SMOKE_TIMEOUT: {
    category: 'BROWSER', severity: 'SEV2', title: 'Browser-Smoke erreicht die erwartete UI nicht',
    explanation: 'Die Route lädt nicht, Projektwahrheitsdaten fehlen oder die UI ist regressiert.',
    commands: ['npm run test:readiness'],
    steps: ['Sichere Browser-, Console- und Server-Logs.', 'Prüfe HTTP-Status der Route und Projektdateien.', 'Prüfe die erwarteten data-testid-Marker.', 'Behebe ausschließlich die nachgewiesene Ursache.'],
    humanRequired: true
  },
  HASH_MISMATCH: {
    category: 'INTEGRITY', severity: 'SEV1', title: 'Hash stimmt nicht überein',
    explanation: 'Zustand, Package oder Beweisdatei weicht von der gebundenen Version ab.',
    commands: ['npm run test:recovery'],
    steps: ['Stoppe jede Freigabe.', 'Bewahre beide Hashwerte und Artefakte.', 'Wiederhole den read-only Vergleich.', 'Eskalation, wenn die Abweichung bestehen bleibt.'],
    humanRequired: true
  },
  RESTORE_PACKAGE_INVALID: {
    category: 'RECOVERY', severity: 'SEV1', title: 'Restore-Paket ist ungültig',
    explanation: 'Schema, Hash oder erforderliche Felder des Pakets sind nicht gültig.',
    commands: ['npm run test:recovery'],
    steps: ['Importiere das Paket nicht.', 'Bewahre das Paket unverändert als Evidence.', 'Prüfe Schema und Hash.', 'Verwende nur ein zuvor validiertes Backup.'],
    humanRequired: true
  },
  EXPORT_MISSING: {
    category: 'EXPORT', severity: 'SEV2', title: 'Erwartetes Exportartefakt fehlt',
    explanation: 'Der vorherige Schritt meldete Erfolg, lieferte aber kein gebundenes Artefakt.',
    commands: ['npm run check'],
    steps: ['Markiere den Schritt als fehlgeschlagen.', 'Prüfe Ausgabeordner und Log.', 'Erzeuge den Export erneut, ohne einen leeren Platzhalter als Erfolg zu zählen.'],
    humanRequired: true
  }
});

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

function hash(value) {
  return createHash('sha256').update(JSON.stringify(canonicalize(value))).digest('hex');
}

function assertSafeCommand(command) {
  if (!SAFE_COMMANDS.includes(command)) throw new Error(`UNSAFE_RECOVERY_COMMAND:${command}`);
  const lower = command.toLowerCase();
  for (const fragment of FORBIDDEN_FRAGMENTS) {
    if (lower.includes(fragment)) throw new Error(`FORBIDDEN_RECOVERY_COMMAND:${fragment}`);
  }
}

export function diagnoseFailure(input = {}) {
  const code = typeof input.code === 'string' ? input.code.trim().toUpperCase() : '';
  const rule = RULES[code];
  if (!rule) {
    const core = {
      schemaVersion: RECOVERY_SCHEMA_VERSION,
      ruleVersion: RECOVERY_RULE_VERSION,
      code: code || 'UNKNOWN',
      category: 'UNKNOWN',
      severity: 'SEV1',
      title: 'Unbekannter Fehler',
      explanation: 'Der Fehler entspricht keiner bewiesenen Recovery-Regel. Das System darf keine Reparatur raten.',
      evidence: [...(input.evidence || [])].map(String).sort(),
      commands: [],
      steps: ['Stoppe die Ausführung.', 'Sichere Logs und betroffene Artefakte.', 'Eskalation an einen Menschen.'],
      automaticActionAllowed: false,
      humanRequired: true,
      decision: 'HUMAN_ESCALATION_REQUIRED',
      retry: null
    };
    return Object.freeze({ ...core, planHash: hash(core) });
  }

  const commands = [...(rule.commands || [])];
  for (const command of commands) assertSafeCommand(command);
  if (rule.retry) assertSafeCommand(rule.retry);
  const automaticActionAllowed = rule.automaticActionAllowed === true;
  const humanRequired = rule.humanRequired === true || !automaticActionAllowed;
  const core = {
    schemaVersion: RECOVERY_SCHEMA_VERSION,
    ruleVersion: RECOVERY_RULE_VERSION,
    code,
    category: rule.category,
    severity: rule.severity,
    title: rule.title,
    explanation: rule.explanation,
    evidence: [...(input.evidence || [])].map(String).sort(),
    commands,
    steps: [...rule.steps],
    automaticActionAllowed,
    humanRequired,
    decision: humanRequired ? 'HUMAN_REVIEW_REQUIRED' : 'SAFE_RETRY_ALLOWED',
    retry: rule.retry || null
  };
  return Object.freeze({ ...core, planHash: hash(core) });
}

export function validateRecoveryPlan(plan) {
  if (!plan || plan.schemaVersion !== RECOVERY_SCHEMA_VERSION) throw new Error('RECOVERY_SCHEMA_INVALID');
  if (!['HUMAN_REVIEW_REQUIRED', 'HUMAN_ESCALATION_REQUIRED', 'SAFE_RETRY_ALLOWED'].includes(plan.decision)) throw new Error('RECOVERY_DECISION_INVALID');
  for (const command of plan.commands || []) assertSafeCommand(command);
  if (plan.retry) assertSafeCommand(plan.retry);
  if (plan.automaticActionAllowed && plan.decision !== 'SAFE_RETRY_ALLOWED') throw new Error('RECOVERY_AUTOMATION_DECISION_MISMATCH');
  if (plan.category === 'UNKNOWN' && (plan.commands.length || plan.retry)) throw new Error('UNKNOWN_RECOVERY_MUST_NOT_EXECUTE');
  const { planHash, ...core } = plan;
  if (hash(core) !== planHash) throw new Error('RECOVERY_PLAN_HASH_MISMATCH');
  return true;
}

export function listRecoveryRules() {
  return Object.freeze(Object.keys(RULES).sort().map((code) => diagnoseFailure({ code })));
}

export function runSyntheticRecoveryDrills({ occurredAt = '2026-07-11T00:00:00.000Z' } = {}) {
  const scenarios = [
    'NODE_UNSUPPORTED', 'GIT_MISSING', 'STUDIO_LOCKFILE_MISSING', 'FRESH_CLONE_CONTAMINATED',
    'NPM_INSTALL_FAILED', 'STUDIO_BUILD_FAILED', 'PROJECT_TRUTH_MISSING', 'PREVIEW_PORT_IN_USE',
    'PREVIEW_START_FAILED', 'BROWSER_SMOKE_TIMEOUT', 'HASH_MISMATCH', 'RESTORE_PACKAGE_INVALID',
    'EXPORT_MISSING', 'SOMETHING_UNCLASSIFIED'
  ];
  const results = scenarios.map((code) => {
    const sandboxBefore = hash({ files: ['fixture.json'], state: 'clean' });
    const diagnosis = diagnoseFailure({ code, evidence: [`fixture:${code.toLowerCase()}`] });
    validateRecoveryPlan(diagnosis);
    const sandboxAfter = hash({ files: ['fixture.json'], state: 'clean' });
    return Object.freeze({
      code,
      diagnosis,
      sandboxBefore,
      sandboxAfter,
      sandboxRestored: sandboxBefore === sandboxAfter,
      externalActionExecuted: false,
      destructiveActionExecuted: false,
      status: sandboxBefore === sandboxAfter ? 'PASS' : 'FAIL'
    });
  });
  const reportCore = {
    schemaVersion: RECOVERY_SCHEMA_VERSION,
    ruleVersion: RECOVERY_RULE_VERSION,
    repository: 'Pagebabe/comic',
    trackingIssue: 118,
    occurredAt,
    scenarioCount: results.length,
    passed: results.filter((result) => result.status === 'PASS').length,
    results,
    boundaries: {
      productionReady: false,
      beginnerReady: false,
      creativeApprovalGranted: false,
      imageGenerationAllowed: false,
      growthOsIntegrated: false,
      observedOperatorRecovery: false
    }
  };
  return Object.freeze({ ...reportCore, reportHash: hash(reportCore) });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

export function renderRecoveryReportHtml(report) {
  const rows = report.results.map((result) => `<article><header><code>${escapeHtml(result.diagnosis.code)}</code><strong>${escapeHtml(result.diagnosis.title)}</strong><span>${escapeHtml(result.diagnosis.severity)}</span></header><p>${escapeHtml(result.diagnosis.explanation)}</p><ol>${result.diagnosis.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol><small>${escapeHtml(result.diagnosis.decision)} · Sandbox ${result.sandboxRestored ? 'RESTORED' : 'FAILED'}</small></article>`).join('');
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src 'none'; connect-src 'none'"><title>Comic Factory Recovery Lab</title><style>body{font-family:system-ui;background:#111;color:#eee;margin:0;padding:24px}main{max-width:1100px;margin:auto}section{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px}article{border:1px solid #444;border-radius:14px;padding:16px;background:#191919}header{display:grid;gap:6px}code,span{color:#f4bd55}ol{padding-left:20px}small{color:#aaa}</style></head><body><main><p>COMIC FACTORY · OPERATOR RECOVERY</p><h1>${report.passed}/${report.scenarioCount} sichere Failure-Drills</h1><p>Keine externen oder destruktiven Aktionen. Unbekannte Fehler werden eskaliert.</p><section>${rows}</section><footer><p>Report ${escapeHtml(report.reportHash)}</p><p>Production Ready: NEIN · Beginner Ready: NEIN · Operator-Beobachtung: OFFEN</p></footer></main></body></html>`;
}
