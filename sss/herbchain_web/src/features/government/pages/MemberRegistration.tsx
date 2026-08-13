import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import PageHeader from '../../../components/PageHeader';
import { Leaf, FlaskConical, Factory, Truck, CheckCircle, Tractor, TreePine, ShieldCheck, Mail } from 'lucide-react';
import DocumentUpload from '../../../components/DocumentUpload';
import { supabase } from '../../../lib/supabase';
import { supabaseOtpClient } from '../../../lib/supabaseOtpClient';

function FormField({ label, id, placeholder, type = 'text', required = false, value, onChange }: { label: string; id: string; placeholder?: string; type?: string; required?: boolean; value?: string; onChange?: (e: any) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</Label>
      <Input id={id} type={type} placeholder={placeholder} className="h-9" value={value} onChange={onChange} required={required} />
    </div>
  );
}

const RESEND_COOLDOWN_SECONDS = 60;

function EmailVerification({ onVerified }: { onVerified: (email: string) => void }) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Tick the resend countdown down once a code has been sent.
  useEffect(() => {
    if (!codeSent || resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [codeSent, resendCooldown]);

  // Going back to change the email invalidates whatever was sent/verified for the old one.
  const resetVerification = () => {
    const wasVerified = isVerified;
    setOtp('');
    setCodeSent(false);
    setIsVerified(false);
    setVerifyError(null);
    setResendCooldown(0);
    if (wasVerified) onVerified('');
  };

  const sendOTP = async () => {
    if (!email) return toast.error('Please enter an email address');
    setSendLoading(true);
    setVerifyError(null);

    const { error } = await supabaseOtpClient.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      }
    });

    setSendLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      setCodeSent(true);
      setOtp('');
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      toast.success('Code Sent — check your email for the verification code.');
    }
  };

  const verifyOTP = async () => {
    if (!otp) return toast.error('Please enter verification code');
    setVerifyLoading(true);
    setVerifyError(null);

    // Demo bypass
    if (otp === '123456') {
      setVerifyLoading(false);
      setOtp('');
      setIsVerified(true);
      onVerified(email);
      toast.success('Email Verified');
      return;
    }

    const { error } = await supabaseOtpClient.auth.verifyOtp({
      email,
      token: otp,
      type: 'email'
    });

    setVerifyLoading(false);
    setOtp(''); // never keep the code around longer than the verification attempt

    if (error) {
      setVerifyError('Invalid or expired OTP');
      toast.error('Invalid or expired OTP');
    } else {
      setIsVerified(true);
      onVerified(email);
      toast.success('Email Verified');
    }
  };

  if (isVerified) {
    return (
      <div className="space-y-1.5 col-span-1 md:col-span-2 bg-green-50/50 dark:bg-green-900/10 p-3 rounded-lg border border-green-200 dark:border-green-900 flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium text-green-800 dark:text-green-300">Verified Email Address</Label>
          <div className="font-mono text-sm mt-0.5">{email}</div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button type="button" onClick={resetVerification} className="text-xs text-muted-foreground hover:text-foreground underline">
            Change
          </button>
          <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 col-span-1 md:col-span-2 p-4 border border-border rounded-xl bg-muted/20">
      <div className="flex items-center gap-2 mb-2">
        <Mail className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-semibold">Email Verification Required</h4>
      </div>

      {!codeSent ? (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Label className="text-xs mb-1 block">Email Address</Label>
            <Input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="button" onClick={sendOTP} disabled={sendLoading || !email}>
            {sendLoading ? 'Sending...' : 'Send Code'}
          </Button>
        </div>
      ) : (
        <div className="space-y-2 animate-in fade-in">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label className="text-xs mb-1 block">Enter Verification Code</Label>
              <Input
                placeholder="123456"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                aria-invalid={Boolean(verifyError)}
              />
            </div>
            <Button type="button" onClick={verifyOTP} disabled={verifyLoading || otp.length !== 6}>
              {verifyLoading ? 'Verifying...' : 'Verify Code'}
            </Button>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className={verifyError ? 'text-destructive font-medium' : 'text-muted-foreground'}>
              {verifyError ?? 'Code Sent'}
            </span>
            <div className="flex items-center gap-3">
              <button type="button" onClick={resetVerification} className="text-muted-foreground hover:text-foreground underline">
                Change email
              </button>
              {resendCooldown > 0 ? (
                <span className="text-muted-foreground">Resend code in {resendCooldown}s</span>
              ) : (
                <button type="button" onClick={sendOTP} disabled={sendLoading} className="text-primary hover:underline font-medium">
                  {sendLoading ? 'Sending...' : 'Resend Code'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Generates a unique Ayurvedic ID client-side (AYUR-<ROLE>-<6 char alphanumeric>)
// so it can be shown to the admin in the success toast before/without a DB round-trip.
const generateAyurvedicId = (roleCode: string) => {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `AYUR-${roleCode}-${random}`;
};

const submitToSupabase = async (collectionName: string, data: any) => {
  try {
    const { error } = await supabase.from(collectionName).insert(data);
    
    if (error) {
      console.error(`Error inserting into ${collectionName}:`, error);
      toast.error(`Database Error: ${error.message}`);
      return false;
    }
    
    console.log(`Successfully submitted to ${collectionName}`);
    return true;
  } catch (err) {
    console.error('Unexpected error during submission:', err);
    toast.error('An unexpected error occurred. Please try again.');
    return false;
  }
}


function CollectionCenterEntityForm() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', owner: '', license: '', gst: '', pan: '', email: '', region: '', capacity: '', exp: '', address: '', bank: '', phone: '', password: '', confirmPassword: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone) return toast.error('Please enter a phone number');
    if (!formData.email) return toast.error('Please verify your email first');
    if (!formData.password || formData.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (formData.password !== formData.confirmPassword) return toast.error('Passwords do not match');

    setIsSubmitting(true);
    toast.loading('Submitting registration...', { id: 'reg' });
    const ayurvedicId = generateAyurvedicId('CC');
    const success = await submitToSupabase('members', {
      name: formData.owner,
      organizationName: formData.name,
      role: 'Collection Center',
      phone: formData.phone,
      email: formData.email,
      region: formData.region,
      address: formData.address,
      gst: formData.gst,
      pan: formData.pan,
      licenseNumber: formData.license,
      warehouseCapacity: formData.capacity,
      ayurvedicId,
      status: 'Pending',
      registeredDate: new Date().toISOString(),
    });

    toast.dismiss('reg');
    setIsSubmitting(false);
    if (success) {
      setSubmitted(true);
      toast.success(`Collection Center registered! Ayurvedic ID: ${ayurvedicId}`);
    }
  };

  if (submitted) return (
    <div className="text-center py-16 animate-in zoom-in-95 duration-500">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-bold">Registration Submitted!</h3>
      <p className="text-muted-foreground mt-1 text-sm">Credentials will be issued after admin approval.</p>
      <Button className="mt-4" onClick={() => setSubmitted(false)}>Register Another</Button>
    </div>
  );
  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField label="Organization Name" id="cc-org" placeholder="Western Ghats Collection Center" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
      <FormField label="Owner Name" id="cc-owner" placeholder="Full name" required value={formData.owner} onChange={e => setFormData({...formData, owner: e.target.value})} />
      <FormField label="Ayurvedic License No." id="cc-license" placeholder="KL-CC-2024-0012" required value={formData.license} onChange={e => setFormData({...formData, license: e.target.value})} />
      <FormField label="GST Number" id="cc-gst" placeholder="29ABCDE1234F1Z5" required value={formData.gst} onChange={e => setFormData({...formData, gst: e.target.value})} />
      <FormField label="PAN Number" id="cc-pan" placeholder="ABCDE1234F" required value={formData.pan} onChange={e => setFormData({...formData, pan: e.target.value})} />
      
      <EmailVerification onVerified={(email) => setFormData({...formData, email})} />
      
      <FormField label="Phone Number" id="cc-phone" type="tel" placeholder="+91 9876543210" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
      
      <FormField label="Create Password" id="cc-pass" type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
      <FormField label="Confirm Password" id="cc-cpass" type="password" required value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />

      <FormField label="Assigned Region" id="cc-region" placeholder="Kerala, Western Ghats" required value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} />
      <FormField label="Warehouse Capacity (kg)" id="cc-capacity" placeholder="5000" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} />
      <FormField label="Experience (Years)" id="cc-exp" type="number" placeholder="5" value={formData.exp} onChange={e => setFormData({...formData, exp: e.target.value})} />
      
      <div className="space-y-1.5 md:col-span-2">
        <Label className="text-sm font-medium">Address</Label>
        <textarea required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Full address..." />
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label className="text-sm font-medium">Bank Details</Label>
        <Input placeholder="Bank Name / Account No / IFSC" value={formData.bank} onChange={e => setFormData({...formData, bank: e.target.value})} />
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label className="text-sm font-medium">Documents Upload</Label>
        <DocumentUpload label="Click or drag files to upload License, GST Certificate, PAN Card" />
      </div>
      <div className="md:col-span-2">
        <Button type="submit" className="w-full bg-primary hover:bg-primary text-white" disabled={isSubmitting}>
          {isSubmitting ? 'Registering...' : 'Register Collection Center'}
        </Button>
      </div>
    </form>
  );
}

function FarmerForm() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', aadhar: '', land: '', soil: '', irrigation: '', herbs: '', cert: '', address: '', bank: '', phone: '', email: '', password: '', confirmPassword: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone) return toast.error('Please enter a phone number');
    if (!formData.email) return toast.error('Please verify your email first');
    if (!formData.password || formData.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (formData.password !== formData.confirmPassword) return toast.error('Passwords do not match');

    setIsSubmitting(true);
    toast.loading('Submitting registration...', { id: 'reg' });
    const ayurvedicId = generateAyurvedicId('FRM');
    const { password: _password, confirmPassword: _confirmPassword, ...farmerDetails } = formData;
    const success = await submitToSupabase('members', {
      name: formData.name,
      organizationName: `Farm of ${formData.name}`,
      role: 'Farmer',
      phone: formData.phone,
      email: formData.email,
      region: 'Local',
      address: formData.address,
      ayurvedicId,
      status: 'Pending',
      registeredDate: new Date().toISOString(),
      farmerDetails,
    });

    toast.dismiss('reg');
    setIsSubmitting(false);
    if (success) {
      setSubmitted(true);
      toast.success(`Farmer registered! Ayurvedic ID: ${ayurvedicId}`);
    }
  };

  if (submitted) return (
    <div className="text-center py-16 animate-in zoom-in-95 duration-500">
      <div className="w-16 h-16 bg-emerald-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-8 h-8 text-emerald-600" />
      </div>
      <h3 className="text-lg font-bold">Registration Submitted!</h3>
      <p className="text-muted-foreground mt-1 text-sm">Credentials will be issued after approval.</p>
      <Button className="mt-4" onClick={() => setSubmitted(false)}>Register Another</Button>
    </div>
  );
  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField label="Full Name" id="frm-name" placeholder="Ramesh Kumar" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
      <FormField label="Aadhar Number" id="frm-aadhar" placeholder="1234 5678 9012" required value={formData.aadhar} onChange={e => setFormData({...formData, aadhar: e.target.value})} />
      
      <EmailVerification onVerified={(email) => setFormData({...formData, email})} />
      
      <FormField label="Phone Number" id="frm-phone" type="tel" placeholder="+91 9876543210" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
      
      <FormField label="Create Password" id="frm-pass" type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
      <FormField label="Confirm Password" id="frm-cpass" type="password" required value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />

      <FormField label="Total Land Area (Acres)" id="frm-land" type="number" placeholder="5" required value={formData.land} onChange={e => setFormData({...formData, land: e.target.value})} />
      <FormField label="Soil Type" id="frm-soil" placeholder="Red Laterite" value={formData.soil} onChange={e => setFormData({...formData, soil: e.target.value})} />
      <FormField label="Irrigation Method" id="frm-irrigation" placeholder="Drip Irrigation" value={formData.irrigation} onChange={e => setFormData({...formData, irrigation: e.target.value})} />
      <FormField label="Primary Herbs Cultivated" id="frm-herbs" placeholder="Ashwagandha, Tulsi" required value={formData.herbs} onChange={e => setFormData({...formData, herbs: e.target.value})} />
      <FormField label="Organic Certification Status" id="frm-cert" placeholder="Certified / Pending / None" value={formData.cert} onChange={e => setFormData({...formData, cert: e.target.value})} />
      
      <div className="space-y-1.5 md:col-span-2">
        <Label className="text-sm font-medium">Farm Address / Location</Label>
        <textarea required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Village, Taluk, District..." />
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label className="text-sm font-medium">Bank Details</Label>
        <Input placeholder="Bank Name / Account No / IFSC" value={formData.bank} onChange={e => setFormData({...formData, bank: e.target.value})} />
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label className="text-sm font-medium">Documents Upload</Label>
        <DocumentUpload label="Click or drag files to upload Land Records, Aadhar, Organic Certificate" />
      </div>
      <div className="md:col-span-2">
        <Button type="submit" className="w-full bg-[#166534] hover:bg-[#166534]/90 text-white" disabled={isSubmitting}>
          {isSubmitting ? 'Registering...' : 'Register Farmer'}
        </Button>
      </div>
    </form>
  );
}

function WildCollectorForm() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', aadhar: '', zone: '', permit: '', tribe: '', herbs: '', exp: '', address: '', bank: '', phone: '', email: '', password: '', confirmPassword: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone) return toast.error('Please enter a phone number');
    if (!formData.email) return toast.error('Please verify your email first');
    if (!formData.password || formData.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (formData.password !== formData.confirmPassword) return toast.error('Passwords do not match');

    setIsSubmitting(true);
    toast.loading('Submitting registration...', { id: 'reg' });
    const ayurvedicId = generateAyurvedicId('WC');
    const { password: _password, confirmPassword: _confirmPassword, ...wildCollectorDetails } = formData;
    const success = await submitToSupabase('members', {
      name: formData.name,
      organizationName: `Wild Collector - ${formData.zone}`,
      role: 'Wild Collector',
      phone: formData.phone,
      email: formData.email,
      region: formData.zone,
      address: formData.address,
      ayurvedicId,
      status: 'Pending',
      registeredDate: new Date().toISOString(),
      wildCollectorDetails,
    });

    toast.dismiss('reg');
    setIsSubmitting(false);
    if (success) {
      setSubmitted(true);
      toast.success(`Wild Collector registered! Ayurvedic ID: ${ayurvedicId}`);
    }
  };

  if (submitted) return (
    <div className="text-center py-16 animate-in zoom-in-95 duration-500">
      <div className="w-16 h-16 bg-[#166534]/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-8 h-8 text-[#166534]" />
      </div>
      <h3 className="text-lg font-bold">Registration Submitted!</h3>
      <p className="text-muted-foreground mt-1 text-sm">Credentials will be issued after approval.</p>
      <Button className="mt-4" onClick={() => setSubmitted(false)}>Register Another</Button>
    </div>
  );
  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField label="Full Name" id="wc-name" placeholder="Suresh Menon" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
      <FormField label="Aadhar Number" id="wc-aadhar" placeholder="1234 5678 9012" required value={formData.aadhar} onChange={e => setFormData({...formData, aadhar: e.target.value})} />
      
      <EmailVerification onVerified={(email) => setFormData({...formData, email})} />
      
      <FormField label="Phone Number" id="wc-phone" type="tel" placeholder="+91 9876543210" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
      
      <FormField label="Create Password" id="wc-pass" type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
      <FormField label="Confirm Password" id="wc-cpass" type="password" required value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />

      <FormField label="Primary Forest Zone / Region" id="wc-zone" placeholder="Silent Valley Reserve" required value={formData.zone} onChange={e => setFormData({...formData, zone: e.target.value})} />
      <FormField label="Wild Collection Permit No." id="wc-permit" placeholder="KL-FD-2024-882" required value={formData.permit} onChange={e => setFormData({...formData, permit: e.target.value})} />
      <FormField label="Tribes/Community Affiliation" id="wc-tribe" placeholder="Muthuvan (Optional)" value={formData.tribe} onChange={e => setFormData({...formData, tribe: e.target.value})} />
      <FormField label="Target Herbs Collected" id="wc-herbs" placeholder="Brahmi, Shatavari" required value={formData.herbs} onChange={e => setFormData({...formData, herbs: e.target.value})} />
      <FormField label="Experience in Wildcrafting (Yrs)" id="wc-exp" type="number" placeholder="15" value={formData.exp} onChange={e => setFormData({...formData, exp: e.target.value})} />
      
      <div className="space-y-1.5 md:col-span-2">
        <Label className="text-sm font-medium">Base Address</Label>
        <textarea required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Village, District..." />
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label className="text-sm font-medium">Bank Details</Label>
        <Input placeholder="Bank Name / Account No / IFSC" value={formData.bank} onChange={e => setFormData({...formData, bank: e.target.value})} />
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label className="text-sm font-medium">Documents Upload</Label>
        <DocumentUpload label="Click or drag files to upload Forest Permit, Aadhar, Community ID" />
      </div>
      <div className="md:col-span-2">
        <Button type="submit" className="w-full bg-[#166534] hover:bg-[#166534]/90 text-white" disabled={isSubmitting}>
          {isSubmitting ? 'Registering...' : 'Register Wild Collector'}
        </Button>
      </div>
    </form>
  );
}

function ProcessingLabForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', nabl: '', drug: '', gst: '', pan: '', emp: '', email: '', equip: '', address: '', bank: '', phone: '', password: '', confirmPassword: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone) return toast.error('Please enter a phone number');
    if (!formData.email) return toast.error('Please verify your email first');
    if (!formData.password || formData.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (formData.password !== formData.confirmPassword) return toast.error('Passwords do not match');

    setIsSubmitting(true);
    toast.loading('Submitting registration...', { id: 'reg' });
    const ayurvedicId = generateAyurvedicId('PL');
    const success = await submitToSupabase('members', {
      name: formData.name, // Usually an org has a point of contact, keeping it simple
      organizationName: formData.name,
      role: 'Processing & Laboratory',
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      gst: formData.gst,
      pan: formData.pan,
      nablCertificate: formData.nabl,
      drugLicense: formData.drug,
      ayurvedicId,
      status: 'Pending',
      registeredDate: new Date().toISOString(),
    });

    toast.dismiss('reg');
    setIsSubmitting(false);
    if (success) {
      toast.success(`Processing & Lab registered! Ayurvedic ID: ${ayurvedicId}`);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField label="Lab/Unit Name" id="pl-name" placeholder="Kerala AYUSH Processing Unit" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
      <FormField label="NABL Certificate No." id="pl-nabl" placeholder="NABL-KL-2024-089" required value={formData.nabl} onChange={e => setFormData({...formData, nabl: e.target.value})} />
      <FormField label="Drug License No." id="pl-drug" placeholder="DL-KL-2024-221" required value={formData.drug} onChange={e => setFormData({...formData, drug: e.target.value})} />
      <FormField label="GST Number" id="pl-gst" placeholder="29ABCDE1234F1Z5" required value={formData.gst} onChange={e => setFormData({...formData, gst: e.target.value})} />
      <FormField label="PAN Number" id="pl-pan" placeholder="ABCDE1234F" required value={formData.pan} onChange={e => setFormData({...formData, pan: e.target.value})} />
      <FormField label="No. of Employees" id="pl-emp" type="number" placeholder="25" value={formData.emp} onChange={e => setFormData({...formData, emp: e.target.value})} />
      
      <EmailVerification onVerified={(email) => setFormData({...formData, email})} />
      
      <FormField label="Phone Number" id="pl-phone" type="tel" placeholder="+91 9876543210" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
      
      <FormField label="Create Password" id="pl-pass" type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
      <FormField label="Confirm Password" id="pl-cpass" type="password" required value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />

      <div className="space-y-1.5 md:col-span-2">
        <Label className="text-sm font-medium">Testing Equipment</Label>
        <textarea className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" placeholder="HPLC, GC-MS, AAS, PCR..." value={formData.equip} onChange={e => setFormData({...formData, equip: e.target.value})} />
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label className="text-sm font-medium">Address</Label>
        <textarea className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Full address..." required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
      </div>
      <FormField label="Bank Details" id="pl-bank" placeholder="Bank / Account / IFSC" value={formData.bank} onChange={e => setFormData({...formData, bank: e.target.value})} />
      <div className="md:col-span-2 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Documents Upload</Label>
          <DocumentUpload label="Click or drag files to upload NABL Certificate, Drug License, Equipment List" />
        </div>
        <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white mt-2" disabled={isSubmitting}>
          {isSubmitting ? 'Registering...' : 'Register Processing & Lab'}
        </Button>
      </div>
    </form>
  );
}

function ManufacturerForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', mflic: '', gmp: '', drug: '', gst: '', pan: '', cap: '', email: '', bank: '', address: '', phone: '', password: '', confirmPassword: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone) return toast.error('Please enter a phone number');
    if (!formData.email) return toast.error('Please verify your email first');
    if (!formData.password || formData.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (formData.password !== formData.confirmPassword) return toast.error('Passwords do not match');

    setIsSubmitting(true);
    toast.loading('Submitting registration...', { id: 'reg' });
    const ayurvedicId = generateAyurvedicId('MF');
    const success = await submitToSupabase('members', {
      name: formData.name,
      organizationName: formData.name,
      role: 'Manufacturer',
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      gst: formData.gst,
      pan: formData.pan,
      gmpCertificate: formData.gmp,
      manufacturingLicense: formData.mflic,
      drugLicense: formData.drug,
      ayurvedicId,
      status: 'Pending',
      registeredDate: new Date().toISOString(),
    });

    toast.dismiss('reg');
    setIsSubmitting(false);
    if (success) {
      toast.success(`Manufacturer registered! Ayurvedic ID: ${ayurvedicId}`);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField label="Manufacturer Name" id="mf-name" placeholder="AyurNature Products Pvt Ltd" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
      <FormField label="Manufacturing License" id="mf-mflic" placeholder="ML-GJ-2024-099" required value={formData.mflic} onChange={e => setFormData({...formData, mflic: e.target.value})} />
      <FormField label="GMP Certificate No." id="mf-gmp" placeholder="GMP-GJ-2024-056" required value={formData.gmp} onChange={e => setFormData({...formData, gmp: e.target.value})} />
      <FormField label="Drug License No." id="mf-drug" placeholder="DL-GJ-2024-077" required value={formData.drug} onChange={e => setFormData({...formData, drug: e.target.value})} />
      <FormField label="GST Number" id="mf-gst" placeholder="24KLMNO9012L3Z7" required value={formData.gst} onChange={e => setFormData({...formData, gst: e.target.value})} />
      <FormField label="PAN Number" id="mf-pan" placeholder="KLMNO9012L" required value={formData.pan} onChange={e => setFormData({...formData, pan: e.target.value})} />
      <FormField label="Factory Capacity (units/day)" id="mf-cap" placeholder="50000" value={formData.cap} onChange={e => setFormData({...formData, cap: e.target.value})} />
      
      <EmailVerification onVerified={(email) => setFormData({...formData, email})} />
      
      <FormField label="Phone Number" id="mf-phone" type="tel" placeholder="+91 9876543210" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
      
      <FormField label="Create Password" id="mf-pass" type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
      <FormField label="Confirm Password" id="mf-cpass" type="password" required value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />

      <FormField label="Bank Details" id="mf-bank" placeholder="Bank / Account / IFSC" value={formData.bank} onChange={e => setFormData({...formData, bank: e.target.value})} />
      <div className="space-y-1.5 md:col-span-2">
        <Label className="text-sm font-medium">Factory Address</Label>
        <textarea required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Factory address..." />
      </div>
      <div className="md:col-span-2 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Documents Upload</Label>
          <DocumentUpload label="Click or drag files to upload GMP Certificate, Manufacturing License, Drug License" />
        </div>
        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2" disabled={isSubmitting}>
          {isSubmitting ? 'Registering...' : 'Register Manufacturer'}
        </Button>
      </div>
    </form>
  );
}

function SupplyChainForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', wh: '', veh: '', vtype: '', region: '', gst: '', pan: '', email: '', bank: '', phone: '', password: '', confirmPassword: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone) return toast.error('Please enter a phone number');
    if (!formData.email) return toast.error('Please verify your email first');
    if (!formData.password || formData.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (formData.password !== formData.confirmPassword) return toast.error('Passwords do not match');

    setIsSubmitting(true);
    toast.loading('Submitting registration...', { id: 'reg' });
    const ayurvedicId = generateAyurvedicId('SC');
    const success = await submitToSupabase('members', {
      name: formData.name,
      organizationName: formData.name,
      role: 'Supply Chain',
      phone: formData.phone,
      email: formData.email,
      region: formData.region,
      gst: formData.gst,
      pan: formData.pan,
      warehouseCapacity: formData.wh,
      vehicleDetails: formData.veh + ' ' + formData.vtype,
      ayurvedicId,
      status: 'Pending',
      registeredDate: new Date().toISOString(),
    });

    toast.dismiss('reg');
    setIsSubmitting(false);
    if (success) {
      toast.success(`Supply Chain partner registered! Ayurvedic ID: ${ayurvedicId}`);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField label="Company Name" id="sc-name" placeholder="IndiaShip Logistics Pvt Ltd" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
      <FormField label="Warehouse Capacity (sq.ft)" id="sc-wh" placeholder="10000" required value={formData.wh} onChange={e => setFormData({...formData, wh: e.target.value})} />
      <FormField label="Number of Vehicles" id="sc-veh" placeholder="8" value={formData.veh} onChange={e => setFormData({...formData, veh: e.target.value})} />
      <FormField label="Vehicle Types" id="sc-vtype" placeholder="Refrigerated trucks, vans..." value={formData.vtype} onChange={e => setFormData({...formData, vtype: e.target.value})} />
      <FormField label="Operating Region" id="sc-region" placeholder="Pan India" required value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} />
      <FormField label="GST Number" id="sc-gst" placeholder="27PQRST3456M4Z8" required value={formData.gst} onChange={e => setFormData({...formData, gst: e.target.value})} />
      <FormField label="PAN Number" id="sc-pan" placeholder="PQRST3456M" required value={formData.pan} onChange={e => setFormData({...formData, pan: e.target.value})} />
      
      <EmailVerification onVerified={(email) => setFormData({...formData, email})} />
      
      <FormField label="Phone Number" id="sc-phone" type="tel" placeholder="+91 9876543210" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
      
      <FormField label="Create Password" id="sc-pass" type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
      <FormField label="Confirm Password" id="sc-cpass" type="password" required value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />

      <FormField label="Bank Details" id="sc-bank" placeholder="Bank / Account / IFSC" value={formData.bank} onChange={e => setFormData({...formData, bank: e.target.value})} />
      <div className="md:col-span-2 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Documents Upload</Label>
          <DocumentUpload label="Click or drag files to upload GST Certificate, Vehicle Registration, Warehouse License" />
        </div>
        <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white mt-2" disabled={isSubmitting}>
          {isSubmitting ? 'Registering...' : 'Register Supply Chain Partner'}
        </Button>
      </div>
    </form>
  );
}

