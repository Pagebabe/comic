import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CURRENT_FILE = fileURLToPath(import.meta.url);
const DEFAULT_ROOT = path.resolve(path.dirname(CURRENT_FILE), '..');

function requireCondition(condition, message, errors) {
  if (!condition) errors.push(message);
}

export function validateCloudWorkbench(rootDir = DEFAULT_ROOT) {
  const configPath = path.join(rootDir, '.devcontainer', 'devcontainer.json');
  const setupPath = path.join(rootDir, 'scripts', 'cloud_workbench_setup.sh');
  const errors = [];

  requireCondition(fs.existsSync(configPath), '.devcontainer/devcontainer.json fehlt', errors);
  requireCondition(fs.existsSync(setupPath), 'scripts/cloud_workbench_setup.sh fehlt', errors);

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }

  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    throw new Error(`Devcontainer-JSON ist ungültig: ${error.message}`);
  }

  const setup = fs.readFileSync(setupPath, 'utf8');
  const extensions = config?.customizations?.vscode?.extensions ?? [];
  const forbiddenPatterns = [
    /\brm\s+-rf\b/,
    /\bgit\s+reset\s+--hard\b/,
    /\bgit\s+clean\b/,
    /\bgit\s+stash\b/,
    /\bgit\s+push\s+[^\n]*--force\b/,
  ];

  requireCondition(config.name === 'Comic Factory Cloud Workbench', 'falscher Workbench-Name', errors);
  requireCondition(
    typeof config.image === 'string' && config.image.includes('javascript-node') && config.image.includes('22'),
    'Node-22-Devcontainer fehlt',
    errors,
  );
  requireCondition(
    Object.prototype.hasOwnProperty.call(config.features ?? {}, 'ghcr.io/devcontainers/features/github-cli:1'),
    'GitHub-CLI-Feature fehlt',
    errors,
  );
  requireCondition(Array.isArray(config.forwardPorts) && config.forwardPorts.includes(3100), 'Port 3100 fehlt', errors);
  requireCondition(
    config?.portsAttributes?.['3100']?.label === 'Comic Factory Studio',
    'Port 3100 ist nicht als Comic Factory Studio beschriftet',
    errors,
  );
  requireCondition(
    config.postCreateCommand === 'bash scripts/cloud_workbench_setup.sh',
    'deterministischer postCreateCommand fehlt',
    errors,
  );
  requireCondition(config.remoteUser === 'node', 'remoteUser muss node sein', errors);
  requireCondition(extensions.includes('GitHub.vscode-pull-request-github'), 'GitHub-PR-Erweiterung fehlt', errors);

  requireCondition(setup.includes('set -euo pipefail'), 'Setup ist nicht fail-closed', errors);
  requireCondition(setup.includes('npm --prefix studio-app ci'), 'deterministische Studio-Installation fehlt', errors);
  requireCondition(setup.includes('node scripts/check_cloud_workbench.mjs'), 'Selbstprüfung im Setup fehlt', errors);
  requireCondition(setup.includes('npm run build:studio'), 'Studio-Build im Setup fehlt', errors);
  requireCondition(setup.includes('CLOUD_WORKBENCH_READY'), 'eindeutiger Abschlussstatus fehlt', errors);

  for (const pattern of forbiddenPatterns) {
    requireCondition(!pattern.test(setup), `verbotenes destruktives Kommando erkannt: ${pattern}`, errors);
  }

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }

  return {
    status: 'CLOUD_WORKBENCH_CONTRACT_PASS',
    image: config.image,
    remoteUser: config.remoteUser,
    forwardedPorts: config.forwardPorts,
    postCreateCommand: config.postCreateCommand,
    destructiveCommands: 0,
    localMacRequired: false,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === CURRENT_FILE) {
  try {
    console.log(JSON.stringify(validateCloudWorkbench(), null, 2));
  } catch (error) {
    console.error(`CLOUD_WORKBENCH_CONTRACT_FAIL\n${error.message}`);
    process.exitCode = 1;
  }
}
