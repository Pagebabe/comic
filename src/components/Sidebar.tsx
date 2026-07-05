import { Archive, BookOpen, Boxes, Captions, Clapperboard, FolderInput, FolderTree, Gauge, Images, Layers3, Map, PenTool, ShieldCheck, Upload, Wand2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type NavGroupName = 'Production' | 'Assets' | 'Training' | 'Output' | 'System' | 'Legacy';

export interface NavItem {
  route: string;
  label: string;
  icon: LucideIcon;
  group: NavGroupName;
}

export interface NavGroup {
  title: NavGroupName;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    title: 'Production',
    items: [
      { route: '/ricco-control', label: 'Ricco Control', icon: Gauge, group: 'Production' },
      { route: '/ricco-workspace', label: 'Workspace Map', icon: FolderTree, group: 'Production' },
      { route: '/ricco-studio', label: 'Ricco Studio', icon: Wand2, group: 'Production' },
      { route: '/ricco-prompt-queue', label: 'Prompt Queue', icon: FolderTree, group: 'Production' },
      { route: '/ricco-generation-queue', label: 'Generation Queue', icon: FolderTree, group: 'Production' },
      { route: '/ricco-comfy-m1', label: 'ComfyUI M1', icon: Wand2, group: 'Production' },
      { route: '/ricco-image-review', label: 'Image Review', icon: ShieldCheck, group: 'Production' },
      { route: '/ricco-qa', label: 'QA Gate', icon: ShieldCheck, group: 'Production' }
    ]
  },
  {
    title: 'Assets',
    items: [
      { route: '/ricco-reference-packs', label: 'Reference Packs', icon: Layers3, group: 'Assets' },
      { route: '/ricco-reference-candidates', label: 'Reference Candidates', icon: Layers3, group: 'Assets' },
      { route: '/ricco-asset-import', label: 'Asset Import', icon: Images, group: 'Assets' },
      { route: '/ricco-assets', label: 'Asset Library', icon: Images, group: 'Assets' },
      { route: '/ricco-fix-queue', label: 'Fix Queue', icon: ShieldCheck, group: 'Assets' },
      { route: '/ricco-bulk-upload', label: 'Bulk Upload', icon: Upload, group: 'Assets' }
    ]
  },
  {
    title: 'Training',
    items: [
      { route: '/ricco-dataset-candidates', label: 'Dataset Candidates', icon: Layers3, group: 'Training' },
      { route: '/ricco-approved-dataset', label: 'Approved Dataset', icon: Layers3, group: 'Training' },
      { route: '/ricco-lora-training-plan', label: 'LoRA Training Plan', icon: Layers3, group: 'Training' }
    ]
  },
  {
    title: 'Output',
    items: [
      { route: '/ricco-export', label: 'Export Gate', icon: Upload, group: 'Output' },
      { route: '/ricco-lettering', label: 'Lettering', icon: Captions, group: 'Output' }
    ]
  },
  {
    title: 'System',
    items: [
      { route: '/ricco-storage', label: 'Storage', icon: Archive, group: 'System' },
      { route: '/ricco-package', label: 'Package Backup', icon: Archive, group: 'System' },
      { route: '/ricco-restore', label: 'Restore', icon: FolderInput, group: 'System' }
    ]
  },
  {
    title: 'Legacy',
    items: [
      { route: '/dashboard', label: 'Dashboard', icon: Gauge, group: 'Legacy' },
      { route: '/story-bible', label: 'Story Bible', icon: BookOpen, group: 'Legacy' },
      { route: '/style-bible', label: 'Style Bible', icon: PenTool, group: 'Legacy' },
      { route: '/characters', label: 'Characters', icon: Boxes, group: 'Legacy' },
      { route: '/locations', label: 'Locations', icon: Map, group: 'Legacy' },
      { route: '/episodes', label: 'Episodes', icon: Clapperboard, group: 'Legacy' },
      { route: '/panel-factory', label: 'Panel Factory', icon: FolderTree, group: 'Legacy' },
      { route: '/review', label: 'Review', icon: ShieldCheck, group: 'Legacy' },
      { route: '/asset-gallery', label: 'Asset Gallery', icon: Images, group: 'Legacy' }
    ]
  }
];

export const navItems: NavItem[] = navGroups.flatMap((group) => group.items);

export function Sidebar({ activeRoute, items }: { activeRoute: string; items: NavItem[] }) {
  const groupedItems = navGroups
    .map((group) => ({
      ...group,
      items: items.filter((item) => item.group === group.title)
    }))
    .filter((group) => group.items.length > 0);

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">RIH</div>
        <div>
          <strong>Ricco im Haus</strong>
          <span>Comic Factory</span>
        </div>
      </div>
      <nav className="sidebar-nav" aria-label="Comic Factory workspace navigation">
        {groupedItems.map((group) => (
          <div className="nav-group" key={group.title}>
            <span className="nav-group-title">{group.title}</span>
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <a key={item.route} className={activeRoute === item.route ? 'active' : ''} href={`#${item.route}`}>
                  <Icon size={18} />
                  {item.label}
                </a>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="sidebar-note">
        <strong>Workflow:</strong> Story first. Clean comic frames second. Text and export only after panel review.
      </div>
    </aside>
  );
}
