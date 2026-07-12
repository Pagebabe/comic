import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const root = new URL('../', import.meta.url);

const fail = (code, detail = '') => {
  throw new Error(`[MARKETING_PRELAUNCH:${code}]${detail ? ` ${detail}` : ''}`);
};
const assert = (condition, code, detail = '') => {
  if (!condition) fail(code, detail);
};
const unique = (items) => new Set(items).size === items.length;
const sorted = (items) => [...items].sort();

const expectedCast = ['Basti Prenzl', 'Don Miau', 'Jule', 'Ricco'];
const expectedPlatforms = ['instagram_reels', 'instagram_static', 'tiktok', 'youtube_shorts'];
const expectedPhaseIds = ['P0_PREPARATION', 'P1_ASSET_ASSEMBLY', 'P2_SHADOW_LAUNCH_REVIEW', 'P3_LIMITED_LIVE_PILOT', 'P4_LEARNING_CYCLE'];
const expectedGateIds = ['G0_STRATEGY', 'G1_EPISODE', 'G2_ASSETS', 'G3_RIGHTS_BRAND', 'G4_SHADOW_PAYLOAD', 'G5_LIVE'];

export const gitBlobSha = (content) => {
  const bytes = Buffer.isBuffer(content) ? content : Buffer.from(content);
  return createHash('sha1')
    .update(Buffer.from(`blob ${bytes.length}\0`))
    .update(bytes)
    .digest('hex');
};

export async function loadMarketingPackage() {
  const paths = {
    agency: 'growth-os/contracts/comic-marketing-agency-v1.json',
    pillars: 'growth-os/contracts/content-pillars-v1.json',
    platforms: 'growth-os/contracts/platform-format-matrix-v1.json',
    campaign: 'growth-os/contracts/ep001-prelaunch-campaign-v1.json',
    queue: 'growth-os/contracts/marketing-approval-queue-v1.json'
  };
  const entries = await Promise.all(Object.entries(paths).map(async ([key, path]) => {
    const raw = await readFile(new URL(path, root));
    return [key, { path, raw, json: JSON.parse(raw.toString('utf8')) }];
  }));
  return Object.fromEntries(entries);
}

