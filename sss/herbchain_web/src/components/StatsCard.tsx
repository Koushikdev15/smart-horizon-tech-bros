import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
  children?: ReactNode;
  onClick?: () => void;
  /** 0-100. Renders a thin progress bar under the value. */
  progress?: number;
  /** Small set of numbers rendered as a trailing sparkline. */
  sparkline?: number[];
  /** Stagger index — each increment delays mount-in by ~60ms. */
  delayIndex?: number;
}

export default function StatsCard({
  title,
  value,
  subtext,
  icon: Icon,
  iconColor = 'text-primary',
  iconBg = 'bg-primary/8',
  trend,
  trendValue,
  className = '',
  children,
  onClick,
  progress,
  sparkline,
  delayIndex = 0,
}: StatsCardProps) {
  const trendColor =
    trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground';
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '';
  const sparklineData = sparkline?.map((v, i) => ({ i, v }));

  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: delayIndex * 0.06, ease: 'easeOut' }}
      whileHover={onClick ? { scale: 1.015 } : undefined}
      whileTap={onClick ? { scale: 0.99 } : undefined}
    >
      <Card onClick={onClick} className={`stat-card h-full flex flex-col border-border/60 shadow-sm hover:shadow-md transition-all duration-200 ${className}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col justify-end">
          <div className="flex items-end justify-between gap-2">
            <div className="text-2xl font-bold font-heading">{value}</div>
            {sparklineData && sparklineData.length > 1 && (
              <div className="w-16 h-8 -mb-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparklineData}>
                    <defs>
                      <linearGradient id={`spark-${title.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="currentColor" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke="currentColor"
                      strokeWidth={1.75}
                      fill={`url(#spark-${title.replace(/\s+/g, '-')})`}
                      className={iconColor}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          {(subtext || trendValue) && (
            <p className="text-xs text-muted-foreground mt-1">
              {trendValue && (
                <span className={`font-medium ${trendColor}`}>
                  {trendIcon} {trendValue}{' '}
                </span>
              )}
              {subtext}
            </p>
          )}
          {typeof progress === 'number' && (
            <div className="mt-2.5 h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${iconColor.replace('text-', 'bg-')}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                transition={{ duration: 0.6, delay: delayIndex * 0.06 + 0.1, ease: 'easeOut' }}
              />
            </div>
          )}
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}
