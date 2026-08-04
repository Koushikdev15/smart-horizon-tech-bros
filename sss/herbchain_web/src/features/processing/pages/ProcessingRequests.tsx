import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '../../../components/PageHeader';
import BatchStatusBadge from '../../../components/BatchStatusBadge';
import BlockchainTimeline from '../../../components/BlockchainTimeline';
import { mockBatches } from '../../../lib/mockData';
import { toast } from 'sonner';
import { FlaskConical, Leaf, MapPin, Sparkles, FileCheck, Award } from 'lucide-react';
import type { Batch } from '../../../types';
import { useBatchStore } from '../../../store/useBatchStore';

const DRYING_METHODS = ['Sun Drying','Shade Drying','Oven Drying','Spray Drying','Freeze Drying'];
const GRINDING_METHODS = ['Ball Mill','Hammer Mill','Pin Mill','Roller Mill','Hand Grinding'];

export default function ProcessingRequests() {
  const storeBatches = useBatchStore(state => state.batches);
  const updateBatchStatus = useBatchStore(state => state.updateBatchStatus);
  const rejectBatch = useBatchStore(state => state.rejectBatch);
  
  const batches = storeBatches.filter(b => b.status === 'Processing');
  
  const [selected, setSelected] = useState<Batch | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [form, setForm] = useState({
    cleaningCompleted: false, dryingMethod: '', grindingMethod: '', storageCondition: '',
    temperature: '', humidity: '', moisture: '', heavyMetals: 'Pass', pesticides: 'Pass',
    dnaAuthentication: 'Authentic', microbialTest: 'Pass', visualInspection: '',
    odour: '', colour: '', texture: '', remarks: '',
  });

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setProcessing(true);
    await new Promise(r => setTimeout(r, 1500));
    updateBatchStatus(selected.id, 'Manufacturing', {
      id: `evt-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].slice(0, 5),
      stage: 'Processing & Laboratory',
      action: 'Quality Testing Passed',
      actor: 'Lab Technician',
      details: 'All quality parameters passed successfully. Forwarded to Manufacturer.'
    });
    setProcessing(false);
    setShowForm(false);
    setSelected(null);
    toast.success('Laboratory certificate generated! Batch forwarded to Manufacturer.');
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !rejectionReason.trim()) {
      toast.error('Please enter a reason for rejection.');
      return;
    }
    setProcessing(true);
    await new Promise(r => setTimeout(r, 1000));
    rejectBatch(selected.id, 'Processing & Laboratory', rejectionReason);
    setProcessing(false);
    setShowRejectForm(false);
    setRejectionReason('');
    setSelected(null);
    toast.error('Batch has been rejected.');
  };

  const TestField = ({ label, field }: { label: string; field: string }) => (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={(form as any)[field]} onChange={e => set(field, e.target.value)}>
        <option value="Pass">✅ Pass</option>
        <option value="Fail">❌ Fail</option>
        <option value="Pending">⏳ Pending</option>
      </select>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader title="Batch Requests" description="Incoming batches from collection centers awaiting processing" />

      <div className="space-y-3">
        {batches.map((batch) => (
          <Card key={batch.id} className={`cursor-pointer hover:shadow-md transition-all duration-200 ${selected?.id === batch.id ? 'border-amber-400/60 shadow-md' : 'hover:border-amber-300/40'}`}>
            <CardContent className="py-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center shrink-0">
                  <FlaskConical className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-sm">{batch.batchNumber}</span>
                    <BatchStatusBadge status={batch.status} />
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Leaf className="w-3 h-3" />{batch.species} ({batch.botanicalName})</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{batch.region}</span>
                    <span className="text-xs text-muted-foreground">{batch.quantity} {batch.unit} · {batch.collectorType}</span>
                  </div>
                  {batch.aiSummary && (
                    <div className="mt-2 p-2 rounded-lg bg-primary/6 dark:bg-primary/12 border border-primary/25 dark:border-primary/30">
                      <p className="text-xs text-primary dark:text-primary font-medium flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI Summary</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{batch.aiSummary}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => { setSelected(batch); setShowForm(false); }} className="h-7 text-xs">
                    View Timeline
                  </Button>
                  {batch.status === 'Processing' && (
                    <div className="flex flex-col gap-1.5">
                      <Button size="sm" onClick={() => { setSelected(batch); setShowForm(true); }} className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white">
                        <FlaskConical className="w-3 h-3 mr-1" /> Process
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => { setSelected(batch); setShowRejectForm(true); }} className="h-7 text-xs">
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {batches.length === 0 && <div className="text-center py-12 text-muted-foreground text-sm">No pending batch requests</div>}
      </div>

      {/* Timeline Dialog */}
      {selected && !showForm && (
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

      {/* Reject Form Dialog */}
      {selected && showRejectForm && (
        <Dialog open onOpenChange={() => { setSelected(null); setShowRejectForm(false); setRejectionReason(''); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                Reject Batch: {selected.batchNumber}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleReject} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Reason for Rejection <span className="text-red-500">*</span></Label>
                <Input 
                  placeholder="Enter the specific reason for rejecting this batch" 
                  value={rejectionReason} 
                  onChange={(e) => setRejectionReason(e.target.value)} 
                  required 
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowRejectForm(false)}>Cancel</Button>
                <Button type="submit" variant="destructive" disabled={processing}>
                  {processing ? 'Rejecting...' : 'Confirm Rejection'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Processing Form Dialog */}
      {selected && showForm && (
        <Dialog open onOpenChange={() => { setSelected(null); setShowForm(false); }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-amber-600" /> Process Batch: {selected.batchNumber}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Processing info */}
              <Card className="border-amber-200 dark:border-amber-800">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Processing Details</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 md:col-span-2">
                    <input type="checkbox" id="cleaning" checked={form.cleaningCompleted} onChange={e => set('cleaningCompleted', e.target.checked)} className="w-4 h-4 rounded" />
                    <Label htmlFor="cleaning" className="text-sm">Cleaning Completed</Label>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Drying Method</Label>
                    <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.dryingMethod} onChange={e => set('dryingMethod', e.target.value)}>
                      <option value="">Select</option>{DRYING_METHODS.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Grinding Method</Label>
                    <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.grindingMethod} onChange={e => set('grindingMethod', e.target.value)}>
                      <option value="">Select</option>{GRINDING_METHODS.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Temperature (°C)</Label>
                    <Input placeholder="25" value={form.temperature} onChange={e => set('temperature', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Humidity (%)</Label>
                    <Input placeholder="55" value={form.humidity} onChange={e => set('humidity', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Moisture Content (%)</Label>
                    <Input placeholder="8.5" value={form.moisture} onChange={e => set('moisture', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Storage Condition</Label>
                    <Input placeholder="Cool & dry, airtight" value={form.storageCondition} onChange={e => set('storageCondition', e.target.value)} />
                  </div>
                </CardContent>
              </Card>

              {/* Lab Tests */}
              <Card className="border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5"><Award className="w-4 h-4 text-blue-500" />Laboratory Tests</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <TestField label="Heavy Metals" field="heavyMetals" />
                  <TestField label="Pesticides" field="pesticides" />
                  <TestField label="DNA Authentication" field="dnaAuthentication" />
                  <TestField label="Microbial Test" field="microbialTest" />
                </CardContent>
              </Card>

              {/* Sensory */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Sensory & Visual Inspection</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Visual Inspection</Label>
                    <Input placeholder="Uniform powder, no foreign matter" value={form.visualInspection} onChange={e => set('visualInspection', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Odour</Label>
                    <Input placeholder="Characteristic, pleasant" value={form.odour} onChange={e => set('odour', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Colour</Label>
                    <Input placeholder="Light brown, uniform" value={form.colour} onChange={e => set('colour', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Texture</Label>
                    <Input placeholder="Fine powder" value={form.texture} onChange={e => set('texture', e.target.value)} />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-sm font-medium">Remarks</Label>
                    <textarea className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" value={form.remarks} onChange={e => set('remarks', e.target.value)} />
                  </div>
                </CardContent>
              </Card>

              <Button type="submit" disabled={processing} className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white font-semibold">
                {processing ? (
                  <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating Certificate...</span>
                ) : (
                  <span className="flex items-center gap-2"><FileCheck className="w-5 h-5" />Generate Lab Certificate & Forward to Manufacturer</span>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
