import { expect, test } from '@playwright/test';
import {
  buildLetteringScriptFromLayout,
  defaultPanelLetteringLayout,
  normalizePanelLetteringLayout,
  normalizeRiccoLetteringLayoutState,
  resetPanelLetteringLayout,
  updatePanelLetteringLayout
} from '../../src/domain/lettering/riccoLetteringLayout';

test('creates default panel lettering layout from panel dialogue', () => {
  const layout = defaultPanelLetteringLayout('panel_001', '2026-07-05T00:00:00.000Z');

  expect(layout.panelId).toBe('panel_001');
  expect(layout.text).toContain('Bruder');
  expect(layout.preset).toBe('bottom_left');
  expect(layout.updatedAt).toBe('2026-07-05T00:00:00.000Z');
});

test('normalizes invalid values and clamps coordinates', () => {
  const layout = normalizePanelLetteringLayout({
    text: 123,
    preset: 'bad',
    x: -10,
    y: 120,
    width: 5,
    fontSize: 99
  }, 'panel_001');

  expect(layout.preset).toBe('bottom_left');
  expect(layout.x).toBe(0);
  expect(layout.y).toBe(92);
  expect(layout.width).toBe(20);
  expect(layout.fontSize).toBe(28);
  expect(layout.text).toContain('Bruder');
});

test('normalizes full layout state for every Ricco panel', () => {
  const state = normalizeRiccoLetteringLayoutState({
    panel_002: {
      text: 'custom text',
      preset: 'top_right',
      x: 1,
      y: 2,
      width: 30,
      fontSize: 12,
      updatedAt: '2026-07-05T00:00:00.000Z'
    }
  });

  expect(Object.keys(state)).toHaveLength(8);
  expect(state.panel_002).toMatchObject({ text: 'custom text', preset: 'top_right', x: 1, y: 2 });
  expect(state.panel_001.text).toContain('Bruder');
});

test('updates layout preset with preset defaults and patch values', () => {
  const state = normalizeRiccoLetteringLayoutState({});
  const next = updatePanelLetteringLayout(state, 'panel_001', {
    preset: 'top_right',
    text: 'new bubble',
    width: 55
  }, '2026-07-05T00:00:00.000Z');

  expect(next.panel_001).toMatchObject({
    preset: 'top_right',
    text: 'new bubble',
    x: 52,
    y: 6,
    width: 55,
    updatedAt: '2026-07-05T00:00:00.000Z'
  });
});

test('resets one panel layout without removing other layouts', () => {
  const state = updatePanelLetteringLayout(normalizeRiccoLetteringLayoutState({}), 'panel_001', { text: 'changed' });
  const reset = resetPanelLetteringLayout(state, 'panel_001', '2026-07-05T00:00:00.000Z');

  expect(reset.panel_001.text).toContain('Bruder');
  expect(reset.panel_001.updatedAt).toBe('2026-07-05T00:00:00.000Z');
  expect(reset.panel_002).toBeTruthy();
});

test('builds dialogue script from lettering layout state', () => {
  const state = updatePanelLetteringLayout(normalizeRiccoLetteringLayoutState({}), 'panel_001', { text: 'CUSTOM PANEL ONE' });
  const script = buildLetteringScriptFromLayout(state);

  expect(script).toContain('Panel 1: Ankunft');
  expect(script).toContain('CUSTOM PANEL ONE');
  expect(script).toContain('---');
});
