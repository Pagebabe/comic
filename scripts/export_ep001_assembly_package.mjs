import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { renderSrt } from './export_ep001_timing.mjs';

const root = new URL('../', import.meta.url);
const defaultOutputDir = new URL('../output/ep001-assembly/', import.meta.url);

const fail = (code, detail = '') => {
  throw new Error(`[EP001_ASSEMBLY:${code}]${detail ? ` ${detail}` : ''}`);
};

const assert = (condition, code, detail = '') => {
  if (!condition) fail(code, detail);
};

const stable = (value) => JSON.stringify(value);

export const gitBlobSha = (content) => {
  const bytes = Buffer.isBuffer(content) ? content : Buffer.from(content);
  return createHash('sha1')
    .update(Buffer.from(`blob ${bytes.length}\0`))
    .update(bytes)
    .digest('hex');
};

export async function loadAssemblyPackage() {
  const paths = {
    contract: 'project/ep001-assembly-contract.json',
    blueprint: 'project/ep001-animatic-blueprint.json',
    voice: 'project/ep001-voice-casting-contract.json',
    cues: 'project/ep001-audio-cue-sheet.json',
    timingExporter: 'scripts/export_ep001_timing.mjs',
    readiness: 'project/production-readiness-v1.json'
  };
  const entries = await Promise.all(Object.entries(paths).map(async ([key, itemPath]) => {
    const raw = await readFile(new URL(itemPath, root));
    return [key, {
      path: itemPath,
      raw,
      json: itemPath.endsWith('.json') ? JSON.parse(raw.toString('utf8')) : null
    }];
  }));
  return Object.fromEntries(entries);
}

function expectedVisualSlots(blueprint) {
  return blueprint.panels.map((panel) => ({
    slotId: `VIS_${panel.panelId.toUpperCase()}`,
    panelId: panel.panelId,
    durationSeconds: panel.durationSeconds,
    locationId: panel.locationId,
    characterIds: panel.characterIds,
    expectedMediaType: 'image/png',
    expectedPixelWidth: 1080,
    expectedPixelHeight: 1920,
    sourcePath: null,
    sourceSha256: null,
    humanApproved: false,
    reviewIssue: null,
    status: 'BLOCKED_MISSING_APPROVED_MEDIA'
  }));
}

function expectedAudioSlots(voice) {
  return voice.stemPlan.map((stem) => ({
    slotId: stem.stemId,
    expectedMediaType: 'audio/wav',
    sampleRateHz: 48000,
    sourcePath: null,
    sourceSha256: null,
    humanApproved: false,
    rightsRecord: null,
    status: 'BLOCKED_MISSING_APPROVED_MEDIA'
  }));
}

function expectedDialogueCues(blueprint) {
  const result = [];
  let panelOffset = 0;
  for (const panel of blueprint.panels || []) {
    for (const dialogue of panel.dialogue || []) {
      const durationSeconds = Number((dialogue.endSeconds - dialogue.startSeconds).toFixed(3));
      result.push({
        cueId: `cue_${String(result.length + 1).padStart(3, '0')}`,
        panelId: panel.panelId,
        speakerId: dialogue.speakerId,
        source: dialogue.source,
        text: dialogue.text,
        panelStartSeconds: dialogue.startSeconds,
        panelEndSeconds: dialogue.endSeconds,
        absoluteStartSeconds: Number((panelOffset + dialogue.startSeconds).toFixed(3)),
        absoluteEndSeconds: Number((panelOffset + dialogue.endSeconds).toFixed(3)),
        durationSeconds,
        charactersPerSecond: Number((dialogue.text.length / durationSeconds).toFixed(2)),
        status: 'TIMING_PREPARED_AUDIO_BLOCKED'
      });
    }
    panelOffset += panel.durationSeconds;
  }
  return result;
}

