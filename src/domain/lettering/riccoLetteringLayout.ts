import { riccoPanels } from '../../data/riccoStudio';

export const RICCO_LETTERING_STORAGE_KEY = 'ricco-lettering-layout-v1';

export type BubblePositionPreset = 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right' | 'caption_bottom';

export type PanelLetteringLayout = {
  panelId: string;
  text: string;
  preset: BubblePositionPreset;
  x: number;
  y: number;
  width: number;
  fontSize: number;
  updatedAt: string;
};

export type RiccoLetteringLayoutState = Record<string, PanelLetteringLayout>;

export const BUBBLE_PRESETS: Record<BubblePositionPreset, Pick<PanelLetteringLayout, 'x' | 'y' | 'width' | 'fontSize'>> = {
  top_left: { x: 6, y: 6, width: 42, fontSize: 16 },
  top_right: { x: 52, y: 6, width: 42, fontSize: 16 },
  bottom_left: { x: 6, y: 68, width: 44, fontSize: 16 },
  bottom_right: { x: 50, y: 68, width: 44, fontSize: 16 },
  caption_bottom: { x: 6, y: 78, width: 88, fontSize: 15 }
};

export function clampNumber(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function defaultPanelLetteringLayout(panelId: string, now = new Date().toISOString()): PanelLetteringLayout {
  const panel = riccoPanels.find((item) => item.id === panelId);
  const preset = 'bottom_left';

  return {
    panelId,
    text: panel?.dialogue ?? '',
    preset,
    ...BUBBLE_PRESETS[preset],
    updatedAt: now
  };
}

export function normalizePanelLetteringLayout(value: unknown, panelId: string): PanelLetteringLayout {
  const fallback = defaultPanelLetteringLayout(panelId);

  if (!value || typeof value !== 'object') return fallback;

  const layout = value as Partial<PanelLetteringLayout>;
  const preset = typeof layout.preset === 'string' && layout.preset in BUBBLE_PRESETS
    ? layout.preset as BubblePositionPreset
    : fallback.preset;

  return {
    panelId,
    text: typeof layout.text === 'string' ? layout.text : fallback.text,
    preset,
    x: clampNumber(Number(layout.x ?? fallback.x), 0, 92),
    y: clampNumber(Number(layout.y ?? fallback.y), 0, 92),
    width: clampNumber(Number(layout.width ?? fallback.width), 20, 94),
    fontSize: clampNumber(Number(layout.fontSize ?? fallback.fontSize), 10, 28),
    updatedAt: typeof layout.updatedAt === 'string' ? layout.updatedAt : fallback.updatedAt
  };
}

export function normalizeRiccoLetteringLayoutState(value: unknown): RiccoLetteringLayoutState {
  const raw = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

  return Object.fromEntries(
    riccoPanels.map((panel) => [panel.id, normalizePanelLetteringLayout(raw[panel.id], panel.id)])
  );
}

export function updatePanelLetteringLayout(
  state: RiccoLetteringLayoutState,
  panelId: string,
  patch: Partial<Omit<PanelLetteringLayout, 'panelId'>>,
  now = new Date().toISOString()
): RiccoLetteringLayoutState {
  const current = state[panelId] ?? defaultPanelLetteringLayout(panelId, now);
  const nextPreset = patch.preset ?? current.preset;
  const presetDefaults = patch.preset ? BUBBLE_PRESETS[nextPreset] : {};

  return {
    ...state,
    [panelId]: normalizePanelLetteringLayout({
      ...current,
      ...presetDefaults,
      ...patch,
      updatedAt: now
    }, panelId)
  };
}

export function resetPanelLetteringLayout(state: RiccoLetteringLayoutState, panelId: string, now = new Date().toISOString()): RiccoLetteringLayoutState {
  return {
    ...state,
    [panelId]: defaultPanelLetteringLayout(panelId, now)
  };
}

export function buildLetteringScriptFromLayout(state: RiccoLetteringLayoutState) {
  const normalized = normalizeRiccoLetteringLayoutState(state);

  return riccoPanels
    .map((panel) => `Panel ${panel.panelNumber}: ${panel.title}\n${normalized[panel.id].text}`)
    .join('\n\n---\n\n');
}
