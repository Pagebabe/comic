import { createHash } from 'node:crypto';

export const OPERATOR_SCHEMA_VERSION = 1;
export const DOCTOR_STATUSES = Object.freeze(['PASS', 'WARN', 'BLOCKED']);
export const DRILL_SEVERITIES = Object.freeze(['WARN', 'BLOCKED']);

export class OperatorReadinessError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'OperatorReadinessError';
    this.details = details;
  }
}

const requireObject = (value, field) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new OperatorReadinessError(`Invalid object: ${field}`, { field });
  }
  return value;
};

const requireString = (value, field) => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new OperatorReadinessError(`Invalid string: ${field}`, { field, value });
  }
  return value.trim();
};

const requireBoolean = (value, field) => {
  if (typeof value !== 'boolean') {
    throw new OperatorReadinessError(`Invalid boolean: ${field}`, { field, value });
  }
  return value;
};

const requireArray = (value, field) => {
  if (!Array.isArray(value)) throw new OperatorReadinessError(`Invalid array: ${field}`, { field });
  return value;
};

const uniqueIds = (items, field) => {
  const ids = new Set();
  for (const [index, item] of items.entries()) {
    const id = requireString(item.id, `${field}[${index}].id`);
    if (ids.has(id)) throw new OperatorReadinessError(`Duplicate id in ${field}`, { id });
    ids.add(id);
  }
};

const canonicalize = (value) => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
};

export const canonicalJson = (value) => JSON.stringify(canonicalize(value));
export const sha256 = (value) => createHash('sha256').update(typeof value === 'string' ? value : canonicalJson(value)).digest('hex');

export const parseVersion = (value) => {
  if (typeof value !== 'string') return null;
  const match = value.match(/(?:^|\s|v)(\d+)(?:\.(\d+))?(?:\.(\d+))?/i);
  if (!match) return null;
  return Object.freeze({
    major: Number(match[1]),
    minor: Number(match[2] ?? 0),
    patch: Number(match[3] ?? 0),
    raw: value.trim()
  });
};

export const versionAtLeast = (actual, minimum) => {
  if (!minimum) return true;
  if (!actual) return false;
  for (const key of ['major', 'minor', 'patch']) {
    const left = Number(actual[key] ?? 0);
    const right = Number(minimum[key] ?? 0);
    if (left > right) return true;
    if (left < right) return false;
  }
  return true;
};

export function validateEnvironmentManifest(input) {
  const manifest = requireObject(input, 'manifest');
  if (manifest.schemaVersion !== OPERATOR_SCHEMA_VERSION) {
    throw new OperatorReadinessError(`Environment schemaVersion must be ${OPERATOR_SCHEMA_VERSION}`);
  }
  const platforms = requireArray(manifest.supportedPlatforms, 'supportedPlatforms').map((platform, index) => {
    const item = requireObject(platform, `supportedPlatforms[${index}]`);
    return Object.freeze({
      id: requireString(item.id, `supportedPlatforms[${index}].id`),
      label: requireString(item.label, `supportedPlatforms[${index}].label`)
    });
  });
  const commands = requireArray(manifest.commands, 'commands').map((command, index) => {
    const item = requireObject(command, `commands[${index}]`);
    const minimum = item.minimum == null ? null : {
      major: Number(item.minimum.major ?? 0),
      minor: Number(item.minimum.minor ?? 0),
      patch: Number(item.minimum.patch ?? 0)
    };
    if (minimum && Object.values(minimum).some((part) => !Number.isInteger(part) || part < 0)) {
      throw new OperatorReadinessError('Invalid minimum version', { command: item.id });
    }
    return Object.freeze({
      id: requireString(item.id, `commands[${index}].id`),
      executable: requireString(item.executable, `commands[${index}].executable`),
      args: Object.freeze(requireArray(item.args, `commands[${index}].args`).map((arg) => String(arg))),
      required: requireBoolean(item.required, `commands[${index}].required`),
      minimum: minimum ? Object.freeze(minimum) : null,
      purpose: requireString(item.purpose, `commands[${index}].purpose`)
    });
  });
  const files = requireArray(manifest.files, 'files').map((file, index) => {
    const item = requireObject(file, `files[${index}]`);
    const kind = requireString(item.kind, `files[${index}].kind`);
    if (!['json', 'text', 'lockfile'].includes(kind)) {
      throw new OperatorReadinessError('Unsupported file kind', { kind, path: item.path });
    }
    return Object.freeze({
      id: requireString(item.id, `files[${index}].id`),
      path: requireString(item.path, `files[${index}].path`),
      required: requireBoolean(item.required, `files[${index}].required`),
      kind,
      purpose: requireString(item.purpose, `files[${index}].purpose`)
    });
  });
  uniqueIds(platforms, 'supportedPlatforms');
  uniqueIds(commands, 'commands');
  uniqueIds(files, 'files');
  return Object.freeze({
    schemaVersion: OPERATOR_SCHEMA_VERSION,
    id: requireString(manifest.id, 'id'),
    mode: requireString(manifest.mode, 'mode'),
    supportedPlatforms: Object.freeze(platforms),
    commands: Object.freeze(commands),
    files: Object.freeze(files),
    forbiddenActions: Object.freeze(requireArray(manifest.forbiddenActions, 'forbiddenActions').map((entry) => requireString(entry, 'forbiddenActions[]'))),
    notProven: Object.freeze(requireArray(manifest.notProven, 'notProven').map((entry) => requireString(entry, 'notProven[]')))
  });
}

