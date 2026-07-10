import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_BLUEPRINT = new URL('../project/ep001-animatic-blueprint.json', import.meta.url);
const DEFAULT_OUTPUT_DIR = new URL('../output/ep001-readthrough/', import.meta.url);

export function formatSrtTimestamp(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) throw new Error(`Invalid timestamp: ${seconds}`);
  const totalMilliseconds = Math.round(seconds * 1000);
  const hours = Math.floor(totalMilliseconds / 3_600_000);
  const minutes = Math.floor((totalMilliseconds % 3_600_000) / 60_000);
  const secs = Math.floor((totalMilliseconds % 60_000) / 1000);
  const milliseconds = totalMilliseconds % 1000;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
}

export function wrapSubtitle(text, maxCharactersPerLine = 34, maximumLines = 2) {
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  if (!words.length) throw new Error('Subtitle text is empty.');
  const lines = [];
  let current = '';
  for (const word of words) {
    if (word.length > maxCharactersPerLine) throw new Error(`Subtitle word exceeds ${maxCharactersPerLine} characters: ${word}`);
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxCharactersPerLine) {
      current = candidate;
      continue;
    }
    lines.push(current);
    current = word;
  }
  if (current) lines.push(current);
  if (lines.length > maximumLines) {
    throw new Error(`Subtitle needs ${lines.length} lines but maximum is ${maximumLines}: ${text}`);
  }
  return lines;
}

export function buildTimingCues(blueprint) {
  if (blueprint?.status !== 'blueprint_ready_assets_blocked') throw new Error('Unexpected blueprint status.');
  if (!Array.isArray(blueprint.panels) || blueprint.panels.length !== 8) throw new Error('Exactly eight panels are required.');
  const maxCharacters = blueprint.subtitleRules?.maximumCharactersPerLine ?? 34;
  const maxLines = blueprint.subtitleRules?.maximumLines ?? 2;
  const cues = [];
  let panelOffset = 0;
  let previousCueEnd = 0;

  for (const panel of blueprint.panels) {
    for (const dialogue of panel.dialogue || []) {
      const startSeconds = panelOffset + dialogue.startSeconds;
      const endSeconds = panelOffset + dialogue.endSeconds;
      if (startSeconds < previousCueEnd) throw new Error(`Overlapping subtitle cue in ${panel.panelId}.`);
      if (endSeconds > panelOffset + panel.durationSeconds) throw new Error(`Dialogue exceeds panel duration in ${panel.panelId}.`);
      const lines = wrapSubtitle(dialogue.text, maxCharacters, maxLines);
      const durationSeconds = endSeconds - startSeconds;
      cues.push({
        index: cues.length + 1,
        panelId: panel.panelId,
        beat: panel.beat,
        speakerId: dialogue.speakerId,
        source: dialogue.source,
        text: dialogue.text,
        lines,
        startSeconds,
        endSeconds,
        durationSeconds,
        gapBeforeSeconds: startSeconds - previousCueEnd,
        charactersPerSecond: dialogue.text.length / durationSeconds
      });
      previousCueEnd = endSeconds;
    }
    panelOffset += panel.durationSeconds;
  }

  const targetDuration = blueprint.format?.targetDurationSeconds;
  if (Math.abs(panelOffset - targetDuration) > 0.001) throw new Error(`Panel duration total ${panelOffset} does not match target ${targetDuration}.`);
  return cues;
}

export function renderSrt(cues) {
  return `${cues.map((cue) => [
    cue.index,
    `${formatSrtTimestamp(cue.startSeconds)} --> ${formatSrtTimestamp(cue.endSeconds)}`,
    cue.lines.join('\n')
  ].join('\n')).join('\n\n')}\n`;
}

export function buildTimingReport(blueprint, cues) {
  const spokenSeconds = cues.reduce((sum, cue) => sum + cue.durationSeconds, 0);
  const maximumAllowedCharactersPerSecond = blueprint.subtitleRules?.maximumCharactersPerSecond ?? 17;
  const maximumCharactersPerSecond = Math.max(...cues.map((cue) => cue.charactersPerSecond));
  const longCues = cues
    .filter((cue) => cue.charactersPerSecond > maximumAllowedCharactersPerSecond)
    .map((cue) => cue.index);
  return {
    schemaVersion: 1,
    status: 'temporary_timing_only',
    pacingStatus: longCues.length ? 'revision_required' : 'pass',
    automaticVoiceApproval: false,
    automaticCanonApproval: false,
    episodeId: blueprint.episode.id,
    episodeTitle: blueprint.episode.title,
    targetDurationSeconds: blueprint.format.targetDurationSeconds,
    panelCount: blueprint.panels.length,
    subtitleCueCount: cues.length,
    spokenSeconds: Number(spokenSeconds.toFixed(3)),
    silentOrReactionSeconds: Number((blueprint.format.targetDurationSeconds - spokenSeconds).toFixed(3)),
    maximumAllowedCharactersPerSecond,
    maximumCharactersPerSecond: Number(maximumCharactersPerSecond.toFixed(2)),
    cuesAboveMaximumCharactersPerSecond: longCues,
    cuesAbove17CharactersPerSecond: maximumAllowedCharactersPerSecond === 17 ? longCues : [],
    subtitleRules: blueprint.subtitleRules,
    voiceRule: 'Use a neutral temporary readthrough only. No generated or recorded voice becomes canonical through this export.',
    renderRule: 'This export creates timing data and subtitles only. It does not create audio, images or an animatic render.',
    cues
  };
}

function parseArgs(argv) {
  const args = { blueprint: fileURLToPath(DEFAULT_BLUEPRINT), outputDir: fileURLToPath(DEFAULT_OUTPUT_DIR) };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--blueprint') args.blueprint = argv[++index];
    else if (token === '--output-dir') args.outputDir = argv[++index];
    else throw new Error(`Unknown argument: ${token}`);
  }
  return args;
}

export async function exportTiming({ blueprintPath, outputDir }) {
  const blueprint = JSON.parse(await readFile(blueprintPath, 'utf8'));
  const cues = buildTimingCues(blueprint);
  const report = buildTimingReport(blueprint, cues);
  await mkdir(outputDir, { recursive: true });
  const srtPath = path.join(outputDir, 'ep001-timing-draft.srt');
  const reportPath = path.join(outputDir, 'ep001-timing-report.json');
  await writeFile(srtPath, renderSrt(cues), 'utf8');
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return { srtPath, reportPath, report };
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const result = await exportTiming({ blueprintPath: path.resolve(args.blueprint), outputDir: path.resolve(args.outputDir) });
    console.log(JSON.stringify({
      status: 'ok',
      timingStatus: result.report.status,
      pacingStatus: result.report.pacingStatus,
      panelCount: result.report.panelCount,
      subtitleCueCount: result.report.subtitleCueCount,
      targetDurationSeconds: result.report.targetDurationSeconds,
      spokenSeconds: result.report.spokenSeconds,
      maximumCharactersPerSecond: result.report.maximumCharactersPerSecond,
      srtPath: result.srtPath,
      reportPath: result.reportPath,
      automaticVoiceApproval: false,
      automaticCanonApproval: false
    }));
    if (result.report.pacingStatus !== 'pass') process.exitCode = 2;
  } catch (error) {
    console.error(JSON.stringify({ status: 'error', message: error.message }));
    process.exitCode = 1;
  }
}
