import StatsCard from '../../components/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockBatches } from '../../lib/mockData';
import BatchStatusBadge from '../../components/BatchStatusBadge';
import { useAppStore } from '../../store/appStore';
import { ClipboardList, Truck, CheckCircle2, Package, Leaf, MapPin } from 'lucide-react';

export default function SupplyChainDashboard() {
  const { setActiveNavItem } = useAppStore();
  const incoming = mockBatches.filter(b => b.status === 'Completed');
  const inTransit = incoming.filter(b => b.deliveryStatus === 'In Transit');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold font-heading">Supply Chain Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-0.5">IndiaShip Logistics — Pan India Operations</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard title="Incoming Shipments" value={incoming.length} icon={ClipboardList} iconColor="text-cyan-600" iconBg="bg-cyan-50 dark:bg-cyan-950/40" />
        <StatsCard title="In Transit" value={inTransit.length} icon={Truck} iconColor="text-blue-600" iconBg="bg-blue-50 dark:bg-blue-950/40" />
        <StatsCard title="Delivered" value={incoming.length} icon={CheckCircle2} iconColor="text-emerald-600" iconBg="bg-emerald-50 dark:bg-emerald-950/40" />
        <StatsCard title="Pending Dispatch" value={incoming.length} icon={Package} iconColor="text-amber-600" iconBg="bg-amber-50 dark:bg-amber-950/40" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Incoming Product Batches</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setActiveNavItem('requests')} className="h-7 text-xs">View All</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {incoming.slice(0,3).map((b) => (
            <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setActiveNavItem('requests')}>
              <div className="w-9 h-9 rounded-lg bg-cyan-100 dark:bg-cyan-950/50 flex items-center justify-center">
                <Truck className="w-4 h-4 text-cyan-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm">{b.batchNumber}</span>
                  <BatchStatusBadge status="Completed" />
                </div>
                <div className="flex gap-3 mt-0.5">
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Leaf className="w-3 h-3" />{b.productName || b.species}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{b.region}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{b.quantity} {b.unit}</p>
                {b.qrCode && <p className="text-xs text-cyan-600 font-mono">{b.qrCode}</p>}
              </div>
            </div>
          ))}
          {incoming.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No incoming shipments</p>}
        </CardContent>
      </Card>
    </div>
  );
}
