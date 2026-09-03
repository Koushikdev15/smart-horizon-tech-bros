import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '../../../components/PageHeader';
import { TextField, SelectField, NotesField } from '../../../components/FormFields';
import { useComplaintStore, useComplaintsLive } from '../../../store/useComplaintStore';
import { useBatchStore, useBatchesLive } from '../../../store/useBatchStore';
import { useAuthStore } from '../../../store/authStore';
import type { Complaint } from '../../../types';
import { toast } from 'sonner';
import {
  AlertTriangle, Search, Plus, Loader2, Database, MessageSquareWarning,
  CheckCircle2, Clock, Eye, ShieldAlert,
} from 'lucide-react';

const TYPES = ['Quality', 'Delivery', 'Fraud', 'Compliance', 'Other'] as const;
const SOURCES = ['Collection Center', 'Processing', 'Manufacturer', 'Supply Chain', 'Consumer'] as const;
const STATUSES = ['Open', 'Under Review', 'Resolved', 'Closed'] as const;
const PRIORITIES = ['High', 'Medium', 'Low'] as const;

const stamp = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const BLANK = {
  batchId: '', type: 'Quality', source: 'Consumer', priority: 'Medium',
  description: '', assignedOfficer: '',
};

/**
 * Complaints register, backed by Supabase.
 *
 * Previously seeded from a mock array held in component state, so every
 * resolution vanished on refresh and no other login ever saw it.
 */
