import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  onBack?: () => void;
  badge?: ReactNode;
  className?: string;
}

export default function PageHeader({ title, description, actions, onBack, badge, className = '' }: PageHeaderProps) {
  return (
    <div className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${className}`}>
      <div className="flex items-start gap-3">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="mt-0.5 shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-heading tracking-tight">{title}</h2>
            {badge}
          </div>
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
