import { useState, useEffect } from 'react';
import { Outlet, Navigate, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import { useSessionGuard } from '../hooks/useSessionGuard';
import { roleNavItems, roleColors, roleIcons, type NavItem } from '../lib/navConfig';
import CommandPalette from '../components/CommandPalette';
import { LogoMark } from '@/components/Logo';
import BotanicalBackground from '../components/BotanicalBackground';
import {
  LogOut, Shield, Menu, X,
  Bell, Sun, Moon, Command as CommandIcon,
  ChevronRight, Pin, Clock, Globe,
} from 'lucide-react';

const GOV_WORKSPACES = ['Ministry of AYUSH — National', 'Ministry of AYUSH — Kerala Regional Office', 'Ministry of AYUSH — Uttarakhand Regional Office'];


// Notification panel
function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { notifications, markAllRead, markRead } = useAppStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const unread = notifications.filter((n) => !n.isRead);

  const typeColors: Record<string, string> = {
    info: 'bg-info',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-destructive',
  };

  const handleNotificationClick = (n: any) => {
    markRead(n.id);
    onClose();

    // Map notifications to correct dashboard route based on content and role
    const role = user?.role;
    if (!role) return;

    if (n.title.toLowerCase().includes('payment')) {
      navigate('/app/payments');
    } else if (n.title.toLowerCase().includes('quality') || n.title.toLowerCase().includes('alert') || n.title.toLowerCase().includes('fail')) {
      if (role === 'Government') {
        navigate('/app/complaints');
      } else if (role === 'Collection Center') {
        navigate('/app/batch-history');
      } else {
        navigate('/app/rejected');
      }
    } else if (n.title.toLowerCase().includes('certificate') || n.title.toLowerCase().includes('lab')) {
      if (role === 'Government') {
        navigate('/app/tracking');
      } else if (role === 'Processing & Laboratory') {
        navigate('/app/history');
      } else {
        navigate('/app/requests');
      }
    } else if (n.title.toLowerCase().includes('batch') || n.title.toLowerCase().includes('received') || n.title.toLowerCase().includes('new')) {
      if (role === 'Government') {
        navigate('/app/approvals');
      } else if (role === 'Collection Center') {
        navigate('/app/batch-history');
      } else {
        navigate('/app/requests');
      }
    } else {
      navigate('/app/dashboard');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="absolute right-0 top-12 w-80 bg-card border border-border rounded-xl elevate-lg z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-sm font-heading">Notifications</h3>
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
            onClick={() => handleNotificationClick(n)}
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
  const { user, logout, isSessionValid } = useAuthStore();
  const {
    sidebarCollapsed, toggleSidebar, darkMode, toggleDarkMode, notifications,
    pinnedNavItems, recentNavItems, togglePinnedNavItem,
  } = useAppStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [workspace, setWorkspace] = useState(GOV_WORKSPACES[0]);
  const navigate = useNavigate();
  const { pageId } = useParams<{ pageId?: string }>();
  const activeNavItem = pageId || 'dashboard';

  // Enforces hard session expiry + idle auto-logout for the whole authenticated shell.
  useSessionGuard();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

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

  if (!user || !isSessionValid()) {
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
    setMobileSidebarOpen(false);
    navigate(`/app/${id}`);
  };

  const NavRow = ({ item, keyPrefix = '' }: { item: NavItem; keyPrefix?: string }) => {
    const isActive = activeNavItem === item.id;
    const isPinned = pinnedForRole.includes(item.id);
    return (
      <button
        key={keyPrefix + item.id}
        onClick={() => handleNav(item.id)}
        title={sidebarCollapsed ? item.label : undefined}
        className={`group w-full flex items-center gap-3 px-3 py-2.5 text-sm mb-0.5 gov-sidebar-item
          ${isActive ? 'gov-sidebar-item-active' : 'text-[#64748B] hover:text-[#0F766E] hover:bg-[#0F766E]/5 dark:text-[#94A3B8] dark:hover:text-[#14B8A6] dark:hover:bg-[#14B8A6]/8'}
          ${sidebarCollapsed ? 'justify-center' : ''}`}
      >
        <item.icon className="w-4 h-4 shrink-0" />
        {!sidebarCollapsed && <span className="truncate flex-1 text-left font-medium">{item.label}</span>}
        {!sidebarCollapsed && item.id !== 'dashboard' && item.id !== 'profile' && (
          <span
            role="button"
            tabIndex={-1}
            onClick={(e) => { e.stopPropagation(); togglePinnedNavItem(item.id); }}
            className={`shrink-0 rounded p-0.5 transition-opacity duration-150 ${isPinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-60 hover:!opacity-100'}`}
          >
            {isPinned ? <Pin className="w-3 h-3 fill-current" /> : <Pin className="w-3 h-3" />}
          </span>
        )}
      </button>
    );
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-border/30 ${sidebarCollapsed ? 'justify-center px-2' : ''}`}>
        <div className="w-9 h-9 rounded-lg bg-[#14B8A6]/20 flex items-center justify-center shrink-0">
          <LogoMark className="w-5 h-5 text-[#14B8A6]" />
        </div>
        {!sidebarCollapsed && (
          <div>
            <h2 className="text-base font-bold font-heading leading-tight text-slate-800 dark:text-[#F8FAFC]">
              <span className="text-[#14B8A6]">Ayu</span>Trace<span className="text-[#F59E0B]">+</span>
            </h2>
            <p className="text-[9.5px] text-slate-600 dark:text-[#94A3B8] uppercase tracking-widest font-semibold">Ministry of AYUSH</p>
          </div>
        )}
      </div>


      {/* Role badge */}
      {!sidebarCollapsed && (
        <div className="mx-3 my-3 px-3 py-2.5 flex items-center gap-2 gov-sidebar-card">
          <div className="w-6 h-6 rounded-md flex items-center justify-center bg-[#14B8A6]/20 shrink-0">
            <RoleIcon className="w-3.5 h-3.5 text-[#14B8A6]" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold truncate text-slate-800 dark:text-[#F8FAFC]">{user.role}</p>
            <p className="text-[10px] text-slate-600 dark:text-[#94A3B8] truncate">{user.organizationName}</p>
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
              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]/70 flex items-center gap-1">
                <Pin className="w-2.5 h-2.5" /> Pinned
              </p>
              {pinnedItems.map((item) => <NavRow key={`pin-${item.id}`} item={item} keyPrefix="pin-" />)}
              <div className="h-px bg-border/30 my-2" />
            </motion.div>
          )}
        </AnimatePresence>

        {navItems.map((item) => <NavRow key={item.id} item={item} />)}

      </nav>

      {/* User footer */}
      <div className={`border-t border-border/30 p-3 ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
        {sidebarCollapsed ? (
          <button onClick={logout} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-[#2DD4BF] hover:bg-[#14B8A6]/20 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center gap-2 p-2.5 gov-sidebar-card">
            <button
              onClick={() => navigate('/app/profile')}
              title="View Profile"
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 cursor-pointer hover:ring-2 hover:ring-[#14B8A6]/40 transition-all ${colors.badge}`}
            >
              {user.name.charAt(0)}
            </button>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate('/app/profile')} title="View Profile">
              <p className="text-sm font-bold truncate text-slate-800 hover:text-[#0F766E] dark:text-[#F8FAFC] dark:hover:text-[#2DD4BF] transition-colors">{user.name}</p>
              <p className="text-xs text-slate-600 dark:text-[#94A3B8] truncate">{user.ayurvedicId}</p>
            </div>
            <button onClick={logout} className="w-7 h-7 rounded-md flex items-center justify-center text-slate-600 hover:text-destructive hover:bg-destructive/10 dark:text-[#94A3B8] transition-colors" title="Logout">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
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
        className={`fixed md:sticky top-0 left-0 z-40 h-[100dvh] shrink-0 border-r border-border transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          ${mobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
          ${sidebarCollapsed ? 'w-[72px]' : 'w-[280px]'}
          bg-[#F8FAFC] dark:bg-[#0B1120]`}
      >
        {/* Sidebar Botanical Leaves */}
        {!sidebarCollapsed && (
          <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
            {/* Top-right branch */}
            <svg viewBox="0 0 200 200" fill="none" className="absolute right-[-2.5rem] top-12 w-32 h-32 rotate-[-15deg] text-[#14B8A6] opacity-[0.12]" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 180 C50 160 120 120 180 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M40 155 Q20 130 50 135 C70 138 60 150 40 155 Z" fill="currentColor"/>
              <path d="M65 135 Q45 110 75 115 C95 118 85 130 65 135 Z" fill="currentColor"/>
              <path d="M90 115 Q70 90 100 95 C120 98 110 110 90 115 Z" fill="currentColor"/>
              <path d="M115 95 Q95 70 125 75 C145 78 135 90 115 95 Z" fill="currentColor"/>
              <path d="M140 75 Q120 50 150 55 C170 58 160 70 140 75 Z" fill="currentColor"/>
            </svg>
            {/* Top-left small leaf */}
            <svg viewBox="0 0 150 150" fill="none" className="absolute left-[-1.5rem] top-32 w-20 h-20 rotate-[60deg] text-[#A7F3D0] opacity-[0.14]" xmlns="http://www.w3.org/2000/svg">
              <path d="M75 140 C75 140 75 75 115 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M75 140 C35 110 25 60 75 25 C125 60 115 110 75 140 Z" fill="currentColor"/>
            </svg>
            {/* Mid-left menu background leaf */}
            <svg viewBox="0 0 200 200" fill="none" className="absolute left-[-3rem] top-[40%] w-36 h-36 rotate-[35deg] text-[#0F766E] opacity-[0.10]" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 180 C50 160 120 120 180 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M40 155 Q20 130 50 135 C70 138 60 150 40 155 Z" fill="currentColor"/>
              <path d="M65 135 Q45 110 75 115 C95 118 85 130 65 135 Z" fill="currentColor"/>
              <path d="M90 115 Q70 90 100 95 C120 98 110 110 90 115 Z" fill="currentColor"/>
              <path d="M115 95 Q95 70 125 75 C145 78 135 90 115 95 Z" fill="currentColor"/>
              <path d="M140 75 Q120 50 150 55 C170 58 160 70 140 75 Z" fill="currentColor"/>
            </svg>
            {/* Mid-right small leaf */}
            <svg viewBox="0 0 200 200" fill="none" className="absolute right-[-2.5rem] bottom-56 w-28 h-28 rotate-[130deg] text-[#16A34A] opacity-[0.11]" xmlns="http://www.w3.org/2000/svg">
              <path d="M100 190 C100 150 110 80 140 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M140 10 C138 2 120 1 115 15 C112 25 130 20 140 10 Z" fill="currentColor"/>
              <path d="M130 45 C115 40 85 45 95 65 C102 78 122 65 130 45 Z" fill="currentColor"/>
              <path d="M132 40 C148 35 178 40 168 60 C161 73 140 60 132 40 Z" fill="currentColor"/>
            </svg>
            {/* Bottom-left leaf */}
            <svg viewBox="0 0 150 150" fill="none" className="absolute left-[-2rem] bottom-20 w-32 h-32 rotate-[45deg] text-[#0F766E] opacity-[0.13]" xmlns="http://www.w3.org/2000/svg">
              <path d="M75 140 C75 140 75 75 115 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M75 140 C35 110 25 60 75 25 C125 60 115 110 75 140 Z" fill="currentColor"/>
            </svg>
            {/* Bottom-right leaf */}
            <svg viewBox="0 0 150 150" fill="none" className="absolute right-[-1.5rem] bottom-6 w-24 h-24 rotate-[-70deg] text-[#A7F3D0] opacity-[0.12]" xmlns="http://www.w3.org/2000/svg">
              <path d="M75 140 C75 140 75 75 115 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M75 140 C35 110 25 60 75 25 C125 60 115 110 75 140 Z" fill="currentColor"/>
            </svg>
          </div>
        )}

        <div className="relative z-10 flex flex-col h-full overflow-hidden">
          {sidebarContent}
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 relative gov-main-bg">
        {/* Header */}
        <header className="h-20 bg-card border-b border-border flex items-center justify-between px-6 shrink-0 gap-3 z-30 sticky top-0 shadow-sm">
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
                  <span className="text-primary text-sm font-semibold hidden sm:inline">{user.role}</span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground hidden sm:inline" />
                  <span className="text-sm font-semibold truncate">
                    {navItems.find((n) => n.id === activeNavItem)?.label}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Command search trigger - Centered visually in a real app, here pushed to right group */}
            <div className="flex-1 max-w-md hidden md:flex items-center justify-center mr-4">
              <button
                onClick={() => setCommandOpen(true)}
                className="flex items-center gap-2 text-sm px-4 py-2 w-full rounded-lg border border-border text-muted-foreground hover:border-primary/40 hover:bg-primary/[0.04] hover:text-primary transition-all justify-between"
              >
                <span className="flex items-center gap-1.5"><CommandIcon className="w-4 h-4" /> Search batches, hashes, or shipments...</span>
                <span className="kbd-chip">⌘K</span>
              </button>
            </div>


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
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowNotifications(false)} />
                    <NotificationPanel onClose={() => setShowNotifications(false)} />
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* User avatar */}
            <button
              onClick={() => navigate('/app/profile')}
              title="View Profile"
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all ${colors.badge}`}
            >
              {user.name.charAt(0)}
            </button>
          </div>
        </header>

        {/* Premium Botanical Background */}
        <BotanicalBackground />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto relative z-10 bg-transparent">
          <div className="p-6 md:p-8 max-w-[1600px] mx-auto relative z-10">
            <Outlet />
          </div>
        </main>
        
        {/* Floating AI Assistant (FAB) */}
        <button className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all z-50">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
          </svg>
        </button>
      </div>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
