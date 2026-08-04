import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import PageHeader from '../../../components/PageHeader';
import { Settings, Bell, ShieldCheck, Link as ChainIcon, Save } from 'lucide-react';

function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/60 last:border-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5.5 rounded-full transition-colors shrink-0 ${checked ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-700'}`}
      >
        <span className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[19px]' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

export default function SystemSettings() {
  const [notif, setNotif] = useState({ newMembers: true, complaints: true, rejections: true, payments: false });
  const [security, setSecurity] = useState({ twoFactor: true, sessionTimeout: true, ipAllowlist: false });
  const [blockchain, setBlockchain] = useState({ autoCommit: true, publicVerify: true });

  const save = (section: string) => toast.success(`${section} settings saved.`);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader title="System Settings" description="Configure organization details, notifications, security, and blockchain preferences" />

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general"><Settings className="w-3.5 h-3.5 mr-1.5" />General</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="w-3.5 h-3.5 mr-1.5" />Notifications</TabsTrigger>
          <TabsTrigger value="security"><ShieldCheck className="w-3.5 h-3.5 mr-1.5" />Security</TabsTrigger>
          <TabsTrigger value="blockchain"><ChainIcon className="w-3.5 h-3.5 mr-1.5" />Blockchain</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Organization Details</CardTitle>
              <CardDescription>Ministry of AYUSH — AyuTrace+ portal configuration</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Organization Name</Label>
                <Input defaultValue="Ministry of AYUSH" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Support Email</Label>
                <Input defaultValue="support@ayutrace.gov.in" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Support Phone</Label>
                <Input defaultValue="+91 11 2345 6789" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Default Region</Label>
                <Input defaultValue="All India" className="h-9" />
              </div>
              <div className="md:col-span-2">
                <Button onClick={() => save('General')} className="bg-primary hover:bg-primary text-white">
                  <Save className="w-4 h-4 mr-1.5" /> Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notification Preferences</CardTitle>
              <CardDescription>Choose which system events trigger admin alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <Toggle label="New Member Registrations" description="Alert when a new member submits registration" checked={notif.newMembers} onChange={(v) => setNotif((n) => ({ ...n, newMembers: v }))} />
              <Toggle label="Consumer Complaints" description="Alert on new complaints filed" checked={notif.complaints} onChange={(v) => setNotif((n) => ({ ...n, complaints: v }))} />
              <Toggle label="Batch Rejections" description="Alert when a batch fails quality checks" checked={notif.rejections} onChange={(v) => setNotif((n) => ({ ...n, rejections: v }))} />
              <Toggle label="Payment Releases" description="Alert on every payment transaction" checked={notif.payments} onChange={(v) => setNotif((n) => ({ ...n, payments: v }))} />
              <div className="mt-4">
                <Button onClick={() => save('Notification')} className="bg-primary hover:bg-primary text-white">
                  <Save className="w-4 h-4 mr-1.5" /> Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Security</CardTitle>
              <CardDescription>Access control and authentication policies</CardDescription>
            </CardHeader>
            <CardContent>
              <Toggle label="Two-Factor Authentication" description="Require 2FA for all admin accounts" checked={security.twoFactor} onChange={(v) => setSecurity((s) => ({ ...s, twoFactor: v }))} />
              <Toggle label="Auto Session Timeout" description="Log out inactive sessions after 30 minutes" checked={security.sessionTimeout} onChange={(v) => setSecurity((s) => ({ ...s, sessionTimeout: v }))} />
              <Toggle label="IP Allowlist" description="Restrict admin access to approved IP ranges" checked={security.ipAllowlist} onChange={(v) => setSecurity((s) => ({ ...s, ipAllowlist: v }))} />
              <div className="mt-4">
                <Button onClick={() => save('Security')} className="bg-primary hover:bg-primary text-white">
                  <Save className="w-4 h-4 mr-1.5" /> Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blockchain" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Blockchain Configuration</CardTitle>
              <CardDescription>Ledger commit behavior and public verification</CardDescription>
            </CardHeader>
            <CardContent>
              <Toggle label="Auto-Commit Transactions" description="Automatically commit verified events to the ledger" checked={blockchain.autoCommit} onChange={(v) => setBlockchain((b) => ({ ...b, autoCommit: v }))} />
              <Toggle label="Public Batch Verification" description="Allow consumers to verify batches via /verify without login" checked={blockchain.publicVerify} onChange={(v) => setBlockchain((b) => ({ ...b, publicVerify: v }))} />
              <div className="mt-4">
                <Button onClick={() => save('Blockchain')} className="bg-primary hover:bg-primary text-white">
                  <Save className="w-4 h-4 mr-1.5" /> Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