export default function Complaints() {
  const { missingTable } = useComplaintsLive();
  useBatchesLive();

  const complaints = useComplaintStore((s) => s.complaints);
  const loading = useComplaintStore((s) => s.loading);
  const addComplaint = useComplaintStore((s) => s.addComplaint);
  const patchComplaint = useComplaintStore((s) => s.patchComplaint);
  const batches = useBatchStore((s) => s.batches);
  const user = useAuthStore((s) => s.user);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [filing, setFiling] = useState(false);
  const [viewing, setViewing] = useState<Complaint | null>(null);
  const [form, setForm] = useState(BLANK);
  const [resolution, setResolution] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return complaints.filter((c) => {
      if (statusFilter !== 'All' && c.status !== statusFilter) return false;
      if (!q) return true;
      return (
        c.batchId?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.type?.toLowerCase().includes(q) ||
        c.source?.toLowerCase().includes(q) ||
        c.assignedOfficer?.toLowerCase().includes(q)
      );
    });
  }, [complaints, search, statusFilter]);

  const counts = useMemo(() => ({
    open: complaints.filter((c) => c.status === 'Open').length,
    review: complaints.filter((c) => c.status === 'Under Review').length,
    resolved: complaints.filter((c) => c.status === 'Resolved' || c.status === 'Closed').length,
    high: complaints.filter((c) => c.priority === 'High' && c.status !== 'Closed').length,
  }), [complaints]);

  const handleFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim()) {
      toast.error('Describe the complaint before filing.');
      return;
    }
    setSaving(true);
    const now = new Date().toISOString();
    try {
      await addComplaint({
        id: '',
        batchId: form.batchId,
        type: form.type as Complaint['type'],
        source: form.source as Complaint['source'],
        description: form.description.trim(),
        status: 'Open',
        priority: form.priority as Complaint['priority'],
        assignedOfficer: form.assignedOfficer || user?.name,
        createdAt: now,
        updatedAt: now,
      });
      toast.success('Complaint filed.');
      setForm(BLANK);
      setFiling(false);
    } catch {
      toast.error('Could not file the complaint.');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (c: Complaint, status: Complaint['status']) => {
    try {
      await patchComplaint(c.id, {
        status,
        resolution: resolution.trim() || c.resolution,
        assignedOfficer: c.assignedOfficer ?? user?.name,
      });
      toast.success(`Marked ${status.toLowerCase()}.`);
      setViewing(null);
      setResolution('');
    } catch {
      toast.error('Could not update the complaint.');
    }
  };

  if (missingTable) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader title="Complaints" description="Quality, delivery and compliance issues raised across the network" />
        <Card>
          <CardContent className="py-12 text-center space-y-3 max-w-xl mx-auto">
            <Database className="w-9 h-9 text-amber-600 mx-auto" />
            <h3 className="font-semibold">The complaints table does not exist yet</h3>
            <p className="text-sm text-muted-foreground">
              Analytics, audit logs and reports are computed from batches and products, so they
              needed no new storage. A complaint is original data somebody files — it has nothing
              to be derived from, so it needs a table.
            </p>
            <p className="text-xs text-muted-foreground">
              Run <span className="font-mono font-semibold">sql/create_complaints_table.sql</span> in
              the Supabase SQL Editor, then reload this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader title="Complaints" description="Quality, delivery and compliance issues raised across the network" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Open', value: counts.open, icon: MessageSquareWarning, tone: 'text-amber-600' },
          { label: 'Under Review', value: counts.review, icon: Clock, tone: 'text-blue-600' },
          { label: 'Resolved', value: counts.resolved, icon: CheckCircle2, tone: 'text-emerald-600' },
          { label: 'High Priority', value: counts.high, icon: ShieldAlert, tone: counts.high ? 'text-red-600' : 'text-muted-foreground' },
        ].map((t) => (
          <Card key={t.label}>
            <CardContent className="py-4 flex items-center gap-3">
              <t.icon className={`w-5 h-5 shrink-0 ${t.tone}`} />
              <div className="min-w-0">
                <p className="text-xl font-bold leading-none">{t.value}</p>
                <p className="text-[11px] text-muted-foreground mt-1 truncate">{t.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by batch, description, type or officer…"
            className="pl-9 h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm min-w-36"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <Button size="sm" className="h-9 text-xs" onClick={() => setFiling(true)}>
          <Plus className="w-3.5 h-3.5 mr-1.5" /> File Complaint
        </Button>
      </div>

      {loading && complaints.length === 0 ? (
        <Card><CardContent className="py-14 flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" /><p className="text-sm">Loading complaints…</p>
        </CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-14 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-600/50 mx-auto" />
          <p className="text-sm text-muted-foreground">
            {complaints.length === 0 ? 'No complaints have been filed.' : 'No complaints match those filters.'}
          </p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-4 flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  c.priority === 'High' ? 'bg-red-100 dark:bg-red-950/50' : 'bg-amber-100 dark:bg-amber-950/50'
                }`}>
                  <AlertTriangle className={`w-5 h-5 ${c.priority === 'High' ? 'text-red-600' : 'text-amber-600'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-sm">{c.type}</span>
                    <Pill label={c.status} tone={
                      c.status === 'Open' ? 'amber' : c.status === 'Under Review' ? 'blue' : 'emerald'
                    } />
                    <Pill label={c.priority} tone={c.priority === 'High' ? 'red' : 'muted'} />
                    {c.batchId && <span className="font-mono text-[11px] text-muted-foreground">{c.batchId}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.description}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    From {c.source} · filed {stamp(c.createdAt)}
                    {c.assignedOfficer ? ` · ${c.assignedOfficer}` : ''}
                  </p>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs shrink-0"
                  onClick={() => { setViewing(c); setResolution(c.resolution ?? ''); }}>
                  <Eye className="w-3 h-3 mr-1" /> Review
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* File */}
      {filing && (
        <Dialog open onOpenChange={() => setFiling(false)}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>File a Complaint</DialogTitle></DialogHeader>
            <form onSubmit={handleFile} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SelectField label="Type" value={form.type} onChange={(v) => set('type', v)} options={TYPES} required />
                <SelectField label="Raised By" value={form.source} onChange={(v) => set('source', v)} options={SOURCES} required />
                <SelectField label="Priority" value={form.priority} onChange={(v) => set('priority', v)} options={PRIORITIES} required />
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Related Batch</label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                    value={form.batchId}
                    onChange={(e) => set('batchId', e.target.value)}
                  >
                    <option value="">Not batch-specific</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.batchNumber}>{b.batchNumber} — {b.species}</option>
                    ))}
                  </select>
                </div>
                <TextField label="Assigned Officer" value={form.assignedOfficer} onChange={(v) => set('assignedOfficer', v)} span />
                <NotesField label="Description" value={form.description} onChange={(v) => set('description', v)} placeholder="What went wrong?" />
              </div>
              <Button type="submit" disabled={saving} className="w-full h-10">
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Filing…</> : 'File Complaint'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Review */}
      {viewing && (
        <Dialog open onOpenChange={() => setViewing(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" /> {viewing.type} Complaint
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <Field label="Status" value={viewing.status} />
                <Field label="Priority" value={viewing.priority} />
                <Field label="Raised By" value={viewing.source} />
                <Field label="Batch" value={viewing.batchId || 'Not batch-specific'} />
                <Field label="Filed" value={stamp(viewing.createdAt)} />
                <Field label="Last Updated" value={stamp(viewing.updatedAt)} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Description</p>
                <p className="text-sm mt-0.5">{viewing.description}</p>
              </div>
              <NotesField label="Resolution" value={resolution} onChange={setResolution} placeholder="What was done about it?" />
              <div className="flex gap-2">
                {viewing.status !== 'Under Review' && (
                  <Button variant="outline" className="flex-1 text-xs" onClick={() => updateStatus(viewing, 'Under Review')}>
                    Under Review
                  </Button>
                )}
                <Button variant="outline" className="flex-1 text-xs" onClick={() => updateStatus(viewing, 'Resolved')}>
                  Resolved
                </Button>
                <Button className="flex-1 text-xs" onClick={() => updateStatus(viewing, 'Closed')}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function Pill({ label, tone }: { label: string; tone: 'amber' | 'blue' | 'emerald' | 'red' | 'muted' }) {
  const tones: Record<string, string> = {
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
    red: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
    muted: 'bg-muted text-muted-foreground',
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${tones[tone]}`}>
      {label}
    </span>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
