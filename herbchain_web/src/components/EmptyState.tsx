import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void; icon?: LucideIcon };
  className?: string;
  children?: ReactNode;
  /** Set for use on dark surfaces (e.g. the Consumer Portal). */
  tone?: 'default' | 'dark';
}

export default function EmptyState({ icon: Icon, title, description, action, className = '', children, tone = 'default' }: EmptyStateProps) {
  const isDark = tone === 'dark';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`flex flex-col items-center justify-center text-center py-14 px-6 ${className}`}
    >
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
          isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-primary/8 border border-primary/15'
        }`}
      >
        <Icon className={`w-6 h-6 ${isDark ? 'text-emerald-400' : 'text-primary'}`} />
      </div>
      <h3 className={`text-base font-semibold font-heading ${isDark ? 'text-white' : 'text-foreground'}`}>{title}</h3>
      {description && (
        <p className={`text-sm mt-1.5 max-w-sm ${isDark ? 'text-gray-400' : 'text-muted-foreground'}`}>{description}</p>
      )}
      {children}
      {action && (
        <Button onClick={action.onClick} className="mt-5 bg-primary text-primary-foreground hover:bg-primary/90" size="sm">
          {action.icon && <action.icon className="w-3.5 h-3.5" />}
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}
