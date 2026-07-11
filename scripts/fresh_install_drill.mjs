import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { access, cp, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { startStaticServer } from './serve_static.mjs';

const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000;

function valueAfter(args, flag, fallback) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : fallback;
}

function hasFlag(args, flag) {
  return args.includes(flag);
}

function nowIso() {
  return new Date().toISOString();
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export function parseMajorVersion(value) {
  const match = String(value).match(/(\d+)/);
  if (!match) throw new Error(`VERSION_UNPARSABLE:${value}`);
  return Number(match[1]);
}

export async function inspectFreshCloneState(cloneDirectory) {
  const paths = {
    rootNodeModules: join(cloneDirectory, 'node_modules'),
    studioNodeModules: join(cloneDirectory, 'studio-app', 'node_modules'),
    studioDist: join(cloneDirectory, 'studio-app', 'dist'),
    rootOutput: join(cloneDirectory, 'output'),
    siteArtifact: join(cloneDirectory, '_site')
  };
  const entries = {};
  for (const [name, path] of Object.entries(paths)) entries[name] = await pathExists(path);
  return entries;
}

export function assertFreshCloneState(state) {
  const stale = Object.entries(state).filter(([, exists]) => exists).map(([name]) => name);
  if (stale.length) throw new Error(`FRESH_CLONE_CONTAMINATED:${stale.join(',')}`);
  return true;
}

async function listFiles(directory) {
  const files = [];
  async function walk(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile()) files.push(path);
    }
  }
  if (await pathExists(directory)) await walk(directory);
  return files.sort();
}

async function sha256(path) {
  const bytes = await readFile(path);
  return createHash('sha256').update(bytes).digest('hex');
}

async function runCommand({ name, command, args = [], cwd, env = process.env, outputDirectory, steps, timeoutMs = DEFAULT_TIMEOUT_MS }) {
  const startedAt = nowIso();
  const startedMs = Date.now();
  const logDirectory = join(outputDirectory, 'logs');
  await mkdir(logDirectory, { recursive: true });
  const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const stdoutPath = join(logDirectory, `${safeName}.stdout.log`);
  const stderrPath = join(logDirectory, `${safeName}.stderr.log`);

  let stdout = '';
  let stderr = '';
  let timedOut = false;

  const code = await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
    });
    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });
    child.once('error', (error) => {
      clearTimeout(timer);
      rejectPromise(error);
    });
    child.once('close', (exitCode) => {
      clearTimeout(timer);
      resolvePromise(exitCode ?? 1);
    });
  });

  await writeFile(stdoutPath, stdout);
  await writeFile(stderrPath, stderr);
  const step = {
    name,
    command: [command, ...args].join(' '),
    cwd,
    startedAt,
    finishedAt: nowIso(),
    durationMs: Date.now() - startedMs,
    status: code === 0 && !timedOut ? 'PASS' : 'FAIL',
    exitCode: code,
    timedOut,
    stdout: relative(outputDirectory, stdoutPath),
    stderr: relative(outputDirectory, stderrPath)
  };
  steps.push(step);
  if (step.status !== 'PASS') throw new Error(`STEP_FAILED:${name}:exit=${code}:timeout=${timedOut}`);
  return { stdout: stdout.trim(), stderr: stderr.trim(), step };
}

