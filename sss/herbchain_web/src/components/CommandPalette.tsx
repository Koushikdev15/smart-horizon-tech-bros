import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import { roleNavItems } from '../lib/navConfig';
import { Search, Sun, Moon, LogOut, User as UserIcon, CornerDownLeft } from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PaletteAction {
  id: string;
  label: string;
  icon: React.ElementType;
  group: 'Navigate' | 'Actions';
  perform: () => void;
}

export default function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { toggleDarkMode, darkMode } = useAppStore();

  const navItems = user ? roleNavItems[user.role] : [];

  const actions: PaletteAction[] = useMemo(() => {
    const navActions: PaletteAction[] = navItems.map((item) => ({
      id: `nav-${item.id}`,
      label: item.label,
      icon: item.icon,
      group: 'Navigate',
      perform: () => {
        navigate(`/app/${item.id}`);
      },
    }));
    const quickActions: PaletteAction[] = [
      {
        id: 'toggle-theme',
        label: darkMode ? 'Switch to light mode' : 'Switch to dark mode',
        icon: darkMode ? Sun : Moon,
        group: 'Actions',
        perform: toggleDarkMode,
      },
      {
        id: 'profile',
        label: 'Go to profile',
        icon: UserIcon,
        group: 'Actions',
        perform: () => {
          navigate('/app/profile');
        },
      },
      { id: 'logout', label: 'Log out', icon: LogOut, group: 'Actions', perform: logout },
    ];
    return [...navActions, ...quickActions];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navItems, darkMode]);

  const filtered = useMemo(() => {
    if (!query.trim()) return actions;
    const q = query.toLowerCase();
    return actions.filter((a) => a.label.toLowerCase().includes(q));
  }, [actions, query]);

  const indexed = filtered.map((action, i) => ({ ...action, i }));
  const groups = (['Navigate', 'Actions'] as const)
    .map((group) => ({ group, items: indexed.filter((a) => a.group === group) }))
    .filter((g) => g.items.length > 0);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const runAction = (action: PaletteAction) => {
    action.perform();
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[activeIndex]) runAction(filtered[activeIndex]);
    } else if (e.key === 'Escape') {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-lg p-0 gap-0 overflow-hidden top-[18%] translate-y-0">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages or run a quick action..."
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
          />
          <span className="kbd-chip">ESC</span>
        </div>
        <div className="max-h-80 overflow-y-auto py-2">
          {groups.map(({ group, items }) => (
            <div key={group} className="px-2 mb-1">
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{group}</p>
              {items.map((action) => {
                const isActive = action.i === activeIndex;
                return (
                  <button
                    key={action.id}
                    onMouseEnter={() => setActiveIndex(action.i)}
                    onClick={() => runAction(action)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-left transition-colors ${
                      isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    <action.icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 truncate">{action.label}</span>
                    {isActive && <CornerDownLeft className="w-3.5 h-3.5 opacity-60" />}
                  </button>
                );
              })}
            </div>
          ))}
          {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No matches found.</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
