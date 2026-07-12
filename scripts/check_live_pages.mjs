import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeBaseUrl = (value) => {
  const url = new URL(String(value));
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('Pages base URL must use HTTP or HTTPS.');
  return url.toString().replace(/\/+$/, '') + '/';
};

const readJson = async (url, fetchImpl) => {
  const response = await fetchImpl(url, { headers: { accept: 'application/json', 'cache-control': 'no-cache' } });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  return response.json();
};

export async function verifyLivePages({ baseUrl, expectedCommit, fetchImpl = fetch, attempts = 30, delayMs = 5000 }) {
  const base = normalizeBaseUrl(baseUrl);
  if (!/^[0-9a-f]{40}$/i.test(String(expectedCommit))) throw new Error('Expected commit must be a full SHA-1.');

  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const studioResponse = await fetchImpl(new URL('studio/', base), { headers: { 'cache-control': 'no-cache' } });
      if (!studioResponse.ok) throw new Error(`studio route returned HTTP ${studioResponse.status}`);

      const [line, cockpit, proof] = await Promise.all([
        readJson(new URL('project/active-line.json', base), fetchImpl),
        readJson(new URL('project/production-cockpit-v1.json', base), fetchImpl),
        readJson(new URL('proof/cockpit/production-cockpit-runtime-evidence.json', base), fetchImpl)
      ]);

      if (line.authority !== 'current_operational_line') throw new Error('active-line authority mismatch');
      if (line.parentGate?.trackingIssue !== 82) throw new Error('parent gate mismatch');
      if (line.strategicContract?.trackingIssue !== 88) throw new Error('strategic contract mismatch');
      if (line.completedAssetScan?.trackingIssue !== 123) throw new Error('asset scan mismatch');
      if (line.activeReviewGate?.trackingIssue !== 153) throw new Error('active review gate mismatch');
      if (line.executionTask?.trackingIssue !== 155 || line.executionTask?.toolingPullRequest !== 154) throw new Error('local execution task mismatch');
      if (!Object.values(line.boundaries || {}).every((value) => value === false)) throw new Error('operational boundary unexpectedly open');

      if (cockpit.status !== 'WORKING_COCKPIT_V1') throw new Error('cockpit status mismatch');
      if (cockpit.activeGate?.trackingIssue !== 153) throw new Error('cockpit active gate mismatch');
      if (cockpit.currentTask?.primaryHref !== 'https://github.com/Pagebabe/comic/issues/155') throw new Error('cockpit task link mismatch');
      if (cockpit.nextAllowedStep?.decision !== 'LOCAL_REVIEW_PACKAGE_COMPLETE_AND_HUMAN_DECISION_RECORDED') throw new Error('cockpit next decision mismatch');

      if (proof.status !== 'pass') throw new Error('runtime proof status mismatch');
      if (proof.commit !== expectedCommit) throw new Error(`runtime proof commit ${proof.commit} != ${expectedCommit}`);
      if (proof.activeParentTrackingIssue !== 82 || proof.strategicContractTrackingIssue !== 88) throw new Error('runtime strategic binding mismatch');
      if (proof.completedAssetScan !== 123 || proof.activeReviewGate !== 153 || proof.localExecutionTask !== 155 || proof.toolingPullRequest !== 154) throw new Error('runtime operational binding mismatch');
      if (proof.activeWorkspace !== 'review' || proof.nextDecision !== 'LOCAL_REVIEW_PACKAGE_COMPLETE_AND_HUMAN_DECISION_RECORDED') throw new Error('runtime cockpit route mismatch');
      if (proof.imageGenerationAllowed !== false || proof.creativeApprovalGranted !== false || proof.productionReady !== false) throw new Error('runtime safety boundary mismatch');

      return {
        schemaVersion: 1,
        status: 'pass',
        baseUrl: base,
        studioUrl: new URL('studio/', base).toString(),
        expectedCommit,
        attempt,
        parentGate: 82,
        strategicContract: 88,
        completedAssetScan: 123,
        activeReviewGate: 153,
        localExecutionTask: 155,
        toolingPullRequest: 154,
        activeWorkspace: 'review',
        imageGenerationAllowed: false,
        automaticMasterApprovalAllowed: false,
        checkedAt: new Date().toISOString()
      };
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await sleep(delayMs);
    }
  }
  throw new Error(`Live Pages verification failed after ${attempts} attempts: ${lastError?.message || 'unknown error'}`);
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  const [baseUrl, expectedCommit] = process.argv.slice(2);
  const result = await verifyLivePages({ baseUrl, expectedCommit });
  await mkdir('output', { recursive: true });
  await writeFile('output/pages-live-check.json', `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result));
}