async function requireFile(path, code) {
  try {
    const metadata = await stat(path);
    if (!metadata.isFile()) throw new Error(code);
  } catch {
    throw new Error(code);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const sourceDirectory = resolve(valueAfter(args, '--source', process.cwd()));
  const outputDirectory = resolve(valueAfter(args, '--output', join(sourceDirectory, 'output', 'fresh-install')));
  const keepTemporaryClone = hasFlag(args, '--keep-temp');
  const skipBrowserInstall = hasFlag(args, '--skip-browser-install');
  const startedAt = nowIso();
  const steps = [];
  let temporaryRoot = null;
  let serverInstance = null;
  let sourceCommit = null;
  let cloneCommit = null;
  let freshBeforeInstall = null;
  let report = null;

  await mkdir(outputDirectory, { recursive: true });
  await requireFile(join(sourceDirectory, '.git', 'HEAD'), 'SOURCE_NOT_GIT_WORKTREE');
  await requireFile(join(sourceDirectory, 'studio-app', 'package.json'), 'STUDIO_PACKAGE_MISSING');
  await requireFile(join(sourceDirectory, 'studio-app', 'package-lock.json'), 'STUDIO_LOCKFILE_MISSING');

  const nodeVersion = process.version;
  if (parseMajorVersion(nodeVersion) < 20) throw new Error(`NODE_20_REQUIRED:${nodeVersion}`);

  try {
    const gitVersion = await runCommand({
      name: 'git-version', command: 'git', args: ['--version'], cwd: sourceDirectory, outputDirectory, steps
    });
    const npmVersion = await runCommand({
      name: 'npm-version', command: 'npm', args: ['--version'], cwd: sourceDirectory, outputDirectory, steps
    });
    const sourceRevision = await runCommand({
      name: 'source-commit', command: 'git', args: ['rev-parse', 'HEAD'], cwd: sourceDirectory, outputDirectory, steps
    });
    sourceCommit = sourceRevision.stdout;
    if (!/^[0-9a-f]{40}$/.test(sourceCommit)) throw new Error(`SOURCE_COMMIT_INVALID:${sourceCommit}`);

    temporaryRoot = await mkdtemp(join(tmpdir(), 'comic-fresh-install-'));
    const cloneDirectory = join(temporaryRoot, 'repository');
    const siteDirectory = join(temporaryRoot, 'site');
    const proofDirectory = join(outputDirectory, 'proof');

    await runCommand({
      name: 'isolated-clone',
      command: 'git',
      args: ['clone', '--no-checkout', '--no-hardlinks', sourceDirectory, cloneDirectory],
      cwd: sourceDirectory,
      outputDirectory,
      steps
    });
    await runCommand({
      name: 'checkout-exact-commit',
      command: 'git',
      args: ['-C', cloneDirectory, 'checkout', '--detach', sourceCommit],
      cwd: sourceDirectory,
      outputDirectory,
      steps
    });
    const cloneRevision = await runCommand({
      name: 'clone-commit', command: 'git', args: ['-C', cloneDirectory, 'rev-parse', 'HEAD'], cwd: sourceDirectory, outputDirectory, steps
    });
    cloneCommit = cloneRevision.stdout;
    if (cloneCommit !== sourceCommit) throw new Error(`CLONE_COMMIT_MISMATCH:${cloneCommit}:${sourceCommit}`);

    freshBeforeInstall = await inspectFreshCloneState(cloneDirectory);
    assertFreshCloneState(freshBeforeInstall);

    await runCommand({
      name: 'locked-studio-install',
      command: 'npm',
      args: ['--prefix', 'studio-app', 'ci'],
      cwd: cloneDirectory,
      outputDirectory,
      steps
    });

    if (!skipBrowserInstall) {
      const playwrightArgs = ['--prefix', 'studio-app', 'exec', '--', 'playwright', 'install'];
      if (process.platform === 'linux' && process.env.CI === 'true') playwrightArgs.push('--with-deps');
      playwrightArgs.push('chromium');
      await runCommand({
        name: 'playwright-chromium-install',
        command: 'npm',
        args: playwrightArgs,
        cwd: cloneDirectory,
        outputDirectory,
        steps
      });
    }

    await runCommand({
      name: 'studio-build',
      command: 'npm',
      args: ['--prefix', 'studio-app', 'run', 'build'],
      cwd: cloneDirectory,
      outputDirectory,
      steps
    });

    await mkdir(join(siteDirectory, 'studio'), { recursive: true });
    await cp(join(cloneDirectory, 'studio-app', 'dist'), join(siteDirectory, 'studio'), { recursive: true });
    serverInstance = await startStaticServer({ directory: siteDirectory, port: 0 });
    const studioUrl = new URL('studio/', serverInstance.url).href;
    const smokeEnvironment = { ...process.env, GITHUB_SHA: sourceCommit };

    await runCommand({
      name: 'studio-browser-smoke',
      command: 'node',
      args: ['studio-app/tests/browser-smoke.mjs', studioUrl, '--output', join(proofDirectory, 'studio')],
      cwd: cloneDirectory,
      env: smokeEnvironment,
      outputDirectory,
      steps
    });
    await runCommand({
      name: 'academy-browser-smoke',
      command: 'node',
      args: ['studio-app/tests/academy-smoke.mjs', studioUrl, '--output', join(proofDirectory, 'academy')],
      cwd: cloneDirectory,
      env: smokeEnvironment,
      outputDirectory,
      steps
    });
    await runCommand({
      name: 'readiness-browser-smoke',
      command: 'node',
      args: ['studio-app/tests/academy-readiness-smoke.mjs', studioUrl, '--output', join(proofDirectory, 'readiness')],
      cwd: cloneDirectory,
      env: smokeEnvironment,
      outputDirectory,
      steps
    });

    await serverInstance.close();
    serverInstance = null;

    const proofFiles = await listFiles(proofDirectory);
    const proof = [];
    for (const file of proofFiles) {
      proof.push({
        path: relative(outputDirectory, file),
        sizeBytes: (await stat(file)).size,
        sha256: await sha256(file)
      });
    }

    report = {
      schemaVersion: 1,
      status: 'PASS',
      repository: 'Pagebabe/comic',
      trackingIssue: 115,
      sourceDirectory: basename(sourceDirectory),
      sourceCommit,
      cloneCommit,
      exactCommitMatch: cloneCommit === sourceCommit,
      startedAt,
      finishedAt: nowIso(),
      environment: {
        platform: process.platform,
        architecture: process.arch,
        node: nodeVersion,
        npm: npmVersion.stdout,
        git: gitVersion.stdout,
        ci: process.env.CI === 'true'
      },
      freshBeforeInstall,
      steps,
      browserProof: proof,
      boundaries: {
        productionReady: false,
        beginnerReady: false,
        creativeApprovalGranted: false,
        imageGenerationAllowed: false,
        growthOsIntegrated: false,
        observedSecondPersonInstall: false,
        readinessGate: 'PR1_PARTIAL'
      },
      temporaryCloneRetained: keepTemporaryClone,
      temporaryClonePath: keepTemporaryClone ? temporaryRoot : null
    };
  } catch (error) {
    report = {
      schemaVersion: 1,
      status: 'FAIL',
      repository: 'Pagebabe/comic',
      trackingIssue: 115,
      sourceCommit,
      cloneCommit,
      exactCommitMatch: Boolean(sourceCommit && cloneCommit && sourceCommit === cloneCommit),
      startedAt,
      finishedAt: nowIso(),
      freshBeforeInstall,
      steps,
      error: error instanceof Error ? error.message : String(error),
      boundaries: {
        productionReady: false,
        beginnerReady: false,
        creativeApprovalGranted: false,
        imageGenerationAllowed: false,
        growthOsIntegrated: false,
        observedSecondPersonInstall: false,
        readinessGate: 'PR1_PARTIAL'
      },
      temporaryCloneRetained: keepTemporaryClone,
      temporaryClonePath: keepTemporaryClone ? temporaryRoot : null
    };
    process.exitCode = 1;
  } finally {
    if (serverInstance) await serverInstance.close().catch(() => {});
    await writeFile(join(outputDirectory, 'fresh-install-report.json'), `${JSON.stringify(report, null, 2)}\n`);
    if (temporaryRoot && !keepTemporaryClone) await rm(temporaryRoot, { recursive: true, force: true });
    console.log(JSON.stringify({
      status: report?.status || 'FAIL',
      sourceCommit: report?.sourceCommit || null,
      cloneCommit: report?.cloneCommit || null,
      output: join(outputDirectory, 'fresh-install-report.json')
    }));
  }
}

const invokedDirectly = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (invokedDirectly) await main();
