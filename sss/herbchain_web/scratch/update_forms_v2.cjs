const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/features/government/pages/MemberRegistration.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add EmailVerification Component before Mock Submit Helper
const emailVerCode = `
import { Mail } from 'lucide-react';

function EmailVerification({ onVerified }: { onVerified: (email: string) => void }) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const sendOTP = async () => {
    if (!email) return toast.error('Please enter an email address');
    setIsLoading(true);
    setTimeout(() => {
      setCodeSent(true);
      setIsLoading(false);
      toast.success('Mock Verification Code sent! (Use any code like 123456)');
    }, 1000);
  };

  const verifyOTP = async () => {
    if (!otp) return toast.error('Please enter verification code');
    setIsLoading(true);
    setTimeout(() => {
      setIsVerified(true);
      onVerified(email);
      setIsLoading(false);
      toast.success('Email verified successfully!');
    }, 1000);
  };

  if (isVerified) {
    return (
      <div className="space-y-1.5 col-span-1 md:col-span-2 bg-green-50/50 dark:bg-green-900/10 p-3 rounded-lg border border-green-200 dark:border-green-900 flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium text-green-800 dark:text-green-300">Verified Email Address</Label>
          <div className="font-mono text-sm mt-0.5">{email}</div>
        </div>
        <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
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
          <Button type="button" onClick={sendOTP} disabled={isLoading || !email}>
            {isLoading ? 'Sending...' : 'Send Code'}
          </Button>
        </div>
      ) : (
        <div className="flex gap-2 items-end animate-in fade-in">
          <div className="flex-1">
            <Label className="text-xs mb-1 block">Enter Verification Code</Label>
            <Input 
              placeholder="123456" 
              value={otp} 
              onChange={(e) => setOtp(e.target.value)} 
            />
          </div>
          <Button type="button" onClick={verifyOTP} disabled={isLoading || !otp}>
            {isLoading ? 'Verifying...' : 'Verify Email'}
          </Button>
        </div>
      )}
    </div>
  );
}

// Mock Submit Helper
`;
content = content.replace(/\/\/ Mock Submit Helper/m, emailVerCode);

content = content.replace(/import \{ ([^}]+) \} from 'lucide-react';/, (match, p1) => {
  if (!p1.includes('Mail')) {
    return "import { " + p1 + ", Mail } from 'lucide-react';";
  }
  return match;
});

const forms = ['CollectionCenterEntityForm', 'FarmerForm', 'WildCollectorForm', 'ProcessingLabForm', 'ManufacturerForm', 'SupplyChainForm'];

forms.forEach(form => {
  const formDataRegex = new RegExp("(function " + form + "\\(\\) \\{[\\s\\S]*?const \\[formData, setFormData\\] = useState\\(\\{[^\\]]*?)\\}\\);", 'm');
  content = content.replace(formDataRegex, (match, p1) => {
    return p1.trimEnd() + ", password: '', confirmPassword: '' });";
  });

  const validationInjection = "\n    if (!formData.email) return toast.error('Please verify your email first');\n    if (!formData.password || formData.password.length < 6) return toast.error('Password must be at least 6 characters');\n    if (formData.password !== formData.confirmPassword) return toast.error('Passwords do not match');";
  
  const submitRegex = new RegExp("(function " + form + "\\(\\) \\{[\\s\\S]*?const handleSubmit = async \\(e: React.FormEvent\\) => \\{\\n\\s*e\\.preventDefault\\(\\);\\n\\s*if \\(!formData\\.phone\\) return toast\\.error\\('Please enter a phone number'\\);)", 'm');
  content = content.replace(submitRegex, (match, p1) => {
    return p1 + validationInjection;
  });

  if (form === 'FarmerForm') {
    content = content.replace(/email: 'farmer@example.com',/g, "email: formData.email,");
  }
  if (form === 'WildCollectorForm') {
    content = content.replace(/email: 'wildcollector@example.com',/g, "email: formData.email,");
  }

  content = content.replace(/<FormField label="Email Address" [^>]+ \/>\n\s*/, '');
  
  const phoneInputRegex = new RegExp("<FormField label=\"Phone Number\" id=\"[a-zA-Z0-9-]+\" type=\"tel\"[^>]+ \\/>");
  const passwordInputs = "\n      <EmailVerification onVerified={(email) => setFormData({...formData, email})} />\n      <FormField label=\"Create Password\" id=\"" + form.toLowerCase() + "-pass\" type=\"password\" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />\n      <FormField label=\"Confirm Password\" id=\"" + form.toLowerCase() + "-cpass\" type=\"password\" required value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />\n  ";
  
  content = content.replace(phoneInputRegex, (match) => {
    return match + '\n' + passwordInputs;
  });
  
  content = content.replace(/(email: formData\.email,)/, "$1\n      password: formData.password,");
});

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Successfully updated MemberRegistration.tsx with Email and Passwords');
