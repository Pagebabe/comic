import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const root = new URL('../', import.meta.url);

const fail = (code, detail = '') => {
  throw new Error(`[LR5_PREPARATION:${code}]${detail ? ` ${detail}` : ''}`);
};

const assert = (condition, code, detail = '') => {
  if (!condition) fail(code, detail);
};

const unique = (items) => new Set(items).size === items.length;
const sorted = (items) => [...items].sort();
const sum = (items) => items.reduce((total, value) => total + value, 0);

const expectedCharacterIds = ['char_basti', 'char_don_miau', 'char_jule', 'char_ricco'];
const expectedLocationIds = ['loc_flur', 'loc_haus_fassade', 'loc_kueche', 'loc_riccos_zimmer'];
const expectedPanelIds = Array.from({ length: 8 }, (_, index) => `panel_${String(index + 1).padStart(3, '0')}`);
const expectedStageIds = [
  'S0_EXISTING_ASSET_REVIEW',
  'S1_RICCO_REFERENCE',
  'S2_REMAINING_CHARACTER_MASTERS',
  'S3_LOCATION_MASTERS',
  'S4_EP001_PANEL_RENDER'
];

export const gitBlobSha = (content) => {
  const bytes = Buffer.isBuffer(content) ? content : Buffer.from(content);
  return createHash('sha1')
    .update(Buffer.from(`blob ${bytes.length}\0`))
    .update(bytes)
    .digest('hex');
};

export async function loadPreparationPackage() {
  const paths = {
    preparation: 'project/lr5-production-preparation-contract.json',
    characters: 'project/lr5-character-render-contracts.json',
    locations: 'project/lr5-location-continuity-contract.json',
    queue: 'project/lr5-image-generation-queue.json',
    panels: 'project/ep001-render-matrix.json'
  };

  const entries = await Promise.all(Object.entries(paths).map(async ([key, path]) => {
    const raw = await readFile(new URL(path, root));
    return [key, { path, raw, json: JSON.parse(raw.toString('utf8')) }];
  }));

  return Object.fromEntries(entries);
}

