import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const DOCTOR_SCHEMA_VERSION = 1;
export const MIN_NODE_VERSION = Object.freeze([20, 19, 0]);
export const MIN_PYTHON_VERSION = Object.freeze([3, 12, 0]);
export const PROFILES = Object.freeze(['studio', 'browser', 'media', 'all']);

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
export const repositoryRoot = path.resolve(scriptDir, '..');
const studioRoot = path.join(repositoryRoot, 'studio-app');

const trimVersion = (value) => String(value || '')
  .replace(/\u001b\[[0-9;]*m/g, '')
  .split(/\r?\n/)
  .map((line) => line.trim())
  .find(Boolean)
  ?.slice(0, 160) || null;

export function parseVersion(value) {
  const match = String(value || '').match(/(\d+)\.(\d+)(?:\.(\d+))?/);
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3] || 0)];
}

export function versionAtLeast(value, minimum) {
  const parsed = Array.isArray(value) ? value : parseVersion(value);
  if (!parsed) return false;
  for (let index = 0; index < 3; index += 1) {
    if (parsed[index] > minimum[index]) return true;
    if (parsed[index] < minimum[index]) return false;
  }
  return true;
}

export function classifyPlatform(platform, arch) {
  if (platform === 'darwin' && arch === 'arm64') return 'SUPPORTED_PRIMARY';
  if (platform === 'linux' && arch === 'x64') return 'SUPPORTED_PRIMARY';
  if ((platform === 'darwin' && arch === 'x64') || (platform === 'linux' && arch === 'arm64')) return 'SUPPORTED_COMPATIBLE';
  return 'UNSUPPORTED';
}

function commandVersion(command, args = ['--version']) {
  const result = spawnSync(command, args, {
    cwd: repositoryRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 10_000
  });
  return {
    available: result.status === 0,
    version: trimVersion(result.stdout) || trimVersion(result.stderr)
  };
}

function probePlaywright() {
  const packageFile = path.join(studioRoot, 'node_modules', '@playwright', 'test', 'package.json');
  if (!existsSync(packageFile)) return { packageInstalled: false, chromiumInstalled: false, version: null };
  try {
    const requireFromStudio = createRequire(path.join(studioRoot, 'package.json'));
    const packageJson = requireFromStudio('@playwright/test/package.json');
    const { chromium } = requireFromStudio('@playwright/test');
    const executable = chromium.executablePath();
    return {
      packageInstalled: true,
      chromiumInstalled: Boolean(executable && existsSync(executable)),
      version: packageJson.version || null
    };
  } catch {
    return { packageInstalled: true, chromiumInstalled: false, version: null };
  }
}

export function collectEnvironment() {
  const npm = commandVersion('npm');
  const git = commandVersion('git');
  const python = commandVersion('python3');
  const ffmpeg = commandVersion('ffmpeg', ['-version']);
  const espeak = commandVersion('espeak-ng');
  const playwright = probePlaywright();

  return Object.freeze({
    platform: process.platform,
    arch: process.arch,
    platformClass: classifyPlatform(process.platform, process.arch),
    nodeVersion: process.version,
    npm,
    git,
    python,
    ffmpeg,
    espeak,
    files: Object.freeze({
      rootPackage: existsSync(path.join(repositoryRoot, 'package.json')),
      studioPackage: existsSync(path.join(studioRoot, 'package.json')),
      studioLock: existsSync(path.join(studioRoot, 'package-lock.json')),
      studioDependencies: existsSync(path.join(studioRoot, 'node_modules', '.package-lock.json')),
      studioBuild: existsSync(path.join(studioRoot, 'dist', 'index.html'))
    }),
    playwright
  });
}

function makeCheck(id, label, required, passed, observed, remediation) {
  return Object.freeze({
    id,
    label,
    required,
    status: passed ? 'PASS' : required ? 'FAIL' : 'OPTIONAL_MISSING',
    observed: observed ?? null,
    remediation: passed ? null : remediation
  });
}

const profileRequires = (profile, capability) => {
  if (profile === 'all') return true;
  if (capability === 'studio') return ['studio', 'browser', 'media'].includes(profile);
  return profile === capability;
};

