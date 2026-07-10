import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildTimingCues, buildTimingReport, exportTiming, formatSrtTimestamp, renderSrt, wrapSubtitle } from '../scripts/export_ep001_timing.mjs';

const blueprintPath = new URL('../project/ep001-animatic-blueprint.json', import.meta.url);
const blueprint = JSON.parse(await readFile(blueprintPath, 'utf8'));

test('SRT timestamp formatting is deterministic', () => {
  assert.equal(formatSrtTimestamp(0), '00:00:00,000');
  assert.equal(formatSrtTimestamp(4.95), '00:00:04,950');
  assert.equal(formatSrtTimestamp(45.5), '00:00:45,500');
});

test('subtitle wrapping respects the mobile two-line contract', () => {
  assert.deepEqual(wrapSubtitle('Die 780 sind eigentlich noch solidarisch gedacht.', 34, 2), [
    'Die 780 sind eigentlich noch',
    'solidarisch gedacht.'
  ]);
  assert.deepEqual(wrapSubtitle('Eigentum an Hummus ist auch Eigentum.', 34, 2), [
    'Eigentum an Hummus ist auch',
    'Eigentum.'
  ]);
  assert.deepEqual(wrapSubtitle('Vermieter ist ein schwieriges Wort.', 34, 2), [
    'Vermieter ist ein schwieriges',
    'Wort.'
  ]);
  assert.throws(() => wrapSubtitle('eins zwei drei vier fünf sechs sieben acht neun zehn elf zwölf dreizehn', 12, 2), /maximum is 2/);
});

test('absolute timing contains ten non-overlapping locked dialogue cues', () => {
  const cues = buildTimingCues(blueprint);
  assert.equal(cues.length, 10);
  assert.equal(cues[0].startSeconds, 4.95);
  assert.equal(cues.at(-1).endSeconds, 42.05);
  assert.ok(cues.every((cue) => cue.source === 'lockedLine'));
  assert.ok(cues.every((cue) => cue.lines.length <= 2));
  assert.ok(cues.every((cue) => cue.lines.every((line) => line.length <= 34)));
  for (let index = 1; index < cues.length; index += 1) {
    assert.ok(cues[index].startSeconds >= cues[index - 1].endSeconds);
  }
});

test('timing report preserves 45.5 seconds and never approves voices or canon', () => {
  const cues = buildTimingCues(blueprint);
  const report = buildTimingReport(blueprint, cues);
  assert.equal(report.status, 'temporary_timing_only');
  assert.equal(report.targetDurationSeconds, 45.5);
  assert.equal(report.panelCount, 8);
  assert.equal(report.subtitleCueCount, 10);
  assert.equal(report.automaticVoiceApproval, false);
  assert.equal(report.automaticCanonApproval, false);
  assert.ok(report.spokenSeconds > 0);
  assert.ok(report.silentOrReactionSeconds > report.spokenSeconds);
  assert.match(report.voiceRule, /neutral temporary readthrough/);
  assert.match(report.renderRule, /does not create audio, images or an animatic render/);
});

test('SRT contains locked dialogue and separate assembly timecodes', () => {
  const srt = renderSrt(buildTimingCues(blueprint));
  assert.match(srt, /00:00:04,950 --> 00:00:07,200/);
  assert.match(srt, /Vermieter ist ein schwieriges\nWort\./);
  assert.match(srt, /Bitte reflektier mal deinen\nKühlschrankanspruch\./);
  assert.match(srt, /00:00:39,850 --> 00:00:42,050/);
  assert.doesNotMatch(srt, /Don Miau/);
});

test('CLI export writes only timing SRT and a non-canonical report', async () => {
  const outputDir = await mkdtemp(path.join(os.tmpdir(), 'ep001-timing-'));
  const result = await exportTiming({ blueprintPath, outputDir });
  const srt = await readFile(result.srtPath, 'utf8');
  const report = JSON.parse(await readFile(result.reportPath, 'utf8'));
  assert.match(srt, /Ich brauch nur WLAN und Ruhe\./);
  assert.equal(report.status, 'temporary_timing_only');
  assert.equal(report.automaticVoiceApproval, false);
  assert.equal(report.automaticCanonApproval, false);
  assert.equal(path.basename(result.srtPath), 'ep001-timing-draft.srt');
  assert.equal(path.basename(result.reportPath), 'ep001-timing-report.json');
});
