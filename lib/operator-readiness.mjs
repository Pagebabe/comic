import { createHash } from 'node:crypto';

export const OPERATOR_SCHEMA_VERSION = 1;
export const NOVICE_SCHEMA_VERSION = 2;
export const REQUIRED_TASK_IDS = Object.freeze(
  Array.from({ length: 12 }, (_, index) => `T${String(index + 1).padStart(2, '0')}`)
);

const ALLOWED_COMMANDS = Object.freeze([
  Object.freeze(['npm', '--prefix', 'studio-app', 'ci']),
  Object.freeze(['npm', '--prefix', 'studio-app', 'run', 'build']),
  Object.freeze(['npm', 'run', 'test:operator']),
  Object.freeze(['npm', 'run', 'test:readiness']),
  Object.freeze(['npm', 'run', 'test:truth']),
  Object.freeze(['npm', 'run', 'build:studio'])
]);

export class OperatorContractError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'OperatorContractError';
    this.details = details;
  }
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

export function sha256(value) {
  const input = typeof value === 'string' ? value : canonicalJson(value);
  return createHash('sha256').update(input).digest('hex');
}

function requireObject(value, field) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new OperatorContractError(`Missing or invalid object: ${field}`, { field });
  }
  return value;
}

function requireString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new OperatorContractError(`Missing or invalid string: ${field}`, { field });
  }
  return value.trim();
}

function requireBoolean(value, field) {
  if (typeof value !== 'boolean') {
    throw new OperatorContractError(`Missing or invalid boolean: ${field}`, { field, value });
  }
  return value;
}

function assertCommit(value) {
  const commit = requireString(value, 'testedCommit');
  if (!/^[0-9a-f]{40}$/i.test(commit)) {
    throw new OperatorContractError('testedCommit must be a full 40-character Git commit SHA', { commit });
  }
  return commit.toLowerCase();
}

function major(version) {
  const match = String(version ?? '').match(/(\d+)/);
  return match ? Number(match[1]) : Number.NaN;
}

export function validateSupportedEnvironmentContract(input) {
  const contract = requireObject(input, 'supportedEnvironmentContract');
  if (contract.schemaVersion !== OPERATOR_SCHEMA_VERSION) {
    throw new OperatorContractError(`Environment schemaVersion must be ${OPERATOR_SCHEMA_VERSION}`);
  }
  if (!Array.isArray(contract.supportedProfiles) || contract.supportedProfiles.length < 2) {
    throw new OperatorContractError('At least two supported environment profiles are required');
  }
  const ids = new Set();
  for (const profile of contract.supportedProfiles) {
    requireObject(profile, 'supportedProfiles[]');
    const id = requireString(profile.id, 'supportedProfiles[].id');
    if (ids.has(id)) throw new OperatorContractError('Duplicate environment profile', { id });
    ids.add(id);
    requireString(profile.os, `${id}.os`);
    requireString(profile.arch, `${id}.arch`);
    if (!Number.isInteger(profile.minimumNodeMajor) || profile.minimumNodeMajor < 20) {
      throw new OperatorContractError('minimumNodeMajor must be at least 20', { id });
    }
    requireString(profile.installCommand, `${id}.installCommand`);
    requireString(profile.startCommand, `${id}.startCommand`);
  }
  return Object.freeze({ ...contract, supportedProfiles: Object.freeze(contract.supportedProfiles.map(Object.freeze)) });
}

