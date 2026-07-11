import { readFile } from 'node:fs/promises';
import {
  appendStoredEvents,
  projectGrowthState,
  summarizeGrowthState,
  verifyStoredEvents
} from './data.mjs';

const scope = Object.freeze({ tenantId: 'tenant_demo', projectId: 'comic_factory' });
const at = '2026-07-11T08:30:00.000Z';
const base = {
  schemaVersion: 1,
  tenantId: scope.tenantId,
  projectId: scope.projectId,
  occurredAt: at,
  actor: 'growth-os-data-check',
  mode: 'shadow'
};
const events = [
  { ...base, id: 'evt_campaign', stream: 'campaign:launch', sequence: 1, type: 'CAMPAIGN_CREATED', payload: { campaignId: 'launch', name: 'Launch', status: 'DRAFT' } },
  { ...base, id: 'evt_content', stream: 'content:one', sequence: 1, type: 'CONTENT_REGISTERED', payload: { contentId: 'one', campaignId: 'launch', episodePackageId: 'ep_demo', title: 'Demo', status: 'READY' } },
  { ...base, id: 'evt_variant', stream: 'variant:one', sequence: 1, type: 'VARIANT_PLANNED', payload: { variantId: 'variant_one', contentId: 'one', platform: 'tiktok', status: 'PLANNED' } },
  { ...base, id: 'evt_metric', stream: 'metric:one', sequence: 1, type: 'METRIC_SNAPSHOT_RECORDED', payload: { metricSnapshotId: 'metric_one', variantId: 'variant_one', platform: 'tiktok', capturedAt: at, metrics: { views: 1000, watchSeconds: 14000, shares: 55, comments: 21, followersGained: 13 } } }
];
const records = appendStoredEvents([], events, scope);
const state = projectGrowthState(records, scope);
const sql = await readFile(new URL('./sql/001_growth_os_foundation.sql', import.meta.url), 'utf8');
for (const marker of [
  'create table if not exists growth_os.events',
  'unique (tenant_id, project_id, stream, sequence)',
  'growth_os.prevent_event_mutation',
  'enable row level security',
  "current_setting('app.tenant_id', true)"
]) {
  if (!sql.includes(marker)) throw new Error(`MKT0-002 SQL marker missing: ${marker}`);
}
if (!verifyStoredEvents(records, scope)) throw new Error('MKT0-002 event chain verification failed');
if (state.eventCount !== events.length) throw new Error('MKT0-002 projection count mismatch');
console.log(JSON.stringify({
  status: 'pass',
  mode: 'shadow',
  remoteDatabaseTouched: false,
  eventChainValid: true,
  eventHead: state.eventHead,
  summary: summarizeGrowthState(state),
  sqlContractMarkers: 5
}, null, 2));
