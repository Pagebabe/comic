import test from 'node:test';
import assert from 'node:assert/strict';
import {
  loadMarketingPackage,
  validateMarketingPackage
} from '../growth-os/marketing-prelaunch-check.mjs';

const clonePackage = (pkg) => Object.fromEntries(
  Object.entries(pkg).map(([key, value]) => [key, {
    ...value,
    raw: Buffer.from(value.raw),
    json: structuredClone(value.json)
  }])
);

const expectFailure = async (pkg, code) => {
  await assert.rejects(
    () => validateMarketingPackage(pkg, { verifySourcePins: false }),
    new RegExp(`MARKETING_PRELAUNCH:${code}`)
  );
};

test('marketing prelaunch package validates with exact source pins', async () => {
  const pkg = await loadMarketingPackage();
  const result = await validateMarketingPackage(pkg);
  assert.deepEqual(result, {
    status: 'COMIC_MARKETING_PRELAUNCH_VALID',
    sourcePins: 7,
    audienceHypotheses: 4,
    departments: 6,
    contentPillars: 6,
    platforms: 4,
    campaignPhases: 5,
    launchAssets: 7,
    queueGates: 6,
    queueJobs: 8,
    activeJobs: 0,
    platformAccounts: 0,
    publishingAllowed: false,
    networkAllowed: false,
    paidSpendEuro: 0,
    liveMetrics: 0
  });
});

test('rejects live publishing activation', async () => {
  const pkg = clonePackage(await loadMarketingPackage());
  pkg.agency.json.operatingModel.publishingAllowed = true;
  await expectFailure(pkg, 'UNSAFE_OPERATING_CAPABILITY');
});

test('rejects fabricated validated audience segment', async () => {
  const pkg = clonePackage(await loadMarketingPackage());
  pkg.agency.json.audienceHypotheses[0].status = 'VALIDATED';
  await expectFailure(pkg, 'AUDIENCE_FALSE_VALIDATION');
});

test('rejects a connected platform account', async () => {
  const pkg = clonePackage(await loadMarketingPackage());
  pkg.platforms.json.platforms[0].accountConnected = true;
  await expectFailure(pkg, 'PLATFORM_ACCOUNT_CONNECTED');
});

test('rejects a fabricated release date', async () => {
  const pkg = clonePackage(await loadMarketingPackage());
  pkg.campaign.json.episode.releaseDate = '2026-08-01';
  await expectFailure(pkg, 'CAMPAIGN_FAKE_RELEASE_DATE');
});

test('rejects numeric follower promises before baseline', async () => {
  const pkg = clonePackage(await loadMarketingPackage());
  pkg.campaign.json.successDefinition.followerPromise = 1000000;
  await expectFailure(pkg, 'CAMPAIGN_FAKE_PROMISE');
});

test('rejects active or publishable marketing job', async () => {
  const pkg = clonePackage(await loadMarketingPackage());
  pkg.queue.json.jobs[1].active = true;
  pkg.queue.json.jobs[1].publish = true;
  await expectFailure(pkg, 'QUEUE_JOB_ACTIVE_OR_PUBLISHING');
});

test('rejects Don Miau voice marketing', async () => {
  const pkg = clonePackage(await loadMarketingPackage());
  const pillar = pkg.pillars.json.pillars.find((item) => item.id === 'pillar_don_miau_judges');
  pillar.forbidden = pillar.forbidden.filter((item) => item !== 'menschliche Stimme');
  await expectFailure(pkg, 'DON_MIAU_MARKETING_VOICE');
});

test('rejects automatic campaign approval', async () => {
  const pkg = clonePackage(await loadMarketingPackage());
  pkg.agency.json.operatingModel.automaticCampaignApprovalAllowed = true;
  await expectFailure(pkg, 'UNSAFE_OPERATING_CAPABILITY');
});
