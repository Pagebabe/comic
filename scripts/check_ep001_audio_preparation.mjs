import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const root = new URL('../', import.meta.url);

const fail = (code, detail = '') => {
  throw new Error(`[EP001_AUDIO_PREPARATION:${code}]${detail ? ` ${detail}` : ''}`);
};

const assert = (condition, code, detail = '') => {
  if (!condition) fail(code, detail);
};

const sorted = (items) => [...items].sort();
const unique = (items) => new Set(items).size === items.length;
const rounded = (value, digits = 3) => Number(value.toFixed(digits));

export const gitBlobSha = (content) => {
  const bytes = Buffer.isBuffer(content) ? content : Buffer.from(content);
  return createHash('sha1')
    .update(Buffer.from(`blob ${bytes.length}\0`))
    .update(bytes)
    .digest('hex');
};

export async function loadAudioPreparationPackage() {
  const paths = {
    voice: 'project/ep001-voice-casting-contract.json',
    cues: 'project/ep001-audio-cue-sheet.json',
    blueprint: 'project/ep001-animatic-blueprint.json',
    ricco: 'project/merge-bibles/ricco.json',
    basti: 'project/merge-bibles/basti-prenzl.json',
    jule: 'project/merge-bibles/jule.json',
    timingExporter: 'scripts/export_ep001_timing.mjs'
  };

  const entries = await Promise.all(Object.entries(paths).map(async ([key, path]) => {
    const raw = await readFile(new URL(path, root));
    const json = path.endsWith('.json') ? JSON.parse(raw.toString('utf8')) : null;
    return [key, { path, raw, json }];
  }));
  return Object.fromEntries(entries);
}

function expectedCuesFromBlueprint(blueprint) {
  const cues = [];
  let panelOffset = 0;
  for (const panel of blueprint.panels || []) {
    for (const dialogue of panel.dialogue || []) {
      const durationSeconds = rounded(dialogue.endSeconds - dialogue.startSeconds);
      cues.push({
        cueId: `cue_${String(cues.length + 1).padStart(3, '0')}`,
        panelId: panel.panelId,
        speakerId: dialogue.speakerId,
        source: dialogue.source,
        text: dialogue.text,
        panelStartSeconds: dialogue.startSeconds,
        panelEndSeconds: dialogue.endSeconds,
        absoluteStartSeconds: rounded(panelOffset + dialogue.startSeconds),
        absoluteEndSeconds: rounded(panelOffset + dialogue.endSeconds),
        durationSeconds,
        charactersPerSecond: rounded(dialogue.text.length / durationSeconds, 2),
        status: 'TIMING_PREPARED_AUDIO_BLOCKED'
      });
    }
    panelOffset += panel.durationSeconds;
  }
  return { cues, panelDurationTotal: rounded(panelOffset) };
}

function countBySpeaker(cues) {
  return cues.reduce((counts, cue) => {
    counts[cue.speakerId] = (counts[cue.speakerId] || 0) + 1;
    return counts;
  }, {});
}

function stable(value) {
  return JSON.stringify(value);
}