function subtitleCues(cueSheet) {
  return cueSheet.dialogueCues.map((cue) => ({
    index: Number(cue.cueId.slice(-3)),
    panelId: cue.panelId,
    speakerId: cue.speakerId,
    text: cue.text,
    lines: wrapSubtitle(cue.text, 34, 2),
    startSeconds: cue.absoluteStartSeconds,
    endSeconds: cue.absoluteEndSeconds,
    durationSeconds: cue.durationSeconds,
    charactersPerSecond: cue.charactersPerSecond
  }));
}

function wrapSubtitle(text, maxCharactersPerLine, maximumLines) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharactersPerLine) {
      current = candidate;
    } else {
      if (!current) fail('SUBTITLE_WORD_TOO_LONG', word);
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  assert(lines.length <= maximumLines, 'SUBTITLE_TOO_MANY_LINES', text);
  return lines;
}

export async function validateAssemblyPackage(pkg, { verifySourcePins = true } = {}) {
  const contract = pkg.contract.json;
  const blueprint = pkg.blueprint.json;
  const voice = pkg.voice.json;
  const cues = pkg.cues.json;
  const readiness = pkg.readiness.json;

  assert(contract.schemaVersion === 1, 'CONTRACT_SCHEMA');
  assert(contract.repository === 'Pagebabe/comic', 'CONTRACT_REPOSITORY');
  assert(contract.status === 'ASSEMBLY_PACKAGE_PREPARED_MEDIA_BLOCKED', 'CONTRACT_STATUS');
  assert(contract.episode?.id === 'ep001', 'EPISODE_ID');
  assert(contract.episode?.durationSeconds === 45.5, 'EPISODE_DURATION');
  assert(contract.episode?.panelCount === 8, 'EPISODE_PANEL_COUNT');

  const sourcePins = contract.sourcePins || [];
  assert(sourcePins.length === 5, 'SOURCE_PIN_COUNT');
  assert(new Set(sourcePins.map((pin) => pin.path)).size === 5, 'SOURCE_PIN_DUPLICATE');
  assert(sourcePins.every((pin) => /^[a-f0-9]{40}$/.test(pin.blobSha)), 'SOURCE_PIN_FORMAT');
  if (verifySourcePins) {
    for (const pin of sourcePins) {
      const content = await readFile(new URL(pin.path, root));
      const actual = gitBlobSha(content);
      assert(actual === pin.blobSha, 'SOURCE_PIN_MISMATCH', `${pin.path} expected=${pin.blobSha} actual=${actual}`);
    }
  }

  const auth = contract.authorization || {};
  for (const key of [
    'manifestExportAllowed',
    'subtitleExportAllowed',
    'renderPlanExportAllowed',
    'handoffChecklistExportAllowed'
  ]) assert(auth[key] === true, 'PREPARATION_AUTHORIZATION_MISSING', key);
  for (const key of [
    'mediaRenderAllowed',
    'ffmpegExecutionAllowed',
    'finalExportAllowed',
    'publishingAllowed',
    'automaticMediaBindingAllowed',
    'automaticFinalApprovalAllowed'
  ]) assert(auth[key] === false, 'UNSAFE_AUTHORIZATION', key);

  const format = contract.format || {};
  assert(format.width === 1080, 'FORMAT_WIDTH');
  assert(format.height === 1920, 'FORMAT_HEIGHT');
  assert(format.aspectRatio === '9:16', 'FORMAT_ASPECT');
  assert(format.fps === 30, 'FORMAT_FPS');
  assert(format.durationSeconds === 45.5, 'FORMAT_DURATION');
  assert(format.audioSampleRateHz === 48000, 'FORMAT_AUDIO_RATE');
  assert(format.audioChannels === 2, 'FORMAT_AUDIO_CHANNELS');
  assert(format.integratedLoudnessTargetLufs === -16, 'FORMAT_LOUDNESS');
  assert(format.truePeakMaximumDbtp === -1, 'FORMAT_TRUE_PEAK');

  assert(blueprint.status === 'blueprint_ready_assets_blocked', 'BLUEPRINT_STATUS');
  assert(blueprint.format?.targetDurationSeconds === 45.5, 'BLUEPRINT_DURATION');
  assert(blueprint.panels?.length === 8, 'BLUEPRINT_PANEL_COUNT');
  assert(voice.status === 'PREPARED_AUDIO_GENERATION_BLOCKED', 'VOICE_STATUS');
  assert(voice.truthCounters?.voiceMasters === '0/3', 'VOICE_MASTER_COUNTER');
  assert(cues.status === 'CUE_SHEET_PREPARED_AUDIO_BLOCKED', 'CUE_STATUS');
  assert(cues.dialogueCues?.length === 10, 'CUE_COUNT');
  assert(readiness.status === 'NOT_PRODUCTION_READY', 'READINESS_STATUS');
  assert(readiness.academyBoundary?.productionReady === false, 'READINESS_PRODUCTION_CLAIM');

  const visualSlots = contract.visualSlots || [];
  assert(visualSlots.length === 8, 'VISUAL_SLOT_COUNT');
  assert(stable(visualSlots) === stable(expectedVisualSlots(blueprint)), 'VISUAL_SLOT_DRIFT');
  for (const slot of visualSlots) {
    assert(slot.sourcePath === null, 'VISUAL_PATH_BOUND_EARLY', slot.panelId);
    assert(slot.sourceSha256 === null, 'VISUAL_HASH_BOUND_EARLY', slot.panelId);
    assert(slot.humanApproved === false, 'VISUAL_APPROVED_EARLY', slot.panelId);
    assert(slot.status === 'BLOCKED_MISSING_APPROVED_MEDIA', 'VISUAL_SLOT_STATUS', slot.panelId);
  }

  const audioSlots = contract.audioSlots || [];
  assert(audioSlots.length === 7, 'AUDIO_SLOT_COUNT');
  assert(stable(audioSlots) === stable(expectedAudioSlots(voice)), 'AUDIO_SLOT_DRIFT');
  for (const slot of audioSlots) {
    assert(slot.sourcePath === null, 'AUDIO_PATH_BOUND_EARLY', slot.slotId);
    assert(slot.sourceSha256 === null, 'AUDIO_HASH_BOUND_EARLY', slot.slotId);
    assert(slot.humanApproved === false, 'AUDIO_APPROVED_EARLY', slot.slotId);
    assert(slot.rightsRecord === null, 'AUDIO_RIGHTS_BOUND_EARLY', slot.slotId);
  }

  const subtitlePlan = contract.subtitlePlan || {};
  assert(subtitlePlan.cueCount === 10, 'SUBTITLE_CUE_COUNT');
  assert(subtitlePlan.maximumLines === 2, 'SUBTITLE_LINE_LIMIT');
  assert(subtitlePlan.maximumCharactersPerLine === 34, 'SUBTITLE_CHARACTER_LIMIT');
  assert(subtitlePlan.maximumCharactersPerSecond === 17, 'SUBTITLE_CPS_LIMIT');
  assert(subtitlePlan.speakerLabels === false, 'SUBTITLE_SPEAKER_LABELS');
  assert(subtitlePlan.burnedIntoSourceImages === false, 'SUBTITLE_SOURCE_BURNIN');
  assert(subtitlePlan.sourcePath === null, 'SUBTITLE_PATH_BOUND_EARLY');
  assert(subtitlePlan.sourceSha256 === null, 'SUBTITLE_HASH_BOUND_EARLY');
  assert(subtitlePlan.status === 'DETERMINISTIC_EXPORT_PREPARED', 'SUBTITLE_STATUS');

  const expectedCueIds = Array.from({ length: 10 }, (_, index) => `cue_${String(index + 1).padStart(3, '0')}`);
  assert(cues.dialogueCues.map((cue) => cue.cueId).join('|') === expectedCueIds.join('|'), 'CUE_ORDER');
  assert(stable(cues.dialogueCues) === stable(expectedDialogueCues(blueprint)), 'CUE_SHEET_DRIFT');
  assert(cues.dialogueCues.every((cue) => cue.charactersPerSecond <= 17), 'CUE_TOO_FAST');
  assert(cues.dialogueCues.every((cue) => cue.speakerId !== 'char_don_miau'), 'DON_MIAU_DIALOGUE');
  const generatedSubtitleCues = subtitleCues(cues);
  assert(generatedSubtitleCues.length === 10, 'GENERATED_SUBTITLE_COUNT');

  const renderPlan = contract.renderPlan || {};
  assert(renderPlan.executable === false, 'RENDER_PLAN_EXECUTABLE');
  assert(renderPlan.shellCommandStored === false, 'SHELL_COMMAND_STORED');
  assert(Array.isArray(renderPlan.stages) && renderPlan.stages.length === 10, 'RENDER_STAGE_COUNT');

  const expectedDeliverables = [
    'ASSEMBLY_MANIFEST',
    'SUBTITLES',
    'RENDER_PLAN',
    'HANDOFF_CHECKLIST',
    'CLEAN_MASTER',
    'SOCIAL_DELIVERY',
    'CHECKSUMS'
  ];
  assert((contract.deliverables || []).map((item) => item.id).join('|') === expectedDeliverables.join('|'), 'DELIVERABLE_IDS');
  assert(contract.deliverables.filter((item) => ['CLEAN_MASTER', 'SOCIAL_DELIVERY', 'CHECKSUMS'].includes(item.id)).every((item) => item.status.startsWith('BLOCKED_')), 'MEDIA_DELIVERABLE_OPEN_EARLY');

  const gates = contract.qualityGates || [];
  assert(gates.length === 7, 'QUALITY_GATE_COUNT');
  assert(gates.find((gate) => gate.id === 'SUBTITLE_QA')?.status === 'PREPARED_NOT_EXECUTED', 'SUBTITLE_GATE_STATUS');
  assert(gates.filter((gate) => gate.id !== 'SUBTITLE_QA').every((gate) => gate.status === 'BLOCKED'), 'QUALITY_GATE_OPEN_EARLY');

  const counters = contract.truthCounters || {};
  assert(counters.visualSlotsBound === 0, 'VISUAL_BOUND_COUNTER');
  assert(counters.visualSlotsRequired === 8, 'VISUAL_REQUIRED_COUNTER');
  assert(counters.voiceMasters === '0/3', 'ASSEMBLY_VOICE_COUNTER');
  assert(counters.audioSlotsBound === 0, 'AUDIO_BOUND_COUNTER');
  assert(counters.audioSlotsRequired === 7, 'AUDIO_REQUIRED_COUNTER');
  for (const key of [
    'subtitleFilesGenerated',
    'renderPlansGenerated',
    'videoFilesGenerated',
    'finishedEpisodes',
    'automaticMediaBindings',
    'automaticFinalApprovals'
  ]) assert(counters[key] === 0, 'NONZERO_TRUTH_COUNTER', key);

  return {
    status: 'EP001_ASSEMBLY_PREPARATION_VALID',
    sourcePins: 5,
    visualSlots: 8,
    audioSlots: 7,
    subtitleCues: generatedSubtitleCues.length,
    durationSeconds: 45.5,
    renderExecutable: false,
    finishedEpisodes: 0,
    automaticFinalApprovals: 0
  };
}

