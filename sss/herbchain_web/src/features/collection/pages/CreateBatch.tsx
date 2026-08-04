import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageHeader from '../../../components/PageHeader';
import DocumentUpload from '../../../components/DocumentUpload';
import { toast } from 'sonner';
import { MapPin, Sparkles, CheckCircle, Package } from 'lucide-react';
import { useBatchStore } from '../../../store/useBatchStore';
import type { Batch } from '../../../types';

const HERB_MASTER_DB: Record<string, string> = {
  'Ashwagandha': 'Withania somnifera',
  'Tulsi (Holy Basil)': 'Ocimum tenuiflorum',
  'Neem': 'Azadirachta indica',
  'Aloe Vera': 'Aloe barbadensis Miller',
  'Turmeric': 'Curcuma longa',
  'Ginger': 'Zingiber officinale',
  'Amla (Indian Gooseberry)': 'Phyllanthus emblica',
  'Brahmi': 'Bacopa monnieri',
  'Giloy (Guduchi)': 'Tinospora cordifolia',
  'Shatavari': 'Asparagus racemosus',
  'Haritaki': 'Terminalia chebula',
  'Bibhitaki': 'Terminalia bellirica',
  'Bael': 'Aegle marmelos',
  'Arjuna': 'Terminalia arjuna',
  'Mulethi (Licorice)': 'Glycyrrhiza glabra',
  'Kalmegh': 'Andrographis paniculata',
  'Bhringraj': 'Eclipta prostrata',
  'Gudmar': 'Gymnema sylvestre',
  'Guggul': 'Commiphora wightii',
  'Punarnava': 'Boerhavia diffusa',
  'Vasaka': 'Justicia adhatoda',
  'Sarpagandha': 'Rauvolfia serpentina',
  'Manjistha': 'Rubia cordifolia',
  'Vidanga': 'Embelia ribes',
  'Safed Musli': 'Chlorophytum borivilianum',
  'Moringa (Drumstick)': 'Moringa oleifera',
  'Pippali (Long Pepper)': 'Piper longum',
  'Black Pepper': 'Piper nigrum',
  'Cardamom': 'Elettaria cardamomum',
  'Cinnamon': 'Cinnamomum verum',
  'Clove': 'Syzygium aromaticum',
  'Coriander': 'Coriandrum sativum',
  'Fennel': 'Foeniculum vulgare',
  'Fenugreek': 'Trigonella foenum-graecum',
  'Ajwain': 'Trachyspermum ammi',
  'Cumin': 'Cuminum cyminum',
  'Curry Leaves': 'Murraya koenigii',
  'Hibiscus': 'Hibiscus rosa-sinensis',
  'Nirgundi': 'Vitex negundo',
  'Ashoka': 'Saraca asoca',
  'Chirata': 'Swertia chirayita',
  'Shankhpushpi': 'Convolvulus pluricaulis',
  'Jatamansi': 'Nardostachys jatamansi',
  'Kutki': 'Picrorhiza kurroa',
  'Tagara': 'Valeriana wallichii',
  'Patha': 'Cissampelos pareira',
  'Anantamul': 'Hemidesmus indicus',
  'Bhumyamalaki': 'Phyllanthus niruri',
  'Kantakari': 'Solanum xanthocarpum',
  'Apamarga': 'Achyranthes aspera',
  'Eranda (Castor)': 'Ricinus communis',
  'Triphala': 'Terminalia chebula, Terminalia bellirica, Phyllanthus emblica' // Keeping Triphala for backwards compatibility
};

const HERBS = Object.keys(HERB_MASTER_DB);
const METHODS = ['Hand Picking','Cutting','Root Extraction','Bark Collection','Seed Collection'];
const GRADES = ['Grade A+','Grade A','Grade B+','Grade B','Grade C'];