export async function validateAudioPreparation(pkg, { verifySourcePins = true } = {}) {
  const voice = pkg.voice.json;
  const cueSheet = pkg.cues.json;
  const blueprint = pkg.blueprint.json;
  const bibles = {
    char_ricco: pkg.ricco.json,
    char_basti: pkg.basti.json,
    char_jule: pkg.jule.json
  };

  assert(voice.schemaVersion === 1, 'VOICE_SCHEMA');
  assert(voice.repository === 'Pagebabe/comic', 'VOICE_REPOSITORY');
  assert(voice.status === 'PREPARED_AUDIO_GENERATION_BLOCKED', 'VOICE_STATUS');
  assert(voice.episode?.id === 'ep001', 'VOICE_EPISODE');
  assert(voice.episode?.targetDurationSeconds === 45.5, 'VOICE_DURATION');
  assert(voice.episode?.dialogueCueCount === 10, 'VOICE_CUE_COUNT');

  const sourcePins = voice.sourcePins || [];
  assert(sourcePins.length === 5, 'SOURCE_PIN_COUNT', String(sourcePins.length));
  assert(unique(sourcePins.map((pin) => pin.path)), 'SOURCE_PIN_DUPLICATE');
  assert(sourcePins.every((pin) => /^[a-f0-9]{40}$/.test(pin.blobSha)), 'SOURCE_PIN_FORMAT');

  if (verifySourcePins) {
    for (const pin of sourcePins) {
      const content = await readFile(new URL(pin.path, root));
      const actual = gitBlobSha(content);
      assert(actual === pin.blobSha, 'SOURCE_PIN_MISMATCH', `${pin.path} expected=${pin.blobSha} actual=${actual}`);
    }
  }

  const authorization = voice.authorization || {};
  for (const key of [
    'voiceContractPreparationAllowed',
    'cueSheetPreparationAllowed',
    'audioQaPreparationAllowed',
    'temporaryNeutralReadthroughAllowed'
  ]) {
    assert(authorization[key] === true, 'PREPARATION_AUTHORIZATION_MISSING', key);
  }
  for (const key of [
    'humanAuditionRecordingAllowed',
    'ttsGenerationAllowed',
    'voiceCloningAllowed',
    'providerPinned',
    'modelPinned',
    'voiceIdPinned',
    'finalMixAllowed',
    'publishingAllowed',
    'automaticVoiceApprovalAllowed',
    'automaticCanonApprovalAllowed'
  ]) {
    assert(authorization[key] === false, 'UNSAFE_AUTHORIZATION', key);
  }

  const rights = voice.rightsAndSafety || {};
  assert(rights.performerConsentRequired === true, 'PERFORMER_CONSENT_RULE');
  assert(rights.usageGrantRequired === true, 'USAGE_GRANT_RULE');
  assert(rights.voiceCloningRequiresSeparateWrittenAuthorization === true, 'CLONE_WRITTEN_AUTH_RULE');
  assert(rights.voiceCloningAuthorized === false, 'VOICE_CLONING_AUTHORIZED');
  assert(rights.celebrityOrRealPersonImitationAllowed === false, 'REAL_PERSON_IMITATION_ALLOWED');
  assert(rights.unlicensedVoiceReuseAllowed === false, 'UNLICENSED_VOICE_REUSE');
  assert(rights.biometricVoiceProfileRetentionAllowed === false, 'BIOMETRIC_RETENTION');
  assert(rights.temporaryReadthroughMayTrainModel === false, 'TEMP_READTHROUGH_TRAINING');

  const temporary = voice.temporaryReadthroughPolicy || {};
  assert(temporary.status === 'ALLOWED_FOR_TIMING_ONLY', 'TEMP_READTHROUGH_STATUS');
  assert(temporary.maximumVariantsPerLine === 1, 'TEMP_VARIANT_LIMIT');
  assert(temporary.mustBeNeutral === true, 'TEMP_NEUTRAL_RULE');
  assert(temporary.mayBePublished === false, 'TEMP_PUBLISHING');
  assert(temporary.mayBecomeVoiceMaster === false, 'TEMP_BECOMES_MASTER');
  assert(temporary.mayTrainVoiceModel === false, 'TEMP_TRAINS_MODEL');
  assert(temporary.mustBeReplacedBeforeFinalMix === true, 'TEMP_REPLACEMENT_RULE');
  assert(temporary.automaticApproval === false, 'TEMP_AUTO_APPROVAL');

  const technical = voice.technicalDelivery || {};
  assert(technical.sampleRateHz === 48000, 'SAMPLE_RATE');
  assert(technical.bitDepth === 24, 'BIT_DEPTH');
  assert(technical.dialogueFormat === 'dry mono WAV', 'DIALOGUE_FORMAT');
  assert(technical.integratedLoudnessTargetLufs === -16, 'LOUDNESS_TARGET');
  assert(technical.integratedLoudnessToleranceLu === 1, 'LOUDNESS_TOLERANCE');
  assert(technical.truePeakMaximumDbtp === -1, 'TRUE_PEAK_MAX');
  assert(technical.clippingAllowed === false, 'CLIPPING_ALLOWED');
  assert(technical.finalMasterStatus === 'BLOCKED', 'FINAL_MASTER_STATUS');

  const casting = voice.castingPolicy || {};
  assert(casting.maximumAuditionsPerSpeaker === 3, 'AUDITION_LIMIT');
  assert(casting.provider === null, 'PROVIDER_PINNED');
  assert(casting.model === null, 'MODEL_PINNED');
  assert(casting.voiceId === null, 'VOICE_ID_PINNED');
  assert(casting.humanDecisionRequired === true, 'HUMAN_DECISION_RULE');
  assert(casting.auditionFilesBecomeMastersAutomatically === false, 'AUDITION_AUTO_MASTER');

  const expectedSpeakerIds = ['char_basti', 'char_jule', 'char_ricco'];
  const speakers = voice.speakers || [];
  assert(speakers.length === 3, 'SPEAKER_COUNT', String(speakers.length));
  assert(unique(speakers.map((speaker) => speaker.id)), 'SPEAKER_DUPLICATE');
  assert(sorted(speakers.map((speaker) => speaker.id)).join('|') === expectedSpeakerIds.join('|'), 'SPEAKER_IDS');

  for (const speaker of speakers) {
    const bible = bibles[speaker.id];
    assert(Boolean(bible), 'UNKNOWN_SPEAKER', speaker.id);
    assert(speaker.name === bible.canonicalName, 'SPEAKER_NAME', speaker.id);
    assert(speaker.age === bible.age, 'SPEAKER_AGE', speaker.id);
    assert(speaker.speechStyle === bible.speech.style, 'SPEECH_STYLE_DRIFT', speaker.id);
    assert(speaker.speechRhythm === bible.speech.rhythm, 'SPEECH_RHYTHM_DRIFT', speaker.id);
    assert(speaker.voiceDirection === bible.voiceDirection, 'VOICE_DIRECTION_DRIFT', speaker.id);
    assert(speaker.status === 'VOICE_CASTING_PREPARED_SAMPLE_BLOCKED', 'SPEAKER_STATUS', speaker.id);
    assert(speaker.voiceMasterReference === null, 'VOICE_MASTER_BOUND_EARLY', speaker.id);
    assert(speaker.approved === false, 'VOICE_APPROVED_EARLY', speaker.id);
    assert(Array.isArray(speaker.performanceGuards) && speaker.performanceGuards.length >= 4, 'PERFORMANCE_GUARDS', speaker.id);
    assert(Array.isArray(speaker.auditionLines) && speaker.auditionLines.length === speaker.expectedEpisodeCueCount, 'AUDITION_LINE_COUNT', speaker.id);
  }

  const nonSpeaking = voice.nonSpeakingCharacters || [];
  assert(nonSpeaking.length === 1, 'NON_SPEAKING_COUNT');
  const donMiau = nonSpeaking[0];
  assert(donMiau.id === 'char_don_miau', 'DON_MIAU_ID');
  assert(donMiau.humanVoiceAllowed === false, 'DON_MIAU_HUMAN_VOICE');
  assert(donMiau.innerMonologueAllowed === false, 'DON_MIAU_INNER_MONOLOGUE');
  assert(donMiau.speechBubbleAllowed === false, 'DON_MIAU_SPEECH_BUBBLE');
  assert(donMiau.intelligibleVocalizationAllowed === false, 'DON_MIAU_INTELLIGIBLE_VOICE');

  const mutti = voice.offscreenPresence?.mutti;
  assert(mutti?.characterIdCreated === false, 'MUTTI_CHARACTER_CREATED');
  assert(mutti?.intelligibleCounterDialogueAllowed === false, 'MUTTI_COUNTER_DIALOGUE');
  assert(mutti?.voiceMasterRequired === false, 'MUTTI_MASTER_REQUIRED');

  const expectedStemIds = ['DX_RICCO', 'DX_BASTI', 'DX_JULE', 'ROOMTONE', 'SFX', 'MUSIC_TEMP', 'MASTER'];
  assert((voice.stemPlan || []).map((stem) => stem.stemId).join('|') === expectedStemIds.join('|'), 'STEM_PLAN');
  assert(voice.stemPlan.every((stem) => stem.status === 'EMPTY_BLOCKED'), 'STEM_NOT_BLOCKED');

  const gates = voice.reviewGates || [];
  assert(gates.length === 5, 'REVIEW_GATE_COUNT');
  assert(gates.find((gate) => gate.id === 'TIMING_READTHROUGH')?.status === 'READY_WITH_NEUTRAL_PLACEHOLDER_ONLY', 'TIMING_GATE');
  assert(gates.filter((gate) => gate.id !== 'TIMING_READTHROUGH').every((gate) => gate.status === 'BLOCKED'), 'REVIEW_GATE_OPEN_EARLY');

  const counters = voice.truthCounters || {};
  assert(counters.voiceMasters === '0/3', 'VOICE_MASTER_COUNTER');
  for (const key of [
    'generatedAudioFiles',
    'voiceClones',
    'approvedAuditions',
    'finalMixes',
    'automaticVoiceApprovals',
    'automaticCanonApprovals'
  ]) {
    assert(counters[key] === 0, 'NONZERO_COUNTER', key);
  }

  assert(cueSheet.schemaVersion === 1, 'CUE_SCHEMA');
  assert(cueSheet.repository === 'Pagebabe/comic', 'CUE_REPOSITORY');
  assert(cueSheet.status === 'CUE_SHEET_PREPARED_AUDIO_BLOCKED', 'CUE_STATUS');
  assert(cueSheet.episode?.id === 'ep001', 'CUE_EPISODE');
  assert(cueSheet.episode?.targetDurationSeconds === 45.5, 'CUE_EPISODE_DURATION');

  const cuePolicy = cueSheet.policy || {};
  assert(cuePolicy.sourceBoundDialogueOnly === true, 'CUE_SOURCE_BOUND_RULE');
  assert(cuePolicy.automaticAudioExecution === false, 'CUE_AUTO_EXECUTION');
  assert(cuePolicy.automaticVoiceApproval === false, 'CUE_AUTO_VOICE_APPROVAL');
  assert(cuePolicy.automaticCanonApproval === false, 'CUE_AUTO_CANON_APPROVAL');
  assert(cuePolicy.maximumCharactersPerSecond === 17, 'CUE_CPS_LIMIT');
  assert(cuePolicy.overlapAllowed === false, 'CUE_OVERLAP_ALLOWED');
  assert(cuePolicy.subtitlesRemainSeparate === true, 'CUE_SUBTITLE_SEPARATION');
  assert(cuePolicy.donMiauHumanVoiceAllowed === false, 'CUE_DON_MIAU_VOICE');

  const expected = expectedCuesFromBlueprint(blueprint);
  assert(expected.panelDurationTotal === 45.5, 'BLUEPRINT_DURATION');
  const actualCues = cueSheet.dialogueCues || [];
  assert(actualCues.length === 10, 'DIALOGUE_CUE_COUNT', String(actualCues.length));
  assert(stable(actualCues) === stable(expected.cues), 'DIALOGUE_CUE_DRIFT');

  let previousEnd = 0;
  for (const cue of actualCues) {
    assert(expectedSpeakerIds.includes(cue.speakerId), 'UNKNOWN_CUE_SPEAKER', cue.speakerId);
    assert(cue.speakerId !== 'char_don_miau', 'DON_MIAU_DIALOGUE_CUE');
    assert(cue.source === 'sourceBoundCandidateLine', 'CUE_SOURCE', cue.cueId);
    assert(cue.absoluteStartSeconds >= previousEnd, 'CUE_OVERLAP', cue.cueId);
    assert(cue.charactersPerSecond <= 17, 'CUE_TOO_FAST', cue.cueId);
    previousEnd = cue.absoluteEndSeconds;
  }

  const spokenSeconds = rounded(actualCues.reduce((sum, cue) => sum + cue.durationSeconds, 0));
  const silentSeconds = rounded(45.5 - spokenSeconds);
  const maximumCps = Math.max(...actualCues.map((cue) => cue.charactersPerSecond));
  const speakerCounts = countBySpeaker(actualCues);
  assert(spokenSeconds === 22.95, 'SPOKEN_SECONDS', String(spokenSeconds));
  assert(silentSeconds === 22.55, 'SILENT_SECONDS', String(silentSeconds));
  assert(maximumCps === 16.61, 'MAXIMUM_CPS', String(maximumCps));
  assert(stable(speakerCounts) === stable({ char_basti: 4, char_ricco: 4, char_jule: 2 }), 'SPEAKER_CUE_COUNTS', stable(speakerCounts));

  const summary = cueSheet.summary || {};
  assert(summary.dialogueCueCount === 10, 'SUMMARY_CUE_COUNT');
  assert(summary.spokenSeconds === 22.95, 'SUMMARY_SPOKEN_SECONDS');
  assert(summary.silentOrReactionSeconds === 22.55, 'SUMMARY_SILENT_SECONDS');
  assert(summary.maximumCharactersPerSecond === 16.61, 'SUMMARY_MAX_CPS');
  assert(Array.isArray(summary.cuesAboveMaximumCharactersPerSecond) && summary.cuesAboveMaximumCharactersPerSecond.length === 0, 'SUMMARY_FAST_CUES');
  assert(stable(summary.speakerCueCounts) === stable({ char_ricco: 4, char_basti: 4, char_jule: 2 }), 'SUMMARY_SPEAKER_COUNTS');
  assert(summary.donMiauCueCount === 0, 'SUMMARY_DON_MIAU_CUES');

  const soundBeds = cueSheet.soundBeds || [];
  assert(soundBeds.length === 8, 'SOUND_BED_COUNT');
  assert(soundBeds.map((bed) => bed.panelId).join('|') === blueprint.panels.map((panel) => panel.panelId).join('|'), 'SOUND_BED_PANEL_ORDER');
  assert(soundBeds.every((bed) => Array.isArray(bed.soundCues) && bed.soundCues.length >= 1), 'SOUND_BED_CUES');

  assert(Array.isArray(cueSheet.assemblyOrder) && cueSheet.assemblyOrder.length >= 7, 'ASSEMBLY_ORDER');
  assert(Array.isArray(cueSheet.deliverablesWhenAuthorized) && cueSheet.deliverablesWhenAuthorized.length >= 5, 'DELIVERABLE_PLAN');

  return {
    status: 'EP001_AUDIO_PREPARATION_VALID',
    sourcePins: sourcePins.length,
    speakers: speakers.length,
    cues: actualCues.length,
    spokenSeconds,
    silentOrReactionSeconds: silentSeconds,
    maximumCharactersPerSecond: maximumCps,
    voiceMasters: counters.voiceMasters,
    generatedAudioFiles: counters.generatedAudioFiles,
    automaticVoiceApprovals: counters.automaticVoiceApprovals
  };
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  const result = await validateAudioPreparation(await loadAudioPreparationPackage());
  console.log(JSON.stringify(result));
}