function buildManifest(pkg) {
  const contract = pkg.contract.json;
  return {
    schemaVersion: 1,
    status: 'MEDIA_BLOCKED',
    repository: 'Pagebabe/comic',
    episode: contract.episode,
    format: contract.format,
    visualSlots: contract.visualSlots,
    audioSlots: contract.audioSlots,
    subtitle: {
      fileName: 'ep001-subtitles.srt',
      cueCount: contract.subtitlePlan.cueCount,
      sourceSha256: null,
      status: 'GENERATED_TIMING_ARTIFACT_NOT_MEDIA_MASTER'
    },
    missingRequirements: {
      visualSlots: 8,
      audioSlots: 7,
      voiceMasters: 3,
      finalHumanDecision: true
    },
    mediaRenderAllowed: false,
    finalExportAllowed: false,
    publishingAllowed: false,
    automaticFinalApprovals: 0
  };
}

function buildRenderPlan(pkg) {
  const contract = pkg.contract.json;
  return {
    schemaVersion: 1,
    status: 'DECLARATIVE_PLAN_MEDIA_BLOCKED',
    executable: false,
    engine: contract.renderPlan.engine,
    shellCommand: null,
    inputBindingRequired: true,
    sourceHashVerificationRequired: true,
    humanApprovalVerificationRequired: true,
    stages: contract.renderPlan.stages.map((description, index) => ({
      stage: index + 1,
      description,
      status: 'BLOCKED_OR_PREPARATION_ONLY'
    })),
    expectedOutputs: contract.deliverables.map((item) => ({
      id: item.id,
      fileName: item.fileName,
      status: item.status
    })),
    automaticFinalApproval: false
  };
}

