import { BookOpen, Boxes, Clapperboard, Film, Gauge, PenTool, ShieldCheck, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  route: string;
  label: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { route: '/', label: 'Production', icon: Gauge },
  { route: '/characters', label: 'Characters', icon: Boxes },
  { route: '/style-bible', label: 'Style Bible', icon: BookOpen },
  { route: '/episodes', label: 'Episodes', icon: Clapperboard },
  { route: '/storyboard', label: 'Storyboard', icon: Film },
  { route: '/generator', label: 'Generator', icon: Sparkles },
  { route: '/review', label: 'Review', icon: ShieldCheck },
  { route: '/export', label: 'Export', icon: PenTool }
];

export function Sidebar({ activeRoute, items }: { activeRoute: string; items: NavItem[] }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">RB</div>
        <div>
          <strong>Rico gegen Berlin</strong>
          <span>Haus Nebenwirkung</span>
        </div>
      </div>
      <nav>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <a key={item.route} className={activeRoute === item.route ? 'active' : ''} href={`#${item.route}`}>
              <Icon size={18} />
              {item.label}
            </a>
          );
        })}
      </nav>
      <div className="sidebar-note">
        <strong>Rule:</strong> Kinderzimmer → Berlin-Schock → Hauschaos → Review → Export. Keine Influencer-Altlasten.
      </div>
    </aside>
  );
}
