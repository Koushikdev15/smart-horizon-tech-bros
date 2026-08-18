import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '../../../components/PageHeader';
import BatchStatusBadge from '../../../components/BatchStatusBadge';
import BlockchainTimeline from '../../../components/BlockchainTimeline';
import StatsCard from '../../../components/StatsCard';

import { History as HistoryIcon, Leaf, MapPin, Package, QrCode, Award } from 'lucide-react';
import type { Batch } from '../../../types';
import LabReportPdfModal from '../../../components/LabReportPdfModal';
import { toast } from 'sonner';
import { useBatchStore, useBatchesLive } from '../../../store/useBatchStore';

export default function History() {
  // Live batches from Supabase, shared across every role.
  useBatchesLive();
  const history = useBatchStore(state => state.batches);
  const [selected, setSelected] = useState<Batch | null>(null);
  const [viewingQr, setViewingQr] = useState<Batch | null>(null);
  const [pdfBatch, setPdfBatch] = useState<Batch | null>(null);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader title="Manufacturing History" description="All batches you have previously manufactured into finished products" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="Total Manufactured" value={history.length} icon={Package} iconColor="text-blue-600" iconBg="bg-blue-50 dark:bg-blue-950/40" />
        <StatsCard title="QR Codes Issued" value={history.filter(b => b.qrCode).length} icon={QrCode} iconColor="text-violet-600" iconBg="bg-violet-50 dark:bg-violet-950/40" />
        <StatsCard title="Avg Quality Grade" value="A" icon={HistoryIcon} iconColor="text-primary" iconBg="bg-primary/6 dark:bg-primary/14" />
      </div>

      <div className="space-y-3">
        {history.map((batch) => (
          <Card key={batch.id} className="hover:shadow-md transition-all duration-200 hover:border-blue-300/40">
            <CardContent className="py-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center shrink-0">
                  <HistoryIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-sm">{batch.batchNumber}</span>
                    <BatchStatusBadge status={batch.status} />
                    {batch.productName && <span className="text-xs font-medium">{batch.productName}</span>}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1 items-center">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Leaf className="w-3.5 h-3.5" />{batch.species} ({batch.botanicalName})</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{batch.region}</span>
                    <span className="text-xs text-muted-foreground">{batch.quantity} {batch.unit}</span>
                    {batch.qrCode && <span className="text-xs font-mono text-muted-foreground">{batch.qrCode}</span>}
                    {batch.labCertificate && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setPdfBatch(batch); }}
                        className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold hover:text-primary/80 cursor-pointer"
                      >
                        <Award className="w-3.5 h-3.5" />{batch.labCertificate} (PDF)
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => setSelected(batch)} className="h-7 text-xs">
                    View Timeline
                  </Button>
                  {batch.qrCode && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-primary/30 text-primary"
                      onClick={(e) => { e.stopPropagation(); setViewingQr(batch); }}
                    >
                      <QrCode className="w-3 h-3 mr-1" /> View QR
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {history.length === 0 && <div className="text-center py-12 text-muted-foreground text-sm">No manufacturing history yet</div>}
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

      {pdfBatch && (
        <LabReportPdfModal batch={pdfBatch} onClose={() => setPdfBatch(null)} />
      )}

      {viewingQr && (
        <Dialog open onOpenChange={() => setViewingQr(null)}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-primary" /> Product QR Code
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center p-6 space-y-4">
              <div className="p-4 bg-white rounded-2xl border-2 border-primary/20 shadow-sm qr-frame flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-40 h-40 text-slate-900" xmlns="http://www.w3.org/2000/svg">
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
              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-foreground">{viewingQr.productName || viewingQr.species}</p>
                <p className="text-xs font-mono text-muted-foreground">{viewingQr.qrCode || `${viewingQr.batchNumber}-QR`}</p>
              </div>
              <div className="w-full pt-4 border-t border-border flex justify-between gap-3">
                <Button variant="outline" className="flex-1 rounded-xl font-medium" onClick={() => window.open(`/verify/${viewingQr.batchNumber}`, '_blank')}>
                  Preview Portal
                </Button>
                <Button className="flex-1 rounded-xl bg-primary hover:bg-primary/95 text-white font-medium" onClick={() => {
                  toast.success('QR label printed successfully.');
                  setViewingQr(null);
                }}>
                  Print Label
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