function buildHandoffChecklist(pkg) {
  const contract = pkg.contract.json;
  const lines = [
    '# EP001 Handoff Checklist',
    '',
    'Status: `MEDIA_BLOCKED`',
    '',
    '## Required media bindings',
    '',
    ...contract.visualSlots.map((slot) => `- [ ] ${slot.panelId}: approved path, SHA-256 and visual review record`),
    ...contract.audioSlots.map((slot) => `- [ ] ${slot.slotId}: approved path, SHA-256, rights record and audio review`),
    '',
    '## Required deterministic artifacts',
    '',
    '- [x] `ep001-subtitles.srt` generated from source-bound cues',
    '- [x] `ep001-assembly-manifest.json` generated',
    '- [x] `ep001-render-plan.json` generated with `executable=false`',
    '- [ ] clean master rendered and hashed',
    '- [ ] social burn-in delivery rendered and hashed',
    '- [ ] `SHA256SUMS.txt` written after media exists',
    '',
    '## Final human gates',
    '',
    '- [ ] visual continuity review',
    '- [ ] voice and dialogue review',
    '- [ ] SFX, room tone and music review',
    '- [ ] subtitle readability and safe-area review',
    '- [ ] duration, resolution, fps, loudness and true-peak QA',
    '- [ ] explicit final handoff decision',
    '',
    'No unchecked item may be inferred as complete.'
  ];
  return `${lines.join('\n')}\n`;
}

