import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '../../../components/PageHeader';
import BatchStatusBadge from '../../../components/BatchStatusBadge';
import BlockchainTimeline from '../../../components/BlockchainTimeline';
import StatsCard from '../../../components/StatsCard';
import { mockBatches } from '../../../lib/mockData';
import { History as HistoryIcon, Leaf, MapPin, Truck, CheckCircle2 } from 'lucide-react';
import type { Batch } from '../../../types';

const history = mockBatches.filter(b => b.timeline.find(t => t.stage === 'Supply Chain')?.status === 'Completed');

export default function History() {
  const [selected, setSelected] = useState<Batch | null>(null);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader title="Delivery History" description="All shipments you have previously delivered" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="Total Delivered" value={history.length} icon={Truck} iconColor="text-cyan-600" iconBg="bg-cyan-50 dark:bg-cyan-950/40" />
        <StatsCard title="On-Time Deliveries" value={history.length} icon={CheckCircle2} iconColor="text-emerald-600" iconBg="bg-emerald-50 dark:bg-emerald-950/40" />
        <StatsCard title="Avg Delivery Time" value="3.2 days" icon={HistoryIcon} iconColor="text-blue-600" iconBg="bg-blue-50 dark:bg-blue-950/40" />
      </div>

      <div className="space-y-3">
        {history.map((batch) => {
          const deliveryEvent = batch.timeline.find(t => t.stage === 'Supply Chain');
          return (
            <Card key={batch.id} className="hover:shadow-md transition-all duration-200 hover:border-cyan-300/40">
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950/50 flex items-center justify-center shrink-0">
                    <HistoryIcon className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-sm">{batch.batchNumber}</span>
                      <BatchStatusBadge status={batch.status} />
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Leaf className="w-3 h-3" />{batch.species} ({batch.botanicalName})</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{batch.region}</span>
                      <span className="text-xs text-muted-foreground">{batch.quantity} {batch.unit}</span>
                    </div>
                    {deliveryEvent?.remarks && <p className="text-xs text-muted-foreground mt-1.5">{deliveryEvent.remarks}</p>}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setSelected(batch)} className="h-7 text-xs shrink-0">
                    View Timeline
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {history.length === 0 && <div className="text-center py-12 text-muted-foreground text-sm">No delivery history yet</div>}
      </div>

      {selected && (
        <Dialog open onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="font-mono">{selected.batchNumber}</span>
                <BatchStatusBadge status={selected.status} />
              </DialogTitle>
            </DialogHeader>
            <BlockchainTimeline events={selected.timeline} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