export async function validatePreparationPackage(pkg, { verifySourcePins = true } = {}) {
  const preparation = pkg.preparation.json;
  const characters = pkg.characters.json;
  const locations = pkg.locations.json;
  const queue = pkg.queue.json;
  const panels = pkg.panels.json;

  assert(preparation.schemaVersion === 1, 'PREPARATION_SCHEMA');
  assert(preparation.status === 'PREPARED_GENERATION_BLOCKED', 'PREPARATION_STATUS');
  assert(preparation.repository === 'Pagebabe/comic', 'PREPARATION_REPOSITORY');
  assert(preparation.selectedPilot?.id === 'pilot-das-zimmer', 'PILOT_ID');
  assert(preparation.selectedPilot?.title === 'Das Zimmer', 'PILOT_TITLE');
  assert(preparation.selectedPilot?.panelCount === 8, 'PILOT_PANEL_COUNT');
  assert(sorted(preparation.selectedPilot?.characterIds || []).join('|') === expectedCharacterIds.join('|'), 'PILOT_CHARACTER_IDS');
  assert(sorted(preparation.selectedPilot?.locationIds || []).join('|') === expectedLocationIds.join('|'), 'PILOT_LOCATION_IDS');

  const sourcePins = preparation.sourcePins || [];
  assert(sourcePins.length === 10, 'SOURCE_PIN_COUNT', String(sourcePins.length));
  assert(unique(sourcePins.map((item) => item.path)), 'SOURCE_PIN_DUPLICATE_PATH');
  assert(sourcePins.every((item) => /^[a-f0-9]{40}$/.test(item.blobSha)), 'SOURCE_PIN_SHA_FORMAT');

  if (verifySourcePins) {
    for (const pin of sourcePins) {
      const content = await readFile(new URL(pin.path, root));
      const actual = gitBlobSha(content);
      assert(actual === pin.blobSha, 'SOURCE_PIN_MISMATCH', `${pin.path} expected=${pin.blobSha} actual=${actual}`);
    }
  }

  const authorization = preparation.authorization || {};
  assert(authorization.textPreparationAllowed === true, 'TEXT_PREPARATION_NOT_ALLOWED');
  assert(authorization.promptTemplatePreparationAllowed === true, 'PROMPT_PREPARATION_NOT_ALLOWED');
  assert(authorization.renderQueuePreparationAllowed === true, 'QUEUE_PREPARATION_NOT_ALLOWED');
  for (const key of [
    'imageGenerationAllowed',
    'modelDownloadAllowed',
    'loraTrainingAllowed',
    'voiceMasterCreationAllowed',
    'automaticMasterApprovalAllowed',
    'mainMergeAllowedByThisContract'
  ]) {
    assert(authorization[key] === false, 'UNSAFE_AUTHORIZATION', key);
  }

  assert(preparation.truthCounters?.riccoMasters === '0/1', 'RICCO_MASTER_COUNTER');
  assert(preparation.truthCounters?.characterMasters === '0/4', 'CHARACTER_MASTER_COUNTER');
  assert(preparation.truthCounters?.locationMasters === '0/4', 'LOCATION_MASTER_COUNTER');
  assert(preparation.truthCounters?.voiceMasters === '0/3', 'VOICE_MASTER_COUNTER');
  assert(preparation.truthCounters?.finishedEpisodes === 0, 'FINISHED_EPISODE_COUNTER');
  assert(preparation.truthCounters?.imageBytesCreatedByThisPackage === 0, 'IMAGE_BYTES_COUNTER');
  assert(preparation.truthCounters?.automaticMasterApprovals === 0, 'AUTO_APPROVAL_COUNTER');

  assert(characters.schemaVersion === 1, 'CHARACTER_SCHEMA');
  assert(characters.status === 'PREPARED_IMAGE_GENERATION_BLOCKED', 'CHARACTER_STATUS');
  assert(Array.isArray(characters.characters) && characters.characters.length === 4, 'CHARACTER_COUNT');
  const characterIds = characters.characters.map((item) => item.id);
  assert(unique(characterIds), 'CHARACTER_DUPLICATE_ID');
  assert(sorted(characterIds).join('|') === expectedCharacterIds.join('|'), 'CHARACTER_IDS');
  assert(characters.global?.globalNegative?.includes('direct protected-franchise imitation'), 'GLOBAL_IP_GUARD');
  assert(characters.global?.globalNegative?.includes('readable text'), 'GLOBAL_TEXT_GUARD');

  for (const character of characters.characters) {
    assert(character.generationAllowed === false, 'CHARACTER_GENERATION_ENABLED', character.id);
    assert(Array.isArray(character.requiredViews) && character.requiredViews.length === 5, 'CHARACTER_VIEW_COUNT', character.id);
    assert(Array.isArray(character.requiredExpressions) && character.requiredExpressions.length >= 4, 'CHARACTER_EXPRESSION_COUNT', character.id);
    assert(Array.isArray(character.requiredPoses) && character.requiredPoses.length >= 4, 'CHARACTER_POSE_COUNT', character.id);
    assert(Array.isArray(character.acceptanceChecks) && character.acceptanceChecks.length >= 5, 'CHARACTER_ACCEPTANCE_COUNT', character.id);
    assert(typeof character.providerNeutralPromptTemplate === 'string' && character.providerNeutralPromptTemplate.includes('{{STYLE_ANCHOR}}'), 'CHARACTER_PROMPT_TEMPLATE', character.id);
  }

  const ricco = characters.characters.find((item) => item.id === 'char_ricco');
  assert(ricco.age === 24, 'RICCO_AGE');
  for (const forbidden of ['child', 'teen', 'weapon']) {
    assert(ricco.forbidden.includes(forbidden), 'RICCO_FORBIDDEN_MISSING', forbidden);
  }
  assert(ricco.status === 'EXISTING_ASSET_REVIEW_REQUIRED', 'RICCO_REVIEW_STATUS');

  const basti = characters.characters.find((item) => item.id === 'char_basti');
  assert(basti.age === 44, 'BASTI_AGE');
  assert(basti.name === 'Basti Prenzl', 'BASTI_NAME');

  const jule = characters.characters.find((item) => item.id === 'char_jule');
  assert(jule.age === 29, 'JULE_AGE');
  assert(jule.forbidden.includes('sexualized depiction'), 'JULE_SEXUALIZATION_GUARD');

  const donMiau = characters.characters.find((item) => item.id === 'char_don_miau');
  assert(donMiau.forbidden.includes('humanoid cat'), 'DON_MIAU_HUMANOID_GUARD');
  assert(donMiau.forbidden.includes('speaking mouth'), 'DON_MIAU_SPEECH_GUARD');
  assert(donMiau.wardrobeAnchor === 'no clothing', 'DON_MIAU_CLOTHING_GUARD');

  assert(locations.schemaVersion === 1, 'LOCATION_SCHEMA');
  assert(locations.status === 'CANDIDATE_LAYOUTS_PREPARED_IMAGE_GENERATION_BLOCKED', 'LOCATION_STATUS');
  assert(locations.global?.generatedTextRule?.includes('No readable AI-generated'), 'LOCATION_TEXT_GUARD');
  assert(Array.isArray(locations.locations) && locations.locations.length === 4, 'LOCATION_COUNT');
  const locationIds = locations.locations.map((item) => item.id);
  assert(unique(locationIds), 'LOCATION_DUPLICATE_ID');
  assert(sorted(locationIds).join('|') === expectedLocationIds.join('|'), 'LOCATION_IDS');

  for (const location of locations.locations) {
    assert(location.status === 'CANDIDATE_LAYOUT_PREPARED', 'LOCATION_ITEM_STATUS', location.id);
    assert(Array.isArray(location.requiredViews) && location.requiredViews.length === 5, 'LOCATION_VIEW_COUNT', location.id);
    assert(Array.isArray(location.cameraAnchors) && location.cameraAnchors.length >= 2, 'LOCATION_CAMERA_ANCHORS', location.id);
    assert(Array.isArray(location.continuityChecks) && location.continuityChecks.length >= 5, 'LOCATION_CONTINUITY_CHECKS', location.id);
  }

  const room = locations.locations.find((item) => item.id === 'loc_riccos_zimmer');
  assert(room.candidateDesign?.topDownAnchors?.door?.wall === 'south', 'ROOM_DOOR_WALL');
  assert(room.candidateDesign?.topDownAnchors?.window?.wall === 'north', 'ROOM_WINDOW_WALL');
  assert(room.candidateDesign?.topDownAnchors?.mattress?.wall === 'west', 'ROOM_MATTRESS_WALL');

  const flur = locations.locations.find((item) => item.id === 'loc_flur');
  assert(flur.candidateDesign?.topDownAnchors?.stairsUp?.direction === 'rises north-east', 'FLUR_STAIR_DIRECTION');

  const kitchen = locations.locations.find((item) => item.id === 'loc_kueche');
  assert(kitchen.candidateDesign?.topDownAnchors?.fridge?.wall === 'east', 'KITCHEN_FRIDGE_WALL');

  assert(queue.schemaVersion === 1, 'QUEUE_SCHEMA');
  assert(queue.status === 'QUEUE_PREPARED_ZERO_ACTIVE_JOBS', 'QUEUE_STATUS');
  assert(queue.queuePolicy?.activeJobs === 0, 'QUEUE_ACTIVE_JOBS');
  assert(queue.queuePolicy?.automaticExecution === false, 'QUEUE_AUTO_EXECUTION');
  assert(queue.queuePolicy?.provider === null, 'QUEUE_PROVIDER_PINNED_EARLY');
  assert(queue.queuePolicy?.model === null, 'QUEUE_MODEL_PINNED_EARLY');
  assert(queue.queuePolicy?.workflow === null, 'QUEUE_WORKFLOW_PINNED_EARLY');
  assert(queue.queuePolicy?.noAutomaticMasterApproval === true, 'QUEUE_AUTO_APPROVAL_GUARD');
  assert(Array.isArray(queue.stages) && queue.stages.length === 5, 'QUEUE_STAGE_COUNT');
  assert(queue.stages.map((item) => item.stageId).join('|') === expectedStageIds.join('|'), 'QUEUE_STAGE_ORDER');

  const allJobs = queue.stages.flatMap((stage) => stage.jobs || []);
  assert(unique(allJobs.map((job) => job.jobId)), 'QUEUE_DUPLICATE_JOB_ID');
  for (const job of allJobs) {
    if (job.generation === true) {
      assert(job.status === 'BLOCKED', 'GENERATION_JOB_NOT_BLOCKED', job.jobId);
      assert(job.maximumCandidates === 1, 'GENERATION_CANDIDATE_LIMIT', job.jobId);
    }
  }
  const stage0 = queue.stages.find((item) => item.stageId === 'S0_EXISTING_ASSET_REVIEW');
  assert(stage0.jobs?.[0]?.generation === false, 'S0_MUST_NOT_GENERATE');
  assert(stage0.jobs?.[0]?.issue === 155, 'S0_ISSUE');

  assert(panels.schemaVersion === 1, 'PANEL_SCHEMA');
  assert(panels.status === 'RENDER_MATRIX_PREPARED_IMAGES_BLOCKED', 'PANEL_STATUS');
  assert(panels.episode?.id === 'ep001', 'PANEL_EPISODE_ID');
  assert(panels.episode?.panelCount === 8, 'PANEL_DECLARED_COUNT');
  assert(Array.isArray(panels.panels) && panels.panels.length === 8, 'PANEL_COUNT');
  const panelIds = panels.panels.map((panel) => panel.panelId);
  assert(unique(panelIds), 'PANEL_DUPLICATE_ID');
  assert(panelIds.join('|') === expectedPanelIds.join('|'), 'PANEL_ORDER');
  assert(Math.abs(sum(panels.panels.map((panel) => panel.durationSeconds)) - 45.5) < 0.0001, 'PANEL_DURATION_TOTAL');
  assert(panels.globalNegative?.includes('readable sign'), 'PANEL_TEXT_GUARD');
  assert(panels.globalNegative?.includes('protected-franchise imitation'), 'PANEL_IP_GUARD');

  for (const panel of panels.panels) {
    assert(
      Array.isArray(panel.characterIds)
        && panel.characterIds.length > 0
        && panel.characterIds.every((id) => expectedCharacterIds.includes(id)),
      'PANEL_UNKNOWN_CHARACTER',
      panel.panelId
    );
    assert(expectedLocationIds.includes(panel.locationId), 'PANEL_UNKNOWN_LOCATION', panel.panelId);
    assert(typeof panel.promptTemplate === 'string' && panel.promptTemplate.includes('{{GLOBAL_PREFIX}}'), 'PANEL_PROMPT_TEMPLATE', panel.panelId);
    assert(Array.isArray(panel.qa) && panel.qa.length >= 5, 'PANEL_QA_COUNT', panel.panelId);
    assert(Array.isArray(panel.negativeAdditions) && panel.negativeAdditions.length >= 5, 'PANEL_NEGATIVE_COUNT', panel.panelId);
  }

  const panel8 = panels.panels.find((item) => item.panelId === 'panel_008');
  assert(panel8.negativeAdditions.includes('Don Miau speaking'), 'PANEL8_DON_MIAU_SPEECH_GUARD');

  const stage4 = queue.stages.find((item) => item.stageId === 'S4_EP001_PANEL_RENDER');
  assert(stage4.jobs.length === 8, 'STAGE4_JOB_COUNT');
  assert(stage4.jobs.map((job) => job.panelId).join('|') === expectedPanelIds.join('|'), 'STAGE4_PANEL_BINDING');

  assert(panels.renderAcceptance?.candidateLimitPerPanel === 1, 'PANEL_CANDIDATE_LIMIT');
  assert(panels.renderAcceptance?.automaticFinalStatus === false, 'PANEL_AUTO_FINAL_GUARD');
  assert(panels.renderAcceptance?.subtitlesAddedAfterImageGeneration === true, 'PANEL_SUBTITLE_ASSEMBLY_RULE');

  return {
    status: 'LR5_PRODUCTION_PREPARATION_VALID',
    sourcePins: sourcePins.length,
    characters: characters.characters.length,
    locations: locations.locations.length,
    queueStages: queue.stages.length,
    totalJobs: allJobs.length,
    activeJobs: queue.queuePolicy.activeJobs,
    panels: panels.panels.length,
    totalDurationSeconds: sum(panels.panels.map((panel) => panel.durationSeconds)),
    imageGenerationAllowed: preparation.authorization.imageGenerationAllowed,
    automaticMasterApprovals: preparation.truthCounters.automaticMasterApprovals
  };
}

async function main() {
  const pkg = await loadPreparationPackage();
  const summary = await validatePreparationPackage(pkg);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
