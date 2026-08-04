import {
  Home, Leaf, Shield, Truck, FlaskConical, Factory,
  Users, FileText, Package, BarChart3, CreditCard,
  ClipboardList, Settings, UserCheck, AlertTriangle, Search,
  MessageSquare, History, XCircle, PlusCircle, TreePine,
  ScrollText, User as UserIcon,
} from 'lucide-react';
import type { UserRole } from '../types';

export interface NavItem {
  icon: React.ElementType;
  label: string;
  id: string;
}

/** Single source of truth for per-role sidebar nav + command palette destinations. */
export const roleNavItems: Record<UserRole, NavItem[]> = {
  'Government': [
    { icon: Home,          label: 'Dashboard',           id: 'dashboard'    },
    { icon: UserCheck,     label: 'Member Registration', id: 'registration' },
    { icon: ClipboardList, label: 'Pending Approvals',   id: 'approvals'    },
    { icon: Users,         label: 'Active Members',      id: 'members'      },
    { icon: AlertTriangle, label: 'Complaints',          id: 'complaints'   },
    { icon: Search,        label: 'Product Tracking',    id: 'tracking'     },
    { icon: History,       label: 'Batch Timeline',      id: 'timeline'     },
    { icon: BarChart3,     label: 'Analytics',           id: 'analytics'    },
    { icon: FileText,      label: 'Reports',             id: 'reports'      },
    { icon: CreditCard,    label: 'Payments',            id: 'payments'     },
    { icon: ScrollText,    label: 'Audit Logs',          id: 'audit'        },
    { icon: Settings,      label: 'System Settings',     id: 'settings'     },
  ],
  'Collection Center': [
    { icon: Home,          label: 'Dashboard',       id: 'dashboard'     },
    { icon: Leaf,          label: 'Farmers',         id: 'farmers'       },
    { icon: TreePine,      label: 'Wild Collectors', id: 'collectors'    },
    { icon: PlusCircle,    label: 'Create Batch',    id: 'create-batch'  },
    { icon: Package,       label: 'Batch History',   id: 'batch-history' },
    { icon: MessageSquare, label: 'Messages',        id: 'messages'      },
    { icon: CreditCard,    label: 'Payments',        id: 'payments'      },
  ],
  'Processing & Laboratory': [
    { icon: Home,          label: 'Dashboard', id: 'dashboard' },
    { icon: ClipboardList, label: 'Requests',  id: 'requests'  },
    { icon: XCircle,       label: 'Rejected',  id: 'rejected'  },
    { icon: History,       label: 'History',   id: 'history'   },
    { icon: MessageSquare, label: 'Messages',  id: 'messages'  },
    { icon: CreditCard,    label: 'Payments',  id: 'payments'  },
  ],
  'Manufacturer': [
    { icon: Home,          label: 'Dashboard', id: 'dashboard' },
    { icon: ClipboardList, label: 'Requests',  id: 'requests'  },
    { icon: XCircle,       label: 'Rejected',  id: 'rejected'  },
    { icon: History,       label: 'History',   id: 'history'   },
    { icon: MessageSquare, label: 'Messages',  id: 'messages'  },
    { icon: CreditCard,    label: 'Payments',  id: 'payments'  },
  ],
  'Supply Chain': [
    { icon: Home,          label: 'Dashboard', id: 'dashboard' },
    { icon: ClipboardList, label: 'Requests',  id: 'requests'  },
    { icon: XCircle,       label: 'Rejected',  id: 'rejected'  },
    { icon: History,       label: 'History',   id: 'history'   },
    { icon: MessageSquare, label: 'Messages',  id: 'messages'  },
    { icon: CreditCard,    label: 'Payments',  id: 'payments'  },
  ],
};

export const roleColors: Record<UserRole, { bg: string; text: string; badge: string }> = {
  'Government':              { bg: 'bg-violet-100 dark:bg-violet-950/50',  text: 'text-violet-700 dark:text-violet-400',  badge: 'bg-violet-500'  },
  'Collection Center':       { bg: 'bg-emerald-100 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-400', badge: 'bg-emerald-500' },
  'Processing & Laboratory': { bg: 'bg-amber-100 dark:bg-amber-950/50',    text: 'text-amber-700 dark:text-amber-400',    badge: 'bg-amber-500'   },
  'Manufacturer':            { bg: 'bg-blue-100 dark:bg-blue-950/50',     text: 'text-blue-700 dark:text-blue-400',      badge: 'bg-blue-500'    },
  'Supply Chain':            { bg: 'bg-cyan-100 dark:bg-cyan-950/50',     text: 'text-cyan-700 dark:text-cyan-400',      badge: 'bg-cyan-500'    },
};

export const roleIcons: Record<UserRole, React.ElementType> = {
  'Government':              Shield,
  'Collection Center':       Leaf,
  'Processing & Laboratory': FlaskConical,
  'Manufacturer':            Factory,
  'Supply Chain':            Truck,
};
