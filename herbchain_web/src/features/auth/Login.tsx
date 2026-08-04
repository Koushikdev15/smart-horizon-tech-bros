import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { User } from '../../types';
import { toast } from 'sonner';
import { Leaf, Shield, Eye, EyeOff, Moon, Sun, Smartphone, Hash, Lock, ChevronRight, FlaskConical, Factory, Truck } from 'lucide-react';

const DEMO_CREDENTIALS = [
  { label: 'Government Admin', ayurvedicId: 'GOV-ADMIN-001', mobile: '9000000001', password: 'admin123', role: 'Government' as const, icon: Shield, color: 'text-violet-400' },
  { label: 'Collection Center', ayurvedicId: 'AYU-CC-001', mobile: '9876543210', password: 'cc123', role: 'Collection Center' as const, icon: Leaf, color: 'text-emerald-400' },
  { label: 'Processing & Lab', ayurvedicId: 'AYU-PL-001', mobile: '9988776655', password: 'lab123', role: 'Processing & Laboratory' as const, icon: FlaskConical, color: 'text-amber-400' },
  { label: 'Manufacturer', ayurvedicId: 'AYU-MF-001', mobile: '9871234567', password: 'mfr123', role: 'Manufacturer' as const, icon: Factory, color: 'text-blue-400' },
  { label: 'Supply Chain', ayurvedicId: 'AYU-SC-001', mobile: '9765432109', password: 'sc123', role: 'Supply Chain' as const, icon: Truck, color: 'text-cyan-400' },
];

const ROLE_USER_MAP: Record<string, Omit<User, 'role'>> = {
  'GOV-ADMIN-001': { id: 'gov1', name: 'Arjun Menon IAS', email: 'arjun.menon@ayush.gov.in', ayurvedicId: 'GOV-ADMIN-001', mobile: '9000000001', organizationName: 'Ministry of AYUSH' },
  'AYU-CC-001':   { id: 'cc1',  name: 'Rajan Pillai',   email: 'rajan@wghc.com',          ayurvedicId: 'AYU-CC-001',   mobile: '9876543210', organizationName: 'Western Ghats Collection Center' },
  'AYU-PL-001':   { id: 'pl1',  name: 'Dr. Priya Nair', email: 'priya@kerapl.com',         ayurvedicId: 'AYU-PL-001',   mobile: '9988776655', organizationName: 'Kerala AYUSH Processing Unit' },
  'AYU-MF-001':   { id: 'mf1',  name: 'Deepak Mehta',   email: 'deepak@ayurnature.com',    ayurvedicId: 'AYU-MF-001',   mobile: '9871234567', organizationName: 'AyurNature Products Pvt Ltd' },
  'AYU-SC-001':   { id: 'sc1',  name: 'Suresh Yadav',   email: 'suresh@indiaship.com',     ayurvedicId: 'AYU-SC-001',   mobile: '9765432109', organizationName: 'IndiaShip Logistics' },
};

