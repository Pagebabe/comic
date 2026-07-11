import { LOOP_STATIONS, canonicalJson, sha256 } from './production-loop.mjs';

export const SELECTED_PILOT_STORAGE_KEY = 'comic-lr4-selected-pilot-loop-v1';
export const SELECTED_PILOT_PACKAGE_STORAGE_KEY = 'comic-lr4-selected-pilot-package-v1';
export const DETAIL_REVIEW_STATUS = 'REVIEW_REQUIRED';

const PACKAGE_ID = 'lr4-selected-pilot-episode-package-v1';
const PACKAGE_TYPE = 'comic-factory-selected-pilot-episode-package';

export const SELECTED_PILOT_SOURCES = [
  { path: 'project/pilot-decision-record.json', blob: '39011644e108d0a3c2dd8ddda41a5f2c74369b23', role: 'selection_authority', status: 'AUTHORITATIVE' },
  { path: 'project/canon.json', blob: '8f1ab3fe5d4330b92f62c0c66315f4dc649f8648', role: 'selected_pilot_plan_and_boundaries', status: 'AUTHORITATIVE_BOUNDARY' },
  { path: 'project/ep001-animatic-blueprint.json', blob: 'edbec4be2b3e9f72f60f95cef3178dcbce01ef1a', role: 'eight_panel_dialogue_and_timing_candidate', status: DETAIL_REVIEW_STATUS },
  { path: 'project/merge-bibles/ricco.json', blob: '186ad510fd3a86d8dd3531f956eac6950f2ab929', role: 'character_detail_candidate_char_ricco', status: DETAIL_REVIEW_STATUS },
  { path: 'project/merge-bibles/basti-prenzl.json', blob: '47796c74416768d3fa89600b2bf1cf03db3aa70d', role: 'character_detail_candidate_char_basti', status: DETAIL_REVIEW_STATUS },
  { path: 'project/merge-bibles/jule.json', blob: 'd6907a39d10d7834f55d8c908cb672169d2aa770', role: 'character_detail_candidate_char_jule', status: DETAIL_REVIEW_STATUS },
  { path: 'project/merge-bibles/don-miau.json', blob: '99a77ec4f43b3af8db6f01243c8952da037f4a47', role: 'character_detail_candidate_char_don_miau', status: DETAIL_REVIEW_STATUS }
];

export const SELECTED_PILOT_PANELS = [
  { panelId: 'panel_001', durationSeconds: 4.5, locationId: 'loc_haus_fassade', characterIds: ['char_ricco', 'char_don_miau'], dialogue: [] },
  { panelId: 'panel_002', durationSeconds: 6, locationId: 'loc_flur', characterIds: ['char_ricco', 'char_basti'], dialogue: [
    { speakerId: 'char_basti', text: 'Vermieter ist ein schwieriges Wort.', startSeconds: 0.45, endSeconds: 2.7 },
    { speakerId: 'char_basti', text: 'Das ist kein Mietverhältnis, das ist ein Prozess.', startSeconds: 2.85, endSeconds: 5.8 }
  ] },
  { panelId: 'panel_003', durationSeconds: 5, locationId: 'loc_flur', characterIds: ['char_ricco', 'char_basti'], dialogue: [
    { speakerId: 'char_basti', text: 'Die 780 sind eigentlich noch solidarisch gedacht.', startSeconds: 0.55, endSeconds: 3.75 }
  ] },
  { panelId: 'panel_004', durationSeconds: 5, locationId: 'loc_riccos_zimmer', characterIds: ['char_ricco'], dialogue: [
    { speakerId: 'char_ricco', text: 'Das war so nicht abgemacht.', startSeconds: 2.45, endSeconds: 4.25 }
  ] },
  { panelId: 'panel_005', durationSeconds: 6, locationId: 'loc_riccos_zimmer', characterIds: ['char_ricco'], dialogue: [
    { speakerId: 'char_ricco', text: 'Mama, das ist hier sehr kreativ.', startSeconds: 1.05, endSeconds: 3.35 }
  ] },
  { panelId: 'panel_006', durationSeconds: 5.5, locationId: 'loc_flur', characterIds: ['char_ricco', 'char_basti'], dialogue: [
    { speakerId: 'char_basti', text: 'Ich halte nur den Raum.', startSeconds: 0.65, endSeconds: 2.15 },
    { speakerId: 'char_ricco', text: 'Ist das hier normal?', startSeconds: 3.15, endSeconds: 4.55 }
  ] },
  { panelId: 'panel_007', durationSeconds: 7, locationId: 'loc_kueche', characterIds: ['char_ricco', 'char_jule'], dialogue: [
    { speakerId: 'char_jule', text: 'Bitte reflektier mal deinen Kühlschrankanspruch.', startSeconds: 0.55, endSeconds: 3.45 },
    { speakerId: 'char_jule', text: 'Eigentum an Hummus ist auch Eigentum.', startSeconds: 3.7, endSeconds: 6.15 }
  ] },
  { panelId: 'panel_008', durationSeconds: 6.5, locationId: 'loc_riccos_zimmer', characterIds: ['char_ricco', 'char_don_miau'], dialogue: [
    { speakerId: 'char_ricco', text: 'Ich brauch nur WLAN und Ruhe.', startSeconds: 0.85, endSeconds: 3.05 }
  ] }
].map((panel) => ({
  ...panel,
  panelStatus: DETAIL_REVIEW_STATUS,
  timingStatus: DETAIL_REVIEW_STATUS,
  locationStatus: DETAIL_REVIEW_STATUS,
  characterStatus: DETAIL_REVIEW_STATUS,
  dialogue: panel.dialogue.map((line) => ({ ...line, sourceStatus: DETAIL_REVIEW_STATUS, dialogueApproval: false }))
}));