export function evaluateEnvironment(environment, profile = 'studio') {
  if (!PROFILES.includes(profile)) throw new Error(`Unsupported doctor profile: ${profile}`);
  const studioRequired = profileRequires(profile, 'studio');
  const browserRequired = profileRequires(profile, 'browser');
  const mediaRequired = profileRequires(profile, 'media');
  const checks = [
    makeCheck('platform', 'Supported operating-system family and architecture', studioRequired, environment.platformClass !== 'UNSUPPORTED', `${environment.platform}/${environment.arch}`, 'Use macOS 14+ on Apple Silicon or Ubuntu 24.04 x64.'),
    makeCheck('node', 'Node.js runtime', studioRequired, versionAtLeast(environment.nodeVersion, MIN_NODE_VERSION), environment.nodeVersion, 'Install Node.js 20.19.0 or newer.'),
    makeCheck('npm', 'npm command', studioRequired, environment.npm.available, environment.npm.version, 'Install npm with the supported Node.js runtime.'),
    makeCheck('git', 'Git command', studioRequired, environment.git.available, environment.git.version, 'Install Git before cloning or updating the repository.'),
    makeCheck('root-package', 'Root package contract', studioRequired, environment.files.rootPackage, environment.files.rootPackage, 'Run the command from the Pagebabe/comic repository root.'),
    makeCheck('studio-package', 'Studio package contract', studioRequired, environment.files.studioPackage, environment.files.studioPackage, 'Restore studio-app/package.json from Git.'),
    makeCheck('studio-lock', 'Locked Studio dependencies', studioRequired, environment.files.studioLock, environment.files.studioLock, 'Restore studio-app/package-lock.json from Git. Do not replace npm ci with npm install.'),
    makeCheck('studio-dependencies', 'Installed Studio dependencies', browserRequired, environment.files.studioDependencies, environment.files.studioDependencies, 'Run npm run bootstrap:first-run.'),
    makeCheck('playwright-package', 'Pinned Playwright package', browserRequired, environment.playwright.packageInstalled, environment.playwright.version, 'Run npm run bootstrap:first-run.'),
    makeCheck('chromium', 'Playwright Chromium browser', browserRequired, environment.playwright.chromiumInstalled, environment.playwright.chromiumInstalled, 'Run npm --prefix studio-app exec -- playwright install chromium.'),
    makeCheck('python', 'Python runtime for recovery and media tools', mediaRequired, environment.python.available && versionAtLeast(environment.python.version, MIN_PYTHON_VERSION), environment.python.version, 'Install Python 3.12 or newer.'),
    makeCheck('ffmpeg', 'FFmpeg media tool', mediaRequired, environment.ffmpeg.available, environment.ffmpeg.version, 'Install FFmpeg. Studio-only work remains available without it.'),
    makeCheck('espeak', 'espeak-ng voice proof tool', mediaRequired, environment.espeak.available, environment.espeak.version, 'Install espeak-ng. Studio-only work remains available without it.')
  ];
  const requiredChecks = checks.filter((check) => check.required);
  return Object.freeze({
    schemaVersion: DOCTOR_SCHEMA_VERSION,
    repository: 'Pagebabe/comic',
    profile,
    status: requiredChecks.every((check) => check.status === 'PASS') ? 'READY' : 'NOT_READY',
    ready: requiredChecks.every((check) => check.status === 'PASS'),
    platform: Object.freeze({ family: environment.platform, architecture: environment.arch, support: environment.platformClass }),
    versions: Object.freeze({
      node: trimVersion(environment.nodeVersion),
      npm: trimVersion(environment.npm.version),
      git: trimVersion(environment.git.version),
      python: trimVersion(environment.python.version),
      ffmpeg: trimVersion(environment.ffmpeg.version),
      espeakNg: trimVersion(environment.espeak.version),
      playwright: trimVersion(environment.playwright.version)
    }),
    checks: Object.freeze(checks),
    boundaries: Object.freeze({
      containsAbsolutePaths: false,
      containsEnvironmentVariables: false,
      containsSecrets: false,
      creativeApprovalGranted: false,
      imageGenerationAllowed: false,
      productionReady: false
    })
  });
}

export async function runDoctor({ profile = 'studio', output = null, environment = null, silent = false } = {}) {
  const report = evaluateEnvironment(environment || collectEnvironment(), profile);
  if (output) {
    const outputPath = path.resolve(repositoryRoot, output);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  }
  if (!silent) {
    console.log(`Comic Factory Doctor · ${profile} · ${report.status}`);
    for (const check of report.checks) {
      const marker = check.status === 'PASS' ? '✓' : check.required ? '✗' : '·';
      console.log(`${marker} ${check.label}: ${check.status}${check.observed == null ? '' : ` · ${check.observed}`}`);
    }
    if (output) console.log(`Report: ${output}`);
  }
  return report;
}

function argumentValue(name, fallback = null) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  const profile = argumentValue('--profile', 'studio');
  const output = argumentValue('--output');
  const jsonOnly = process.argv.includes('--json');
  const report = await runDoctor({ profile, output, silent: jsonOnly });
  if (jsonOnly) console.log(JSON.stringify(report));
  if (!report.ready) process.exitCode = 2;
}
