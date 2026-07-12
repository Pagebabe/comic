import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  canonicalJsonSha256,
  escapeHtml,
  serializeCsv,
  validateMigrationOutput
} from '../scripts/check_legacy_asset_migration_output.mjs';

const root = new URL('../', import.meta.url);
const json = async (path) => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const clone = (value) => structuredClone(value);

const loadInputs = async () => {
  const [contract, mappingContract, inventory, shortlist, oracle] = await Promise.all([
    json('project/legacy-asset-migration-output-contract.json'),
    json('project/legacy-asset-mapping-contract.json'),
    json('tests/fixtures/legacy-asset-migration/asset-recovery-inventory.json'),
    json('tests/fixtures/legacy-asset-migration/analysis/visual-candidate-shortlist.json'),
    json('tests/fixtures/legacy-asset-migration/expected-migration-oracle.json')
  ]);
  return { contract, mappingContract, inventory, shortlist, oracle };
};

const buildValidOutput = ({ contract, mappingContract, inventory, shortlist, oracle }) => {
  const inventoryByPath = new Map(inventory.files.map((record) => [record.absolute_path, record]));
  const records = oracle.expectedRecords
    .map((expected) => {
      const source = inventoryByPath.get(expected.sourcePath);
      return {
        sourcePath: expected.sourcePath,
        sourceSha256: source.sha256,
        assetClass: expected.assetClass,
        sourceExtension: source.extension,
        legacyCharacterId: expected.legacyCharacterId,
        canonicalCharacterId: expected.canonicalCharacterId,
        mappingStatus: expected.mappingStatus,
        reviewStatus: 'REVIEW_REQUIRED',
        duplicateOf: expected.duplicateOf,
        sourceExecuted: false,
        sourceCopied: false,
        sourceImported: false,
        automaticMasterApproval: false
      };
    })
    .sort((left, right) => left.sourcePath.localeCompare(right.sourcePath, 'en', { sensitivity: 'variant' }));
  const exclusions = oracle.expectedExclusions
    .map((expected) => {
      const source = inventoryByPath.get(expected.sourcePath);
      return {
        sourcePath: expected.sourcePath,
        sourceSha256: source.sha256,
        reason: expected.reason,
        reviewStatus: 'REVIEW_REQUIRED',
        sourceExecuted: false,
        sourceCopied: false,
        sourceImported: false,
        automaticMasterApproval: false
      };
    })
    .sort((left, right) => left.sourcePath.localeCompare(right.sourcePath, 'en', { sensitivity: 'variant' }));

  const report = {
    schemaVersion: 1,
    reportId: contract.report.reportId,
    contractId: contract.contractId,
    mappingContractId: mappingContract.contractId,
    inputFingerprintSha256: canonicalJsonSha256({ inventory, shortlist, mappingContract }),
    sourceInventory: {
      path: 'asset-recovery-inventory.json',
      sha256: canonicalJsonSha256(inventory)
    },
    sourceShortlist: {
      path: 'analysis/visual-candidate-shortlist.json',
      sha256: canonicalJsonSha256(shortlist)
    },
    summary: clone(contract.report.fixtureExpectedSummary),
    records,
    exclusions,
    safety: {
      reviewStatus: 'REVIEW_REQUIRED',
      sourceFilesExecuted: 0,
      sourceFilesCopied: 0,
      sourceFilesImported: 0,
      automaticMasterApprovals: 0
    },
    notProven: [...contract.notProven]
  };

  const csvText = serializeCsv(
    contract.csv.header,
    records.map((record) => contract.csv.header.map((field) => record[field]))
  );

  const recordRows = records.map((record) => `<tr><td>${escapeHtml(record.sourcePath)}</td><td>${escapeHtml(record.assetClass)}</td><td>${escapeHtml(record.mappingStatus)}</td><td>REVIEW_REQUIRED</td></tr>`).join('');
  const exclusionRows = exclusions.map((record) => `<tr><td>${escapeHtml(record.sourcePath)}</td><td>${escapeHtml(record.reason)}</td><td>REVIEW_REQUIRED</td></tr>`).join('');
  const htmlText = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${contract.html.requiredCsp}">
<title>Legacy-Asset-Migrationsprüfung</title>
<style>body{font-family:system-ui;margin:2rem}table{border-collapse:collapse;width:100%}td,th{border:1px solid;padding:.35rem;text-align:left}</style>
</head>
<body>
<h1>Legacy-Asset-Migrationsprüfung</h1>
<p>REVIEW_REQUIRED</p>
<p>LEGACY_SUPPORT_UNMAPPED</p>
<p>AUTOMATIC_MASTER_APPROVALS: 0</p>
<ul><li>19 Eingaben</li><li>17 Prüfzeilen</li><li>2 Ausschlüsse</li><li>1 Duplikatgruppe</li></ul>
<h2>Prüfzeilen</h2><table><thead><tr><th>Pfad</th><th>Klasse</th><th>Mapping</th><th>Status</th></tr></thead><tbody>${recordRows}</tbody></table>
<h2>Ausschlüsse</h2><table><thead><tr><th>Pfad</th><th>Grund</th><th>Status</th></tr></thead><tbody>${exclusionRows}</tbody></table>
</body>
</html>
`;

  return { report, csvText, htmlText };
};

test('valid deterministic JSON CSV and HTML outputs satisfy the acceptance contract', async () => {
  const inputs = await loadInputs();
  const output = buildValidOutput(inputs);
  assert.equal(validateMigrationOutput({ ...inputs, ...output }), true);
  assert.equal(output.report.records.length, 17);
  assert.equal(output.report.exclusions.length, 2);
  assert.equal(output.report.safety.automaticMasterApprovals, 0);
});

test('output checker CLI validates a complete output directory', async () => {
  const inputs = await loadInputs();
  const output = buildValidOutput(inputs);
  const directory = await mkdtemp(join(tmpdir(), 'comic-legacy-output-'));
  try {
    await Promise.all([
      writeFile(join(directory, inputs.contract.requiredFiles.json), JSON.stringify(output.report, null, 2) + '\n'),
      writeFile(join(directory, inputs.contract.requiredFiles.csv), output.csvText),
      writeFile(join(directory, inputs.contract.requiredFiles.html), output.htmlText)
    ]);
    const result = spawnSync(
      process.execPath,
      ['scripts/check_legacy_asset_migration_output.mjs', '--output-dir', directory],
      { cwd: new URL('../', import.meta.url), encoding: 'utf8' }
    );
    assert.equal(result.status, 0, result.stderr);
    const summary = JSON.parse(result.stdout);
    assert.equal(summary.status, 'pass');
    assert.equal(summary.includedRecords, 17);
    assert.equal(summary.excludedRecords, 2);
    assert.equal(summary.automaticMasterApprovals, 0);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('tampered input fingerprint is rejected', async () => {
  const inputs = await loadInputs();
  const output = buildValidOutput(inputs);
  output.report.inputFingerprintSha256 = '0'.repeat(64);
  assert.throws(() => validateMigrationOutput({ ...inputs, ...output }), /REPORT_FINGERPRINT/);
});

test('unsorted records are rejected', async () => {
  const inputs = await loadInputs();
  const output = buildValidOutput(inputs);
  output.report.records.reverse();
  assert.throws(() => validateMigrationOutput({ ...inputs, ...output }), /REPORT_RECORD_ORDER/);
});

test('invented canonical mapping is rejected against the oracle', async () => {
  const inputs = await loadInputs();
  const output = buildValidOutput(inputs);
  const sami = output.report.records.find((record) => record.legacyCharacterId === 'char_sami');
  sami.canonicalCharacterId = 'char_jule';
  sami.mappingStatus = 'EXPLICIT_PROJECT_DECISION';
  assert.throws(() => validateMigrationOutput({ ...inputs, ...output }), /REPORT_RECORD_ORACLE_VALUE/);
});

test('automatic master approval is rejected at row and summary level', async () => {
  const inputs = await loadInputs();
  const output = buildValidOutput(inputs);
  output.report.records[0].automaticMasterApproval = true;
  assert.throws(() => validateMigrationOutput({ ...inputs, ...output }), /REPORT_RECORD_AUTO_MASTER/);
});

test('CSV header and row order are bound to the JSON report', async () => {
  const inputs = await loadInputs();
  const output = buildValidOutput(inputs);
  const lines = output.csvText.trimEnd().split('\n');
  [lines[1], lines[2]] = [lines[2], lines[1]];
  output.csvText = lines.join('\n') + '\n';
  assert.throws(() => validateMigrationOutput({ ...inputs, ...output }), /CSV_ROW/);
});

test('CSV with CRLF is rejected', async () => {
  const inputs = await loadInputs();
  const output = buildValidOutput(inputs);
  output.csvText = output.csvText.replaceAll('\n', '\r\n');
  assert.throws(() => validateMigrationOutput({ ...inputs, ...output }), /CSV_LINE_ENDING/);
});

test('HTML with weaker CSP is rejected', async () => {
  const inputs = await loadInputs();
  const output = buildValidOutput(inputs);
  output.htmlText = output.htmlText.replace(inputs.contract.html.requiredCsp, "default-src 'self'");
  assert.throws(() => validateMigrationOutput({ ...inputs, ...output }), /HTML_CSP/);
});

test('HTML scripts and external resources are rejected', async () => {
  const inputs = await loadInputs();
  const scripted = buildValidOutput(inputs);
  scripted.htmlText = scripted.htmlText.replace('</body>', '<script>alert(1)</script></body>');
  assert.throws(() => validateMigrationOutput({ ...inputs, ...scripted }), /HTML_FORBIDDEN_ELEMENT/);

  const linked = buildValidOutput(inputs);
  linked.htmlText = linked.htmlText.replace('</body>', '<a href="https://example.invalid">external</a></body>');
  assert.throws(() => validateMigrationOutput({ ...inputs, ...linked }), /HTML_FORBIDDEN_SCHEME|HTML_CLICKABLE_RESOURCE/);
});

test('HTML must visibly contain every source path', async () => {
  const inputs = await loadInputs();
  const output = buildValidOutput(inputs);
  const path = output.report.records[0].sourcePath;
  output.htmlText = output.htmlText.replace(escapeHtml(path), 'REMOVED_PATH');
  assert.throws(() => validateMigrationOutput({ ...inputs, ...output }), /HTML_SOURCE_PATH/);
});
