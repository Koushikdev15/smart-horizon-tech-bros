import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PageHeader from '../../../components/PageHeader';
import { useAuditTrail } from '../useAuditTrail';
import { downloadCsv } from '../../../lib/exportCsv';
import { toast } from 'sonner';
import {
  Search, ScrollText, Package, FlaskConical, Download, Loader2,
  CheckCircle2, XCircle, Clock, Link2,
} from 'lucide-react';

const PAGE_SIZE = 25;

const stamp = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
};

/**
 * Immutable audit trail, assembled from the timelines every batch and product
 * carries. Previously this page listed five hard-coded rows.
 */
export default function AuditLogs() {
  const { loading, events, organizations, stages, counts } = useAuditTrail();

  const [search, setSearch] = useState('');
  const [org, setOrg] = useState('All');
  const [stage, setStage] = useState('All');
  const [visible, setVisible] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => {
      if (org !== 'All' && e.organization !== org) return false;
      if (stage !== 'All' && e.stage !== stage) return false;
      if (!q) return true;
      return (
        e.entity.toLowerCase().includes(q) ||
        e.organization.toLowerCase().includes(q) ||
        e.user.toLowerCase().includes(q) ||
        e.stage.toLowerCase().includes(q) ||
        e.remarks?.toLowerCase().includes(q)
      );
    });
  }, [events, search, org, stage]);

  const handleExport = () => {
    if (!filtered.length) {
      toast.error('Nothing to export.');
      return;
    }
    downloadCsv(
      `ayurtrace-audit-log-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Timestamp', 'Entity', 'Type', 'Stage', 'Status', 'Organization', 'User', 'Remarks', 'Tx Hash'],
      filtered.map((e) => [
        e.timestamp, e.entity, e.entityKind, e.stage, e.status,
        e.organization, e.user, e.remarks ?? '', e.txHash ?? '',
      ]),
    );
    toast.success(`Exported ${filtered.length} audit entries.`);
  };

  const StatusIcon = (s: string) =>
    s === 'Completed' ? CheckCircle2 : s === 'Rejected' ? XCircle : Clock;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Audit Logs"
        description="Every recorded event across the network, newest first"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Events', value: counts.total, icon: ScrollText, tone: 'text-emerald-600' },
          { label: 'Batch Events', value: counts.batches, icon: FlaskConical, tone: 'text-blue-600' },
          { label: 'Product Events', value: counts.products, icon: Package, tone: 'text-indigo-600' },
          { label: 'Rejections', value: counts.rejected, icon: XCircle, tone: counts.rejected ? 'text-red-600' : 'text-muted-foreground' },
        ].map((t) => (
          <Card key={t.label}>
            <CardContent className="py-4 flex items-center gap-3">
              <t.icon className={`w-5 h-5 shrink-0 ${t.tone}`} />
              <div className="min-w-0">
                <p className="text-xl font-bold leading-none">{t.value.toLocaleString('en-IN')}</p>
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
            placeholder="Search by batch, product, organisation, user or remark…"
            className="pl-9 h-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setVisible(PAGE_SIZE); }}
          />
        </div>
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm min-w-44"
          value={org}
          onChange={(e) => { setOrg(e.target.value); setVisible(PAGE_SIZE); }}
        >
          <option value="All">All organisations</option>
          {organizations.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm min-w-36"
          value={stage}
          onChange={(e) => { setStage(e.target.value); setVisible(PAGE_SIZE); }}
        >
          <option value="All">All stages</option>
          {stages.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <Button variant="outline" size="sm" className="h-9 text-xs" onClick={handleExport}>
          <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading && events.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <p className="text-sm">Loading audit trail…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center space-y-1">
              <ScrollText className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm text-muted-foreground">
                {events.length === 0 ? 'No events recorded yet.' : 'No entries match those filters.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Organisation</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Ledger</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.slice(0, visible).map((e) => {
                      const Icon = StatusIcon(e.status);
                      return (
                        <TableRow key={e.id}>
                          <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                            {stamp(e.timestamp)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              {e.entityKind === 'Product'
                                ? <Package className="w-3 h-3 text-indigo-600 shrink-0" />
                                : <FlaskConical className="w-3 h-3 text-emerald-600 shrink-0" />}
                              <span className="font-mono text-xs">{e.entity}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Icon
                                className={`w-3 h-3 shrink-0 ${
                                  e.status === 'Completed' ? 'text-emerald-600'
                                    : e.status === 'Rejected' ? 'text-red-600'
                                      : 'text-blue-600'
                                }`}
                              />
                              <span className="text-xs font-medium">{e.stage}</span>
                            </div>
                            {e.remarks && (
                              <p className="text-[11px] text-muted-foreground mt-0.5 max-w-md truncate">
                                {e.remarks}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-xs max-w-48 truncate">{e.organization}</TableCell>
                          <TableCell className="text-xs max-w-36 truncate">{e.user}</TableCell>
                          <TableCell>
                            {e.txHash ? (
                              <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                                <Link2 className="w-2.5 h-2.5 shrink-0" />
                                {e.txHash.slice(0, 14)}…
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  Showing {Math.min(visible, filtered.length)} of {filtered.length}
                  {filtered.length !== events.length ? ` (filtered from ${events.length})` : ''}
                </p>
                {visible < filtered.length && (
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                    Load more
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