export function buildDoctorReport({
  profile = 'studio',
  commit,
  platform,
  arch,
  nodeVersion,
  npmVersion,
  pythonVersion = null,
  ffmpegAvailable = false,
  espeakAvailable = false,
  generatedAt = null
}) {
  if (!['studio', 'media'].includes(profile)) {
    throw new OperatorContractError('profile must be studio or media', { profile });
  }
  const normalizedCommit = assertCommit(commit);
  const checks = [
    Object.freeze({ id: 'node', required: true, passed: major(nodeVersion) >= 20, observed: String(nodeVersion) }),
    Object.freeze({ id: 'npm', required: true, passed: major(npmVersion) >= 10, observed: String(npmVersion) }),
    Object.freeze({ id: 'python', required: profile === 'media', passed: profile === 'studio' || major(pythonVersion) >= 3, observed: pythonVersion }),
    Object.freeze({ id: 'ffmpeg', required: profile === 'media', passed: profile === 'studio' || ffmpegAvailable === true, observed: ffmpegAvailable }),
    Object.freeze({ id: 'espeak-ng', required: profile === 'media', passed: profile === 'studio' || espeakAvailable === true, observed: espeakAvailable })
  ];
  const ready = checks.every((check) => !check.required || check.passed);
  const report = {
    schemaVersion: OPERATOR_SCHEMA_VERSION,
    type: 'comic-factory-operator-doctor',
    profile,
    testedCommit: normalizedCommit,
    environment: {
      platform: requireString(platform, 'platform'),
      arch: requireString(arch, 'arch'),
      nodeVersion: String(nodeVersion),
      npmVersion: String(npmVersion),
      pythonVersion,
      ffmpegAvailable,
      espeakAvailable
    },
    checks,
    ready,
    mutatedWorkspace: false,
    generatedAt
  };
  return Object.freeze({ ...report, reportHash: sha256({ ...report, generatedAt: null }) });
}

export function setupCommandPlan(profile = 'studio') {
  if (!['studio', 'media'].includes(profile)) {
    throw new OperatorContractError('profile must be studio or media', { profile });
  }
  return Object.freeze([
    Object.freeze(['npm', '--prefix', 'studio-app', 'ci']),
    Object.freeze(['npm', '--prefix', 'studio-app', 'run', 'build'])
  ]);
}

export function verifyCommandPlan() {
  return Object.freeze([
    Object.freeze(['npm', 'run', 'test:operator']),
    Object.freeze(['npm', 'run', 'test:readiness']),
    Object.freeze(['npm', 'run', 'build:studio'])
  ]);
}

export function assertAllowedCommand(command) {
  if (!Array.isArray(command) || command.some((part) => typeof part !== 'string')) {
    throw new OperatorContractError('Command must be an array of strings');
  }
  const allowed = ALLOWED_COMMANDS.some((candidate) =>
    candidate.length === command.length && candidate.every((part, index) => part === command[index])
  );
  if (!allowed) throw new OperatorContractError('Command is not in the operator allowlist', { command });
  return Object.freeze([...command]);
}

export function buildExecutionReport({ type, commit, profile, plan, results, generatedAt = null }) {
  const normalizedPlan = plan.map(assertAllowedCommand);
  if (!Array.isArray(results) || results.length !== normalizedPlan.length) {
    throw new OperatorContractError('Execution results must match the command plan');
  }
  const normalizedResults = results.map((result, index) => {
    requireObject(result, `results[${index}]`);
    const exitCode = Number(result.exitCode);
    if (!Number.isInteger(exitCode)) throw new OperatorContractError('exitCode must be an integer', { index });
    return Object.freeze({
      command: normalizedPlan[index],
      exitCode,
      stdoutHash: sha256(String(result.stdout ?? '')),
      stderrHash: sha256(String(result.stderr ?? ''))
    });
  });
  const report = {
    schemaVersion: OPERATOR_SCHEMA_VERSION,
    type: requireString(type, 'type'),
    testedCommit: assertCommit(commit),
    profile: requireString(profile, 'profile'),
    commandPlan: normalizedPlan,
    results: normalizedResults,
    passed: normalizedResults.every((result) => result.exitCode === 0),
    generatedAt
  };
  return Object.freeze({ ...report, reportHash: sha256({ ...report, generatedAt: null }) });
}

function normalizeRole(role, field) {
  const value = requireObject(role, field);
  const actorType = requireString(value.actorType, `${field}.actorType`).toUpperCase();
  if (actorType !== 'HUMAN') throw new OperatorContractError(`${field} must be HUMAN`, { actorType });
  return Object.freeze({
    code: requireString(value.code, `${field}.code`),
    actorType,
    projectContributor: requireBoolean(value.projectContributor, `${field}.projectContributor`),
    priorProjectKnowledge: requireBoolean(value.priorProjectKnowledge, `${field}.priorProjectKnowledge`)
  });
}

