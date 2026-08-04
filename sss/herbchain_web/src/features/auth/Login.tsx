import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Logo, { LogoMark } from '@/components/Logo';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import type { User } from '../../types';
import { toast } from 'sonner';
import { Shield, Eye, EyeOff, Moon, Sun, Smartphone, Hash, Lock, ChevronRight, FlaskConical, Factory, Truck, Leaf, KeyRound } from 'lucide-react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import BotanicalBackground from '../../components/BotanicalBackground';

const DEMO_CREDENTIALS = [
  { label: 'Government Admin', ayurvedicId: 'GOV-ADMIN-001', mobile: '9000000001', password: 'admin123', role: 'Government' as const, icon: Shield },
  { label: 'Collection Center', ayurvedicId: 'AYU-CC-001', mobile: '9876543210', password: 'cc123', role: 'Collection Center' as const, icon: Leaf },
  { label: 'Processing & Lab', ayurvedicId: 'AYU-PL-001', mobile: '9988776655', password: 'lab123', role: 'Processing & Laboratory' as const, icon: FlaskConical },
  { label: 'Manufacturer', ayurvedicId: 'AYU-MF-001', mobile: '9871234567', password: 'mfr123', role: 'Manufacturer' as const, icon: Factory },
  { label: 'Supply Chain', ayurvedicId: 'AYU-SC-001', mobile: '9765432109', password: 'sc123', role: 'Supply Chain' as const, icon: Truck },
];

const ROLE_USER_MAP: Record<string, Omit<User, 'role'>> = {
  'GOV-ADMIN-001': { id: 'gov1', name: 'Arjun Menon IAS', email: 'arjun.menon@ayush.gov.in', ayurvedicId: 'GOV-ADMIN-001', mobile: '9000000001', organizationName: 'Ministry of AYUSH' },
  'AYU-CC-001':   { id: 'cc1',  name: 'Rajan Pillai',   email: 'rajan@wghc.com',          ayurvedicId: 'AYU-CC-001',   mobile: '9876543210', organizationName: 'Western Ghats Collection Center' },
  'AYU-PL-001':   { id: 'pl1',  name: 'Dr. Priya Nair', email: 'priya@kerapl.com',         ayurvedicId: 'AYU-PL-001',   mobile: '9988776655', organizationName: 'Kerala AYUSH Processing Unit' },
  'AYU-MF-001':   { id: 'mf1',  name: 'Deepak Mehta',   email: 'deepak@ayurnature.com',    ayurvedicId: 'AYU-MF-001',   mobile: '9871234567', organizationName: 'AyurNature Products Pvt Ltd' },
  'AYU-SC-001':   { id: 'sc1',  name: 'Suresh Yadav',   email: 'suresh@indiaship.com',     ayurvedicId: 'AYU-SC-001',   mobile: '9765432109', organizationName: 'IndiaShip Logistics' },
};