const statusRank = Object.freeze({ PASS: 0, WARN: 1, BLOCKED: 2 });

const makeCheck = ({ id, category, status, message, evidence = null, nextAction = null }) => Object.freeze({
  id,
  category,
  status,
  message,
  evidence,
  nextAction
});

export function evaluateDoctor({ manifest: rawManifest, observations: rawObservations, generatedAt, cwd, gitCommit }) {
  const manifest = validateEnvironmentManifest(rawManifest);
  const observations = requireObject(rawObservations, 'observations');
  const platform = requireObject(observations.platform, 'observations.platform');
  const platformId = `${requireString(platform.os, 'platform.os')}-${requireString(platform.arch, 'platform.arch')}`;
  const checks = [];
  const supported = manifest.supportedPlatforms.some((item) => item.id === platformId);
  checks.push(makeCheck({
    id: 'platform',
    category: 'environment',
    status: supported ? 'PASS' : 'BLOCKED',
    message: supported ? `Supported platform: ${platformId}` : `Unsupported platform: ${platformId}`,
    evidence: platformId,
    nextAction: supported ? null : 'Use a documented supported machine or add a separately reviewed platform contract.'
  }));

  const commandObservations = requireObject(observations.commands, 'observations.commands');
  for (const command of manifest.commands) {
    const observed = commandObservations[command.id] ?? { available: false, version: null };
    const available = observed.available === true;
    const parsed = available ? parseVersion(observed.version ?? '') : null;
    const minimumSatisfied = available && versionAtLeast(parsed, command.minimum);
    let status = 'PASS';
    let message = `${command.id} available`;
    let nextAction = null;
    if (!available) {
      status = command.required ? 'BLOCKED' : 'WARN';
      message = `${command.id} is not available`;
      nextAction = `Install ${command.id} manually using the documented platform instructions, then rerun the doctor.`;
    } else if (!minimumSatisfied) {
      status = command.required ? 'BLOCKED' : 'WARN';
      message = `${command.id} version is below the required minimum`;
      nextAction = `Upgrade ${command.id} manually, then rerun the doctor.`;
    }
    checks.push(makeCheck({
      id: `command:${command.id}`,
      category: 'command',
      status,
      message,
      evidence: available ? { version: observed.version, minimum: command.minimum } : null,
      nextAction
    }));
  }

  const fileObservations = requireObject(observations.files, 'observations.files');
  for (const file of manifest.files) {
    const observed = fileObservations[file.path] ?? { exists: false, valid: false };
    let status = 'PASS';
    let message = `${file.path} present`;
    let nextAction = null;
    if (observed.exists !== true) {
      status = file.required ? 'BLOCKED' : 'WARN';
      message = `${file.path} is missing`;
      nextAction = 'Restore the file from the exact repository commit. Do not recreate authoritative contracts from memory.';
    } else if (file.kind === 'json' && observed.valid !== true) {
      status = 'BLOCKED';
      message = `${file.path} is not valid JSON`;
      nextAction = 'Restore or repair the JSON on an isolated branch and run the full contract suite.';
    }
    checks.push(makeCheck({
      id: `file:${file.id}`,
      category: 'file',
      status,
      message,
      evidence: observed.exists ? { sha256: observed.sha256 ?? null, valid: observed.valid ?? null } : null,
      nextAction
    }));
  }

  const highest = checks.reduce((rank, check) => Math.max(rank, statusRank[check.status]), 0);
  const status = DOCTOR_STATUSES.find((candidate) => statusRank[candidate] === highest) ?? 'BLOCKED';
  const blockers = checks.filter((check) => check.status === 'BLOCKED');
  const warnings = checks.filter((check) => check.status === 'WARN');
  const core = Object.freeze({
    schemaVersion: OPERATOR_SCHEMA_VERSION,
    manifestId: manifest.id,
    mode: manifest.mode,
    platform: platformId,
    cwd: requireString(cwd, 'cwd'),
    gitCommit: requireString(gitCommit, 'gitCommit'),
    status,
    checks: Object.freeze(checks),
    blockers: Object.freeze(blockers.map((check) => check.id)),
    warnings: Object.freeze(warnings.map((check) => check.id)),
    nextActions: Object.freeze(checks.filter((check) => check.nextAction).map((check) => check.nextAction)),
    forbiddenActions: manifest.forbiddenActions,
    notProven: manifest.notProven
  });
  return Object.freeze({
    ...core,
    generatedAt: requireString(generatedAt, 'generatedAt'),
    evidenceHash: sha256(core)
  });
}

