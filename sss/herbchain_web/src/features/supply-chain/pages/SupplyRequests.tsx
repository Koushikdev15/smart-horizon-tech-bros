import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '../../../components/PageHeader';
import BatchStatusBadge from '../../../components/BatchStatusBadge';
import BlockchainTimeline from '../../../components/BlockchainTimeline';
import { mockBatches } from '../../../lib/mockData';
import { toast } from 'sonner';
import { Truck, Leaf, QrCode, MapPin, CheckCircle } from 'lucide-react';
import type { Batch } from '../../../types';

const DELIVERY_STATUS = ['Ready for Dispatch','In Transit','Out for Delivery','Delivered','Delayed'];

export default function SupplyRequests() {
  const [batches] = useState<Batch[]>(mockBatches.filter(b => b.status === 'Completed'));
  const [selected, setSelected] = useState<Batch | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [viewingQr, setViewingQr] = useState<Batch | null>(null);
  const [submitted, setSubmitted] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [form, setForm] = useState({
    warehouse: '', dispatchDate: '', vehicleNumber: '', destination: '',
    expectedDelivery: '', deliveryStatus: 'Ready for Dispatch',
    temperature: '', remarks: '',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    await new Promise(r => setTimeout(r, 1200));
    setProcessing(false);
    if (selected) setSubmitted(s => [...s, selected.id]);
    setShowForm(false);
    setSelected(null);
    toast.success('Shipment updated on blockchain! Batch delivery in progress.');
  };

  const handleComplete = async (id: string) => {
    await new Promise(r => setTimeout(r, 800));
    setSubmitted(s => [...s, id]);
    toast.success('Batch delivered! Final settlement initiated. Batch lifecycle complete.');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader title="Shipment Requests" description="Incoming product batches ready for dispatch and delivery" />

      <div className="space-y-3">
        {batches.map((batch) => {
          const isDone = submitted.includes(batch.id);
          return (
            <Card key={batch.id} className="hover:shadow-md transition-all duration-200">
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950/50 flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-sm">{batch.batchNumber}</span>
                      {isDone ? <BatchStatusBadge status="Completed" /> : <BatchStatusBadge status={batch.status} />}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Leaf className="w-3 h-3" />{batch.productName || batch.species}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{batch.region}</span>
                      {batch.qrCode && <span className="text-xs text-cyan-600 flex items-center gap-1 font-mono"><QrCode className="w-3 h-3" />{batch.qrCode}</span>}
                    </div>
                    {batch.destination && (
                      <p className="text-xs text-muted-foreground mt-0.5">→ {batch.destination}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => { setSelected(batch); setShowForm(false); }} className="h-7 text-xs">Timeline</Button>
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
                    {!isDone && (
                      <Button size="sm" onClick={() => { setSelected(batch); setShowForm(true); }} className="h-7 text-xs bg-cyan-600 hover:bg-cyan-700 text-white">
                        <Truck className="w-3 h-3 mr-1" /> Dispatch
                      </Button>
                    )}
                    {isDone && (
                      <Button size="sm" variant="outline" className="h-7 text-xs border-primary/30 text-primary" onClick={() => handleComplete(batch.id)}>
                        <CheckCircle className="w-3 h-3 mr-1" /> Mark Delivered
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {batches.length === 0 && <div className="text-center py-12 text-muted-foreground text-sm">No shipment requests</div>}
      </div>

      {selected && !showForm && (
        <Dialog open onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-mono">{selected.batchNumber}</DialogTitle></DialogHeader>
            <BlockchainTimeline events={selected.timeline} />
          </DialogContent>
        </Dialog>
      )}

      {selected && showForm && (
        <Dialog open onOpenChange={() => { setSelected(null); setShowForm(false); }}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-cyan-600" /> Dispatch: {selected.batchNumber}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Warehouse', key: 'warehouse', placeholder: 'Mumbai Warehouse A' },
                  { label: 'Vehicle Number', key: 'vehicleNumber', placeholder: 'MH-01-AB-1234' },
                  { label: 'Destination', key: 'destination', placeholder: 'Delhi Retail Hub' },
                  { label: 'Temperature During Transport (°C)', key: 'temperature', placeholder: '4-8°C' },
                ].map(({ label, key, placeholder }) => (
                  <div key={key} className="space-y-1.5">
                    <Label className="text-sm font-medium">{label}</Label>
                    <Input placeholder={placeholder} value={(form as any)[key]} onChange={e => set(key, e.target.value)} />
                  </div>
                ))}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Dispatch Date<span className="text-red-500">*</span></Label>
                  <Input type="date" value={form.dispatchDate} onChange={e => set('dispatchDate', e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Expected Delivery</Label>
                  <Input type="date" value={form.expectedDelivery} onChange={e => set('expectedDelivery', e.target.value)} />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-sm font-medium">Delivery Status</Label>
                  <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.deliveryStatus} onChange={e => set('deliveryStatus', e.target.value)}>
                    {DELIVERY_STATUS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-sm font-medium">Remarks</Label>
                  <textarea className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" value={form.remarks} onChange={e => set('remarks', e.target.value)} />
                </div>
              </div>

              <Button type="submit" disabled={processing} className="w-full h-11 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold">
                {processing ? (
                  <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Updating Blockchain...</span>
                ) : (
                  <span className="flex items-center gap-2"><Truck className="w-5 h-5" />Confirm Dispatch & Update Shipment</span>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
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
