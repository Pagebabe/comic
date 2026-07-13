import assert from 'node:assert/strict';
import test from 'node:test';

import {
  loadAudioPreparationPackage,
  validateAudioPreparation
} from '../scripts/check_ep001_audio_preparation.mjs';

const clonePackage = (pkg) => Object.fromEntries(
  Object.entries(pkg).map(([key, value]) => [
    key,
    {
      ...value,
      raw: Buffer.from(value.raw),
      json: value.json === null ? null : structuredClone(value.json)
    }
  ])
);

const rejectsWith = async (pkg, code) => {
  await assert.rejects(
    () => validateAudioPreparation(pkg, { verifySourcePins: false }),
    new RegExp(`\\[EP001_AUDIO_PREPARATION:${code}\\]`)
  );
};

test('validates the complete blocked EP001 audio preparation package and source pins', async () => {
  const summary = await validateAudioPreparation(await loadAudioPreparationPackage());
  assert.deepEqual(summary, {
    status: 'EP001_AUDIO_PREPARATION_VALID',
    sourcePins: 5,
    speakers: 3,
    cues: 10,
    spokenSeconds: 22.95,
    silentOrReactionSeconds: 22.55,
    maximumCharactersPerSecond: 16.61,
    voiceMasters: '0/3',
    generatedAudioFiles: 0,
    automaticVoiceApprovals: 0
  });
});

test('rejects early TTS or audio-generation authorization', async () => {
  const pkg = clonePackage(await loadAudioPreparationPackage());
  pkg.voice.json.authorization.ttsGenerationAllowed = true;
  await rejectsWith(pkg, 'UNSAFE_AUTHORIZATION');
});

test('rejects voice cloning authorization', async () => {
  const pkg = clonePackage(await loadAudioPreparationPackage());
  pkg.voice.json.rightsAndSafety.voiceCloningAuthorized = true;
  await rejectsWith(pkg, 'VOICE_CLONING_AUTHORIZED');
});

test('rejects a provider pinned before the casting decision', async () => {
  const pkg = clonePackage(await loadAudioPreparationPackage());
  pkg.voice.json.castingPolicy.provider = 'example-provider';
  await rejectsWith(pkg, 'PROVIDER_PINNED');
});

test('rejects automatic voice approval', async () => {
  const pkg = clonePackage(await loadAudioPreparationPackage());
  pkg.voice.json.authorization.automaticVoiceApprovalAllowed = true;
  await rejectsWith(pkg, 'UNSAFE_AUTHORIZATION');
});

test('rejects any human voice for Don Miau', async () => {
  const pkg = clonePackage(await loadAudioPreparationPackage());
  pkg.voice.json.nonSpeakingCharacters[0].humanVoiceAllowed = true;
  await rejectsWith(pkg, 'DON_MIAU_HUMAN_VOICE');
});

test('rejects a Don Miau dialogue cue', async () => {
  const pkg = clonePackage(await loadAudioPreparationPackage());
  pkg.cues.json.dialogueCues[0].speakerId = 'char_don_miau';
  await rejectsWith(pkg, 'DIALOGUE_CUE_DRIFT');
});

test('rejects dialogue text drift from the blueprint', async () => {
  const pkg = clonePackage(await loadAudioPreparationPackage());
  pkg.cues.json.dialogueCues[0].text = 'Neuer Text.';
  await rejectsWith(pkg, 'DIALOGUE_CUE_DRIFT');
});

test('rejects cue timing drift or overlap', async () => {
  const pkg = clonePackage(await loadAudioPreparationPackage());
  pkg.cues.json.dialogueCues[1].absoluteStartSeconds = pkg.cues.json.dialogueCues[0].absoluteStartSeconds;
  await rejectsWith(pkg, 'DIALOGUE_CUE_DRIFT');
});

test('rejects voice direction drift from a merge bible', async () => {
  const pkg = clonePackage(await loadAudioPreparationPackage());
  pkg.voice.json.speakers.find((speaker) => speaker.id === 'char_jule').voiceDirection = 'Schrill und hektisch.';
  await rejectsWith(pkg, 'VOICE_DIRECTION_DRIFT');
});

test('rejects a temporary readthrough becoming a voice master', async () => {
  const pkg = clonePackage(await loadAudioPreparationPackage());
  pkg.voice.json.temporaryReadthroughPolicy.mayBecomeVoiceMaster = true;
  await rejectsWith(pkg, 'TEMP_BECOMES_MASTER');
});

test('rejects speaker-count drift', async () => {
  const pkg = clonePackage(await loadAudioPreparationPackage());
  pkg.voice.json.speakers.pop();
  await rejectsWith(pkg, 'SPEAKER_COUNT');
});
