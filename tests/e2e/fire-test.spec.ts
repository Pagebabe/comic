import { expect, test } from '@playwright/test';

const routes = [
  ['/#/', 'Rico gegen Berlin'],
  ['/#/story-bible', 'Clean frame'],
  ['/#/characters', 'Rico Bassmann'],
  ['/#/locations', 'Club Nein'],
  ['/#/style-bible', 'Exaggeration Rules'],
  ['/#/episodes', 'Season roadmap'],
  ['/#/storyboard', 'Comic Video Board'],
  ['/#/panel-factory', 'Panel Factory'],
  ['/#/generator', 'Clean Frame Generator'],
  ['/#/renderers', 'Manual Image Tool'],
  ['/#/voice-subtitles', 'Voice/Subtitles'],
  ['/#/review', 'Review'],
  ['/#/jobs', 'Generate character reference sheets'],
  ['/#/assembly', 'Assembly'],
  ['/#/export', 'Export']
] as const;

test.describe('fire test routes', () => {
  for (const [route, expectedText] of routes) {
    test(`${route} renders ${expectedText}`, async ({ page }) => {
      await page.goto(route);
      await expect(page.getByText('Rico gegen Berlin').first()).toBeVisible();
      await expect(page.getByText('Comic Video Machine')).toBeVisible();
      await expect(page.getByText(expectedText).first()).toBeVisible();
    });
  }
});

test('style bible keeps the overdrawn non-realistic direction visible', async ({ page }) => {
  await page.goto('/#/style-bible');

  await expect(page.getByRole('heading', { name: 'Free-for-All Berlin Absurd Cartoon' })).toBeVisible();
  await expect(page.getByText('No photorealism.')).toBeVisible();
  await expect(page.getByText('No semi-realistic portrait rendering.')).toBeVisible();
  await expect(page.getByText(/Berghain, KitKat, Christopher Street Day and Loveparade/)).toBeVisible();
});

test('pilot episode is the active 4-panel production script', async ({ page }) => {
  await page.goto('/#/storyboard');

  await expect(page.getByRole('heading', { name: 'Die Entkommerzialisierungsgebühr', exact: true })).toBeVisible();
  await expect(page.getByText('Kurzer Hausmoment.')).toBeVisible();
  await expect(page.getByText('Das ist eine Entkommerzialisierungsgebühr.')).toBeVisible();
  await expect(page.getByText('Der nimmt sogar Mäusen Miete.')).toBeVisible();
  await expect(page.getByText('Willkommen in Berlin.')).toBeVisible();

  await page.goto('/#/voice-subtitles');
  await expect(page.getByText('4').first()).toBeVisible();
  await expect(page.getByText('10').first()).toBeVisible();
});