function generateBatchId() {
  return `BATCH-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

export default function CreateBatch() {
  const addBatch = useBatchStore(state => state.addBatch);
  const [batchId, setBatchId] = useState(generateBatchId());
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
    
    const newBatch: Batch = {
      id: `b-${Date.now()}`,
      batchNumber: batchId,
      species: form.species,
      botanicalName: form.botanicalName,
      quantity: form.quantity,
      unit: form.unit,
      collectorType: form.collectorType as any,
      region: form.region,
      date: form.harvestDate,
      status: 'Processing',
      aiSummary: aiSummary,
      timeline: [
        {
          id: `evt-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().split(' ')[0].slice(0, 5),
          stage: 'Collection Center',
          action: 'Batch Created',
          actor: form.collectorName || form.collectorType,
          details: `Harvested ${form.quantity}${form.unit} of ${form.species}. Forwarded to Processing.`
        }
      ]
    };
    
    addBatch(newBatch);
    setSubmitted(true);
    toast.success(`Batch ${batchId} created and forwarded to Processing & Laboratory!`);
  };

  if (submitted) return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="max-w-lg mx-auto mt-12">
        <CardContent className="py-16 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold font-heading">Batch Created!</h3>
          <p className="text-muted-foreground mt-1 text-sm">Batch <span className="font-mono font-bold text-primary">{batchId}</span> has been recorded on blockchain and forwarded to Processing & Laboratory.</p>
          <Button className="mt-6 bg-primary hover:bg-primary text-white" onClick={() => { 
            setSubmitted(false); 
            setAiSummary(''); 
            setBatchId(generateBatchId()); 
            setForm({
              collectorType: 'Farmer', collectorName: '', species: '', botanicalName: '',
              quantity: '', unit: 'kg', harvestDate: '', harvestTime: '', method: '',
              region: '', gpsLocation: '', moisture: '', storageCondition: '',
              qualityObservations: '', estimatedGrade: '', sustainabilityNotes: '', remarks: '',
            });
          }}>
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
        badge={<span className="font-mono text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold">{batchId}</span>}
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
              <select 
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" 
                value={form.species} 
                onChange={(e) => {
                  const selectedSpecies = e.target.value;
                  setForm(f => ({
                    ...f, 
                    species: selectedSpecies, 
                    botanicalName: HERB_MASTER_DB[selectedSpecies] || ''
                  }));
                }} 
                required
              >
                <option value="">Select herb species</option>
                {HERBS.map((h) => <option key={h}>{h}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Botanical Name</Label>
              <Input 
                placeholder="Botanical name will be filled automatically" 
                value={form.botanicalName} 
                readOnly 
                tabIndex={-1}
                className="bg-muted/30 text-muted-foreground cursor-not-allowed focus-visible:ring-0" 
              />
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
                <Input placeholder="lat, lng or auto-detect" className="pl-9 pr-20" value={form.gpsLocation} onChange={(e) => set('gpsLocation', e.target.value)} />
                <Button 
                  type="button" 
                  size="sm" 
                  className="absolute right-1 top-1 h-7 text-xs px-3 bg-primary hover:bg-primary/90 text-white font-medium shadow-sm transition-colors"
                  onClick={() => {
                    if (navigator.geolocation) {
                      toast.loading('Detecting location...', { id: 'gps-toast' });
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          set('gpsLocation', `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`);
                          toast.success('Location detected!', { id: 'gps-toast' });
                        },
                        (err) => toast.error('Failed to detect location. Please ensure location permissions are granted.', { id: 'gps-toast' })
                      );
                    } else {
                      toast.error('Geolocation is not supported by your browser.');
                    }
                  }}
                >
                  Detect
                </Button>
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
            <DocumentUpload label="Click or drag files to upload Herb Photos, Field Images, Collection Certificates" />
          </CardContent>
        </Card>

        {/* AI Summary */}
        <Card className="border-primary/25 dark:border-primary/30">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> AI Quality Summary
            </CardTitle>
            <Button type="button" onClick={generateAISummary} disabled={generating} variant="outline" className="h-8 text-xs border-primary/30 text-primary hover:bg-primary/6">
              {generating ? <><div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-1.5" />Generating...</> : <><Sparkles className="w-3.5 h-3.5 mr-1.5" />Generate AI Summary</>}
            </Button>
          </CardHeader>
          <CardContent>
            {aiSummary ? (
              <div className="p-4 rounded-lg bg-primary/6 dark:bg-primary/12 border border-primary/25 dark:border-primary/30">
                <p className="text-sm leading-relaxed">{aiSummary}</p>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-muted/50 border border-dashed border-border text-center text-sm text-muted-foreground">
                Fill in the herb details above, then click "Generate AI Summary"
              </div>
            )}
          </CardContent>
        </Card>

        <Button type="submit" disabled={!aiSummary} className="w-full h-11 bg-primary hover:bg-primary text-white font-semibold text-base">
          Submit Batch & Forward to Processing Unit
        </Button>
      </form>
    </div>
  );
}
