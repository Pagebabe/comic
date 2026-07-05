import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import outputStructure from '../src/data/outputStructure.json' assert { type: 'json' };

const root = process.cwd();
const sceneIds = ['ep001_scene_001', 'ep001_scene_002', 'ep001_scene_003', 'ep001_scene_004'];

function materializePath(template, sceneId) {
  return template.replace('{scene_id}', sceneId);
}

function createManifest(folderPath, manifestName, stage, sceneId = null) {
  const manifestPath = join(folderPath, manifestName);
  if (existsSync(manifestPath)) return;

  const manifest = {
    episode_id: outputStructure.episode_id,
    scene_id: sceneId,
    stage,
    assets: [],
    created_by: 'setupOutputs.mjs',
    notes: 'Generated manifest. Add approved assets here after review.'
  };

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
}

for (const folder of outputStructure.folders) {
  const hasSceneToken = folder.path.includes('{scene_id}');
  const targets = hasSceneToken ? sceneIds : [null];

  for (const sceneId of targets) {
    const relativePath = hasSceneToken ? materializePath(folder.path, sceneId) : folder.path;
    const absolutePath = join(root, relativePath);
    mkdirSync(absolutePath, { recursive: true });
    createManifest(absolutePath, folder.manifest, folder.id, sceneId);
    console.log(`created ${relativePath}/${folder.manifest}`);
  }
}

console.log('\nOutput structure ready.');
