import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import PageHeader from '../../../components/PageHeader';
import { CheckCircle, Tractor, TreePine } from 'lucide-react';
import DocumentUpload from '../../../components/DocumentUpload';

function FormField({ label, id, placeholder, type = 'text', required = false }: { label: string; id: string; placeholder?: string; type?: string; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      <Input id={id} type={type} placeholder={placeholder} className="h-9" />
    </div>
  );
}

function FarmerForm() {
  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTimeout(() => {
      setSubmitted(true);
      toast.success('Farmer registered successfully!');
    }, 800);
  };
  if (submitted) return (
    <div className="text-center py-16">
      <div className="w-16 h-16 bg-emerald-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-8 h-8 text-emerald-600" />
      </div>
      <h3 className="text-lg font-bold">Registration Submitted!</h3>
      <p className="text-muted-foreground mt-1 text-sm">The farmer has been added to your collection registry.</p>
      <Button className="mt-4" onClick={() => setSubmitted(false)}>Register Another</Button>
    </div>
  );
  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField label="Full Name" id="frm-name" placeholder="Ramesh Kumar" required />
      <FormField label="Aadhar Number" id="frm-aadhar" placeholder="1234 5678 9012" required />
      <FormField label="Phone Number" id="frm-phone" placeholder="+91 9876543210" required />
      <FormField label="Total Land Area (Acres)" id="frm-land" type="number" placeholder="5" required />
      <FormField label="Soil Type" id="frm-soil" placeholder="Red Laterite" />
      <FormField label="Irrigation Method" id="frm-irrigation" placeholder="Drip Irrigation" />
      <FormField label="Primary Herbs Cultivated" id="frm-herbs" placeholder="Ashwagandha, Tulsi" required />
      <FormField label="Organic Certification Status" id="frm-cert" placeholder="Certified / Pending / None" />
      <div className="space-y-1.5 md:col-span-2">
        <Label className="text-sm font-medium">Farm Address / Location</Label>
        <textarea className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Village, Taluk, District..." />
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label className="text-sm font-medium">Bank Details</Label>
        <Input placeholder="Bank Name / Account No / IFSC" />
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label className="text-sm font-medium">Documents Upload</Label>
        <DocumentUpload label="Click or drag files to upload Land Records, Aadhar, Organic Certificate" />
      </div>
      <div className="md:col-span-2">
        <Button type="submit" className="w-full bg-[#166534] hover:bg-[#166534]/90 text-white">Register Farmer</Button>
      </div>
    </form>
  );
}

function WildCollectorForm() {
  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTimeout(() => {
      setSubmitted(true);
      toast.success('Wild Collector registered successfully!');
    }, 800);
  };
  if (submitted) return (
    <div className="text-center py-16">
      <div className="w-16 h-16 bg-[#166534]/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-8 h-8 text-[#166534]" />
      </div>
      <h3 className="text-lg font-bold">Registration Submitted!</h3>
      <p className="text-muted-foreground mt-1 text-sm">The wild collector has been added to your collection registry.</p>
      <Button className="mt-4" onClick={() => setSubmitted(false)}>Register Another</Button>
    </div>
  );
  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField label="Full Name" id="wc-name" placeholder="Suresh Menon" required />
      <FormField label="Aadhar Number" id="wc-aadhar" placeholder="1234 5678 9012" required />
      <FormField label="Phone Number" id="wc-phone" placeholder="+91 9876543210" required />
      <FormField label="Primary Forest Zone / Region" id="wc-zone" placeholder="Silent Valley Reserve" required />
      <FormField label="Wild Collection Permit No." id="wc-permit" placeholder="KL-FD-2024-882" required />
      <FormField label="Tribes/Community Affiliation" id="wc-tribe" placeholder="Muthuvan (Optional)" />
      <FormField label="Target Herbs Collected" id="wc-herbs" placeholder="Brahmi, Shatavari" required />
      <FormField label="Experience in Wildcrafting (Yrs)" id="wc-exp" type="number" placeholder="15" />
      <div className="space-y-1.5 md:col-span-2">
        <Label className="text-sm font-medium">Base Address</Label>
        <textarea className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Village, District..." />
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label className="text-sm font-medium">Bank Details</Label>
        <Input placeholder="Bank Name / Account No / IFSC" />
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label className="text-sm font-medium">Documents Upload</Label>
        <DocumentUpload label="Click or drag files to upload Forest Permit, Aadhar, Community ID" />
      </div>
      <div className="md:col-span-2">
        <Button type="submit" className="w-full bg-[#166534] hover:bg-[#166534]/90 text-white">Register Wild Collector</Button>
      </div>
    </form>
  );
}

export default function StakeholderRegistration() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Stakeholder Registration"
        description="Register new farmers and wild collectors into your local collection node."
      />

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="farmer">
            <TabsList className="grid grid-cols-2 w-full max-w-md mb-6 h-auto p-1">
              <TabsTrigger value="farmer" className="text-xs gap-1.5 text-slate-700 dark:text-slate-300 data-[state=active]:font-bold py-2">
                <Tractor className="w-3.5 h-3.5" /> Farmer
              </TabsTrigger>
              <TabsTrigger value="wild" className="text-xs gap-1.5 text-slate-700 dark:text-slate-300 data-[state=active]:font-bold py-2">
                <TreePine className="w-3.5 h-3.5" /> Wild Collector
              </TabsTrigger>
            </TabsList>

            <TabsContent value="farmer"><FarmerForm /></TabsContent>
            <TabsContent value="wild"><WildCollectorForm /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
