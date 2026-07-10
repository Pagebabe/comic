import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readJson = async (path) => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'));

test('INC-005 preserves both failed and corrected public proof', async () => {
  const incident = await readJson('project/incidents/INC-005-stale-evidence-heading.json');
  assert.equal(incident.repository, 'Pagebabe/comic');
  assert.equal(incident.status, 'closed_verified_by_runtime_visual_proof');
  assert.equal(incident.failedProof.commit, 'ed889faafb92ec359c3dea7008a9c27ae8ac15fb');
  assert.equal(incident.correctiveProof.commit, '24e63b3208bcb0e36e4b521d0c449a9d0dc994cb');
  assert.equal(incident.correctiveProof.runtimeChecks.desktopStaleEvidenceCountPresent, false);
  assert.equal(incident.correctiveProof.runtimeChecks.mobileStaleEvidenceCountPresent, false);
  assert.equal(incident.correctiveProof.runtimeChecks.desktopDriftSafeEvidenceHeadingPresent, true);
  assert.equal(incident.correctiveProof.runtimeChecks.mobileDriftSafeEvidenceHeadingPresent, true);
});

test('closure manifest records five terminal incidents', async () => {
  const closure = await readJson('project/evidence-closure.json');
  assert.equal(Object.keys(closure.incidentClosures).length, 5);
  assert.equal(closure.incidentClosures['INC-005-stale-evidence-heading'], 'closed_verified_by_runtime_visual_proof');
});
