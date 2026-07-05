import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import shotBriefs from '../src/data/pilotShotBriefs.json' assert { type: 'json' };
import template from '../src/data/promptExportTemplate.json' assert { type: 'json' };

const root = process.cwd();
const outRoot = join(root, template.output_root);
mkdirSync(outRoot, { recursive: true });

const index = shotBriefs
  .slice()
  .sort((a, b) => a.priority - b.priority)
  .map((brief) => {
    const base = `${brief.priority}_${brief.tv_shot_id}`;
    const cleanPath = join(outRoot, `${base}_clean_prompt.txt`);
    const negativePath = join(outRoot, `${base}_negative_prompt.txt`);
    const metaPath = join(outRoot, `${base}_meta.json`);

    const cleanText = [
      `SHOT: ${brief.tv_shot_id}`,
      `TITLE: ${brief.title}`,
      `TARGET: ${brief.target_path}`,
      '',
      brief.clean_prompt
    ].join('\n');

    const negativeText = [
      `SHOT: ${brief.tv_shot_id}`,
      `TITLE: ${brief.title}`,
      '',
      brief.negative_prompt
    ].join('\n');

    const meta = {
      id: brief.id,
      episode_id: brief.episode_id,
      scene_id: brief.scene_id,
      tv_shot_id: brief.tv_shot_id,
      title: brief.title,
      priority: brief.priority,
      target_path: brief.target_path,
      clean_prompt_file: cleanPath.replace(`${root}/`, ''),
      negative_prompt_file: negativePath.replace(`${root}/`, '')
    };

    writeFileSync(cleanPath, cleanText, 'utf8');
    writeFileSync(negativePath, negativeText, 'utf8');
    writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8');

    return {
      ...meta,
      meta_file: metaPath.replace(`${root}/`, '')
    };
  });

const report = {
  id: template.id,
  episode_id: 'ep001',
  created_at: new Date().toISOString(),
  count: index.length,
  output_root: template.output_root,
  prompts: index
};

writeFileSync(join(root, template.index_output), JSON.stringify(report, null, 2), 'utf8');

console.log(`wrote ${template.index_output}`);
console.log(`Prompt files: ${index.length * 2}`);
console.log(`Meta files: ${index.length}`);
