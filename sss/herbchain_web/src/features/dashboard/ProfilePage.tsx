import { useAuthStore } from '../../store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Leaf, FlaskConical, Factory, Truck, Tractor, TreePine, Mail, Phone, MapPin, Hash, Building2, CalendarDays } from 'lucide-react';
import type { UserRole } from '../../types';

const roleIcons: Record<UserRole, React.ElementType> = {
  'Government': Shield,
  'Collection Center': Leaf,
  'Farmer': Tractor,
  'Wild Collector': TreePine,
  'Processing & Laboratory': FlaskConical,
  'Manufacturer': Factory,
  'Supply Chain': Truck,
};

const roleColors: Record<UserRole, string> = {
  'Government': 'text-violet-600',
  'Collection Center': 'text-primary',
  'Farmer': 'text-lime-600',
  'Wild Collector': 'text-teal-600',
  'Processing & Laboratory': 'text-amber-600',
  'Manufacturer': 'text-blue-600',
  'Supply Chain': 'text-cyan-600',
};

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;

  const RoleIcon = roleIcons[user.role];
  const roleColor = roleColors[user.role];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-xl font-bold font-heading">My Profile</h2>
        <p className="text-sm text-muted-foreground">Your account details and credentials</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar card */}
        <Card className="text-center">
          <CardContent className="pt-8 pb-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 dark:bg-primary/16 flex items-center justify-center text-2xl font-bold text-primary mx-auto mb-4">
              {user.name.charAt(0)}
            </div>
            <h3 className="text-lg font-bold">{user.name}</h3>
            <div className={`flex items-center justify-center gap-1.5 mt-1 ${roleColor}`}>
              <RoleIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{user.role}</span>
            </div>
            <Badge className="mt-3 bg-primary/10 text-primary border-primary/25 hover:bg-primary/10">Active</Badge>
          </CardContent>
        </Card>

        {/* Details card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Account Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: Hash, label: 'Ayurvedic ID', value: user.ayurvedicId || 'N/A' },
              { icon: Phone, label: 'Mobile Number', value: user.mobile || 'N/A' },
              { icon: Mail, label: 'Email Address', value: user.email },
              { icon: Building2, label: 'Organization', value: user.organizationName || 'N/A' },
              { icon: MapPin, label: 'Region', value: user.region || 'N/A' },
              { icon: CalendarDays, label: 'Account Status', value: user.status || 'Active' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
                <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
