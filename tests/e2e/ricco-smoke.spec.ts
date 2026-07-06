import { expect, test } from '@playwright/test';

const routes = [
  { path: '/#/ricco-control', text: 'Ricco Control Room' },
  { path: '/#/ricco-studio', text: 'Ricco Studio' },
  { path: '/#/ricco-prompt-queue', text: 'Ricco Prompt Queue' },
  { path: '/#/ricco-comfy-m1', text: 'Ricco ComfyUI' },
  { path: '/#/ricco-image-review', text: 'Ricco Image Review' },
  { path: '/#/ricco-qa', text: 'Ricco QA Gate' },
  { path: '/#/ricco-export', text: 'Ricco Export' },
  { path: '/#/ricco-lettering', text: 'Ricco Lettering Preview' },
  { path: '/#/ricco-package', text: 'Ricco Production Package' },
  { path: '/#/ricco-restore', text: 'Ricco Restore' }
];

test.describe('Ricco workflow smoke tests', () => {
  for (const route of routes) {
    test(`opens ${route.path}`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page.getByText(route.text, { exact: false }).first()).toBeVisible();
    });
  }

  test('prompt queue exposes all 8 pilot prompts', async ({ page }) => {
    await page.goto('/#/ricco-prompt-queue');
    await expect(page.getByText('8 Panel Prompts')).toBeVisible();
    await expect(page.getByText('Panel 1')).toBeVisible();
    await expect(page.getByText('Panel 8')).toBeVisible();
  });

  test('qa gate starts blocked without final images', async ({ page }) => {
    await page.goto('/#/ricco-qa');
    await page.evaluate(() => window.localStorage.removeItem('ricco-studio-images-v1'));
    await page.reload();
    await expect(page.getByText('QA braucht Nacharbeit')).toBeVisible();
    await expect(page.getByText('8 Blocker')).toBeVisible();
  });
});