export function validateDrillManifest(input) {
  const manifest = requireObject(input, 'drillManifest');
  if (manifest.schemaVersion !== OPERATOR_SCHEMA_VERSION) {
    throw new OperatorReadinessError(`Drill schemaVersion must be ${OPERATOR_SCHEMA_VERSION}`);
  }
  const scenarios = requireArray(manifest.scenarios, 'scenarios').map((scenario, index) => {
    const item = requireObject(scenario, `scenarios[${index}]`);
    const severity = requireString(item.expectedSeverity, `scenarios[${index}].expectedSeverity`);
    if (!DRILL_SEVERITIES.includes(severity)) throw new OperatorReadinessError('Unsupported drill severity', { severity });
    const kind = requireString(item.kind, `scenarios[${index}].kind`);
    if (!['missing_required_file', 'invalid_json', 'commit_mismatch', 'restore_source_equals_target', 'optional_tool_missing'].includes(kind)) {
      throw new OperatorReadinessError('Unsupported drill kind', { kind });
    }
    return Object.freeze({
      id: requireString(item.id, `scenarios[${index}].id`),
      kind,
      expectedFinding: requireString(item.expectedFinding, `scenarios[${index}].expectedFinding`),
      expectedSeverity: severity,
      guidance: requireString(item.guidance, `scenarios[${index}].guidance`)
    });
  });
  uniqueIds(scenarios, 'scenarios');
  return Object.freeze({
    schemaVersion: OPERATOR_SCHEMA_VERSION,
    id: requireString(manifest.id, 'id'),
    mode: requireString(manifest.mode, 'mode'),
    scenarios: Object.freeze(scenarios),
    notProven: Object.freeze(requireArray(manifest.notProven, 'notProven').map((entry) => requireString(entry, 'notProven[]')))
  });
}

export function inspectRecoveryCase(scenario, fixture) {
  const item = requireObject(scenario, 'scenario');
  const data = requireObject(fixture, 'fixture');
  let finding = 'NO_FINDING';
  let severity = 'WARN';
  switch (item.kind) {
    case 'missing_required_file':
      if (data.requiredFileExists !== true) {
        finding = 'MISSING_REQUIRED_FILE';
        severity = 'BLOCKED';
      }
      break;
    case 'invalid_json':
      try {
        JSON.parse(String(data.jsonText ?? ''));
      } catch {
        finding = 'INVALID_JSON';
        severity = 'BLOCKED';
      }
      break;
    case 'commit_mismatch':
      if (data.expectedCommit !== data.actualCommit) {
        finding = 'COMMIT_MISMATCH';
        severity = 'BLOCKED';
      }
      break;
    case 'restore_source_equals_target':
      if (data.restoreSource === data.restoreTarget) {
        finding = 'RESTORE_SOURCE_EQUALS_TARGET';
        severity = 'BLOCKED';
      }
      break;
    case 'optional_tool_missing':
      if (data.optionalToolAvailable !== true) {
        finding = 'OPTIONAL_TOOL_MISSING';
        severity = 'WARN';
      }
      break;
    default:
      throw new OperatorReadinessError('Unsupported recovery case', { kind: item.kind });
  }
  return Object.freeze({
    scenarioId: item.id,
    finding,
    severity,
    drillStatus: finding === item.expectedFinding && severity === item.expectedSeverity ? 'PASS' : 'FAIL',
    expectedFinding: item.expectedFinding,
    expectedSeverity: item.expectedSeverity,
    guidance: item.guidance
  });
}
