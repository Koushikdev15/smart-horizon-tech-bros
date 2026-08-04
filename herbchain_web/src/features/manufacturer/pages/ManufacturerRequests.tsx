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
import { Factory, Leaf, QrCode, Award, Package } from 'lucide-react';
import type { Batch } from '../../../types';

const CATEGORIES = ['Tablet','Capsule','Syrup','Powder','Oil','Cream','Churna','Kwatha','Asava','Arishta'];
const PACKAGING = ['Blister Pack','Bottle','Sachet','Jar','Tube','Pouch'];

export default function ManufacturerRequests() {
  const [batches] = useState<Batch[]>(mockBatches.filter(b => b.status === 'Manufacturing' || b.status === 'Completed'));
  const [selected, setSelected] = useState<Batch | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [form, setForm] = useState({
    productName: '', productCategory: '', manufacturingDate: '', expiryDate: '',
    packagingType: '', storage: '', qualityConfirmation: false, batchSize: '', remarks: '',
  });
  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    await new Promise(r => setTimeout(r, 1500));
    setProcessing(false);
    if (selected) setSubmitted(s => [...s, selected.id]);
    setShowForm(false);
    setSelected(null);
    toast.success('Product batch created! QR code generated and updated on blockchain. Forwarding to Supply Chain.');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader title="Manufacturing Requests" description="Certified batches from processing units ready for manufacturing" />

      <div className="space-y-3">
        {batches.map((batch) => {
          const isDone = submitted.includes(batch.id) || batch.status === 'Completed';
          return (
            <Card key={batch.id} className={`cursor-pointer hover:shadow-md transition-all duration-200 ${isDone ? 'opacity-70' : ''}`}>
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center shrink-0">
                    <Factory className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-sm">{batch.batchNumber}</span>
                      {isDone ? <BatchStatusBadge status="Completed" /> : <BatchStatusBadge status={batch.status} />}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Leaf className="w-3 h-3" />{batch.species}</span>
                      <span className="text-xs text-muted-foreground">{batch.quantity} {batch.unit}</span>
                      {batch.labCertificate && (
                        <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium"><Award className="w-3 h-3" />{batch.labCertificate}</span>
                      )}
                    </div>
                    {batch.productName && (
                      <div className="mt-1 flex items-center gap-2">
                        <Package className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs font-medium">{batch.productName} — {batch.productCategory}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => { setSelected(batch); setShowForm(false); }} className="h-7 text-xs">Timeline</Button>
                    {!isDone && (
                      <Button size="sm" onClick={() => { setSelected(batch); setShowForm(true); }} className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white">
                        <Factory className="w-3 h-3 mr-1" /> Manufacture
                      </Button>
                    )}
                    {isDone && (
                      <Button size="sm" variant="outline" className="h-7 text-xs border-emerald-300 text-emerald-600">
                        <QrCode className="w-3 h-3 mr-1" /> View QR
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Factory className="w-5 h-5 text-blue-600" /> Manufacture: {selected.batchNumber}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Product Name<span className="text-red-500">*</span></Label>
                  <Input placeholder="e.g. Ashwagandha Capsules" value={form.productName} onChange={e => set('productName', e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Product Category<span className="text-red-500">*</span></Label>
                  <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.productCategory} onChange={e => set('productCategory', e.target.value)} required>
                    <option value="">Select</option>{CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Manufacturing Date<span className="text-red-500">*</span></Label>
                  <Input type="date" value={form.manufacturingDate} onChange={e => set('manufacturingDate', e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Expiry Date<span className="text-red-500">*</span></Label>
                  <Input type="date" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Packaging Type<span className="text-red-500">*</span></Label>
                  <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.packagingType} onChange={e => set('packagingType', e.target.value)} required>
                    <option value="">Select</option>{PACKAGING.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Batch Size (units)</Label>
                  <Input type="number" placeholder="10000" value={form.batchSize} onChange={e => set('batchSize', e.target.value)} />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-sm font-medium">Storage Conditions</Label>
                  <Input placeholder="Store in cool, dry place away from direct sunlight..." value={form.storage} onChange={e => set('storage', e.target.value)} />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-sm font-medium">Remarks</Label>
                  <textarea className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" value={form.remarks} onChange={e => set('remarks', e.target.value)} />
                </div>
                <div className="flex items-center gap-2 md:col-span-2">
                  <input type="checkbox" id="qc" checked={form.qualityConfirmation} onChange={e => set('qualityConfirmation', e.target.checked)} className="w-4 h-4 rounded" required />
                  <Label htmlFor="qc" className="text-sm">I confirm this product meets all quality standards and GMP requirements</Label>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-sm flex items-center gap-2">
                <QrCode className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-blue-700 dark:text-blue-400">A unique QR code will be generated and linked to this product batch on submission.</span>
              </div>

              <Button type="submit" disabled={processing || !form.qualityConfirmation} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                {processing ? (
                  <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating QR & Updating Blockchain...</span>
                ) : (
                  <span className="flex items-center gap-2"><QrCode className="w-5 h-5" />Generate Product, QR Code & Forward to Supply Chain</span>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
