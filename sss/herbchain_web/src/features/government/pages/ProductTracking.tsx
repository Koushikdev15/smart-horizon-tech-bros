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
import { toast } from 'sonner';

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
        <Button
          variant="outline"
          className="h-9 gap-1.5 text-sm"
          onClick={() => {
            const completedWithQr = mockBatches.find(b => b.qrCode);
            if (completedWithQr) {
              setSelected(completedWithQr);
              toast.success(`Scanned QR Code: ${completedWithQr.qrCode}. Showing traceability data.`);
            } else {
              toast.error('No QR codes available to scan in mock data.');
            }
          }}
        >
          <QrCode className="w-4 h-4" /> Scan QR
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((batch) => (
          <Card
            key={batch.id}
            className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200"
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
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg font-bold font-heading">
                <span>Batch Traceability: </span>
                <span className="font-mono text-primary">{selected.batchNumber}</span>
                <BatchStatusBadge status={selected.status} />
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
              {/* Left Column: Details & AI */}
              <div className="lg:col-span-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Specification & Source</h3>
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
                    <div key={k} className="p-3 rounded-lg bg-muted/50 border border-border/20">
                      <p className="text-[10px] uppercase font-semibold text-muted-foreground">{k}</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{v}</p>
                    </div>
                  ))}
                </div>

                {selected.aiSummary && (
                  <div className="p-4 rounded-xl bg-primary/6 dark:bg-primary/12 border border-primary/20 dark:border-primary/20">
                    <p className="text-xs font-bold text-primary mb-1.5 uppercase tracking-wide">🤖 AI Quality Summary</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">{selected.aiSummary}</p>
                  </div>
                )}

                {selected.qrCode && (
                  <div className="p-4 rounded-xl border border-primary/20 bg-card flex flex-col items-center justify-center space-y-3 shadow-sm">
                    <p className="text-xs font-bold text-primary uppercase tracking-wide flex items-center gap-1.5"><QrCode className="w-4 h-4" /> Product QR Code</p>
                    <div className="p-2 bg-white rounded-lg border border-primary/20 flex items-center justify-center">
                      <svg viewBox="0 0 100 100" className="w-24 h-24 text-slate-900" xmlns="http://www.w3.org/2000/svg">
                        <rect x="0" y="0" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="4" />
                        <rect x="5" y="5" width="15" height="15" fill="currentColor" />
                        <rect x="75" y="0" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="4" />
                        <rect x="80" y="5" width="15" height="15" fill="currentColor" />
                        <rect x="0" y="75" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="4" />
                        <rect x="5" y="80" width="15" height="15" fill="currentColor" />
                        <rect x="80" y="80" width="10" height="10" fill="currentColor" />
                        <path d="M 35 5 L 45 5 L 45 15 L 35 15 Z" fill="currentColor" />
                        <path d="M 55 5 L 65 5 L 65 25 L 55 25 Z" fill="currentColor" />
                        <path d="M 35 25 L 45 25 L 45 45 L 35 45 Z" fill="currentColor" />
                        <path d="M 50 35 L 70 35 L 70 45 L 50 45 Z" fill="currentColor" />
                        <path d="M 5 35 L 25 35 L 25 45 L 5 45 Z" fill="currentColor" />
                        <path d="M 5 55 L 15 55 L 15 70 L 5 70 Z" fill="currentColor" />
                        <path d="M 35 55 L 55 55 L 55 65 L 35 65 Z" fill="currentColor" />
                        <path d="M 65 55 L 95 55 L 95 65 L 65 65 Z" fill="currentColor" />
                        <path d="M 35 75 L 45 75 L 45 95 L 35 95 Z" fill="currentColor" />
                        <path d="M 55 75 L 75 75 L 75 95 L 55 95 Z" fill="currentColor" />
                      </svg>
                    </div>
                    <code className="text-xs font-mono text-muted-foreground">{selected.qrCode}</code>
                  </div>
                )}

                {selected.blockchainHash && (
                  <div className="p-3 rounded-lg border border-border bg-card flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Chain Proof Hash:</span>
                    <code className="font-mono text-primary font-bold">{selected.blockchainHash.slice(0, 20)}...</code>
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
