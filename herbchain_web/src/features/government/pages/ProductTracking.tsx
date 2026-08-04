import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '../../../components/PageHeader';
import BatchStatusBadge from '../../../components/BatchStatusBadge';
import BlockchainTimeline from '../../../components/BlockchainTimeline';
import { mockBatches } from '../../../lib/mockData';
import { Search, QrCode, Package, MapPin, CalendarDays, Leaf } from 'lucide-react';
import type { Batch } from '../../../types';

export default function ProductTracking() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Batch | null>(null);

  const filtered = mockBatches.filter((b) =>
    b.batchNumber.toLowerCase().includes(search.toLowerCase()) ||
    b.species.toLowerCase().includes(search.toLowerCase()) ||
    b.collectionCenter.toLowerCase().includes(search.toLowerCase()) ||
    b.region.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Product Tracking"
        description="Search and trace any batch across the entire supply chain"
      />

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by Batch ID, species, center, region..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button variant="outline" className="h-9 gap-1.5 text-sm">
          <QrCode className="w-4 h-4" /> Scan QR
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((batch) => (
          <Card
            key={batch.id}
            className="cursor-pointer hover:shadow-md hover:border-emerald-400/40 transition-all duration-200"
            onClick={() => setSelected(batch)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-sm font-bold font-mono">{batch.batchNumber}</CardTitle>
                  <CardDescription className="text-sm mt-0.5 font-medium text-foreground">{batch.species}</CardDescription>
                  <p className="text-xs text-muted-foreground italic">{batch.botanicalName}</p>
                </div>
                <BatchStatusBadge status={batch.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Leaf className="w-3.5 h-3.5" />
                <span>{batch.collectionCenter}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />
                <span>{batch.region}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="w-3.5 h-3.5" />
                <span>{new Date(batch.harvestDate).toLocaleDateString('en-IN')}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Package className="w-3.5 h-3.5" />
                <span>{batch.quantity} {batch.unit}</span>
              </div>
              {batch.estimatedGrade && (
                <Badge variant="outline" className="text-xs mt-1">{batch.estimatedGrade}</Badge>
              )}
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground">Current Stage</p>
                <p className="text-sm font-medium">{batch.currentStage}</p>
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

            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Species', selected.species],
                  ['Botanical Name', selected.botanicalName || 'N/A'],
                  ['Quantity', `${selected.quantity} ${selected.unit}`],
                  ['Region', selected.region],
                  ['Collector', selected.collectorName],
                  ['Type', selected.collectorType || 'N/A'],
                  ['Harvest Date', new Date(selected.harvestDate).toLocaleDateString('en-IN')],
                  ['Grade', selected.estimatedGrade || 'N/A'],
                ].map(([k, v]) => (
                  <div key={k} className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">{k}</p>
                    <p className="text-sm font-medium">{v}</p>
                  </div>
                ))}
              </div>

              {selected.aiSummary && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">🤖 AI Quality Summary</p>
                  <p className="text-sm">{selected.aiSummary}</p>
                </div>
              )}

              {selected.blockchainHash && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Blockchain Hash:</span>
                  <code className="blockchain-hash">{selected.blockchainHash.slice(0, 24)}...</code>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold mb-3">Complete Batch Timeline</h4>
                <BlockchainTimeline events={selected.timeline} />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
