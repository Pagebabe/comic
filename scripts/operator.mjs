#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  assertAllowedCommand,
  buildDoctorReport,
  buildExecutionReport,
  createNoviceSession,
  evaluateNoviceRecord,
  setupCommandPlan,
  verifyCommandPlan
} from '../lib/operator-readiness.mjs';

const args = process.argv.slice(2);
const command = args.shift();

function readFlag(name, fallback = null) {
  const index = args.indexOf(name);
  if (index < 0) return fallback;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`Missing value for ${name}`);
  return value;
}

function hasFlag(name) {
  return args.includes(name);
}

function ensureParent(path) {
  mkdirSync(dirname(resolve(path)), { recursive: true });
}

function writeJson(path, value) {
  ensureParent(path);
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function capture(program, programArgs = []) {
  const result = spawnSync(program, programArgs, { encoding: 'utf8' });
  return {
    exitCode: Number.isInteger(result.status) ? result.status : 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? String(result.error?.message ?? '')
  };
}

function version(program, programArgs = ['--version']) {
  const result = capture(program, programArgs);
  return result.exitCode === 0 ? (result.stdout || result.stderr).trim().split('\n')[0] : null;
}

function currentCommit() {
  const fromEnvironment = process.env.GITHUB_SHA;
  if (fromEnvironment && /^[0-9a-f]{40}$/i.test(fromEnvironment)) return fromEnvironment.toLowerCase();
  const result = capture('git', ['rev-parse', 'HEAD']);
  if (result.exitCode !== 0 || !/^[0-9a-f]{40}$/i.test(result.stdout.trim())) {
    throw new Error('Unable to resolve a full Git commit SHA. Run from a Git checkout or set GITHUB_SHA.');
  }
  return result.stdout.trim().toLowerCase();
}

function toolAvailable(program, programArgs = ['--version']) {
  return capture(program, programArgs).exitCode === 0;
}

function executePlan(plan) {
  return plan.map((rawCommand) => {
    const allowed = assertAllowedCommand(rawCommand);
    const [program, ...programArgs] = allowed;
    const result = capture(program, programArgs);
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    return result;
  });
}

function runDoctor() {
  const profile = readFlag('--profile', 'studio');
  const output = readFlag('--output', 'output/operator/doctor-report.json');
  const report = buildDoctorReport({
    profile,
    commit: currentCommit(),
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    npmVersion: version('npm'),
    pythonVersion: version('python3'),
    ffmpegAvailable: toolAvailable('ffmpeg', ['-version']),
    espeakAvailable: toolAvailable('espeak-ng', ['--version']),
    generatedAt: new Date().toISOString()
  });
  writeJson(output, report);
  console.log(JSON.stringify({ status: report.ready ? 'pass' : 'fail', output, reportHash: report.reportHash }));
  if (!report.ready) process.exitCode = 1;
}

function runExecution(type) {
  const profile = readFlag('--profile', 'studio');
  const execute = hasFlag('--execute');
  const defaultOutput = type === 'setup'
    ? 'output/operator/setup-report.json'
    : 'output/operator/verify-report.json';
  const output = readFlag('--output', defaultOutput);
  const plan = type === 'setup' ? setupCommandPlan(profile) : verifyCommandPlan();
  if (!execute) {
    const preview = {
      schemaVersion: 1,
      type: `comic-factory-${type}-plan`,
      testedCommit: currentCommit(),
      profile,
      executeRequired: true,
      commandPlan: plan,
      mutatedWorkspace: false
    };
    writeJson(output, preview);
    console.log(JSON.stringify({ status: 'plan-only', output, commandCount: plan.length }));
    return;
  }
  const results = executePlan(plan);
  const report = buildExecutionReport({
    type: `comic-factory-${type}-execution`,
    commit: currentCommit(),
    profile,
    plan,
    results,
    generatedAt: new Date().toISOString()
  });
  writeJson(output, report);
  console.log(JSON.stringify({ status: report.passed ? 'pass' : 'fail', output, reportHash: report.reportHash }));
  if (!report.passed) process.exitCode = 1;
}

function runNoviceSession() {
  const templatePath = readFlag('--template', 'project/novice-acceptance-template.json');
  const outputDir = readFlag('--output-dir', 'output/novice-acceptance');
  const participantCode = readFlag('--participant');
  const observerCode = readFlag('--observer');
  const reviewerCode = readFlag('--reviewer');
  const operatingSystem = readFlag('--os');
  const browser = readFlag('--browser');
  const device = readFlag('--device');
  const route = readFlag('--route', 'https://pagebabe.github.io/comic/');
  const freshMachine = readFlag('--fresh-machine', 'true') === 'true';
  const createdAt = new Date().toISOString();
  const sessionId = readFlag('--session-id', `novice-${createdAt.replace(/[:.]/g, '-')}`);
  const template = JSON.parse(readFileSync(templatePath, 'utf8'));
  const record = createNoviceSession({
    template,
    commit: currentCommit(),
    participant: { code: participantCode, actorType: 'HUMAN', projectContributor: false, priorProjectKnowledge: false },
    observer: { code: observerCode, actorType: 'HUMAN', projectContributor: false, priorProjectKnowledge: false },
    reviewer: { code: reviewerCode, actorType: 'HUMAN', projectContributor: false, priorProjectKnowledge: false },
    environment: { operatingSystem, browser, device, freshMachine, route },
    sessionId,
    createdAt
  });
  const recordPath = resolve(outputDir, sessionId, 'record.json');
  writeJson(recordPath, record);
  const guidePath = resolve(outputDir, sessionId, 'observer-guide.md');
  ensureParent(guidePath);
  writeFileSync(guidePath, [
    '# Comic Factory · Beobachterleitfaden',
    '',
    `Session: \`${sessionId}\``,
    `Commit: \`${record.testedCommit}\``,
    '',
    '- Nicht helfen, außer Sicherheit oder Datenverlust drohen.',
    '- Jede Hilfe im Record dokumentieren.',
    '- Keine Aufgabe als bestanden markieren, die nur nach Erklärung gelöst wurde.',
    '- Screenshots oder Videoausschnitte hashen und unter `evidence` eintragen.',
    '- Beobachter und Gegenprüfer müssen verschiedene Menschen sein.',
    '- Eine KI darf das Protokoll vorbereiten, aber nicht attestieren.',
    '',
    'Nach dem Lauf: `npm run novice:validate -- --record <pfad-zur-record.json>`'
  ].join('\n'), 'utf8');
  console.log(JSON.stringify({ status: 'ready-for-observation', recordPath, guidePath, recordHash: record.recordHash }));
}

function runNoviceValidate() {
  const recordPath = readFlag('--record');
  if (!recordPath) throw new Error('--record is required');
  const output = readFlag('--output', resolve(dirname(recordPath), 'evaluation.json'));
  const record = JSON.parse(readFileSync(recordPath, 'utf8'));
  const evaluation = evaluateNoviceRecord(record);
  writeJson(output, evaluation);
  console.log(JSON.stringify({ status: evaluation.passed ? 'pass' : 'fail', output, decision: evaluation.decision }));
  if (!evaluation.passed) process.exitCode = 1;
}

try {
  if (command === 'doctor') runDoctor();
  else if (command === 'setup') runExecution('setup');
  else if (command === 'verify') runExecution('verify');
  else if (command === 'novice-session') runNoviceSession();
  else if (command === 'novice-validate') runNoviceValidate();
  else {
    console.error([
      'Comic Factory Operator',
      '',
      'Commands:',
      '  doctor          read-only environment check',
      '  setup           print plan; add --execute to run allowlisted setup',
      '  verify          print plan; add --execute to run allowlisted verification',
      '  novice-session  create a human observation package',
      '  novice-validate validate a completed human observation record'
    ].join('\n'));
    process.exitCode = 2;
  }
} catch (error) {
  console.error(JSON.stringify({ status: 'error', name: error.name, message: error.message, details: error.details ?? null }));
  process.exitCode = 1;
}