export default function Login() {
  const panelRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const springConfig = { damping: 25, stiffness: 120 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Logo: tilt and shift (moving with mouse)
  const logoRotX = useTransform(smoothY, [0, 1], [15, -15]);
  const logoRotY = useTransform(smoothX, [0, 1], [-15, 15]);
  const logoX = useTransform(smoothX, [0, 1], [-15, 15]);
  const logoY = useTransform(smoothY, [0, 1], [-15, 15]);

  // Background: shifts in alignment/counter-balance
  const bgX = useTransform(smoothX, [0, 1], [10, -10]);
  const bgY = useTransform(smoothY, [0, 1], [10, -10]);

  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;

    // Gentle auto-floating movement (orbit/circle) when not hovered
    let angle = 0;
    const interval = setInterval(() => {
      angle += 0.02;
      mouseX.set(0.5 + Math.cos(angle) * 0.06);
      mouseY.set(0.5 + Math.sin(angle) * 0.06);
    }, 30);

    return () => clearInterval(interval);
  }, [isHovered]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!panelRef.current) return;
    setIsHovered(true);
    const rect = panelRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  const [ayurvedicId, setAyurvedicId] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetRequested, setResetRequested] = useState(false);

  const setAuth = useAuthStore((s) => s.setAuth);
  const { darkMode, toggleDarkMode } = useAppStore();
  const navigate = useNavigate();

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

    await new Promise((r) => setTimeout(r, 700));

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

  const handleForgotOpenChange = (open: boolean) => {
    setForgotOpen(open);
    if (!open) setResetRequested(false);
  };

  const handleRequestReset = () => {
    setResetRequested(true);
    toast.success('Reset request sent to your Government Administrator.');
  };

  return (
    <div className="min-h-screen login-bg flex items-center justify-center p-4 sm:p-6 relative">
      <BotanicalBackground />
      <button
        onClick={toggleDarkMode}
        className="absolute top-5 right-5 w-9 h-9 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors z-20"
        aria-label="Toggle dark mode"
      >
        {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 rounded-2xl overflow-hidden elevate-lg login-card text-card-foreground">
        {/* Left — Brand / logo panel */}
        <div 
          ref={panelRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative hidden lg:flex flex-col items-center justify-center p-10 min-h-[620px] overflow-hidden border-r border-border"
          style={{ 
            perspective: 1000,
            background: darkMode 
              ? 'radial-gradient(circle at 50% 30%, rgba(20, 184, 166, 0.08) 0%, rgba(15, 23, 42, 0.98) 100%)'
              : 'radial-gradient(circle at 50% 30%, rgba(20, 184, 166, 0.06) 0%, rgba(248, 250, 252, 0.95) 100%)',
          }}
        >
          {/* Subtle botanical background pattern matching the site background */}
          <motion.div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{
              x: bgX,
              y: bgY,
            }}
          >
            <svg viewBox="0 0 200 200" fill="none" className="w-[120%] h-[120%] text-[#14B8A6] opacity-[0.06] dark:opacity-[0.09]" xmlns="http://www.w3.org/2000/svg">
              <path d="M30 170 C60 150 130 110 190 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M50 145 Q30 120 60 125 C80 128 70 140 50 145 Z" fill="currentColor" />
              <path d="M75 125 Q55 100 85 105 C105 108 95 120 75 125 Z" fill="currentColor" />
              <path d="M100 105 Q80 80 110 85 C130 88 120 100 100 105 Z" fill="currentColor" />
              <path d="M125 85 Q105 60 135 65 C155 68 145 80 125 85 Z" fill="currentColor" />
              <path d="M150 65 Q130 40 160 45 C180 48 170 60 150 65 Z" fill="currentColor" />
            </svg>
          </motion.div>
          
          {/* Subtle grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'radial-gradient(#F8F7F2 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }} />

          <div className="relative z-10 flex flex-col items-center justify-center text-center gap-6" style={{ transformStyle: "preserve-3d" }}>
            <motion.div
              style={{
                rotateX: logoRotX,
                rotateY: logoRotY,
                x: logoX,
                y: logoY,
                transformStyle: "preserve-3d"
              }}
              className="w-60 h-60 p-2 flex items-center justify-center filter drop-shadow-[0_8px_25px_rgba(0,0,0,0.15)]"
            >
              <LogoMark className="w-full h-full object-contain" />
            </motion.div>
            <div className="space-y-2" style={{ transform: "translateZ(30px)" }}>
              <h2 className="text-[#0F172A] dark:text-[#F8FAFC] font-heading font-bold tracking-tight text-4xl leading-none">
                <span className="text-[#14B8A6]">Ayu</span><span className="text-[#0D9488] dark:text-[#ffffff]">Trace</span><span className="text-[#F59E0B]">+</span>
              </h2>
              <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] uppercase tracking-[0.22em] font-medium leading-relaxed">
                Promoting Holistic Wellness &amp; Innovation
              </p>
            </div>
          </div>
        </div>

        {/* Right — Login card */}
        <div className="login-right-panel flex flex-col justify-center p-8 sm:p-12">
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo className="justify-center" markClassName="w-11 h-11" wordmarkClassName="text-xl" subtitle="Ministry of AYUSH · Govt. of India" />
          </div>

          <div className="mb-7 hidden lg:block text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-primary dark:text-[#F59E0B] mb-1">Government-Certified Portal</p>
            <h1 className="text-page-title text-foreground">Sign in to your account</h1>
            <p className="text-sm text-muted-foreground mt-1.5">Credentials are issued by your Government Administrator.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-destructive/8 border border-destructive/25 rounded-lg px-4 py-2.5 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="ayurvedicId" className="text-sm font-medium">Ayurvedic ID</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="ayurvedicId"
                  placeholder="e.g. AYU-CC-001"
                  value={ayurvedicId}
                  onChange={(e) => setAyurvedicId(e.target.value)}
                  className="pl-9 h-11 font-mono text-sm rounded-xl animate-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mobile" className="text-sm font-medium">Mobile Number</Label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="mobile"
                  placeholder="10-digit mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="pl-9 h-11 rounded-xl"
                  maxLength={10}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-xs font-semibold text-[#14B8A6] dark:text-[#2DD4BF] hover:text-[#0F766E] dark:hover:text-[#14B8A6] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Your secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-10 h-11 rounded-xl"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl font-semibold text-[0.95rem] bg-[#14B8A6] hover:bg-[#0F766E] text-white shadow-sm hover:shadow-md transition-all duration-200"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  Authenticating…
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  Sign in to portal <ChevronRight className="w-4 h-4 transition-transform group-hover/button:translate-x-0.5" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-7">
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
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs border border-border hover:border-primary/40 hover:bg-primary/[0.04] dark:hover:bg-primary/10 transition-all text-left text-foreground group"
                >
                  <cred.icon className="w-3.5 h-3.5 text-[#14B8A6]" />
                  <span className="font-medium text-foreground">{cred.label}</span>
                  <span className="text-muted-foreground ml-auto font-mono">{cred.ayurvedicId}</span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-xs text-center text-muted-foreground">
            Password reset requires Admin approval.{' '}
            <button type="button" onClick={() => setForgotOpen(true)} className="text-[#14B8A6] dark:text-[#2DD4BF] hover:text-[#0F766E] dark:hover:text-[#14B8A6] hover:underline font-semibold">
              Contact Administrator
            </button>
          </p>
        </div>
      </div>

      <Dialog open={forgotOpen} onOpenChange={handleForgotOpenChange}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-1">
              <KeyRound className="w-5 h-5 text-primary" />
            </div>
            <DialogTitle>Forgot your password?</DialogTitle>
            <DialogDescription>
              For security, password resets on this Government-issued account can only be approved by
              your registered Administrator — they will verify your identity before issuing new credentials.
            </DialogDescription>
          </DialogHeader>

          {resetRequested ? (
            <div className="rounded-lg border border-success/25 bg-success/8 px-4 py-3 text-sm text-success">
              Your request has been logged. An Administrator will contact you on your registered mobile number shortly.
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="reset-ayurvedic-id" className="text-sm font-medium">Ayurvedic ID</Label>
              <Input
                id="reset-ayurvedic-id"
                placeholder="e.g. AYU-CC-001"
                defaultValue={ayurvedicId}
                className="h-10 font-mono text-sm rounded-xl"
              />
            </div>
          )}

          <DialogFooter>
            {resetRequested ? (
              <Button type="button" onClick={() => setForgotOpen(false)} className="rounded-xl">Done</Button>
            ) : (
              <Button type="button" onClick={handleRequestReset} className="rounded-xl">Request Reset</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
