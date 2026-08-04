import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import PageHeader from '../../../components/PageHeader';
import { Leaf, FlaskConical, Factory, Truck, Upload, CheckCircle } from 'lucide-react';

function FormField({ label, id, placeholder, type = 'text', required = false }: { label: string; id: string; placeholder?: string; type?: string; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      <Input id={id} type={type} placeholder={placeholder} className="h-9" />
    </div>
  );
}

function CollectionCenterForm() {
  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTimeout(() => {
      setSubmitted(true);
      toast.success('Collection Center registered! Pending admin approval.');
    }, 800);
  };
  if (submitted) return (
    <div className="text-center py-16">
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-8 h-8 text-emerald-600" />
      </div>
      <h3 className="text-lg font-bold">Registration Submitted!</h3>
      <p className="text-muted-foreground mt-1 text-sm">Credentials will be issued after admin approval.</p>
      <Button className="mt-4" onClick={() => setSubmitted(false)}>Register Another</Button>
    </div>
  );
  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField label="Organization Name" id="cc-org" placeholder="Western Ghats Collection Center" required />
      <FormField label="Owner Name" id="cc-owner" placeholder="Full name" required />
      <FormField label="Ayurvedic License No." id="cc-license" placeholder="KL-CC-2024-0012" required />
      <FormField label="GST Number" id="cc-gst" placeholder="29ABCDE1234F1Z5" required />
      <FormField label="PAN Number" id="cc-pan" placeholder="ABCDE1234F" required />
      <FormField label="Phone Number" id="cc-phone" placeholder="+91 9876543210" required />
      <FormField label="Email Address" id="cc-email" type="email" placeholder="info@example.com" required />
      <FormField label="Assigned Region" id="cc-region" placeholder="Kerala, Western Ghats" required />
      <FormField label="Warehouse Capacity (kg)" id="cc-capacity" placeholder="5000" />
      <FormField label="Experience (Years)" id="cc-exp" type="number" placeholder="5" />
      <div className="space-y-1.5 md:col-span-2">
        <Label className="text-sm font-medium">Address</Label>
        <textarea className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Full address..." />
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label className="text-sm font-medium">Bank Details</Label>
        <Input placeholder="Bank Name / Account No / IFSC" />
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label className="text-sm font-medium">Documents Upload</Label>
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-emerald-400/50 transition-colors cursor-pointer">
          <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Click to upload license, GST certificate, PAN card</p>
          <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG up to 10MB each</p>
        </div>
      </div>
      <div className="md:col-span-2">
        <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Register Collection Center</Button>
      </div>
    </form>
  );
}

function ProcessingLabForm() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Processing & Lab registered! Pending admin approval.');
  };
  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField label="Lab/Unit Name" id="pl-name" placeholder="Kerala AYUSH Processing Unit" required />
      <FormField label="NABL Certificate No." id="pl-nabl" placeholder="NABL-KL-2024-089" required />
      <FormField label="Drug License No." id="pl-drug" placeholder="DL-KL-2024-221" required />
      <FormField label="GST Number" id="pl-gst" placeholder="29ABCDE1234F1Z5" required />
      <FormField label="PAN Number" id="pl-pan" placeholder="ABCDE1234F" required />
      <FormField label="No. of Employees" id="pl-emp" type="number" placeholder="25" />
      <FormField label="Phone Number" id="pl-phone" placeholder="+91 9876543210" required />
      <FormField label="Email Address" id="pl-email" type="email" placeholder="lab@example.com" required />
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Testing Equipment</Label>
        <textarea className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" placeholder="HPLC, GC-MS, AAS, PCR..." />
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Address</Label>
        <textarea className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Full address..." />
      </div>
      <FormField label="Bank Details" id="pl-bank" placeholder="Bank / Account / IFSC" />
      <div className="md:col-span-2">
        <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-amber-400/50 transition-colors cursor-pointer mb-4">
          <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
          <p className="text-sm text-muted-foreground">Upload NABL Certificate, Drug License, Equipment List</p>
        </div>
        <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white">Register Processing & Lab</Button>
      </div>
    </form>
  );
}

