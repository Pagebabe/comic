import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = new URL('../', import.meta.url);
const sha256Pattern = /^[a-f0-9]{64}$/;

const fail = (code, detail = '') => {
  throw new Error(`[LEGACY_MIGRATION_OUTPUT:${code}]${detail ? ` ${detail}` : ''}`);
};
const assert = (condition, code, detail = '') => {
  if (!condition) fail(code, detail);
};
const sorted = (items) => [...items].sort((left, right) => left.localeCompare(right, 'en', { sensitivity: 'variant' }));

export const sha256Text = (value) => createHash('sha256').update(value, 'utf8').digest('hex');

export function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}

export const canonicalJsonSha256 = (value) => sha256Text(stableStringify(value));

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function serializeCsv(header, rows) {
  const encode = (value) => {
    if (value === null || value === undefined) return '';
    const text = typeof value === 'boolean' ? String(value) : String(value);
    if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
    return text;
  };
  return [header, ...rows]
    .map((row) => row.map(encode).join(','))
    .join('\n') + '\n';
}

export function parseCsv(text) {
  assert(!text.includes('\r'), 'CSV_LINE_ENDING');
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += character;
      }
      continue;
    }
    if (character === '"') {
      assert(field.length === 0, 'CSV_QUOTE_POSITION');
      quoted = true;
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }
  assert(!quoted, 'CSV_UNCLOSED_QUOTE');
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  if (rows.at(-1)?.length === 1 && rows.at(-1)[0] === '') rows.pop();
  return rows;
}

const assertExactKeys = (value, required, code, detail = '') => {
  assert(value && typeof value === 'object' && !Array.isArray(value), code, detail);
  const missing = required.filter((key) => !Object.hasOwn(value, key));
  assert(missing.length === 0, code, `${detail} missing: ${missing.join(', ')}`);
};

const normalizeCsvValue = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return String(value);
  return String(value);
};

export function validateOutputContract(contract, mappingContract) {
  assert(contract?.schemaVersion === 1, 'CONTRACT_SCHEMA');
  assert(contract.contractId === 'legacy-asset-migration-output-v1', 'CONTRACT_ID');
  assert(contract.repository === 'Pagebabe/comic', 'CONTRACT_REPOSITORY');
  assert(contract.trackingIssue === 125, 'CONTRACT_TRACKING_ISSUE');
  assert(contract.status === 'OUTPUT_CONTRACT_DEFINED_REVIEW_REQUIRED', 'CONTRACT_STATUS');
  assert(contract.requiredFiles?.json === 'legacy-asset-migration-report.json', 'CONTRACT_JSON_FILE');
  assert(contract.requiredFiles?.csv === 'legacy-asset-migration-review.csv', 'CONTRACT_CSV_FILE');
  assert(contract.requiredFiles?.html === 'legacy-asset-migration-review.html', 'CONTRACT_HTML_FILE');
  assert(contract.report?.reportId === 'legacy-asset-migration-report-v1', 'CONTRACT_REPORT_ID');
  assert(contract.csv?.lineEnding === 'LF', 'CONTRACT_CSV_LINE_ENDING');
  assert(contract.html?.language === 'de', 'CONTRACT_HTML_LANGUAGE');
  assert(contract.safety?.reviewStatus === 'REVIEW_REQUIRED', 'CONTRACT_REVIEW_STATUS');
  assert(contract.safety?.sourceExecuted === false, 'CONTRACT_SOURCE_EXECUTION');
  assert(contract.safety?.sourceCopied === false, 'CONTRACT_SOURCE_COPY');
  assert(contract.safety?.sourceImported === false, 'CONTRACT_SOURCE_IMPORT');
  assert(contract.safety?.automaticMasterApproval === false, 'CONTRACT_AUTO_MASTER');
  assert(contract.safety?.automaticMasterApprovals === 0, 'CONTRACT_AUTO_MASTER_COUNT');
  assert(contract.safety?.outputMayContainSourceBytes === false, 'CONTRACT_SOURCE_BYTES');
  assert(contract.safety?.outputMayContainBase64Media === false, 'CONTRACT_BASE64');
  assert(contract.safety?.outputMayContainClickableFileLinks === false, 'CONTRACT_FILE_LINKS');
  assert(contract.safety?.outputMayMutateSourceAssets === false, 'CONTRACT_SOURCE_MUTATION');
  assert(mappingContract?.contractId === 'legacy-asset-mapping-v1', 'MAPPING_CONTRACT_ID');
  return true;
}

