import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '../../../components/PageHeader';
import BatchStatusBadge from '../../../components/BatchStatusBadge';
import BlockchainTimeline from '../../../components/BlockchainTimeline';
import StatsCard from '../../../components/StatsCard';

import { History as HistoryIcon, Leaf, MapPin, Package, Award } from 'lucide-react';
import type { Batch } from '../../../types';
import { useBatchStore, useBatchesLive } from '../../../store/useBatchStore';

export default function History() {
  // Live batches from Supabase, shared across every role.
  useBatchesLive();
  const history = useBatchStore(state => state.batches);
  const [selected, setSelected] = useState<Batch | null>(null);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader title="Processing History" description="All batches you have previously processed and certified" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="Total Processed" value={history.length} icon={Package} iconColor="text-amber-600" iconBg="bg-amber-50 dark:bg-amber-950/40" />
        <StatsCard title="Certificates Issued" value={history.filter(b => b.labCertificate).length} icon={Award} iconColor="text-blue-600" iconBg="bg-blue-50 dark:bg-blue-950/40" />
        <StatsCard title="Avg Quality Grade" value="A" icon={HistoryIcon} iconColor="text-primary" iconBg="bg-primary/6 dark:bg-primary/14" />
      </div>

      <div className="space-y-3">
        {history.map((batch) => (
          <Card key={batch.id} className="hover:shadow-md transition-all duration-200 hover:border-amber-300/40">
            <CardContent className="py-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center shrink-0">
                  <HistoryIcon className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-sm">{batch.batchNumber}</span>
                    <BatchStatusBadge status={batch.status} />
                    {batch.estimatedGrade && <span className="text-xs text-muted-foreground">Grade: {batch.estimatedGrade}</span>}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Leaf className="w-3 h-3" />{batch.species} ({batch.botanicalName})</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{batch.region}</span>
                    <span className="text-xs text-muted-foreground">{batch.quantity} {batch.unit}</span>
                    {batch.labCertificate && <span className="text-xs font-mono text-muted-foreground">{batch.labCertificate}</span>}
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setSelected(batch)} className="h-7 text-xs shrink-0">
                  View Timeline
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {history.length === 0 && <div className="text-center py-12 text-muted-foreground text-sm">No processing history yet</div>}
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