export function createNoviceSession({ template, commit, participant, observer, reviewer, environment, sessionId, createdAt }) {
  const source = requireObject(template, 'template');
  if (!Array.isArray(source.tasks) || source.tasks.length !== 12) {
    throw new OperatorContractError('Template must contain exactly 12 tasks');
  }
  const roles = {
    participant: normalizeRole(participant, 'participant'),
    observer: normalizeRole(observer, 'observer'),
    reviewer: normalizeRole(reviewer, 'reviewer')
  };
  const roleCodes = Object.values(roles).map((role) => role.code);
  if (new Set(roleCodes).size !== roleCodes.length) {
    throw new OperatorContractError('Participant, observer and reviewer must be different people');
  }
  if (roles.participant.projectContributor || roles.participant.priorProjectKnowledge) {
    throw new OperatorContractError('Participant must be independent and have no prior project knowledge');
  }
  if (roles.observer.projectContributor || roles.reviewer.projectContributor) {
    throw new OperatorContractError('Observer and reviewer must not be project contributors');
  }
  const tasks = source.tasks.map((task, index) => Object.freeze({
    id: REQUIRED_TASK_IDS[index],
    prompt: requireString(task.prompt, `tasks[${index}].prompt`),
    passed: null,
    helpRequired: null,
    notes: '',
    evidenceRefs: Object.freeze([])
  }));
  const record = {
    schemaVersion: NOVICE_SCHEMA_VERSION,
    type: 'comic-factory-novice-acceptance-record',
    repository: 'Pagebabe/comic',
    trackingIssue: 95,
    sessionId: requireString(sessionId, 'sessionId'),
    status: 'READY_FOR_OBSERVATION',
    testedCommit: assertCommit(commit),
    createdAt: requireString(createdAt, 'createdAt'),
    roles,
    environment: Object.freeze({
      operatingSystem: requireString(environment?.operatingSystem, 'environment.operatingSystem'),
      browser: requireString(environment?.browser, 'environment.browser'),
      device: requireString(environment?.device, 'environment.device'),
      freshMachine: requireBoolean(environment?.freshMachine, 'environment.freshMachine'),
      route: requireString(environment?.route, 'environment.route')
    }),
    tasks: Object.freeze(tasks),
    timing: Object.freeze({ startedAt: null, completedAt: null, durationMinutes: null }),
    safety: Object.freeze({ violations: Object.freeze([]), aborted: false }),
    assistance: Object.freeze({ undocumentedHelpUsed: null, documentedInterventions: Object.freeze([]) }),
    observerAttestation: null,
    reviewerDecision: Object.freeze({ decision: 'PENDING', attestation: null }),
    evidence: Object.freeze([]),
    result: Object.freeze({ passedTasks: 0, score: 0, decision: 'NOT_EXECUTED', blockingFindings: Object.freeze([]) })
  };
  return Object.freeze({ ...record, recordHash: sha256(record) });
}

