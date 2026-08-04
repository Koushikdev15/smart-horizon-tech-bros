import StatsCard from '../../components/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockBatches } from '../../lib/mockData';
import BatchStatusBadge from '../../components/BatchStatusBadge';
import { Package, CheckCircle2, Clock, XCircle, CreditCard, Bell, Leaf, MapPin, CalendarDays } from 'lucide-react';

const todayCollections = [
  { id: 'COL-T001', species: 'Ashwagandha', qty: '120 kg', collector: 'Rajesh Kumar', time: '08:30 AM' },
  { id: 'COL-T002', species: 'Tulsi', qty: '45 kg', collector: 'Geeta Sharma', time: '10:15 AM' },
  { id: 'COL-T003', species: 'Neem Leaves', qty: '200 kg', collector: 'Vikram Singh', time: '01:00 PM' },
];

const notifications = [
  { msg: 'Processing Unit approved BATCH-2026-0042', type: 'success', time: '2h ago' },
  { msg: 'Payment ₹33,750 released for BATCH-2026-0033', type: 'success', time: '5h ago' },
  { msg: 'BATCH-2026-0038 rejected — heavy metals test failed', type: 'error', time: '1d ago' },
];

const typeColors: Record<string, string> = { success: 'bg-emerald-500', error: 'bg-red-500', info: 'bg-blue-500' };

export default function CollectionDashboard() {
  const batches = mockBatches;
  const approved = batches.filter(b => b.status === 'Processing' || b.status === 'Manufacturing' || b.status === 'Completed').length;
  const pending = batches.filter(b => b.currentStage === 'Collection').length;
  const rejected = batches.filter(b => b.status === 'Rejected').length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold font-heading">Collection Center Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Western Ghats Collection Center — Palakkad, Kerala</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatsCard title="Today's Collection" value="3" icon={Leaf} iconColor="text-emerald-600" iconBg="bg-emerald-50 dark:bg-emerald-950/40" subtext="entries" />
        <StatsCard title="Pending Batches" value={pending} icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-50 dark:bg-amber-950/40" />
        <StatsCard title="Approved Batches" value={approved} icon={CheckCircle2} iconColor="text-blue-600" iconBg="bg-blue-50 dark:bg-blue-950/40" />
        <StatsCard title="Rejected Batches" value={rejected} icon={XCircle} iconColor="text-red-600" iconBg="bg-red-50 dark:bg-red-950/40" />
        <StatsCard title="Pending Payment" value="₹13,500" icon={CreditCard} iconColor="text-violet-600" iconBg="bg-violet-50 dark:bg-violet-950/40" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Collections */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Today's Collections</CardTitle>
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">{new Date().toLocaleDateString('en-IN')}</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayCollections.map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center">
                  <Leaf className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{c.species} — <span className="text-muted-foreground font-normal">{c.qty}</span></p>
                  <p className="text-xs text-muted-foreground">{c.collector} · {c.time}</p>
                </div>
                <BatchStatusBadge status="Pending" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Bell className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-base">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.map((n, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${typeColors[n.type]}`} />
                <div>
                  <p className="text-sm">{n.msg}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Batches */}
      <Card>
        <CardHeader><CardTitle className="text-base">Recent Batch History</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {batches.slice(0,4).map((b) => (
            <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                <Package className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono font-medium">{b.batchNumber}</p>
                  <BatchStatusBadge status={b.status} />
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Leaf className="w-3 h-3" />{b.species}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{b.region}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><CalendarDays className="w-3 h-3" />{new Date(b.harvestDate).toLocaleDateString('en-IN')}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{b.quantity} {b.unit}</p>
                <BatchStatusBadge status={b.paymentStatus || 'Pending'} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