const validateSafetyRow = (row, code, path) => {
  assert(row.reviewStatus === 'REVIEW_REQUIRED', `${code}_REVIEW_STATUS`, path);
  assert(row.sourceExecuted === false, `${code}_EXECUTED`, path);
  assert(row.sourceCopied === false, `${code}_COPIED`, path);
  assert(row.sourceImported === false, `${code}_IMPORTED`, path);
  assert(row.automaticMasterApproval === false, `${code}_AUTO_MASTER`, path);
};

export function validateMigrationOutput({
  contract,
  mappingContract,
  inventory,
  shortlist,
  oracle,
  report,
  csvText,
  htmlText
}) {
  validateOutputContract(contract, mappingContract);

  const inventoryByPath = new Map((inventory.files || []).map((record) => [record.absolute_path, record]));
  const oracleRecords = new Map((oracle.expectedRecords || []).map((record) => [record.sourcePath, record]));
  const oracleExclusions = new Map((oracle.expectedExclusions || []).map((record) => [record.sourcePath, record]));

  assertExactKeys(report, contract.report.requiredTopLevelFields, 'REPORT_FIELDS');
  assert(report.schemaVersion === contract.report.schemaVersion, 'REPORT_SCHEMA');
  assert(report.reportId === contract.report.reportId, 'REPORT_ID');
  assert(report.contractId === contract.contractId, 'REPORT_CONTRACT_ID');
  assert(report.mappingContractId === mappingContract.contractId, 'REPORT_MAPPING_CONTRACT_ID');
  assert(sha256Pattern.test(report.inputFingerprintSha256), 'REPORT_FINGERPRINT_FORMAT');

  const expectedFingerprint = canonicalJsonSha256({ inventory, shortlist, mappingContract });
  assert(report.inputFingerprintSha256 === expectedFingerprint, 'REPORT_FINGERPRINT');

  assert(report.sourceInventory?.path === 'asset-recovery-inventory.json', 'REPORT_INVENTORY_PATH');
  assert(report.sourceInventory?.sha256 === canonicalJsonSha256(inventory), 'REPORT_INVENTORY_SHA');
  assert(report.sourceShortlist?.path === 'analysis/visual-candidate-shortlist.json', 'REPORT_SHORTLIST_PATH');
  assert(report.sourceShortlist?.sha256 === canonicalJsonSha256(shortlist), 'REPORT_SHORTLIST_SHA');

  const expectedSummary = contract.report.fixtureExpectedSummary;
  for (const [key, expected] of Object.entries(expectedSummary)) {
    assert(report.summary?.[key] === expected, 'REPORT_SUMMARY', `${key}: expected ${expected}, got ${report.summary?.[key]}`);
  }
  assert(report.summary.inputRecords === inventory.files.length, 'REPORT_INPUT_COUNT');
  assert(report.summary.includedRecords === oracle.expectedRecords.length, 'REPORT_INCLUDED_COUNT');
  assert(report.summary.excludedRecords === oracle.expectedExclusions.length, 'REPORT_EXCLUDED_COUNT');

  assert(Array.isArray(report.records), 'REPORT_RECORDS');
  assert(Array.isArray(report.exclusions), 'REPORT_EXCLUSIONS');
  assert(report.records.length === oracle.expectedRecords.length, 'REPORT_RECORD_COUNT');
  assert(report.exclusions.length === oracle.expectedExclusions.length, 'REPORT_EXCLUSION_COUNT');

  const recordPaths = report.records.map((record) => record.sourcePath);
  const exclusionPaths = report.exclusions.map((record) => record.sourcePath);
  assert(JSON.stringify(recordPaths) === JSON.stringify(sorted(recordPaths)), 'REPORT_RECORD_ORDER');
  assert(JSON.stringify(exclusionPaths) === JSON.stringify(sorted(exclusionPaths)), 'REPORT_EXCLUSION_ORDER');
  assert(new Set([...recordPaths, ...exclusionPaths]).size === inventory.files.length, 'REPORT_PATH_UNIQUENESS');
  assert(JSON.stringify(sorted([...recordPaths, ...exclusionPaths])) === JSON.stringify(sorted([...inventoryByPath.keys()])), 'REPORT_PATH_PARTITION');

  for (const record of report.records) {
    assertExactKeys(record, contract.report.requiredRecordFields, 'REPORT_RECORD_FIELDS', record.sourcePath);
    const source = inventoryByPath.get(record.sourcePath);
    const expected = oracleRecords.get(record.sourcePath);
    assert(source, 'REPORT_RECORD_SOURCE', record.sourcePath);
    assert(expected, 'REPORT_RECORD_ORACLE', record.sourcePath);
    assert(record.sourceSha256 === source.sha256, 'REPORT_RECORD_SHA', record.sourcePath);
    assert(record.sourceExtension === source.extension, 'REPORT_RECORD_EXTENSION', record.sourcePath);
    for (const key of ['assetClass', 'legacyCharacterId', 'canonicalCharacterId', 'mappingStatus', 'duplicateOf']) {
      assert(record[key] === expected[key], 'REPORT_RECORD_ORACLE_VALUE', `${record.sourcePath} ${key}`);
    }
    assert(mappingContract.assetClasses.some((assetClass) => assetClass.id === record.assetClass), 'REPORT_RECORD_CLASS', record.sourcePath);
    validateSafetyRow(record, 'REPORT_RECORD', record.sourcePath);
  }

  for (const exclusion of report.exclusions) {
    assertExactKeys(exclusion, contract.report.requiredExclusionFields, 'REPORT_EXCLUSION_FIELDS', exclusion.sourcePath);
    const source = inventoryByPath.get(exclusion.sourcePath);
    const expected = oracleExclusions.get(exclusion.sourcePath);
    assert(source, 'REPORT_EXCLUSION_SOURCE', exclusion.sourcePath);
    assert(expected, 'REPORT_EXCLUSION_ORACLE', exclusion.sourcePath);
    assert(exclusion.sourceSha256 === source.sha256, 'REPORT_EXCLUSION_SHA', exclusion.sourcePath);
    assert(exclusion.reason === expected.reason, 'REPORT_EXCLUSION_REASON', exclusion.sourcePath);
    validateSafetyRow(exclusion, 'REPORT_EXCLUSION', exclusion.sourcePath);
  }

  assert(report.safety?.reviewStatus === 'REVIEW_REQUIRED', 'REPORT_SAFETY_REVIEW');
  assert(report.safety?.sourceFilesExecuted === 0, 'REPORT_SAFETY_EXECUTED');
  assert(report.safety?.sourceFilesCopied === 0, 'REPORT_SAFETY_COPIED');
  assert(report.safety?.sourceFilesImported === 0, 'REPORT_SAFETY_IMPORTED');
  assert(report.safety?.automaticMasterApprovals === 0, 'REPORT_SAFETY_AUTO_MASTER');
  assert(Array.isArray(report.notProven), 'REPORT_NOT_PROVEN');
  for (const statement of contract.notProven) assert(report.notProven.includes(statement), 'REPORT_NOT_PROVEN_ITEM', statement);

  const reportText = JSON.stringify(report);
  for (const forbidden of ['APPROVED_MASTER', 'APPROVED_CANON']) {
    assert(!reportText.includes(forbidden), 'REPORT_FORBIDDEN_CLAIM', forbidden);
  }

  const csvRows = parseCsv(csvText);
  assert(csvRows.length > 0, 'CSV_EMPTY');
  const [header, ...dataRows] = csvRows;
  assert(JSON.stringify(header) === JSON.stringify(contract.csv.header), 'CSV_HEADER');
  assert(dataRows.length === report.records.length, 'CSV_ROW_COUNT');
  for (let index = 0; index < report.records.length; index += 1) {
    const expectedRow = contract.csv.header.map((field) => normalizeCsvValue(report.records[index][field]));
    assert(JSON.stringify(dataRows[index]) === JSON.stringify(expectedRow), 'CSV_ROW', `row ${index + 2}`);
  }
  assert(csvText.endsWith('\n'), 'CSV_FINAL_LF');
  assert(!csvText.includes('APPROVED_MASTER') && !csvText.includes('APPROVED_CANON'), 'CSV_FORBIDDEN_CLAIM');

  assert(/^<!doctype html>/i.test(htmlText.trimStart()), 'HTML_DOCTYPE');
  assert(/<html\s+[^>]*lang=["']de["']/i.test(htmlText), 'HTML_LANGUAGE');
  const csp = contract.html.requiredCsp;
  const cspPattern = new RegExp(`<meta\\s+[^>]*http-equiv=["']Content-Security-Policy["'][^>]*content=["']${csp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`, 'i');
  assert(cspPattern.test(htmlText), 'HTML_CSP');

  for (const element of contract.html.forbiddenElements) {
    assert(!new RegExp(`<\\s*${element}\\b`, 'i').test(htmlText), 'HTML_FORBIDDEN_ELEMENT', element);
  }
  for (const scheme of contract.html.forbiddenResourceSchemes) {
    assert(!htmlText.toLowerCase().includes(scheme.toLowerCase()), 'HTML_FORBIDDEN_SCHEME', scheme);
  }
  assert(!/base64\s*,/i.test(htmlText), 'HTML_BASE64');
  assert(!/\b(?:href|src)\s*=/i.test(htmlText), 'HTML_CLICKABLE_RESOURCE');

  for (const token of contract.html.requiredVisibleTokens) {
    assert(htmlText.includes(escapeHtml(token)), 'HTML_VISIBLE_TOKEN', token);
  }
  for (const sourcePath of [...recordPaths, ...exclusionPaths]) {
    const escapedPath = escapeHtml(sourcePath);
    assert(htmlText.includes(escapedPath), 'HTML_SOURCE_PATH', sourcePath);
  }
  assert(!htmlText.includes('APPROVED_MASTER') && !htmlText.includes('APPROVED_CANON'), 'HTML_FORBIDDEN_CLAIM');

  return true;
}

const parseArgs = (argv) => {
  const args = { outputDir: null };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--output-dir') args.outputDir = argv[++index];
    else fail('CLI_ARGUMENT', argv[index]);
  }
  assert(args.outputDir, 'CLI_OUTPUT_DIR');
  return args;
};

const readJsonFile = async (path) => JSON.parse(await readFile(path, 'utf8'));

export async function loadAndValidateMigrationOutput(outputDir) {
  const [contract, mappingContract, inventory, shortlist, oracle] = await Promise.all([
    readJsonFile(new URL('../project/legacy-asset-migration-output-contract.json', import.meta.url)),
    readJsonFile(new URL('../project/legacy-asset-mapping-contract.json', import.meta.url)),
    readJsonFile(new URL('../tests/fixtures/legacy-asset-migration/asset-recovery-inventory.json', import.meta.url)),
    readJsonFile(new URL('../tests/fixtures/legacy-asset-migration/analysis/visual-candidate-shortlist.json', import.meta.url)),
    readJsonFile(new URL('../tests/fixtures/legacy-asset-migration/expected-migration-oracle.json', import.meta.url))
  ]);
  const base = resolve(outputDir);
  const [report, csvText, htmlText] = await Promise.all([
    readJsonFile(resolve(base, contract.requiredFiles.json)),
    readFile(resolve(base, contract.requiredFiles.csv), 'utf8'),
    readFile(resolve(base, contract.requiredFiles.html), 'utf8')
  ]);
  validateMigrationOutput({ contract, mappingContract, inventory, shortlist, oracle, report, csvText, htmlText });
  return { report, csvText, htmlText };
}

const invokedDirectly = process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url;
if (invokedDirectly) {
  const args = parseArgs(process.argv.slice(2));
  const { report } = await loadAndValidateMigrationOutput(args.outputDir);
  console.log(JSON.stringify({
    status: 'pass',
    reportId: report.reportId,
    inputFingerprintSha256: report.inputFingerprintSha256,
    includedRecords: report.records.length,
    excludedRecords: report.exclusions.length,
    automaticMasterApprovals: report.safety.automaticMasterApprovals
  }, null, 2));
}
