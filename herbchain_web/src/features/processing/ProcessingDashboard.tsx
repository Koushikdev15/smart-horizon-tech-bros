import StatsCard from '../../components/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockBatches } from '../../lib/mockData';
import BatchStatusBadge from '../../components/BatchStatusBadge';
import { useAppStore } from '../../store/appStore';
import { ClipboardList, CheckCircle2, XCircle, FlaskConical, Leaf, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProcessingDashboard() {
  const { setActiveNavItem } = useAppStore();
  const pending = mockBatches.filter(b => b.status === 'Processing');
  const completed = mockBatches.filter(b => b.status === 'Manufacturing' || b.status === 'Completed');
  const rejected = mockBatches.filter(b => b.status === 'Rejected');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold font-heading">Processing & Laboratory Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Kerala AYUSH Processing Unit — NABL Certified</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard title="Incoming Requests" value={pending.length} icon={ClipboardList} iconColor="text-amber-600" iconBg="bg-amber-50 dark:bg-amber-950/40" />
        <StatsCard title="In Processing" value={pending.length} icon={FlaskConical} iconColor="text-blue-600" iconBg="bg-blue-50 dark:bg-blue-950/40" />
        <StatsCard title="Certified & Forwarded" value={completed.length} icon={CheckCircle2} iconColor="text-emerald-600" iconBg="bg-emerald-50 dark:bg-emerald-950/40" />
        <StatsCard title="Rejected Batches" value={rejected.length} icon={XCircle} iconColor="text-red-600" iconBg="bg-red-50 dark:bg-red-950/40" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Pending Requests</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setActiveNavItem('requests')} className="h-7 text-xs">View All</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {pending.slice(0,3).map((b) => (
            <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setActiveNavItem('requests')}>
              <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center">
                <FlaskConical className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm">{b.batchNumber}</span>
                  <BatchStatusBadge status="In Progress" />
                </div>
                <div className="flex gap-3 mt-0.5">
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Leaf className="w-3 h-3" />{b.species}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{b.region}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{b.quantity} {b.unit}</p>
                <p className="text-xs text-muted-foreground">{b.collectionCenter}</p>
              </div>
            </div>
          ))}
          {pending.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No pending requests</p>}
        </CardContent>
      </Card>
    </div>
  );
}
