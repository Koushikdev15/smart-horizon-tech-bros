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
                    {!isDone && (
                      <Button size="sm" onClick={() => { setSelected(batch); setShowForm(true); }} className="h-7 text-xs bg-cyan-600 hover:bg-cyan-700 text-white">
                        <Truck className="w-3 h-3 mr-1" /> Dispatch
                      </Button>
                    )}
                    {isDone && (
                      <Button size="sm" variant="outline" className="h-7 text-xs border-emerald-300 text-emerald-600" onClick={() => handleComplete(batch.id)}>
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
    </div>
  );
}
