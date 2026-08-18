import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '../../../components/PageHeader';
import BatchStatusBadge from '../../../components/BatchStatusBadge';
import BlockchainTimeline from '../../../components/BlockchainTimeline';
import { useBatchStore, useBatchesLive } from '../../../store/useBatchStore';
import { Search, Package } from 'lucide-react';
import type { Batch } from '../../../types';

export default function BatchTimeline() {
  // Live batches from Supabase, so Collection Centre submissions appear here.
  useBatchesLive();
  const allBatches = useBatchStore((s) => s.batches);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Batch | null>(null);

  const filtered = allBatches.filter((b) =>
    b.batchNumber.toLowerCase().includes(search.toLowerCase()) ||
    b.species.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Batch Timeline"
        description="View the complete immutable lifecycle of any batch on the blockchain"
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by batch ID or species..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((batch) => (
          <Card key={batch.id} className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200" onClick={() => setSelected(batch)}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">{batch.batchNumber}</p>
                  <CardTitle className="text-base">{batch.species}</CardTitle>
                </div>
                <BatchStatusBadge status={batch.status} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-1 flex-wrap mt-1">
                {batch.timeline.map((ev, i) => (
                  <div key={i} className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${ev.status === 'Completed' ? 'bg-primary/10 text-primary dark:bg-primary/16 dark:text-primary' : ev.status === 'In Progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400' : ev.status === 'Rejected' ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                    {ev.stage}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">{batch.collectionCenter} · {batch.region}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {selected && (
        <Dialog open onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg font-bold font-heading">
                <Package className="w-5 h-5 text-primary" />
                <span>Batch Timeline: </span>
                <span className="font-mono text-primary">{selected.batchNumber}</span> — {selected.species}
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
              {/* Left Column: Details Summary */}
              <div className="lg:col-span-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Batch Overview</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Species', selected.species],
                    ['Botanical Name', selected.botanicalName || 'N/A'],
                    ['Quantity', `${selected.quantity} ${selected.unit}`],
                    ['Origin Region', selected.region],
                    ['Collection Center', selected.collectionCenter],
                    ['Harvest Date', new Date(selected.harvestDate).toLocaleDateString('en-IN')],
                  ].map(([k, v]) => (
                    <div key={k} className="p-3 rounded-lg bg-muted/50 border border-border/20">
                      <p className="text-[10px] uppercase font-semibold text-muted-foreground">{k}</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{v}</p>
                    </div>
                  ))}
                </div>

                {selected.blockchainHash && (
                  <div className="p-3 rounded-lg border border-border bg-card flex flex-col gap-1 text-xs">
                    <span className="text-muted-foreground font-semibold uppercase text-[9px] tracking-wider">Blockchain Ledger Proof</span>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-muted-foreground">TX Hash:</span>
                      <code className="font-mono text-primary font-bold text-[11px]">{selected.blockchainHash.slice(0, 18)}...</code>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Timeline */}
              <div className="lg:col-span-7 space-y-4 border-t lg:border-t-0 lg:border-l border-border pt-4 lg:pt-0 lg:pl-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Immutable Blockchain Timeline</h3>
                <div className="pr-1">
                  <BlockchainTimeline events={selected.timeline} />
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