function clone(value) {
  return structuredClone(value);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
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

function allCreativeApprovalsFalse(state) {
  return Object.values(state.creativeApprovals).every((value) => value === false);
}

function allDetailsReviewRequired(state) {
  const statuses = Object.values(state.detailsStatus);
  const panelStatuses = state.panels.flatMap((panel) => [panel.panelStatus, panel.timingStatus, panel.locationStatus, panel.characterStatus]);
  const dialogueStatuses = state.panels.flatMap((panel) => panel.dialogue.map((line) => line.sourceStatus));
  return [...statuses, ...panelStatuses, ...dialogueStatuses].every((value) => value === DETAIL_REVIEW_STATUS);
}

export function createSelectedPilotState() {
  return {
    schemaVersion: 1,
    packageId: PACKAGE_ID,
    selectedPilot: { id: 'pilot-das-zimmer', title: 'Das Zimmer', decisionStatus: 'human_decision_recorded', approvalScope: 'pilot_identity_and_planning_direction_only' },
    technicalScope: 'lr4_selected_pilot_transport_delete_restore_test_only',
    sourceRefs: clone(SELECTED_PILOT_SOURCES),
    detailsStatus: {
      characters: DETAIL_REVIEW_STATUS,
      locations: DETAIL_REVIEW_STATUS,
      panels: DETAIL_REVIEW_STATUS,
      dialogue: DETAIL_REVIEW_STATUS,
      timing: DETAIL_REVIEW_STATUS,
      visuals: DETAIL_REVIEW_STATUS,
      voices: DETAIL_REVIEW_STATUS
    },
    panels: clone(SELECTED_PILOT_PANELS),
    sequence: 3,
    stations: LOOP_STATIONS.map((station) => ({ ...station, status: ['control', 'studio', 'prompt_queue'].includes(station.id) ? 'passed' : 'pending' })),
    promptQueue: SELECTED_PILOT_PANELS.map((panel) => ({
      id: `prompt-${panel.panelId}`,
      panelId: panel.panelId,
      status: 'manual_only_no_execution',
      sourceStatus: DETAIL_REVIEW_STATUS,
      externalExecution: false
    })),
    assets: [],
    reviews: [],
    qa: { status: 'pending', checks: [] },
    lettering: { status: 'pending', overlays: [] },
    creativeApprovals: {
      detailCanon: false,
      dialogue: false,
      timing: false,
      visualMaster: false,
      voiceMaster: false,
      finalEpisode: false
    },
    events: [
      { sequence: 1, type: 'CONTROL_OPENED', station: 'control', detail: 'LR4 selected-pilot transport test initialized.' },
      { sequence: 2, type: 'STUDIO_READY', station: 'studio', detail: 'Verified Studio Foundation loaded.' },
      { sequence: 3, type: 'PROMPT_QUEUE_BOUND', station: 'prompt_queue', detail: 'Eight manual-only candidate panels bound; no provider execution.' }
    ]
  };
}

export function importSelectedPilotMetadata(state) {
  assert(state.selectedPilot.id === 'pilot-das-zimmer', 'Unexpected selected pilot.');
  assert(state.assets.length === 0, 'Selected-pilot metadata was already imported.');
  const next = clone(state);
  next.assets = state.panels.map((panel) => ({
    id: `asset-${panel.panelId}`,
    panelId: panel.panelId,
    source: 'selected_pilot_metadata_only',
    mediaType: 'application/x-comic-panel-metadata',
    containsImage: false,
    mediaByteLength: 0,
    externalExecution: false,
    sourceStatus: DETAIL_REVIEW_STATUS
  }));
  return transition(next, 'import', 'SELECTED_PILOT_METADATA_IMPORTED', 'Eight metadata-only panel assets imported; no image bytes or network source.');
}

export function reviewSelectedPilotForTransport(state) {
  assert(state.assets.length === 8, 'All eight panel metadata assets must be imported before review.');
  assert(state.reviews.length === 0, 'Selected-pilot transport review was already recorded.');
  const next = clone(state);
  next.reviews = state.assets.map((asset) => ({
    id: `review-${asset.panelId}`,
    assetId: asset.id,
    decision: 'approved_for_transport_only',
    detailStatus: DETAIL_REVIEW_STATUS,
    visualApprovalGranted: false,
    dialogueApprovalGranted: false,
    note: 'Candidate metadata accepted only for LR4 transport and restore proof.'
  }));
  return transition(next, 'review', 'TRANSPORT_REVIEW_RECORDED', 'Eight technical transport reviews recorded; all creative decisions remain open.');
}

export function runSelectedPilotQa(state) {
  const duration = state.panels.reduce((sum, panel) => sum + panel.durationSeconds, 0);
  const dialogueCues = state.panels.flatMap((panel) => panel.dialogue);
  const checks = [
    { id: 'selected-pilot-bound', passed: state.selectedPilot.id === 'pilot-das-zimmer' },
    { id: 'seven-pinned-sources', passed: state.sourceRefs.length === 7 && state.sourceRefs.every((source) => /^[0-9a-f]{40}$/.test(source.blob)) },
    { id: 'eight-panels', passed: state.panels.length === 8 && new Set(state.panels.map((panel) => panel.panelId)).size === 8 },
    { id: 'candidate-duration-45-5', passed: duration === 45.5 },
    { id: 'ten-dialogue-cues', passed: dialogueCues.length === 10 },
    { id: 'don-miau-has-no-dialogue', passed: dialogueCues.every((line) => line.speakerId !== 'char_don_miau') },
    { id: 'eight-metadata-assets', passed: state.assets.length === 8 && state.assets.every((asset) => asset.containsImage === false && asset.mediaByteLength === 0) },
    { id: 'no-external-execution', passed: state.assets.every((asset) => asset.externalExecution === false) && state.promptQueue.every((item) => item.externalExecution === false) },
    { id: 'reviews-transport-only', passed: state.reviews.length === 8 && state.reviews.every((review) => review.decision === 'approved_for_transport_only') },
    { id: 'all-details-review-required', passed: allDetailsReviewRequired(state) },
    { id: 'no-creative-approvals', passed: allCreativeApprovalsFalse(state) }
  ];
  assert(checks.every((check) => check.passed), 'Selected-pilot technical QA failed.');
  const next = clone(state);
  next.qa = { status: 'passed_transport_only', checks, candidateDurationSeconds: duration, dialogueCueCount: dialogueCues.length };
  return transition(next, 'qa', 'SELECTED_PILOT_QA_PASSED', 'Selected-pilot transport contract passed; detail, visual, voice and final gates remain closed.');
}

export function applySelectedPilotLettering(state) {
  assert(state.qa.status === 'passed_transport_only', 'Selected-pilot QA must pass before lettering.');
  const overlays = state.panels.flatMap((panel) => panel.dialogue.map((line, index) => ({
    id: `subtitle-${panel.panelId}-${index + 1}`,
    panelId: panel.panelId,
    speakerId: line.speakerId,
    text: line.text,
    startSeconds: line.startSeconds,
    endSeconds: line.endSeconds,
    sourceStatus: DETAIL_REVIEW_STATUS,
    dialogueApproval: false,
    placement: 'bottom_safe_area'
  })));
  const next = clone(state);
  next.lettering = { status: 'applied_candidate_only', overlays };
  return transition(next, 'lettering', 'CANDIDATE_LETTERING_APPLIED', 'Ten subtitle candidates attached for transport only; no dialogue approval granted.');
}

export async function createSelectedPilotPackage(state) {
  assert(state.lettering.status === 'applied_candidate_only', 'Candidate lettering must be applied before package export.');
  assert(state.qa.status === 'passed_transport_only', 'Selected-pilot QA must pass before package export.');
  assert(allDetailsReviewRequired(state), 'All selected-pilot details must remain REVIEW_REQUIRED.');
  assert(allCreativeApprovalsFalse(state), 'Creative approval must stay false.');

  const packagedState = transition(state, 'package', 'SELECTED_PILOT_PACKAGE_EXPORTED', 'Deterministic SelectedPilotEpisodePackage exported.');
  const stateHash = await sha256(packagedState);
  const unsignedPackage = {
    schemaVersion: 1,
    packageType: PACKAGE_TYPE,
    packageId: PACKAGE_ID,
    selectedPilot: packagedState.selectedPilot,
    sourceRefs: packagedState.sourceRefs,
    productionStatus: 'selected_pilot_fire_test_candidate_only',
    detailStatus: DETAIL_REVIEW_STATUS,
    creativeApprovals: packagedState.creativeApprovals,
    stateHash,
    state: packagedState
  };
  const packageHash = await sha256(unsignedPackage);
  return { ...unsignedPackage, packageHash };
}

export function serializeSelectedPilotPackage(pkg) {
  return JSON.stringify(pkg, null, 2);
}

export async function restoreSelectedPilotPackage(input) {
  const pkg = typeof input === 'string' ? JSON.parse(input) : clone(input);
  assert(pkg?.schemaVersion === 1, 'Unsupported SelectedPilotEpisodePackage schema.');
  assert(pkg?.packageId === PACKAGE_ID, 'Unexpected SelectedPilotEpisodePackage id.');
  assert(pkg?.packageType === PACKAGE_TYPE, 'Unexpected SelectedPilotEpisodePackage type.');
  assert(pkg?.selectedPilot?.id === 'pilot-das-zimmer', 'Unexpected selected pilot in package.');
  assert(pkg?.detailStatus === DETAIL_REVIEW_STATUS, 'Package tried to change the detail-review boundary.');
  const { packageHash, ...unsignedPackage } = pkg;
  const computedPackageHash = await sha256(unsignedPackage);
  assert(packageHash === computedPackageHash, 'SelectedPilotEpisodePackage hash mismatch.');
  const restoredStateHash = await sha256(pkg.state);
  assert(pkg.stateHash === restoredStateHash, 'Restored selected-pilot state hash mismatch.');
  assert(allDetailsReviewRequired(pkg.state), 'Restore tried to approve selected-pilot details.');
  assert(allCreativeApprovalsFalse(pkg.state), 'Restore tried to grant a creative approval.');
  return {
    state: clone(pkg.state),
    packageHash,
    expectedStateHash: pkg.stateHash,
    restoredStateHash,
    match: pkg.stateHash === restoredStateHash
  };
}

export function markSelectedPilotRestorePassed(state, restoreProof) {
  assert(restoreProof?.match === true, 'Selected-pilot restore proof must match before completion.');
  return transition(state, 'restore', 'SELECTED_PILOT_RESTORE_VERIFIED', `Delete-and-restore hash match: ${restoreProof.restoredStateHash}`);
}

export function selectedPilotStationMap(state) {
  return Object.fromEntries(state.stations.map((station) => [station.id, station.status]));
}

export function canonicalSelectedPilotState(state) {
  return canonicalJson(state);
}