export async function exportAssemblyPackage({ outputDir, pkg = null }) {
  const loaded = pkg || await loadAssemblyPackage();
  const summary = await validateAssemblyPackage(loaded);
  const cues = subtitleCues(loaded.cues.json);
  await mkdir(outputDir, { recursive: true });
  const files = {
    manifest: path.join(outputDir, 'ep001-assembly-manifest.json'),
    subtitles: path.join(outputDir, 'ep001-subtitles.srt'),
    renderPlan: path.join(outputDir, 'ep001-render-plan.json'),
    checklist: path.join(outputDir, 'ep001-handoff-checklist.md')
  };
  await writeFile(files.manifest, `${JSON.stringify(buildManifest(loaded), null, 2)}\n`, 'utf8');
  await writeFile(files.subtitles, renderSrt(cues), 'utf8');
  await writeFile(files.renderPlan, `${JSON.stringify(buildRenderPlan(loaded), null, 2)}\n`, 'utf8');
  await writeFile(files.checklist, buildHandoffChecklist(loaded), 'utf8');
  return { summary, files };
}

function parseArgs(argv) {
  const args = { outputDir: fileURLToPath(defaultOutputDir) };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--output-dir') args.outputDir = argv[++index];
    else fail('UNKNOWN_ARGUMENT', argv[index]);
  }
  return args;
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  const args = parseArgs(process.argv.slice(2));
  const result = await exportAssemblyPackage({ outputDir: path.resolve(args.outputDir) });
  console.log(JSON.stringify({
    status: result.summary.status,
    outputDir: path.resolve(args.outputDir),
    files: result.files,
    renderExecutable: false,
    mediaRenderAllowed: false,
    finishedEpisodes: 0,
    automaticFinalApprovals: 0
  }));
}
