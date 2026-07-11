export const LOOP_STORAGE_KEY = 'comic-lr3-neutral-loop-v1';
export const PACKAGE_STORAGE_KEY = 'comic-lr3-neutral-package-v1';

export const LOOP_STATIONS = [
  { id: 'control', label: 'Control' },
  { id: 'studio', label: 'Studio' },
  { id: 'prompt_queue', label: 'Prompt Queue' },
  { id: 'import', label: 'Import' },
  { id: 'review', label: 'Review' },
  { id: 'qa', label: 'QA' },
  { id: 'lettering', label: 'Lettering' },
  { id: 'package', label: 'Package' },
  { id: 'restore', label: 'Restore' }
];

const FIXTURE_ID = 'lr3-neutral-fixture-v1';
const PACKAGE_ID = 'lr3-neutral-episode-package-v1';
const TEST_ASSET_PAYLOAD = 'SYNTHETIC_TEST_CARD_V1|NO_IMAGE|NO_CHARACTER|NO_LOCATION|NO_CANON';

function clone(value) {
  return structuredClone(value);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function sortValue(value) {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortValue(value[key])]));
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(sortValue(value));
}

export async function sha256(value) {
  const text = typeof value === 'string' ? value : canonicalJson(value);
  const bytes = new TextEncoder().encode(text);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function appendEvent(state, type, station, detail) {
  const next = clone(state);
  next.sequence += 1;
  next.events.push({ sequence: next.sequence, type, station, detail });
  return next;
}

function setStation(state, stationId, status) {
  const next = clone(state);
  next.stations = next.stations.map((station) => station.id === stationId ? { ...station, status } : station);
  return next;
}

function transition(state, stationId, type, detail) {
  return appendEvent(setStation(state, stationId, 'passed'), type, stationId, detail);
}

export function createInitialLoopState() {
  return {
    schemaVersion: 1,
    fixtureId: FIXTURE_ID,
    packageId: PACKAGE_ID,
    selectedPilot: {
      id: 'pilot-das-zimmer',
      title: 'Das Zimmer',
      approvalScope: 'pilot_identity_only'
    },
    technicalScope: 'synthetic_lr3_delete_restore_test_only',
    sequence: 3,
    stations: LOOP_STATIONS.map((station) => ({
      ...station,
      status: ['control', 'studio', 'prompt_queue'].includes(station.id) ? 'passed' : 'pending'
    })),
    promptQueue: [{
      id: 'prompt-neutral-001',
      panelId: 'neutral-panel-001',
      status: 'manual_only_no_execution',
      positivePrompt: 'SYNTHETIC TEST CARD ONLY. NO CHARACTER. NO LOCATION. NO CANON.',
      negativePrompt: 'NO IMAGE GENERATION. NO LOGO. NO REAL PERSON. NO FINAL ASSET.'
    }],
    assets: [],
    reviews: [],
    qa: { status: 'pending', checks: [] },
    lettering: { status: 'pending', overlays: [] },
    creativeApprovals: {
      detailCanon: false,
      visualMaster: false,
      voiceMaster: false,
      finalEpisode: false
    },
    events: [
      { sequence: 1, type: 'CONTROL_OPENED', station: 'control', detail: 'Neutral LR3 test path initialized.' },
      { sequence: 2, type: 'STUDIO_READY', station: 'studio', detail: 'Verified Studio Foundation loaded.' },
      { sequence: 3, type: 'PROMPT_QUEUED', station: 'prompt_queue', detail: 'Manual-only synthetic prompt queued; no external execution.' }
    ]
  };
}

export async function importSyntheticAsset(state) {
  assert(state.fixtureId === FIXTURE_ID, 'Unknown LR3 fixture.');
  assert(state.assets.length === 0, 'Synthetic asset was already imported.');
  const asset = {
    id: 'asset-neutral-001',
    panelId: 'neutral-panel-001',
    source: 'synthetic_local_fixture',
    mediaType: 'application/x-comic-test-card',
    payload: TEST_ASSET_PAYLOAD,
    payloadSha256: await sha256(TEST_ASSET_PAYLOAD),
    containsImage: false,
    externalExecution: false
  };
  const next = clone(state);
  next.assets = [asset];
  return transition(next, 'import', 'ASSET_IMPORTED', 'Synthetic local test asset imported; no image bytes or network source.');
}

export function approveTechnicalReview(state) {
  assert(state.assets.length === 1, 'Import must pass before review.');
  assert(state.reviews.length === 0, 'Technical review was already recorded.');
  const next = clone(state);
  next.reviews = [{
    id: 'review-neutral-001',
    assetId: state.assets[0].id,
    decision: 'approved_for_technical_loop_only',
    humanGateSimulated: true,
    visualApprovalGranted: false,
    note: 'Synthetic metadata accepted only for LR3 transport and restore proof.'
  }];
  return transition(next, 'review', 'REVIEW_RECORDED', 'Technical-only review accepted without visual or canon approval.');
}

export function runTechnicalQa(state) {
  const checks = [
    { id: 'asset-present', passed: state.assets.length === 1 },
    { id: 'asset-is-synthetic', passed: state.assets[0]?.source === 'synthetic_local_fixture' },
    { id: 'no-image-bytes', passed: state.assets[0]?.containsImage === false },
    { id: 'no-external-execution', passed: state.assets[0]?.externalExecution === false },
    { id: 'review-technical-only', passed: state.reviews[0]?.decision === 'approved_for_technical_loop_only' },
    { id: 'no-creative-approvals', passed: Object.values(state.creativeApprovals).every((value) => value === false) }
  ];
  assert(checks.every((check) => check.passed), 'Technical QA failed.');
  const next = clone(state);
  next.qa = { status: 'passed_technical_only', checks };
  return transition(next, 'qa', 'QA_PASSED', 'Synthetic transport contract passed; creative gates remain closed.');
}

export function applyTechnicalLettering(state) {
  assert(state.qa.status === 'passed_technical_only', 'QA must pass before lettering.');
  const next = clone(state);
  next.lettering = {
    status: 'applied_technical_only',
    overlays: [{
      panelId: 'neutral-panel-001',
      text: 'LR3 TEST · KEIN CANON',
      placement: 'bottom_safe_area',
      approvedDialogue: false
    }]
  };
  return transition(next, 'lettering', 'LETTERING_APPLIED', 'Technical test overlay applied; no pilot dialogue approved.');
}

export async function createEpisodePackage(state) {
  assert(state.lettering.status === 'applied_technical_only', 'Lettering must be applied before package export.');
  assert(state.qa.status === 'passed_technical_only', 'QA must pass before package export.');
  assert(Object.values(state.creativeApprovals).every((value) => value === false), 'Creative approval must stay false.');

  const packagedState = transition(state, 'package', 'PACKAGE_EXPORTED', 'Deterministic neutral EpisodePackage exported.');
  const stateHash = await sha256(packagedState);
  const unsignedPackage = {
    schemaVersion: 1,
    packageType: 'comic-factory-neutral-episode-package',
    packageId: PACKAGE_ID,
    sourceFixture: FIXTURE_ID,
    selectedPilot: packagedState.selectedPilot,
    productionStatus: 'technical_loop_candidate_only',
    creativeApprovals: packagedState.creativeApprovals,
    stateHash,
    state: packagedState
  };
  const packageHash = await sha256(unsignedPackage);
  return { ...unsignedPackage, packageHash };
}

export function serializeEpisodePackage(pkg) {
  return JSON.stringify(pkg, null, 2);
}

export async function restoreEpisodePackage(input) {
  const pkg = typeof input === 'string' ? JSON.parse(input) : clone(input);
  assert(pkg?.schemaVersion === 1, 'Unsupported EpisodePackage schema.');
  assert(pkg?.packageId === PACKAGE_ID, 'Unexpected EpisodePackage id.');
  assert(pkg?.packageType === 'comic-factory-neutral-episode-package', 'Unexpected EpisodePackage type.');
  const { packageHash, ...unsignedPackage } = pkg;
  const computedPackageHash = await sha256(unsignedPackage);
  assert(packageHash === computedPackageHash, 'EpisodePackage hash mismatch.');
  const restoredStateHash = await sha256(pkg.state);
  assert(pkg.stateHash === restoredStateHash, 'Restored state hash mismatch.');
  assert(Object.values(pkg.state.creativeApprovals).every((value) => value === false), 'Restore tried to grant a creative approval.');
  return {
    state: clone(pkg.state),
    packageHash,
    expectedStateHash: pkg.stateHash,
    restoredStateHash,
    match: pkg.stateHash === restoredStateHash
  };
}

export function markRestorePassed(state, restoreProof) {
  assert(restoreProof?.match === true, 'Restore proof must match before completion.');
  return transition(state, 'restore', 'RESTORE_VERIFIED', `Delete-and-restore hash match: ${restoreProof.restoredStateHash}`);
}

export function stationMap(state) {
  return Object.fromEntries(state.stations.map((station) => [station.id, station.status]));
}