function ManufacturerForm() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Manufacturer registered! Pending admin approval.');
  };
  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField label="Manufacturer Name" id="mf-name" placeholder="AyurNature Products Pvt Ltd" required />
      <FormField label="Manufacturing License" id="mf-mflic" placeholder="ML-GJ-2024-099" required />
      <FormField label="GMP Certificate No." id="mf-gmp" placeholder="GMP-GJ-2024-056" required />
      <FormField label="Drug License No." id="mf-drug" placeholder="DL-GJ-2024-077" required />
      <FormField label="GST Number" id="mf-gst" placeholder="24KLMNO9012L3Z7" required />
      <FormField label="PAN Number" id="mf-pan" placeholder="KLMNO9012L" required />
      <FormField label="Factory Capacity (units/day)" id="mf-cap" placeholder="50000" />
      <FormField label="Phone Number" id="mf-phone" placeholder="+91 9871234567" required />
      <FormField label="Email Address" id="mf-email" type="email" placeholder="mfg@example.com" required />
      <FormField label="Bank Details" id="mf-bank" placeholder="Bank / Account / IFSC" />
      <div className="space-y-1.5 md:col-span-2">
        <Label className="text-sm font-medium">Factory Address</Label>
        <textarea className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Factory address..." />
      </div>
      <div className="md:col-span-2">
        <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-blue-400/50 transition-colors cursor-pointer mb-4">
          <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
          <p className="text-sm text-muted-foreground">Upload GMP Certificate, Manufacturing License, Drug License</p>
        </div>
        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">Register Manufacturer</Button>
      </div>
    </form>
  );
}

function SupplyChainForm() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Supply Chain partner registered! Pending admin approval.');
  };
  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField label="Company Name" id="sc-name" placeholder="IndiaShip Logistics Pvt Ltd" required />
      <FormField label="Warehouse Capacity (sq.ft)" id="sc-wh" placeholder="10000" required />
      <FormField label="Number of Vehicles" id="sc-veh" placeholder="8" />
      <FormField label="Vehicle Types" id="sc-vtype" placeholder="Refrigerated trucks, vans..." />
      <FormField label="Operating Region" id="sc-region" placeholder="Pan India" required />
      <FormField label="GST Number" id="sc-gst" placeholder="27PQRST3456M4Z8" required />
      <FormField label="PAN Number" id="sc-pan" placeholder="PQRST3456M" required />
      <FormField label="Phone Number" id="sc-phone" placeholder="+91 9765432109" required />
      <FormField label="Email Address" id="sc-email" type="email" placeholder="logistics@example.com" required />
      <FormField label="Bank Details" id="sc-bank" placeholder="Bank / Account / IFSC" />
      <div className="md:col-span-2">
        <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-cyan-400/50 transition-colors cursor-pointer mb-4">
          <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
          <p className="text-sm text-muted-foreground">Upload GST Certificate, Vehicle Registration, Warehouse License</p>
        </div>
        <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white">Register Supply Chain Partner</Button>
      </div>
    </form>
  );
}

export default function MemberRegistration() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Member Registration"
        description="Register new stakeholders into the AYUTRACE+ ecosystem. Credentials are issued only after admin approval."
      />

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="collection">
            <TabsList className="grid grid-cols-4 w-full mb-6">
              <TabsTrigger value="collection" className="text-xs gap-1.5">
                <Leaf className="w-3.5 h-3.5" /> Collection Center
              </TabsTrigger>
              <TabsTrigger value="processing" className="text-xs gap-1.5">
                <FlaskConical className="w-3.5 h-3.5" /> Processing & Lab
              </TabsTrigger>
              <TabsTrigger value="manufacturer" className="text-xs gap-1.5">
                <Factory className="w-3.5 h-3.5" /> Manufacturer
              </TabsTrigger>
              <TabsTrigger value="supply" className="text-xs gap-1.5">
                <Truck className="w-3.5 h-3.5" /> Supply Chain
              </TabsTrigger>
            </TabsList>

            <TabsContent value="collection"><CollectionCenterForm /></TabsContent>
            <TabsContent value="processing"><ProcessingLabForm /></TabsContent>
            <TabsContent value="manufacturer"><ManufacturerForm /></TabsContent>
            <TabsContent value="supply"><SupplyChainForm /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
