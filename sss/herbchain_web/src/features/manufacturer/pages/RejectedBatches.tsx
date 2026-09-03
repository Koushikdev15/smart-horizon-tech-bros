import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '../../../components/PageHeader';
import BatchStatusBadge from '../../../components/BatchStatusBadge';
import BatchTraceability from '../../../components/BatchTraceability';
import StatsCard from '../../../components/StatsCard';

import { XCircle, Leaf, MapPin, AlertTriangle } from 'lucide-react';
import type { Batch } from '../../../types';
import { useBatchStore, useBatchesLive } from '../../../store/useBatchStore';

export default function RejectedBatches() {
  // Live batches from Supabase, shared across every role.
  useBatchesLive();
  const storeBatches = useBatchStore(state => state.batches);
  const rejected = storeBatches.filter(b => b.status === 'Rejected' && b.currentStage === 'Manufacturer');
  
  const [selected, setSelected] = useState<Batch | null>(null);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader title="Rejected Batches" description="Batches that failed GMP or quality audits during manufacturing" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="Total Rejected" value={rejected.length} icon={XCircle} iconColor="text-red-600" iconBg="bg-red-50 dark:bg-red-950/40" />
        <StatsCard title="This Month" value={rejected.length} icon={AlertTriangle} iconColor="text-amber-600" iconBg="bg-amber-50 dark:bg-amber-950/40" />
        <StatsCard title="Rejection Rate" value="2.8%" icon={XCircle} iconColor="text-red-600" iconBg="bg-red-50 dark:bg-red-950/40" />
      </div>

      <div className="space-y-3">
        {rejected.map((batch) => {
          const rejectionEvent = batch.timeline.find(t => t.status === 'Rejected');
          return (
            <Card key={batch.id} className="border-red-200/60 dark:border-red-900/40 hover:shadow-md transition-all duration-200">
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center shrink-0">
                    <XCircle className="w-5 h-5 text-red-600" />
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
                    {rejectionEvent?.remarks && (
                      <div className="mt-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                        <p className="text-xs text-red-700 dark:text-red-400 font-medium flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Rejection Reason</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{rejectionEvent.remarks}</p>
                      </div>
                    )}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setSelected(batch)} className="h-7 text-xs shrink-0">
                    View Timeline
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {rejected.length === 0 && <div className="text-center py-12 text-muted-foreground text-sm">No rejected batches</div>}
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
            <BatchTraceability batch={selected} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
