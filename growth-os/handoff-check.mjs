import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { inspectFactoryExport, renderHandoffHtml } from './handoff.mjs';
import { createFactoryHandoffFixture } from './handoff-fixture.mjs';

const outputDirectory = resolve('output/growth-os');
const jsonPath = resolve(outputDirectory, 'mkt1-factory-handoff.json');
const htmlPath = resolve(outputDirectory, 'mkt1-factory-handoff.html');
const checkedAt = '2026-07-11T00:00:00.000Z';

await mkdir(outputDirectory, { recursive: true });

const report = inspectFactoryExport(createFactoryHandoffFixture(), { checkedAt });
if (report.state !== 'READY_FOR_SHADOW_INGEST') throw new Error(`HANDOFF_NOT_READY:${report.state}`);
if (report.ingestPlan?.mode !== 'shadow') throw new Error('HANDOFF_MODE_NOT_SHADOW');
if (report.ingestPlan?.publishAllowed !== false) throw new Error('HANDOFF_PUBLISH_MUST_BE_FALSE');
if (report.boundaries.mainIntegrationAllowed !== false) throw new Error('HANDOFF_MAIN_INTEGRATION_MUST_BE_FALSE');
if (report.boundaries.networkUsed !== false) throw new Error('HANDOFF_NETWORK_MUST_BE_FALSE');
if (report.boundaries.sourceMutationPerformed !== false) throw new Error('HANDOFF_SOURCE_MUTATION_MUST_BE_FALSE');
if (report.boundaries.canonMutationPerformed !== false) throw new Error('HANDOFF_CANON_MUTATION_MUST_BE_FALSE');
if (report.boundaries.productionMutationPerformed !== false) throw new Error('HANDOFF_PRODUCTION_MUTATION_MUST_BE_FALSE');
if (report.boundaries.automaticCreativeApproval !== false) throw new Error('HANDOFF_CREATIVE_APPROVAL_MUST_BE_FALSE');

const html = renderHandoffHtml(report);
await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
await writeFile(htmlPath, html, 'utf8');

const persisted = JSON.parse(await readFile(jsonPath, 'utf8'));
const persistedHtml = await readFile(htmlPath, 'utf8');
if (persisted.reportHash !== report.reportHash) throw new Error('HANDOFF_REPORT_HASH_CHANGED');
if (!persistedHtml.includes(report.reportHash)) throw new Error('HANDOFF_HTML_HASH_MISSING');
if (!persistedHtml.includes("default-src 'none'")) throw new Error('HANDOFF_HTML_CSP_MISSING');
if (/<script/i.test(persistedHtml)) throw new Error('HANDOFF_HTML_SCRIPT_FORBIDDEN');
if (/https?:\/\//i.test(persistedHtml)) throw new Error('HANDOFF_HTML_NETWORK_REFERENCE_FORBIDDEN');

console.log(JSON.stringify({
  status: 'pass',
  trackingIssue: 130,
  mode: report.mode,
  state: report.state,
  exportId: report.export.exportId,
  assets: report.export.assets.length,
  reportHash: report.reportHash,
  jsonPath,
  htmlPath,
  liveReady: false,
  publishingAllowed: false,
  mainIntegrationAllowed: false,
  networkUsed: false,
  sourceMutationPerformed: false,
  canonMutationPerformed: false,
  productionMutationPerformed: false,
  automaticCreativeApproval: false
}, null, 2));