export function evaluateNoviceRecord(input) {
  const record = requireObject(input, 'noviceRecord');
  if (record.schemaVersion !== NOVICE_SCHEMA_VERSION) {
    throw new OperatorContractError(`Novice schemaVersion must be ${NOVICE_SCHEMA_VERSION}`);
  }
  assertCommit(record.testedCommit);
  const participant = normalizeRole(record.roles?.participant, 'roles.participant');
  const observer = normalizeRole(record.roles?.observer, 'roles.observer');
  const reviewer = normalizeRole(record.roles?.reviewer, 'roles.reviewer');
  if (new Set([participant.code, observer.code, reviewer.code]).size !== 3) {
    throw new OperatorContractError('Participant, observer and reviewer must be different people');
  }
  if (participant.projectContributor || participant.priorProjectKnowledge) {
    throw new OperatorContractError('Participant independence contract failed');
  }
  if (observer.projectContributor || reviewer.projectContributor) {
    throw new OperatorContractError('Observer/reviewer independence contract failed');
  }
  if (!Array.isArray(record.tasks) || record.tasks.length !== 12) {
    throw new OperatorContractError('Record must contain exactly 12 tasks');
  }
  const taskIds = record.tasks.map((task) => task.id);
  if (taskIds.some((id, index) => id !== REQUIRED_TASK_IDS[index])) {
    throw new OperatorContractError('Task IDs or order changed', { taskIds });
  }
  const passedTasks = record.tasks.filter((task) => task.passed === true).length;
  const helpTasks = record.tasks.filter((task) => task.helpRequired === true).length;
  const safetyViolations = Array.isArray(record.safety?.violations) ? record.safety.violations : [];
  const blockingFindings = [];
  if (passedTasks !== 12) blockingFindings.push('NOT_ALL_TASKS_PASSED');
  if (helpTasks > 0) blockingFindings.push('HELP_REQUIRED');
  if (record.assistance?.undocumentedHelpUsed !== false) blockingFindings.push('UNDOCUMENTED_HELP_NOT_CLEARED');
  if (record.safety?.aborted !== false || safetyViolations.length > 0) blockingFindings.push('SAFETY_BOUNDARY_FAILED');
  if (typeof record.observerAttestation !== 'string' || record.observerAttestation.trim().length < 20) {
    blockingFindings.push('OBSERVER_ATTESTATION_MISSING');
  }
  if (record.reviewerDecision?.decision !== 'APPROVED') blockingFindings.push('SECOND_REVIEW_NOT_APPROVED');
  if (typeof record.reviewerDecision?.attestation !== 'string' || record.reviewerDecision.attestation.trim().length < 20) {
    blockingFindings.push('REVIEWER_ATTESTATION_MISSING');
  }
  if (!record.environment?.freshMachine) blockingFindings.push('FRESH_MACHINE_NOT_CONFIRMED');
  if (!record.timing?.startedAt || !record.timing?.completedAt || !Number.isFinite(Number(record.timing?.durationMinutes))) {
    blockingFindings.push('TIMING_INCOMPLETE');
  }
  if (!Array.isArray(record.evidence) || record.evidence.length === 0) blockingFindings.push('EVIDENCE_MISSING');
  for (const [index, evidence] of (record.evidence ?? []).entries()) {
    if (!evidence || typeof evidence.path !== 'string' || !/^[0-9a-f]{64}$/i.test(String(evidence.sha256 ?? ''))) {
      blockingFindings.push(`INVALID_EVIDENCE_${index + 1}`);
    }
  }
  const passed = blockingFindings.length === 0;
  return Object.freeze({
    schemaVersion: NOVICE_SCHEMA_VERSION,
    testedCommit: record.testedCommit,
    sessionId: record.sessionId,
    passedTasks,
    score: passedTasks,
    helpTasks,
    passed,
    decision: passed ? 'PASSED' : 'NOT_PASSED',
    blockingFindings: Object.freeze([...new Set(blockingFindings)]),
    evaluatedRecordHash: sha256({ ...record, recordHash: undefined })
  });
}

export function buildEvidenceManifest(entries, metadata = {}) {
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new OperatorContractError('At least one evidence entry is required');
  }
  const files = entries.map((entry, index) => {
    requireObject(entry, `entries[${index}]`);
    return Object.freeze({
      path: requireString(entry.path, `entries[${index}].path`),
      sha256: /^[0-9a-f]{64}$/i.test(String(entry.sha256 ?? ''))
        ? String(entry.sha256).toLowerCase()
        : sha256(String(entry.content ?? ''))
    });
  }).sort((left, right) => left.path.localeCompare(right.path));
  const manifest = {
    schemaVersion: OPERATOR_SCHEMA_VERSION,
    type: 'comic-factory-evidence-manifest',
    metadata: canonicalize(metadata),
    files
  };
  return Object.freeze({ ...manifest, manifestHash: sha256(manifest) });
}
