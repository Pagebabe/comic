import { test, expect, type Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { deflateSync } from 'node:zlib';

const outputDir = path.resolve(process.env.EPISODE1_OUTPUT_DIR || 'test-results/episode1-proof');
const fixtureDir = path.join(outputDir, 'input-images');
const storageKey = 'ricco-studio-images-v1';
const archiveCommit = '7266cf8df99ad811904933189666bbb827bd3ad1';

const panels = [
  ['panel_001', 1, 'Ankunft'],
  ['panel_002', 2, 'Basti erscheint'],
  ['panel_003', 3, 'Solidarische Nutzungsgebühr'],
  ['panel_004', 4, 'Das Zimmer'],
  ['panel_005', 5, 'Mama ruft an'],
  ['panel_006', 6, 'Hausregeln'],
  ['panel_007', 7, 'Die Küche'],
  ['panel_008', 8, 'Mietrealität']
] as const;

const fixtureNames = [
  'panel_001_v1.png',
  'panel_001_v2.png',
  'panel_002_v1.png',
  'panel_003_v1.png',
  'panel_004_v1.png',
  'panel_005_v1.png',
  'panel_006_v1.png',
  'panel_007_v1.png',
  'panel_008_v1.png'
];

const transitions: Array<{ id: string; status: 'pass' | 'manual' | 'blocked'; detail: string; at: string }> = [];
const record = (id: string, detail: string, status: 'pass' | 'manual' | 'blocked' = 'pass') => transitions.push({ id, status, detail, at: new Date().toISOString() });

function crc32(input: Buffer) {
  let crc = 0xffffffff;
  for (const value of input) {
    crc ^= value;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer) {
  const typeBytes = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
  return Buffer.concat([length, typeBytes, data, checksum]);
}

function makePng(red: number, green: number, blue: number) {
  const width = 96;
  const height = 64;
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const rows: Buffer[] = [];
  for (let y = 0; y < height; y += 1) {
    const row = Buffer.alloc(1 + width * 4);
    row[0] = 0;
    for (let x = 0; x < width; x += 1) {
      const offset = 1 + x * 4;
      const stripe = ((x >> 4) + (y >> 4)) % 2 === 0 ? 0 : 28;
      row[offset] = Math.min(255, red + stripe);
      row[offset + 1] = Math.min(255, green + stripe);
      row[offset + 2] = Math.min(255, blue + stripe);
      row[offset + 3] = 255;
    }
    rows.push(row);
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(Buffer.concat(rows))),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

async function createFixtures() {
  await mkdir(fixtureDir, { recursive: true });
  const colors = [
    [100, 40, 40], [150, 70, 35], [40, 95, 145], [80, 120, 60], [135, 70, 135],
    [70, 135, 125], [145, 115, 45], [70, 75, 145], [130, 65, 90]
  ];
  for (let index = 0; index < fixtureNames.length; index += 1) {
    await writeFile(path.join(fixtureDir, fixtureNames[index]), makePng(...colors[index] as [number, number, number]));
  }
}

async function go(page: Page, route: string) {
  await page.goto(`/#/${route}`, { waitUntil: 'networkidle' });
}

async function choosePanel(page: Page, panelId: string) {
  await page.locator('aside select').first().selectOption(panelId);
}

async function cardForFile(page: Page, fileName: string) {
  const cards = page.locator('article.export-card');
  const count = await cards.count();
  for (let index = 0; index < count; index += 1) {
    const card = cards.nth(index);
    const note = await card.locator('textarea').inputValue();
    if (note.includes(fileName)) return card;
  }
  throw new Error(`Image card not found for ${fileName}`);
}

async function reviewVariant(page: Page, panelId: string, fileName: string, note: string) {
  await choosePanel(page, panelId);
  const card = await cardForFile(page, fileName);
  await card.locator('select').nth(0).selectOption('5');
  await card.locator('select').nth(1).selectOption('5');
  await card.locator('textarea').fill(note);
  await card.getByRole('button', { name: 'Als final wählen' }).click();
  await expect(card.getByText('FINAL')).toBeVisible();
}

function normalizePackage(value: any) {
  const clone = structuredClone(value);
  delete clone.generatedAt;
  if (clone.reviewState?.storedImages) {
    clone.reviewState.storedImages.sort((a: any, b: any) => `${a.panelId}:${a.notes}`.localeCompare(`${b.panelId}:${b.notes}`));
  }
  return clone;
}

test('Episode 1 traverses the complete local production chain without data loss', async ({ browser }) => {
  test.setTimeout(180_000);
  await mkdir(outputDir, { recursive: true });
  await createFixtures();
  const context = await browser.newContext({ acceptDownloads: true });
  let page = await context.newPage();

  await go(page, 'ricco-studio');
  await page.evaluate((key) => localStorage.removeItem(key), storageKey);
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.getByText('#1 Das Zimmer')).toBeVisible();
  await expect(page.getByText('8 Panels')).toBeVisible();
  record('episode_loaded', 'Episode ep_001 Das Zimmer loaded from the existing archive application.');

  const panelLabels = await page.locator('article.card p.eyebrow').allTextContents();
  const numbered = panelLabels.filter((value) => /^Panel \d+$/.test(value));
  expect(numbered).toEqual(panels.map(([, number]) => `Panel ${number}`));
  record('panel_order_verified', 'Eight panels appeared in canonical numeric order.');

  await page.getByRole('button', { name: 'Alle Prompts erzeugen' }).click();
  await expect(page.getByText('8/8 Prompts generated')).toBeVisible();
  await expect(page.locator('span.status-badge', { hasText: 'prompt ready' })).toHaveCount(8);
  record('prompts_generated', 'All eight existing panel prompts were generated and displayed.');

  await go(page, 'ricco-export');
  await expect(page.getByRole('heading', { name: 'Noch nicht exportbereit' })).toBeVisible();
  await expect(page.getByText('8 fehlend')).toBeVisible();
  await expect(page.getByText('MISSING')).toHaveCount(8);
  record('missing_assets_detected', 'Export gate reported all eight missing final images with visible guidance.');

  await go(page, 'ricco-bulk-upload');
  await page.locator('input[type="file"]').setInputFiles(fixtureNames.map((name) => path.join(fixtureDir, name)));
  await expect(page.getByText('9 Dateien geprüft.')).toBeVisible();
  await page.getByRole('button', { name: 'Bereite Dateien speichern' }).click();
  await expect(page.getByText('9 Bilder gespeichert.')).toBeVisible();
  record('images_imported', 'Nine synthetic PNG test files were imported through the existing bulk upload UI.');

  await go(page, 'ricco-image-review');
  await expect(page.getByText('9 Bilder gespeichert')).toBeVisible();
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.getByText('9 Bilder gespeichert')).toBeVisible();
  await expect(page.locator('.image-preview')).toHaveCount(2);
  record('images_survived_reload', 'Imported image previews remained available after a browser reload.');

  await choosePanel(page, 'panel_001');
  const first = await cardForFile(page, 'panel_001_v1.png');
  await first.locator('select').nth(0).selectOption('5');
  await first.locator('select').nth(1).selectOption('5');
  await first.locator('textarea').fill('TEST ASSET ONLY · first selection for replacement proof');
  await first.getByRole('button', { name: 'Als final wählen' }).click();
  await expect(first.getByText('FINAL')).toBeVisible();
  record('first_selection_made', 'Panel 1 variant v1 was selected as final.');

  const replacement = await cardForFile(page, 'panel_001_v2.png');
  await replacement.locator('select').nth(0).selectOption('5');
  await replacement.locator('select').nth(1).selectOption('5');
  await replacement.locator('textarea').fill('TEST ASSET ONLY · approved replacement inside technical proof');
  await replacement.getByRole('button', { name: 'Als final wählen' }).click();
  await expect(replacement.getByText('FINAL')).toBeVisible();
  await expect(first.getByText('VARIANT')).toBeVisible();
  record('selection_changed', 'Panel 1 final selection changed from v1 to v2 and remained exclusive.');

  await go(page, 'ricco-export');
  await expect(page.getByText('7 fehlend')).toBeVisible();

  for (let index = 1; index < panels.length; index += 1) {
    const [panelId, panelNumber] = panels[index];
    await go(page, 'ricco-image-review');
    await reviewVariant(page, panelId, `panel_${String(panelNumber).padStart(3, '0')}_v1.png`, `TEST ASSET ONLY · panel ${panelNumber} technical final`);
  }
  await expect(page.getByText('8/8 Finalbilder')).toBeVisible();
  record('all_final_images_selected', 'Exactly one reviewed final image was selected for all eight panels.');

  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.getByText('8/8 Finalbilder')).toBeVisible();

  await go(page, 'ricco-qa');
  await expect(page.getByRole('heading', { name: 'QA bestanden' })).toBeVisible();
  await expect(page.getByText('0 Blocker')).toBeVisible();
  await expect(page.getByText('0 Warnings')).toBeVisible();
  await expect(page.getByText('8/8 OK')).toBeVisible();
  record('qa_passed', 'QA gate passed with zero blockers and zero warnings.');
  await page.screenshot({ path: path.join(outputDir, 'episode1-qa-pass.png'), fullPage: true });

  await go(page, 'ricco-export');
  await expect(page.getByRole('heading', { name: 'Exportbereit' })).toBeVisible();
  await expect(page.getByText('8/8 Panels haben ein finales Bild.')).toBeVisible();
  await expect(page.getByText('0 fehlend')).toBeVisible();
  record('export_ready', 'Export gate reported 8/8 final panels and zero missing assets.');
  await page.screenshot({ path: path.join(outputDir, 'episode1-export-ready.png'), fullPage: true });

  await go(page, 'ricco-lettering');
  await expect(page.getByText('8/8 Finalbilder')).toBeVisible();
  await expect(page.locator('article.lettering-panel')).toHaveCount(8);
  await expect(page.locator('img.lettering-image')).toHaveCount(8);
  const alts = await page.locator('img.lettering-image').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('alt')));
  expect(alts).toEqual(panels.map(([, number, title]) => `Panel ${number}: ${title}`));
  record('lettering_preview_opened', 'Lettering preview rendered all eight final images in episode order.');

  await page.evaluate(() => {
    (window as any).__episode1PrintCalled = false;
    window.print = () => { (window as any).__episode1PrintCalled = true; };
  });
  await page.getByRole('button', { name: 'Browser Print / PDF' }).click();
  expect(await page.evaluate(() => (window as any).__episode1PrintCalled)).toBe(true);
  record('print_invoked', 'Existing Browser Print / PDF control invoked window.print.');

  const pdfPath = path.join(outputDir, 'episode1-lettering-preview.pdf');
  await page.pdf({ path: pdfPath, format: 'A4', printBackground: true, preferCSSPageSize: true });
  const pdfBytes = await readFile(pdfPath);
  expect(pdfBytes.subarray(0, 4).toString()).toBe('%PDF');
  record('pdf_created', `Chromium created a ${pdfBytes.length}-byte PDF from the existing lettering page.`);
  await page.screenshot({ path: path.join(outputDir, 'episode1-lettering-preview.png'), fullPage: true });

  await go(page, 'ricco-package');
  await expect(page.getByRole('heading', { name: 'Package vollständig' })).toBeVisible();
  const rawPackage = await page.locator('textarea[readonly]').inputValue();
  const packageData = JSON.parse(rawPackage);
  expect(packageData.episode.id).toBe('ep_001');
  expect(packageData.panels).toHaveLength(8);
  expect(packageData.reviewState.storedImages).toHaveLength(9);
  expect(packageData.reviewState.finalImageCount).toBe(8);
  expect(packageData.reviewState.exportReady).toBe(true);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'JSON herunterladen' }).click();
  const download = await downloadPromise;
  const packagePath = path.join(outputDir, 'episode1-production-package.json');
  await download.saveAs(packagePath);
  record('package_downloaded', 'A complete JSON production package was downloaded from the existing package page.');

  await page.close();
  page = await context.newPage();
  await go(page, 'ricco-export');
  await expect(page.getByRole('heading', { name: 'Exportbereit' })).toBeVisible();
  record('project_reopened', 'A new page in the same browser profile reopened the project with all selections intact.');

  await go(page, 'ricco-restore');
  page.on('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Local Review löschen' }).click();
  await expect(page.getByText('Lokaler Review-Stand gelöscht.')).toBeVisible();
  await go(page, 'ricco-export');
  await expect(page.getByText('8 fehlend')).toBeVisible();
  record('state_cleared', 'Local review state was explicitly cleared and the export gate returned to 8 missing assets.');

  await go(page, 'ricco-restore');
  await page.locator('textarea').fill(rawPackage);
  await expect(page.getByText('Package erkannt')).toBeVisible();
  await expect(page.getByText('9 Bilder gefunden')).toBeVisible();
  await page.getByRole('button', { name: 'Bilder wiederherstellen' }).click();
  await expect(page.getByText('9 Bilder wiederhergestellt. 8 Finalbilder gesetzt.')).toBeVisible();
  record('package_restored', 'The downloaded package restored all nine variants and eight final selections.');

  await go(page, 'ricco-export');
  await expect(page.getByRole('heading', { name: 'Exportbereit' })).toBeVisible();
  await go(page, 'ricco-package');
  const reconstructedRaw = await page.locator('textarea[readonly]').inputValue();
  const reconstructed = JSON.parse(reconstructedRaw);
  const originalHash = createHash('sha256').update(JSON.stringify(normalizePackage(packageData))).digest('hex');
  const reconstructedHash = createHash('sha256').update(JSON.stringify(normalizePackage(reconstructed))).digest('hex');
  expect(reconstructedHash).toBe(originalHash);
  await writeFile(path.join(outputDir, 'episode1-reconstruction-proof.json'), JSON.stringify({
    status: 'pass',
    originalNormalizedSha256: originalHash,
    reconstructedNormalizedSha256: reconstructedHash,
    storedImages: reconstructed.reviewState.storedImages.length,
    finalImages: reconstructed.reviewState.finalImageCount,
    exportReady: reconstructed.reviewState.exportReady
  }, null, 2));
  record('reconstructed_package_matched', 'Normalized reconstructed package hash matched the original package hash.');

  record('manual_external_generation_handoff', 'Real creative image generation remains an explicit manual external step; only synthetic test PNGs were used.', 'manual');
  const manifest = {
    schemaVersion: 1,
    status: 'pass',
    decisionScope: 'technical_episode_pipeline_proof_only',
    repository: 'Pagebabe/comic',
    sourceArchiveCommit: archiveCommit,
    episode: { id: 'ep_001', title: 'Das Zimmer', panels: 8 },
    importedImages: 9,
    finalImages: 8,
    creativeApprovalGranted: false,
    characterLockGranted: false,
    locationLockGranted: false,
    styleLockGranted: false,
    externalGenerationExecuted: false,
    storageImplementationObserved: 'localStorage_data_urls',
    transitions,
    artifacts: {
      package: 'episode1-production-package.json',
      pdf: 'episode1-lettering-preview.pdf',
      reconstructionProof: 'episode1-reconstruction-proof.json'
    },
    generatedAt: new Date().toISOString()
  };
  await writeFile(path.join(outputDir, 'episode1-run-manifest.json'), JSON.stringify(manifest, null, 2));
  await context.close();
});
