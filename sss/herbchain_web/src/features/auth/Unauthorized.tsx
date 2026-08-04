import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuthStore } from '../../store/authStore';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import BotanicalBackground from '../../components/BotanicalBackground';

/**
 * Shown whenever a signed-in user's role does not grant access to a requested page —
 * either via a stale nav link or a hand-typed / bookmarked URL. Never renders the
 * restricted content itself; DashboardRouter redirects here before that can happen.
 */
export default function Unauthorized() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen login-bg flex items-center justify-center p-4 relative">
      <BotanicalBackground />
      <Card className="w-full max-w-md rounded-2xl elevate-lg border border-border relative z-10">
        <CardContent className="pt-10 pb-8 px-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/25 flex items-center justify-center mb-5">
            <ShieldAlert className="w-8 h-8 text-destructive" aria-hidden="true" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-destructive mb-1.5">Access Restricted</p>
          <h1 className="text-page-title text-foreground">You don't have permission to view this page</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {user
              ? `Your account role (${user.role}) does not include access to this section. If you believe this is an error, contact your Government Administrator.`
              : 'Please sign in with an account that has access to this section.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-2.5 mt-7 w-full">
            <Button
              variant="outline"
              className="flex-1 rounded-xl h-10"
              onClick={() => navigate('/app/dashboard', { replace: true })}
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Button>
            <Button
              variant="ghost"
              className="flex-1 rounded-xl h-10 text-muted-foreground hover:text-destructive"
              onClick={() => { logout(); navigate('/login', { replace: true }); }}
            >
              <LogOut className="w-4 h-4" /> Sign out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
