import type { Panel } from '../types/comic';
import { scene001Panels } from './panels.scene001';
import { scene002Panels } from './panels.scene002';
import { scene003Panels } from './panels.scene003';
import { scene004Panels } from './panelsScene004';
import { panel017 } from './panel017';
import { remainingPanels } from './panelsRemaining';
import { panel021 } from './panel021';
import { panel022 } from './panel022';
import { panel023 } from './panel023';
import { panel024 } from './panel024';
import { panel025 } from './panel025';
import { panel026 } from './panel026';
import { panel027 } from './panel027';
import { panel028 } from './panel028';
import { panel029 } from './panel029';
import { panel030 } from './panel030';

export const panels: Panel[] = [
  ...scene001Panels,
  ...scene002Panels,
  ...scene003Panels,
  ...scene004Panels,
  panel017,
  ...remainingPanels,
  panel021,
  panel022,
  panel023,
  panel024,
  panel025,
  panel026,
  panel027,
  panel028,
  panel029,
  panel030
];
