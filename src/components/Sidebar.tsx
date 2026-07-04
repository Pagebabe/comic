import { BookOpen, Boxes, Clapperboard, Film, Gauge, Map, PenTool, ScrollText, ShieldCheck, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  route: string;
  label: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { route: '/', label: 'Production', icon: Gauge },
  { route: '/story-bible', label: 'Story Bible', icon: ScrollText },
  { route: '/characters', label: 'Characters', icon: Boxes },
  { route: '/locations', label: 'Locations', icon: Map },
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
          <span>Comic Video Machine</span>
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
        <strong>Rule:</strong> Kleine Comics als clean frames. Keine Speech Bubbles im Bild. Voice, subtitles, cut, export.
      </div>
    </aside>
  );
}
