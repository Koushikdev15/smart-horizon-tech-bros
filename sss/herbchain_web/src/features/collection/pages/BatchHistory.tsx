import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import PageHeader from '../../../components/PageHeader';
import BatchStatusBadge from '../../../components/BatchStatusBadge';
import BlockchainTimeline from '../../../components/BlockchainTimeline';
import { mockBatches } from '../../../lib/mockData';
import { Search, Package, Leaf, MapPin, CalendarDays, Star } from 'lucide-react';
import type { Batch } from '../../../types';
import { useBatchStore } from '../../../store/useBatchStore';

export default function BatchHistory() {
  const storeBatches = useBatchStore(state => state.batches);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Batch | null>(null);

  const filtered = storeBatches.filter((b) =>
    b.batchNumber.toLowerCase().includes(search.toLowerCase()) ||
    b.species.toLowerCase().includes(search.toLowerCase()) ||
    b.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader title="Batch History" description="All batches submitted from your collection center" />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search batches..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="space-y-3">
        {filtered.map((batch) => (
          <Card key={batch.id} className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200" onClick={() => setSelected(batch)}>
            <CardContent className="py-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/16 flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-sm">{batch.batchNumber}</span>
                    <BatchStatusBadge status={batch.status} />
                    {batch.paymentStatus && <BatchStatusBadge status={batch.paymentStatus} />}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1.5">
                    <span className="text-sm flex items-center gap-1 text-muted-foreground"><Leaf className="w-3.5 h-3.5" />{batch.species}</span>
                    <span className="text-sm flex items-center gap-1 text-muted-foreground"><MapPin className="w-3.5 h-3.5" />{batch.region}</span>
                    <span className="text-sm flex items-center gap-1 text-muted-foreground"><CalendarDays className="w-3.5 h-3.5" />{new Date(batch.harvestDate).toLocaleDateString('en-IN')}</span>
                    <span className="text-sm font-medium">{batch.quantity} {batch.unit}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">Current Stage</p>
                  <p className="text-sm font-medium">{batch.currentStage}</p>
                  {batch.rating && (
                    <div className="flex items-center gap-1 justify-end mt-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-medium">{batch.rating}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stage progress bar */}
              <div className="mt-3 flex gap-1">
                {['Collection','Processing','Laboratory','Manufacturing','Supply Chain'].map((stage) => {
                  const ev = batch.timeline.find(t => t.stage === stage || (stage === 'Laboratory' && t.stage === 'Laboratory'));
                  const status = ev?.status || 'Pending';
                  return (
                    <div key={stage} className={`flex-1 h-1.5 rounded-full ${status === 'Completed' ? 'bg-primary' : status === 'In Progress' ? 'bg-blue-400' : status === 'Rejected' ? 'bg-red-400' : 'bg-gray-200 dark:bg-gray-700'}`} title={`${stage}: ${status}`} />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
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
            {selected.aiSummary && (
              <div className="p-3 rounded-lg bg-primary/6 dark:bg-primary/12 border border-primary/25 dark:border-primary/30 text-sm">
                <p className="text-xs font-semibold text-primary dark:text-primary mb-1">🤖 AI Summary</p>
                {selected.aiSummary}
              </div>
            )}
            <BlockchainTimeline events={selected.timeline} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
