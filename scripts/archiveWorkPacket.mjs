import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const force = process.argv.includes('--force');
const packetPath = join(root, 'outputs', 'pilot', 'work-packet', 'ep001_next_work_packet.json');
const progressPath = join(root, 'outputs', 'pilot', 'work-packet', 'ep001_work_packet_progress.json');
const archiveDir = join(root, 'outputs', 'pilot', 'work-packet', 'archive');
const indexPath = join(archiveDir, 'ep001_work_packet_archive.json');

if (!existsSync(packetPath)) {
  console.error('Next work packet not found. Run npm run create:work-packet first.');
  process.exit(1);
}

if (!existsSync(progressPath)) {
  console.error('Work progress not found. Run npm run create:work-progress first.');
  process.exit(1);
}

const packet = JSON.parse(readFileSync(packetPath, 'utf8'));
const progress = JSON.parse(readFileSync(progressPath, 'utf8'));
const isDone = progress.counts?.done === progress.counts?.total && progress.counts?.total > 0;

if (!isDone && !force) {
  console.error('Work packet is not complete. Use --force to archive anyway.');
  process.exit(1);
}

const safeTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
const shotId = packet.shot?.tv_shot_id ?? 'unknown_shot';
const archiveFile = join(archiveDir, `${shotId}_${safeTimestamp}.json`);
const archiveEntry = {
  id: `archive_${shotId}_${Date.now()}`,
  episode_id: packet.episode_id ?? 'ep001',
  shot_id: shotId,
  archived_at: new Date().toISOString(),
  forced: force,
  final_status: progress.overall_status ?? (isDone ? 'done' : 'open'),
  counts: progress.counts,
  file: archiveFile.replace(`${root}/`, ''),
  packet,
  progress
};

mkdirSync(archiveDir, { recursive: true });
writeFileSync(archiveFile, JSON.stringify(archiveEntry, null, 2), 'utf8');

const index = existsSync(indexPath)
  ? JSON.parse(readFileSync(indexPath, 'utf8'))
  : { id: 'work_packet_archive_index_v1', episode_id: 'ep001', entries: [] };

index.entries.push({
  id: archiveEntry.id,
  shot_id: shotId,
  archived_at: archiveEntry.archived_at,
  forced: force,
  final_status: archiveEntry.final_status,
  counts: archiveEntry.counts,
  file: archiveEntry.file
});
index.updated_at = archiveEntry.archived_at;
writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf8');

console.log(`archived ${shotId}`);
console.log(archiveEntry.file);
console.log('updated outputs/pilot/work-packet/archive/ep001_work_packet_archive.json');
