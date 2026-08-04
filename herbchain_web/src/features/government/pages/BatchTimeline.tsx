import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '../../../components/PageHeader';
import BatchStatusBadge from '../../../components/BatchStatusBadge';
import BlockchainTimeline from '../../../components/BlockchainTimeline';
import { mockBatches } from '../../../lib/mockData';
import { Search, Package } from 'lucide-react';
import type { Batch } from '../../../types';

export default function BatchTimeline() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Batch | null>(null);

  const filtered = mockBatches.filter((b) =>
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
          <Card key={batch.id} className="cursor-pointer hover:shadow-md hover:border-emerald-400/40 transition-all duration-200" onClick={() => setSelected(batch)}>
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
                  <div key={i} className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${ev.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' : ev.status === 'In Progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400' : ev.status === 'Rejected' ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                <span className="font-mono">{selected.batchNumber}</span> — {selected.species}
              </DialogTitle>
            </DialogHeader>
            {selected.blockchainHash && (
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <span className="text-xs text-muted-foreground">Chain Hash:</span>
                <code className="blockchain-hash">{selected.blockchainHash.slice(0, 28)}...</code>
              </div>
            )}
            <BlockchainTimeline events={selected.timeline} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
