import { useState, useEffect } from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import { roleNavItems, roleColors, roleIcons, type NavItem } from '../lib/navConfig';
import CommandPalette from '../components/CommandPalette';
import {
  LogOut, Leaf, Shield, Menu, X,
  Bell, Sun, Moon, Command as CommandIcon,
  ChevronRight, Pin, Clock, Globe,
} from 'lucide-react';
import type { UserRole } from '../types';

const GOV_WORKSPACES = ['Ministry of AYUSH — National', 'Ministry of AYUSH — Kerala Regional Office', 'Ministry of AYUSH — Uttarakhand Regional Office'];

// Notification panel
function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { notifications, markAllRead, markRead } = useAppStore();
  const unread = notifications.filter((n) => !n.isRead);

  const typeColors: Record<string, string> = {
    info: 'bg-blue-500',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-destructive',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="absolute right-0 top-12 w-80 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-sm">Notifications</h3>
        <div className="flex items-center gap-2">
          {unread.length > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary hover:underline">Mark all read</button>
          )}
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="max-h-80 overflow-y-auto divide-y divide-border">
        {notifications.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No notifications</p>
        )}
        {notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => markRead(n.id)}
            className={`px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50 ${!n.isRead ? 'bg-primary/5' : ''}`}
          >
            <div className="flex items-start gap-2.5">
              <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${typeColors[n.type]}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${!n.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.description}</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {new Date(n.timestamp).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function GlobalLayout() {
  const { user, logout, updateUser } = useAuthStore();
  const {
    sidebarCollapsed, toggleSidebar, darkMode, toggleDarkMode, activeNavItem, setActiveNavItem, notifications,
    pinnedNavItems, recentNavItems, togglePinnedNavItem,
  } = useAppStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [workspace, setWorkspace] = useState(GOV_WORKSPACES[0]);
  const navigate = useNavigate();

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Global Cmd/Ctrl+K command palette shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const navItems = roleNavItems[user.role] || [];
  const colors = roleColors[user.role];
  const RoleIcon = roleIcons[user.role] || Shield;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const pinnedForRole = pinnedNavItems[user.role] ?? [];
  const recentForRole = recentNavItems[user.role] ?? [];
  const pinnedItems = navItems.filter((item) => pinnedForRole.includes(item.id));
  const recentItems = recentForRole
    .map((id) => navItems.find((item) => item.id === id))
    .filter((item): item is NavItem => Boolean(item))
    .slice(0, 3);

  const handleNav = (id: string) => {
    setActiveNavItem(id);
    setMobileSidebarOpen(false);
    navigate('/');
  };

  const NavRow = ({ item, keyPrefix = '' }: { item: NavItem; keyPrefix?: string }) => {
    const isActive = activeNavItem === item.id;
    const isPinned = pinnedForRole.includes(item.id);
    return (
      <button
        key={keyPrefix + item.id}
        onClick={() => handleNav(item.id)}
        title={sidebarCollapsed ? item.label : undefined}
        className={`group w-full flex items-center gap-3 px-3.5 py-2.5 text-sm mb-1.5 transition-all duration-200 ayur-sidebar-item
          ${isActive
            ? 'ayur-sidebar-item-active'
            : 'text-muted-foreground hover:text-emerald-800 dark:hover:text-emerald-200'
          }
          ${sidebarCollapsed ? 'justify-center' : ''}`}
      >
        <item.icon className={`w-4 h-4 shrink-0 transition-transform duration-300 group-hover:rotate-12 ${isActive ? 'text-current' : 'text-emerald-700/60 dark:text-emerald-400/50 group-hover:text-emerald-800 dark:group-hover:text-emerald-200'}`} />
        {!sidebarCollapsed && <span className="truncate flex-1 text-left font-medium">{item.label}</span>}
        {!sidebarCollapsed && item.id !== 'dashboard' && item.id !== 'profile' && (
          <span
            role="button"
            tabIndex={-1}
            onClick={(e) => { e.stopPropagation(); togglePinnedNavItem(item.id); }}
            className={`shrink-0 rounded p-0.5 transition-all duration-150 ${isPinned ? 'opacity-100 text-current' : 'opacity-0 group-hover:opacity-60 hover:!opacity-100 hover:scale-110'}`}
          >
            {isPinned ? <Pin className="w-3 h-3 fill-current" /> : <Pin className="w-3 h-3" />}
          </span>
        )}
        {!sidebarCollapsed && isActive && <ChevronRight className="w-3 h-3 text-current animate-pulse" />}
      </button>
    );
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-border/60 ${sidebarCollapsed ? 'justify-center px-2' : ''}`}>
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-md shadow-primary/20">
          <Leaf className="w-4 h-4 text-primary-foreground" />
        </div>
        {!sidebarCollapsed && (
          <div>
            <h2 className="text-base font-bold text-primary font-heading leading-tight">AYUTRACE+</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Enterprise Portal</p>
          </div>
        )}
      </div>

      {/* Workspace switcher — Government only, presentation-only */}
      {!sidebarCollapsed && user.role === 'Government' && (
        <div className="mx-3 mt-3">
          <select
            value={workspace}
            onChange={(e) => setWorkspace(e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-border/60 bg-muted/40 text-foreground cursor-pointer outline-none appearance-none flex items-center"
          >
            {GOV_WORKSPACES.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>
      )}

      {/* Role badge */}
      {!sidebarCollapsed && (
        <div className={`mx-3 my-3 px-3 py-2 rounded-lg flex items-center gap-2 ${colors.bg}`}>
          <div className={`w-6 h-6 rounded-md flex items-center justify-center ${colors.badge} bg-opacity-20`}>
            <RoleIcon className={`w-3.5 h-3.5 ${colors.text}`} />
          </div>
          <div className="min-w-0">
            <p className={`text-xs font-semibold truncate ${colors.text}`}>{user.role}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user.organizationName}</p>
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav className={`flex-1 py-2 overflow-y-auto ${sidebarCollapsed ? 'px-2' : 'px-3'}`}>
        <AnimatePresence initial={false}>
          {pinnedItems.length > 0 && !sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-2 overflow-hidden"
            >
              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Pin className="w-2.5 h-2.5" /> Pinned
              </p>
              {pinnedItems.map((item) => <NavRow key={`pin-${item.id}`} item={item} keyPrefix="pin-" />)}
              <div className="h-px bg-border/60 my-2" />
            </motion.div>
          )}
        </AnimatePresence>

        {navItems.map((item) => <NavRow key={item.id} item={item} />)}

        <AnimatePresence initial={false}>
          {recentItems.length > 0 && !sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-2 overflow-hidden"
            >
              <div className="h-px bg-border/60 mb-2" />
              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" /> Recent
              </p>
              {recentItems.map((item) => <NavRow key={`recent-${item.id}`} item={item} keyPrefix="recent-" />)}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Role switcher (dev only) */}
      {!sidebarCollapsed && (
        <div className="mx-3 mb-2 px-3 py-2 rounded-lg bg-muted/50 border border-border/60">
          <p className="text-[10px] text-muted-foreground mb-1 font-medium uppercase tracking-wide">Demo Role Switch</p>
          <select
            className="w-full text-xs bg-transparent border-none outline-none text-foreground cursor-pointer"
            value={user.role}
            onChange={(e) => {
              updateUser({ role: e.target.value as UserRole });
              setActiveNavItem('dashboard');
            }}
          >
            <option value="Government">Government Admin</option>
            <option value="Collection Center">Collection Center</option>
            <option value="Processing & Laboratory">Processing & Lab</option>
            <option value="Manufacturer">Manufacturer</option>
            <option value="Supply Chain">Supply Chain</option>
          </select>
        </div>
      )}

      {/* User footer */}
      <div className={`border-t border-border/60 p-3 ${sidebarCollapsed ? 'flex justify-center' : ''} relative z-10`}>
        {sidebarCollapsed ? (
          <button onClick={logout} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${colors.badge}`}>
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.ayurvedicId}</p>
            </div>
            <button onClick={logout} className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Logout">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Botanical Background Vector Decoration */}
      {!sidebarCollapsed && (
        <div className="absolute bottom-24 left-4 right-4 pointer-events-none opacity-8 dark:opacity-4 flex justify-center leaf-float z-0">
          <svg className="w-28 h-28 text-emerald-800 dark:text-emerald-400" viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 90C50 90 30 70 30 50C30 30 50 10 50 10C50 10 70 30 70 50C70 70 50 90 50 90ZM50 15C42 28 35 42 35 50C35 65 48 78 50 82C52 78 65 65 65 50C65 42 58 28 50 15Z" />
            <path d="M50 10V90" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M50 30C45 35 40 37 36 38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M50 45C45 50 40 52 36 53" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M50 60C45 65 40 67 36 68" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M50 35C55 40 60 42 64 43" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M50 50C55 55 60 57 64 58" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M50 65C55 70 60 72 64 73" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      )}
    </>
  );

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative z-50 lg:z-auto h-full ayur-sidebar-glass flex flex-col transition-all duration-300 shadow-xl lg:shadow-none
          ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${sidebarCollapsed ? 'w-16' : 'w-56'}`}
      >
        {sidebarContent}
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-14 bg-card/65 backdrop-blur-md border-b border-emerald-600/10 dark:border-emerald-500/10 flex items-center justify-between px-4 shrink-0 shadow-sm gap-3 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => { toggleSidebar(); setMobileSidebarOpen(!mobileSidebarOpen); }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              {navItems.find((n) => n.id === activeNavItem) && (
                <>
                  <span className="text-emerald-700 dark:text-emerald-300 text-sm font-semibold hidden sm:inline">{user.role}</span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground hidden sm:inline" />
                  <span className="text-sm font-semibold truncate">
                    {navItems.find((n) => n.id === activeNavItem)?.label}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Command search trigger */}
            <button
              onClick={() => setCommandOpen(true)}
              className="hidden sm:flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all min-w-40 justify-between"
            >
              <span className="flex items-center gap-1.5"><CommandIcon className="w-3 h-3" /> Search...</span>
              <span className="kbd-chip">⌘K</span>
            </button>

            {/* Consumer Portal link */}
            <a
              href="/verify/BATCH-2026-0033"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:border-emerald-500/40 hover:bg-emerald-500/5 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
            >
              <Globe className="w-3 h-3" />
              Consumer Portal
            </a>

            {/* Dark mode */}
            <button
              onClick={toggleDarkMode}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
              </AnimatePresence>
            </div>

            {/* User avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${colors.badge}`}>
              {user.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto ayur-main-bg relative">
          {/* Delicate architectural leaf outline graphics */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-30 dark:opacity-15">
            {/* Top Right delicate leaf outline */}
            <svg className="absolute -top-12 -right-12 w-80 h-80 text-emerald-800/20 dark:text-emerald-400/25 rotate-45" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.75">
              <path d="M50 90C50 90 20 65 20 40C20 20 50 10 50 10C50 10 80 20 80 40C80 65 50 90 50 90ZM50 10V90 M50 25C40 32 30 35 22 36 M50 42C40 48 30 50 24 51 M50 60C40 66 30 68 26 69 M50 30C60 37 70 40 78 41 M50 48C60 54 70 56 76 57 M50 66C60 72 70 74 74 75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            
            {/* Bottom Left delicate leaf outline */}
            <svg className="absolute bottom-12 -left-12 w-96 h-96 text-emerald-800/15 dark:text-emerald-400/20 -rotate-12" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.75">
              <path d="M50 90C50 90 20 65 20 40C20 20 50 10 50 10C50 10 80 20 80 40C80 65 50 90 50 90ZM50 10V90 M50 25C40 32 30 35 22 36 M50 42C40 48 30 50 24 51 M50 60C40 66 30 68 26 69 M50 30C60 37 70 40 78 41 M50 48C60 54 70 56 76 57 M50 66C60 72 70 74 74 75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div className="p-6 max-w-[1400px] mx-auto relative z-10">
            <Outlet />
          </div>
        </main>
      </div>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