export default function Login() {
  const [ayurvedicId, setAyurvedicId] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setAuth = useAuthStore((s) => s.setAuth);
  const { darkMode, toggleDarkMode } = useAppStore();
  const navigate = useNavigate();

  // Apply dark mode on mount
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    await new Promise((r) => setTimeout(r, 800)); // Simulate API call

    // Find matching demo credential
    const match = DEMO_CREDENTIALS.find(
      (c) => c.ayurvedicId === ayurvedicId && c.mobile === mobile && c.password === password
    );

    if (match) {
      const baseUser = ROLE_USER_MAP[ayurvedicId];
      if (baseUser) {
        const user: User = { ...baseUser, role: match.role };
        setAuth(user, `mock_jwt_${Date.now()}`);
        toast.success(`Welcome back, ${baseUser.name}!`);
        navigate('/');
      }
    } else {
      setError('Invalid Ayurvedic ID, Mobile Number, or Password.');
    }
    setLoading(false);
  };

  const fillDemo = (cred: typeof DEMO_CREDENTIALS[0]) => {
    setAyurvedicId(cred.ayurvedicId);
    setMobile(cred.mobile);
    setPassword(cred.password);
    setError('');
  };

  return (
    <div className="min-h-screen login-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl animate-pulse animate-duration-5000" />
      <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl animate-pulse animate-duration-7000" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-amber-500/8 blur-3xl animate-pulse animate-duration-6000" style={{ animationDelay: '2s' }} />

      {/* Dark mode toggle */}
      <button
        onClick={toggleDarkMode}
        className="absolute top-4 right-4 w-10 h-10 rounded-full glass flex items-center justify-center text-gray-300 hover:text-white transition-colors z-20"
        aria-label="Toggle dark mode"
      >
        {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 relative z-10">
        {/* Left — Brand Panel */}
        <div 
          className="relative hidden lg:flex flex-col justify-between items-center p-10 bg-cover bg-center overflow-hidden text-center min-h-[600px]"
          style={{ backgroundImage: "url('/ayurvedic_bg.png')" }}
        >
          {/* High-quality Overlay for dark mode look and readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/90 via-teal-950/90 to-cyan-950/90 mix-blend-multiply" />
          <div className="absolute inset-0 bg-black/45" />

          {/* Spacer */}
          <div className="flex-1" />

          {/* Centered Logo & Title */}
          <div className="relative z-10 flex flex-col items-center gap-6 my-auto">
            {/* Innovative Logo - Organic Ayurvedic Leaf + Digital Blockchain Circuit */}
            <div className="relative flex items-center justify-center w-28 h-28 rounded-2xl bg-white/5 backdrop-blur-md border border-white/15 shadow-2xl p-4 float-anim">
              <svg viewBox="0 0 100 100" className="w-full h-full text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                {/* Left Side: Organic Leaf Half */}
                <path d="M50,15 C30,30 32,65 50,85 C50,85 50,15 50,15 Z" fill="url(#leafLeftGrad)" />
                {/* Organic Leaf Veins */}
                <path d="M50,35 C42,42 40,50 40,50" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M50,50 C44,57 42,65 42,65" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M50,65 C46,72 44,78 44,78" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />

                {/* Center Stem */}
                <line x1="50" y1="15" x2="50" y2="85" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />

                {/* Right Side: Tech / Blockchain Circuit Half */}
                <path d="M50,15 C70,30 68,65 50,85" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 3" />
                {/* Circuit Connections / Veins */}
                <path d="M50,35 L70,35 L75,42" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="75" cy="42" r="3" fill="#06b6d4" />
                <circle cx="75" cy="42" r="5" fill="none" stroke="#06b6d4" strokeWidth="1" className="animate-pulse" style={{ transformOrigin: '75px 42px' }} />

                <path d="M50,50 L65,58 L65,68" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="65" cy="68" r="3" fill="#10b981" />

                <path d="M50,65 L58,73 L70,73" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="70" cy="73" r="3" fill="#06b6d4" />

                {/* Outer Blockchain Ring Linkage */}
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="5 15" opacity="0.3" />

                <defs>
                  <linearGradient id="leafLeftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#047857" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Title / Brand Name */}
            <div className="space-y-2">
              <h1 className="text-4xl font-extrabold font-heading text-white tracking-wider drop-shadow-md">
                AYUTRACE<span className="text-emerald-400">+</span>
              </h1>
              <div className="h-0.5 w-16 bg-gradient-to-r from-emerald-500 to-cyan-500 mx-auto rounded-full" />
              <p className="text-xs text-emerald-300 font-bold uppercase tracking-widest">
                Gov. Certified Portal
              </p>
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1 flex items-end justify-center">
            <p className="relative z-10 text-xs font-semibold text-emerald-300/60 uppercase tracking-widest">
              Ministry of AYUSH · Government of India · Secured Portal
            </p>
          </div>
        </div>

        {/* Right — Login Form */}
        <div className="relative bg-white dark:bg-gray-900 p-8 lg:p-10 flex flex-col justify-center overflow-hidden border-t lg:border-t-0 lg:border-l border-white/10">
          {/* Subtle design assets/backgrounds for the right side */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/[0.03] rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/5 dark:bg-teal-500/[0.03] rounded-full blur-3xl pointer-events-none" />
          
          {/* Elegant Leaf Watermark Designs in Corners */}
          <div className="absolute -right-16 -bottom-16 opacity-[0.03] dark:opacity-[0.015] pointer-events-none text-emerald-800 dark:text-emerald-100">
            <svg width="240" height="240" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M50,10 C70,30 80,60 50,90 C20,60 30,30 50,10 Z M50,10 L50,90 M50,30 C65,35 72,48 72,48 M50,45 C30,50 28,62 28,62 M50,60 C65,65 68,75 68,75 M50,72 C32,77 32,82 32,82" />
            </svg>
          </div>
          <div className="absolute -top-16 -left-16 opacity-[0.02] dark:opacity-[0.01] pointer-events-none text-teal-800 dark:text-teal-100">
            <svg width="180" height="180" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M50,10 C70,30 80,60 50,90 C20,60 30,30 50,10 Z M50,10 L50,90 M50,30 C65,35 72,48 72,48 M50,45 C30,50 28,62 28,62 M50,60 C65,65 68,75 68,75 M50,72 C32,77 32,82 32,82" />
            </svg>
          </div>

          <div className="relative z-10">
            {/* Mobile logo */}
            <div className="flex lg:hidden items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-500/30 flex items-center justify-center p-1.5">
                <svg viewBox="0 0 100 100" className="w-full h-full text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]">
                  <path d="M50,15 C30,30 32,65 50,85 Z" fill="currentColor" opacity="0.8" />
                  <path d="M50,15 C70,30 68,65 50,85" fill="none" stroke="#06b6d4" strokeWidth="4" />
                  <circle cx="68" cy="48" r="4" fill="#06b6d4" />
                </svg>
              </div>
              <div>
                <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400 font-heading tracking-wide">AYUTRACE+</span>
                <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Gov. Certified Portal</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-bold font-heading text-gray-900 dark:text-white">Login</h3>
              <p className="text-sm text-muted-foreground mt-1">Credentials issued by Government Admin only</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-sm text-red-700 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="ayurvedicId" className="text-sm font-medium">Ayurvedic ID</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="ayurvedicId"
                    placeholder="e.g. AYU-CC-001"
                    value={ayurvedicId}
                    onChange={(e) => setAyurvedicId(e.target.value)}
                    className="pl-9 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mobile" className="text-sm font-medium">Mobile Number</Label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="mobile"
                    placeholder="10-digit mobile number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="pl-9"
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Your secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-emerald-200 dark:shadow-emerald-900/30"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  'Sign In to Portal'
                )}
              </Button>
            </form>

            {/* Demo credentials */}
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground font-medium">Demo Credentials</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {DEMO_CREDENTIALS.map((cred) => (
                  <button
                    key={cred.ayurvedicId}
                    type="button"
                    onClick={() => fillDemo(cred)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs border border-border hover:border-emerald-400/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all text-left group"
                  >
                    <cred.icon className={`w-3.5 h-3.5 ${cred.color}`} />
                    <span className="font-medium text-foreground">{cred.label}</span>
                    <span className="text-muted-foreground ml-auto font-mono">{cred.ayurvedicId}</span>
                    <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            <p className="mt-6 text-xs text-center text-muted-foreground">
              Password reset requires Admin approval.{' '}
              <a href="#" className="text-emerald-600 hover:underline">Contact Administrator</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