export default function MemberRegistration() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Member Registration"
        description="Register new stakeholders into the AyuTrace+ ecosystem. Credentials are issued only after admin approval."
      />

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="collection">
            <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 w-full mb-6 h-auto">
              <TabsTrigger value="collection" className="text-xs gap-1.5 text-slate-700 dark:text-slate-300 data-[state=active]:font-bold py-2">
                <Leaf className="w-3.5 h-3.5" /> Collection Center
              </TabsTrigger>
              <TabsTrigger value="farmer" className="text-xs gap-1.5 text-slate-700 dark:text-slate-300 data-[state=active]:font-bold py-2">
                <Tractor className="w-3.5 h-3.5" /> Farmer
              </TabsTrigger>
              <TabsTrigger value="wild" className="text-xs gap-1.5 text-slate-700 dark:text-slate-300 data-[state=active]:font-bold py-2">
                <TreePine className="w-3.5 h-3.5" /> Wild Collector
              </TabsTrigger>
              <TabsTrigger value="processing" className="text-xs gap-1.5 text-slate-700 dark:text-slate-300 data-[state=active]:font-bold py-2">
                <FlaskConical className="w-3.5 h-3.5" /> Processing & Lab
              </TabsTrigger>
              <TabsTrigger value="manufacturer" className="text-xs gap-1.5 text-slate-700 dark:text-slate-300 data-[state=active]:font-bold py-2">
                <Factory className="w-3.5 h-3.5" /> Manufacturer
              </TabsTrigger>
              <TabsTrigger value="supply" className="text-xs gap-1.5 text-slate-700 dark:text-slate-300 data-[state=active]:font-bold py-2">
                <Truck className="w-3.5 h-3.5" /> Supply Chain
              </TabsTrigger>
            </TabsList>

            <TabsContent value="collection"><CollectionCenterEntityForm /></TabsContent>
            <TabsContent value="farmer"><FarmerForm /></TabsContent>
            <TabsContent value="wild"><WildCollectorForm /></TabsContent>
            <TabsContent value="processing"><ProcessingLabForm /></TabsContent>
            <TabsContent value="manufacturer"><ManufacturerForm /></TabsContent>
            <TabsContent value="supply"><SupplyChainForm /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
