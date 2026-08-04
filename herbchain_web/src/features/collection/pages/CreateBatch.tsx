import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageHeader from '../../../components/PageHeader';
import { toast } from 'sonner';
import { Upload, MapPin, Sparkles, CheckCircle, Package } from 'lucide-react';

const HERBS = ['Ashwagandha','Brahmi','Tulsi','Neem','Amla','Shatavari','Triphala','Giloy','Moringa','Haritaki'];
const METHODS = ['Hand Picking','Cutting','Root Extraction','Bark Collection','Seed Collection'];
const GRADES = ['Grade A+','Grade A','Grade B+','Grade B','Grade C'];

function generateBatchId() {
  return `BATCH-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

export default function CreateBatch() {
  const [batchId] = useState(generateBatchId());
  const [submitted, setSubmitted] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [form, setForm] = useState({
    collectorType: 'Farmer', collectorName: '', species: '', botanicalName: '',
    quantity: '', unit: 'kg', harvestDate: '', harvestTime: '', method: '',
    region: '', gpsLocation: '', moisture: '', storageCondition: '',
    qualityObservations: '', estimatedGrade: '', sustainabilityNotes: '', remarks: '',
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const generateAISummary = async () => {
    if (!form.species || !form.quantity) {
      toast.error('Please fill species and quantity first.');
      return;
    }
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 1500));
    const summary = `AI Quality Analysis: ${form.species} batch collected from ${form.region || 'specified region'}. Quantity: ${form.quantity} ${form.unit}. Harvest method: ${form.method || 'standard'}. Moisture content ${form.moisture ? form.moisture + '%' : 'within range'}. ${form.estimatedGrade ? `Estimated grade: ${form.estimatedGrade}.` : ''} ${form.qualityObservations || 'Preliminary visual inspection indicates acceptable quality.'} Blockchain verification ready. Forwarding to processing unit recommended.`;
    setAiSummary(summary);
    setGenerating(false);
    toast.success('AI summary generated successfully!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiSummary) { toast.error('Please generate the AI summary before submitting.'); return; }
    await new Promise((r) => setTimeout(r, 1000));
    setSubmitted(true);
    toast.success(`Batch ${batchId} created and forwarded to Processing & Laboratory!`);
  };

  if (submitted) return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="max-w-lg mx-auto mt-12">
        <CardContent className="py-16 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold font-heading">Batch Created!</h3>
          <p className="text-muted-foreground mt-1 text-sm">Batch <span className="font-mono font-bold text-emerald-600">{batchId}</span> has been recorded on blockchain and forwarded to Processing & Laboratory.</p>
          <Button className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setSubmitted(false); setAiSummary(''); }}>
            <Package className="w-4 h-4 mr-1.5" /> Create Another Batch
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Create New Batch"
        description="Record a new herb collection batch with complete details"
        badge={<span className="font-mono text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold">{batchId}</span>}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Collector Info */}
        <Card>
          <CardHeader><CardTitle className="text-base">Collector Information</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Collector Type<span className="text-red-500">*</span></Label>
              <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={form.collectorType} onChange={(e) => set('collectorType', e.target.value)}>
                <option>Farmer</option><option>Wild Collector</option>
              </select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-sm font-medium">Collector Name<span className="text-red-500">*</span></Label>
              <Input placeholder="Select or type farmer/collector name" value={form.collectorName} onChange={(e) => set('collectorName', e.target.value)} required />
            </div>
          </CardContent>
        </Card>

        {/* Herb Details */}
        <Card>
          <CardHeader><CardTitle className="text-base">Herb & Harvest Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Species<span className="text-red-500">*</span></Label>
              <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={form.species} onChange={(e) => set('species', e.target.value)} required>
                <option value="">Select herb species</option>
                {HERBS.map((h) => <option key={h}>{h}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Botanical Name</Label>
              <Input placeholder="e.g. Withania somnifera" value={form.botanicalName} onChange={(e) => set('botanicalName', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Quantity<span className="text-red-500">*</span></Label>
              <div className="flex gap-2">
                <Input type="number" placeholder="0" className="flex-1" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} required />
                <select className="w-20 h-9 rounded-md border border-input bg-background px-2 text-sm" value={form.unit} onChange={(e) => set('unit', e.target.value)}>
                  <option>kg</option><option>g</option><option>tonnes</option><option>litres</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Harvest Date<span className="text-red-500">*</span></Label>
              <Input type="date" value={form.harvestDate} onChange={(e) => set('harvestDate', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Harvest Time</Label>
              <Input type="time" value={form.harvestTime} onChange={(e) => set('harvestTime', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Collection Method</Label>
              <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={form.method} onChange={(e) => set('method', e.target.value)}>
                <option value="">Select method</option>
                {METHODS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Location & Condition */}
        <Card>
          <CardHeader><CardTitle className="text-base">Location & Quality</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Harvest Region<span className="text-red-500">*</span></Label>
              <Input placeholder="e.g. Palakkad, Kerala" value={form.region} onChange={(e) => set('region', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">GPS Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="lat, lng or auto-detect" className="pl-9" value={form.gpsLocation} onChange={(e) => set('gpsLocation', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Moisture Content (%)</Label>
              <Input type="number" placeholder="e.g. 8.5" value={form.moisture} onChange={(e) => set('moisture', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Estimated Grade</Label>
              <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" value={form.estimatedGrade} onChange={(e) => set('estimatedGrade', e.target.value)}>
                <option value="">Select grade</option>
                {GRADES.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Storage Condition</Label>
              <Input placeholder="e.g. Cool & dry, 20°C" value={form.storageCondition} onChange={(e) => set('storageCondition', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Quality Observations</Label>
              <Input placeholder="Visual inspection notes" value={form.qualityObservations} onChange={(e) => set('qualityObservations', e.target.value)} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-sm font-medium">Sustainability Notes</Label>
              <Input placeholder="Organic certification, sustainable harvest notes..." value={form.sustainabilityNotes} onChange={(e) => set('sustainabilityNotes', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Remarks</Label>
              <Input placeholder="Any additional notes..." value={form.remarks} onChange={(e) => set('remarks', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Photo Upload */}
        <Card>
          <CardHeader><CardTitle className="text-base">Photos & Documents</CardTitle></CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-emerald-400/50 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Upload herb photos, field images, collection certificates</p>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG, PDF — Max 10MB each</p>
            </div>
          </CardContent>
        </Card>

        {/* AI Summary */}
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" /> AI Quality Summary
            </CardTitle>
            <Button type="button" onClick={generateAISummary} disabled={generating} variant="outline" className="h-8 text-xs border-emerald-300 text-emerald-600 hover:bg-emerald-50">
              {generating ? <><div className="w-3.5 h-3.5 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin mr-1.5" />Generating...</> : <><Sparkles className="w-3.5 h-3.5 mr-1.5" />Generate AI Summary</>}
            </Button>
          </CardHeader>
          <CardContent>
            {aiSummary ? (
              <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                <p className="text-sm leading-relaxed">{aiSummary}</p>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-muted/50 border border-dashed border-border text-center text-sm text-muted-foreground">
                Fill in the herb details above, then click "Generate AI Summary"
              </div>
            )}
          </CardContent>
        </Card>

        <Button type="submit" disabled={!aiSummary} className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base">
          Submit Batch & Forward to Processing Unit
        </Button>
      </form>
    </div>
  );
}