export async function validateMarketingPackage(pkg, { verifySourcePins = true } = {}) {
  const agency = pkg.agency.json;
  const pillars = pkg.pillars.json;
  const platforms = pkg.platforms.json;
  const campaign = pkg.campaign.json;
  const queue = pkg.queue.json;

  assert(agency.schemaVersion === 1, 'AGENCY_SCHEMA');
  assert(agency.contractId === 'comic-growth-os.marketing-agency.v1', 'AGENCY_CONTRACT_ID');
  assert(agency.status === 'PRELAUNCH_PREPARED_LIVE_BLOCKED', 'AGENCY_STATUS');
  assert(agency.repository === 'Pagebabe/comic', 'AGENCY_REPOSITORY');
  assert(agency.trackingIssue === 158, 'AGENCY_ISSUE');
  assert(agency.sourceHead === '77f77db12a227c976e6e33ef7afde655f455772e', 'AGENCY_SOURCE_HEAD');

  const sourcePins = agency.sourcePins || [];
  assert(sourcePins.length === 7, 'SOURCE_PIN_COUNT', String(sourcePins.length));
  assert(unique(sourcePins.map((pin) => pin.path)), 'SOURCE_PIN_DUPLICATE');
  assert(sourcePins.every((pin) => /^[a-f0-9]{40}$/.test(pin.blobSha)), 'SOURCE_PIN_SHA_FORMAT');
  if (verifySourcePins) {
    for (const pin of sourcePins) {
      const raw = await readFile(new URL(pin.path, root));
      const actual = gitBlobSha(raw);
      assert(actual === pin.blobSha, 'SOURCE_PIN_MISMATCH', `${pin.path} expected=${pin.blobSha} actual=${actual}`);
    }
  }

  assert(agency.brand?.series === 'Ricco im Haus', 'BRAND_SERIES');
  assert(agency.brand?.selectedPilot === 'Das Zimmer', 'BRAND_PILOT');
  assert(sorted(agency.brand?.cast || []).join('|') === expectedCast.join('|'), 'BRAND_CAST');
  assert(Array.isArray(agency.brand?.brandGuardrails) && agency.brand.brandGuardrails.length >= 7, 'BRAND_GUARDRAILS');
  assert(agency.brand.brandGuardrails.some((rule) => rule.includes('Don Miau spricht nicht')), 'DON_MIAU_SPEECH_GUARD');
  assert(Array.isArray(agency.audienceHypotheses) && agency.audienceHypotheses.length === 4, 'AUDIENCE_COUNT');
  assert(agency.audienceHypotheses.every((item) => item.status === 'UNVALIDATED_HYPOTHESIS'), 'AUDIENCE_FALSE_VALIDATION');
  assert(agency.audienceHypotheses.every((item) => item.sensitiveProfilingAllowed === false), 'AUDIENCE_SENSITIVE_PROFILING');

  const operating = agency.operatingModel || {};
  assert(operating.mode === 'shadow', 'OPERATING_MODE');
  for (const key of [
    'networkAllowed',
    'oauthAllowed',
    'publishingAllowed',
    'paidMediaAllowed',
    'influencerOutreachAllowed',
    'automaticReplyAllowed',
    'automaticModerationAllowed',
    'automaticCampaignApprovalAllowed',
    'automaticCanonMutationAllowed',
    'automaticMasterApprovalAllowed'
  ]) {
    assert(operating[key] === false, 'UNSAFE_OPERATING_CAPABILITY', key);
  }
  assert(operating.platformAccountsConnected === 0, 'CONNECTED_ACCOUNTS');
  assert(operating.humanApprovalRequiredForLive === true, 'HUMAN_LIVE_APPROVAL');
  assert(Array.isArray(agency.departments) && agency.departments.length === 6, 'DEPARTMENT_COUNT');
  assert(agency.departments.every((item) => item.liveAuthority === false), 'DEPARTMENT_LIVE_AUTHORITY');

  const kpi = agency.kpiContract || {};
  assert(kpi.baselineStatus === 'UNKNOWN_NO_LIVE_DATA', 'KPI_BASELINE');
  assert(kpi.numericTargetsAllowedBeforeBaseline === false, 'KPI_EARLY_TARGETS');
  assert(kpi.vanityClaimsAllowed === false, 'KPI_VANITY_CLAIMS');
  assert(Array.isArray(kpi.trackedAfterLaunch) && kpi.trackedAfterLaunch.length >= 10, 'KPI_METRIC_COUNT');
  assert(kpi.canonMutationFromMetrics === false, 'KPI_CANON_MUTATION');
  assert(kpi.characterMutationFromMetrics === false, 'KPI_CHARACTER_MUTATION');
  for (const [key, value] of Object.entries(agency.truthCounters || {})) {
    assert(value === 0, 'NONZERO_TRUTH_COUNTER', `${key}=${value}`);
  }

  assert(pillars.schemaVersion === 1, 'PILLARS_SCHEMA');
  assert(pillars.status === 'PREPARED_ASSET_DEPENDENT', 'PILLARS_STATUS');
  assert(pillars.rules?.sourceBoundOnly === true, 'PILLARS_SOURCE_BOUND');
  assert(pillars.rules?.noNewCanonFromMarketing === true, 'PILLARS_CANON_GUARD');
  assert(Array.isArray(pillars.pillars) && pillars.pillars.length === 6, 'PILLAR_COUNT');
  assert(unique(pillars.pillars.map((item) => item.id)), 'PILLAR_DUPLICATE_ID');
  assert(pillars.pillars.every((item) => item.status.startsWith('PREPARED_BLOCKED')), 'PILLAR_NOT_BLOCKED');
  const donPillar = pillars.pillars.find((item) => item.id === 'pillar_don_miau_judges');
  assert(donPillar?.forbidden?.includes('menschliche Stimme'), 'DON_MIAU_MARKETING_VOICE');
  assert(pillars.launchSelection?.status === 'UNSELECTED_NO_APPROVED_EPISODE', 'PILLAR_SELECTION_STATUS');
  assert(pillars.launchSelection?.automaticSelection === false, 'PILLAR_AUTO_SELECTION');

  assert(platforms.schemaVersion === 1, 'PLATFORM_SCHEMA');
  assert(platforms.status === 'PREPARED_ADAPTER_VALIDATION_REQUIRED', 'PLATFORM_STATUS');
  assert(platforms.masterFormat?.aspectRatio === '9:16', 'MASTER_ASPECT_RATIO');
  assert(platforms.masterFormat?.width === 1080 && platforms.masterFormat?.height === 1920, 'MASTER_DIMENSIONS');
  assert(platforms.masterFormat?.subtitlesSeparate === true, 'MASTER_SUBTITLE_RULE');
  assert(Array.isArray(platforms.platforms) && platforms.platforms.length === 4, 'PLATFORM_COUNT');
  assert(sorted(platforms.platforms.map((item) => item.id)).join('|') === expectedPlatforms.join('|'), 'PLATFORM_IDS');
  for (const platform of platforms.platforms) {
    assert(platform.status === 'SHADOW_TEMPLATE_ONLY', 'PLATFORM_ITEM_STATUS', platform.id);
    assert(platform.accountConnected === false, 'PLATFORM_ACCOUNT_CONNECTED', platform.id);
    assert(platform.networkAllowed === false, 'PLATFORM_NETWORK_ALLOWED', platform.id);
    assert(platform.publishAllowed === false, 'PLATFORM_PUBLISH_ALLOWED', platform.id);
    assert(Array.isArray(platform.activationChecks) && platform.activationChecks.length >= 4, 'PLATFORM_ACTIVATION_CHECKS', platform.id);
  }
  assert(platforms.platformCounts?.connected === 0 && platforms.platformCounts?.live === 0, 'PLATFORM_LIVE_COUNTS');
  assert(platforms.commonSafety?.noAutomaticPublish === true, 'PLATFORM_AUTO_PUBLISH');

  assert(campaign.schemaVersion === 1, 'CAMPAIGN_SCHEMA');
  assert(campaign.status === 'PREPARED_BLOCKED_MISSING_APPROVED_EPISODE', 'CAMPAIGN_STATUS');
  assert(campaign.episode?.id === 'ep001' && campaign.episode?.title === 'Das Zimmer', 'CAMPAIGN_EPISODE');
  assert(campaign.episode?.approvedEpisodePackageSha256 === null, 'CAMPAIGN_FAKE_EPISODE_SHA');
  assert(campaign.episode?.releaseDate === null, 'CAMPAIGN_FAKE_RELEASE_DATE');
  assert(campaign.campaign?.currentPhase === 'P0_PREPARATION', 'CAMPAIGN_PHASE');
  assert(campaign.campaign?.activePublicAssets === 0 && campaign.campaign?.activePosts === 0, 'CAMPAIGN_ACTIVE_OUTPUT');
  assert(campaign.campaign?.paidSpendEuro === 0, 'CAMPAIGN_PAID_SPEND');
  assert(Array.isArray(campaign.phases) && campaign.phases.length === 5, 'CAMPAIGN_PHASE_COUNT');
  assert(campaign.phases.map((item) => item.id).join('|') === expectedPhaseIds.join('|'), 'CAMPAIGN_PHASE_ORDER');
  assert(campaign.phases.every((item) => item.publicOutputAllowed === false), 'CAMPAIGN_PUBLIC_OUTPUT');
  assert(Array.isArray(campaign.launchAssetPlan) && campaign.launchAssetPlan.length === 7, 'CAMPAIGN_ASSET_COUNT');
  assert(campaign.launchAssetPlan.every((item) => item.status === 'BLOCKED'), 'CAMPAIGN_ASSET_NOT_BLOCKED');
  assert(Array.isArray(campaign.copyTemplates?.forbiddenClaims) && campaign.copyTemplates.forbiddenClaims.length >= 6, 'COPY_FORBIDDEN_CLAIMS');
  assert(campaign.releaseCadence?.status === 'UNSET_UNTIL_APPROVED_ASSET_INVENTORY', 'CAMPAIGN_CADENCE_PRESET');
  assert(campaign.releaseCadence?.automaticScheduling === false, 'CAMPAIGN_AUTO_SCHEDULING');
  assert(campaign.successDefinition?.status === 'NO_BASELINE_NO_NUMERIC_TARGETS', 'CAMPAIGN_SUCCESS_STATUS');
  for (const key of ['followerPromise', 'reachPromise', 'revenuePromise']) {
    assert(campaign.successDefinition?.[key] === null, 'CAMPAIGN_FAKE_PROMISE', key);
  }

  assert(queue.schemaVersion === 1, 'QUEUE_SCHEMA');
  assert(queue.status === 'QUEUE_PREPARED_ZERO_ACTIVE_JOBS', 'QUEUE_STATUS');
  assert(queue.queuePolicy?.mode === 'shadow', 'QUEUE_MODE');
  assert(queue.queuePolicy?.activeJobs === 0, 'QUEUE_ACTIVE_JOBS');
  for (const key of ['automaticExecution', 'automaticApproval', 'automaticPublishing', 'networkAllowed', 'oauthAllowed']) {
    assert(queue.queuePolicy?.[key] === false, 'QUEUE_UNSAFE_CAPABILITY', key);
  }
  assert(queue.queuePolicy?.platformAccountsConnected === 0, 'QUEUE_CONNECTED_ACCOUNTS');
  assert(queue.queuePolicy?.maximumLivePostsPerExplicitApproval === 1, 'QUEUE_LIVE_POST_LIMIT');
  assert(Array.isArray(queue.gates) && queue.gates.length === 6, 'QUEUE_GATE_COUNT');
  assert(queue.gates.map((item) => item.id).join('|') === expectedGateIds.join('|'), 'QUEUE_GATE_ORDER');
  assert(Array.isArray(queue.jobs) && queue.jobs.length === 8, 'QUEUE_JOB_COUNT');
  assert(unique(queue.jobs.map((job) => job.jobId)), 'QUEUE_DUPLICATE_JOB');
  assert(queue.jobs.every((job) => job.active === false && job.publish === false), 'QUEUE_JOB_ACTIVE_OR_PUBLISHING');
  assert(queue.approvalRecordRequired?.liveDecisionAvailableInThisContract === false, 'QUEUE_LIVE_DECISION_AVAILABLE');
  assert(queue.auditCounters?.jobs === 8, 'QUEUE_AUDIT_JOB_COUNT');
  for (const key of ['activeJobs', 'shadowApprovedJobs', 'liveApprovedJobs', 'publishingActions', 'networkCalls', 'automaticApprovals']) {
    assert(queue.auditCounters?.[key] === 0, 'QUEUE_NONZERO_AUDIT_COUNTER', key);
  }

  return {
    status: 'COMIC_MARKETING_PRELAUNCH_VALID',
    sourcePins: sourcePins.length,
    audienceHypotheses: agency.audienceHypotheses.length,
    departments: agency.departments.length,
    contentPillars: pillars.pillars.length,
    platforms: platforms.platforms.length,
    campaignPhases: campaign.phases.length,
    launchAssets: campaign.launchAssetPlan.length,
    queueGates: queue.gates.length,
    queueJobs: queue.jobs.length,
    activeJobs: queue.queuePolicy.activeJobs,
    platformAccounts: operating.platformAccountsConnected,
    publishingAllowed: operating.publishingAllowed,
    networkAllowed: operating.networkAllowed,
    paidSpendEuro: agency.truthCounters.paidSpendEuro,
    liveMetrics: agency.truthCounters.liveMetrics
  };
}

async function main() {
  const pkg = await loadMarketingPackage();
  const result = await validateMarketingPackage(pkg);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
