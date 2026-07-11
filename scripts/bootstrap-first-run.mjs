import { spawnSync } from 'node:child_process';
import { createReadStream, existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { repositoryRoot, runDoctor } from './install-doctor.mjs';

export const BOOTSTRAP_SCHEMA_VERSION = 1;
const studioRoot = path.join(repositoryRoot, 'studio-app');
const defaultReport = 'output/installation/first-run-report.json';

const contentTypes = Object.freeze({
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp'
});

export function buildBootstrapPlan(options = {}) {
  const skipInstall = Boolean(options.skipInstall);
  const skipBrowserInstall = Boolean(options.skipBrowserInstall);
  const skipSmoke = Boolean(options.skipSmoke);
  return Object.freeze([
    Object.freeze({ id: 'doctor-preflight', required: true }),
    ...(!skipInstall ? [Object.freeze({ id: 'studio-npm-ci', required: true })] : []),
    ...(!skipBrowserInstall ? [Object.freeze({ id: 'playwright-chromium', required: true })] : []),
    Object.freeze({ id: 'studio-build', required: true }),
    Object.freeze({ id: 'doctor-browser', required: !skipSmoke }),
    ...(!skipSmoke ? [
      Object.freeze({ id: 'studio-browser-smoke', required: true }),
      Object.freeze({ id: 'academy-browser-smoke', required: true })
    ] : [])
  ]);
}

function runCommand(command, args, label) {
  console.log(`\n[${label}] ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    cwd: repositoryRoot,
    env: { ...process.env, CI: process.env.CI || '1' },
    encoding: 'utf8',
    stdio: 'inherit',
    timeout: 20 * 60 * 1000
  });
  if (result.error) throw new Error(`${label} failed to start: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`${label} failed with exit code ${result.status}`);
  return Object.freeze({ id: label, status: 'PASS' });
}

function safeFile(root, requestUrl) {
  const pathname = decodeURIComponent(String(requestUrl || '/').split('?')[0]);
  const requested = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const candidate = path.resolve(root, requested);
  const relative = path.relative(root, candidate);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
  if (existsSync(candidate)) return candidate;
  const fallback = path.join(root, 'index.html');
  return existsSync(fallback) ? fallback : null;
}

async function startStaticServer(root, port = 4174) {
  const server = createServer((request, response) => {
    const file = safeFile(root, request.url);
    if (!file) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }
    response.writeHead(200, {
      'content-type': contentTypes[path.extname(file)] || 'application/octet-stream',
      'cache-control': 'no-store'
    });
    createReadStream(file).pipe(response);
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  return server;
}

function summarizeDoctor(report) {
  return Object.freeze({
    profile: report.profile,
    status: report.status,
    ready: report.ready,
    platform: report.platform,
    versions: report.versions,
    failedChecks: Object.freeze(report.checks.filter((check) => check.required && check.status !== 'PASS').map((check) => check.id))
  });
}

export async function runBootstrap(options = {}) {
  const reportPath = options.report || defaultReport;
  const steps = [];
  const plan = buildBootstrapPlan(options);
  const preflight = await runDoctor({ profile: 'studio', silent: true });
  steps.push(Object.freeze({ id: 'doctor-preflight', status: preflight.ready ? 'PASS' : 'FAIL' }));
  if (!preflight.ready) throw new Error(`Studio preflight failed: ${preflight.checks.filter((check) => check.required && check.status !== 'PASS').map((check) => check.id).join(', ')}`);

  if (!options.skipInstall) {
    steps.push(runCommand('npm', ['--prefix', 'studio-app', 'ci'], 'studio-npm-ci'));
  }
  if (!options.skipBrowserInstall) {
    steps.push(runCommand('npm', ['--prefix', 'studio-app', 'exec', '--', 'playwright', 'install', 'chromium'], 'playwright-chromium'));
  }
  steps.push(runCommand('npm', ['--prefix', 'studio-app', 'run', 'build'], 'studio-build'));

  const browserDoctor = await runDoctor({ profile: options.skipSmoke ? 'studio' : 'browser', silent: true });
  steps.push(Object.freeze({ id: 'doctor-browser', status: browserDoctor.ready ? 'PASS' : 'FAIL' }));
  if (!browserDoctor.ready) throw new Error(`Browser readiness failed: ${browserDoctor.checks.filter((check) => check.required && check.status !== 'PASS').map((check) => check.id).join(', ')}`);

  if (!options.skipSmoke) {
    const server = await startStaticServer(path.join(studioRoot, 'dist'));
    try {
      steps.push(runCommand(process.execPath, ['studio-app/tests/browser-smoke.mjs', 'http://127.0.0.1:4174/', '--output', 'output/installation/studio-smoke'], 'studio-browser-smoke'));
      steps.push(runCommand(process.execPath, ['studio-app/tests/academy-smoke.mjs', 'http://127.0.0.1:4174/', '--output', 'output/installation/academy-smoke'], 'academy-browser-smoke'));
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  }

  const report = Object.freeze({
    schemaVersion: BOOTSTRAP_SCHEMA_VERSION,
    repository: 'Pagebabe/comic',
    trackingIssue: 111,
    status: 'PASS',
    commit: process.env.GITHUB_SHA || 'local',
    plan,
    steps: Object.freeze(steps),
    preflight: summarizeDoctor(preflight),
    finalDoctor: summarizeDoctor(browserDoctor),
    outputs: Object.freeze({
      studioBuild: 'studio-app/dist',
      studioSmoke: options.skipSmoke ? null : 'output/installation/studio-smoke',
      academySmoke: options.skipSmoke ? null : 'output/installation/academy-smoke'
    }),
    boundaries: Object.freeze({
      cleanInstallUsesNpmCi: !options.skipInstall,
      networkRequiredOnlyForDependencyAndBrowserInstallation: !options.skipInstall || !options.skipBrowserInstall,
      containsSecrets: false,
      containsAbsolutePaths: false,
      creativeApprovalGranted: false,
      imageGenerationAllowed: false,
      productionReady: false,
      beginnerReady: false,
      externalNoviceObservationStillRequired: true
    })
  });

  const absoluteReport = path.resolve(repositoryRoot, reportPath);
  await mkdir(path.dirname(absoluteReport), { recursive: true });
  await writeFile(absoluteReport, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`\nComic Factory First Run · PASS\nReport: ${reportPath}\nStart: npm run start:studio\nURL: http://127.0.0.1:3100/`);
  return report;
}

function argumentValue(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  try {
    await runBootstrap({
      skipInstall: process.argv.includes('--skip-install'),
      skipBrowserInstall: process.argv.includes('--skip-browser-install'),
      skipSmoke: process.argv.includes('--skip-smoke'),
      report: argumentValue('--report', defaultReport)
    });
  } catch (error) {
    const failurePath = path.resolve(repositoryRoot, argumentValue('--report', defaultReport));
    await mkdir(path.dirname(failurePath), { recursive: true });
    const failure = {
      schemaVersion: BOOTSTRAP_SCHEMA_VERSION,
      repository: 'Pagebabe/comic',
      trackingIssue: 111,
      status: 'FAIL',
      error: String(error?.message || error),
      boundaries: {
        containsSecrets: false,
        containsAbsolutePaths: false,
        creativeApprovalGranted: false,
        productionReady: false,
        beginnerReady: false
      }
    };
    await writeFile(failurePath, `${JSON.stringify(failure, null, 2)}\n`, 'utf8');
    console.error(`Comic Factory First Run · FAIL\n${failure.error}\nReport: ${path.relative(repositoryRoot, failurePath)}`);
    process.exitCode = 1;
  }
}
