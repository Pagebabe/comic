import { mkdir, writeFile } from 'node:fs/promises';
import { runSyntheticShadowDemo } from './fixture.mjs';

const outputPath = new URL('../output/growth-os/mkt0-shadow-demo.json', import.meta.url);
const result = runSyntheticShadowDemo();

await mkdir(new URL('../output/growth-os/', import.meta.url), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({
  status: 'SHADOW_DEMO_WRITTEN',
  output: 'output/growth-os/mkt0-shadow-demo.json',
  classification: result.analysis.classification,
  growthScore: result.analysis.score,
  auditValid: result.auditValid,
  liveActionsExecuted: result.liveActionsExecuted
}, null, 2));
