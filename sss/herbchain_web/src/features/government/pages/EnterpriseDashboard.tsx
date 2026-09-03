import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Package, Users, Leaf as LeafIcon, AlertTriangle, Loader2,
  Boxes, Truck, FlaskConical, ArrowRight, Link2,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  AreaChart, Area, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useNetworkStats } from '../useNetworkStats';
import BatchStatusBadge from '../../../components/BatchStatusBadge';

/**
 * Government dashboard — the state of the network, from the ledger.
 *
 * Every figure here is derived from the batches, products and members that
 * actually exist. The previous version was entirely hard-coded (1,240
 * shipments, 45 nodes, a fixed list of ledger hashes), so it told the same
 * story no matter what the data did.
 */

/** Chart palette — greens for volume, amber for caution, red for failure. */
const GREENS = ['#0B7A46', '#159A5A', '#2FB673', '#5FCB93', '#8FDCB4', '#B9E9D0', '#D6F2E3', '#E9F8F0'];
const QUALITY_COLOURS: Record<string, string> = {
  Passed: '#159A5A',
  Conditional: '#D9A02B',
  Failed: '#C7382F',
  'Awaiting test': '#B7C3BC',
};

const relative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff)) return '';
  const m = Math.round(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.round(h / 24);
  return d < 30 ? `${d} d ago` : new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

/** Recharts tooltip styled to the app's surface rather than its white default. */
const tooltipStyle = {
  contentStyle: {
    background: 'var(--color-card, #fff)',
    border: '1px solid var(--color-border, #e5e7eb)',
    borderRadius: '0.6rem',
    fontSize: '12px',
    boxShadow: '0 6px 20px -8px rgba(0,0,0,0.25)',
  },
  labelStyle: { fontWeight: 600, marginBottom: 2 },
};

export default function EnterpriseDashboard() {
  const navigate = useNavigate();
  const s = useNetworkStats();

  const tiles = [
    {
      title: 'Batches on Ledger',
      value: s.counts.batches.toLocaleString('en-IN'),
      sub: `${s.counts.speciesCount} species · ${s.counts.totalKg.toLocaleString('en-IN')} kg`,
      icon: Boxes,
      tone: 'text-emerald-600',
      to: '/app/timeline',
    },
    {
      title: 'Verified Herbs (kg)',
      value: s.counts.verifiedKg.toLocaleString('en-IN'),
      sub: `${s.counts.tested} of ${s.counts.batches} batches lab-tested`,
      icon: LeafIcon,
      tone: 'text-emerald-600',
      to: '/app/timeline',
    },
    {
      title: 'Products Released',
      value: s.counts.products.toLocaleString('en-IN'),
      sub: `${s.counts.inTransit} in transit · ${s.counts.delivered} delivered`,
      icon: Package,
      tone: 'text-blue-600',
      to: '/app/tracking',
    },
    {
      title: 'Active Nodes',
      value: s.counts.activeNodes.toLocaleString('en-IN'),
      sub: `${s.counts.activeMembers} active of ${s.counts.totalMembers} members`,
      icon: Users,
      tone: 'text-indigo-600',
      to: '/app/members',
    },
    {
      title: 'Flagged',
      value: s.counts.flagged.toLocaleString('en-IN'),
      sub: s.counts.flagged ? 'Rejected, quarantined, failed or expired' : 'Nothing requires attention',
      icon: AlertTriangle,
      tone: s.counts.flagged ? 'text-red-600' : 'text-muted-foreground',
      to: '/app/complaints',
    },
  ];

  if (s.loading && s.counts.batches === 0) {
    return (
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading network data…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── Headline figures ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {tiles.map((t) => (
          <Card
            key={t.title}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(t.to)}
          >
            <CardContent className="py-4 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-medium text-muted-foreground leading-tight">{t.title}</p>
                <t.icon className={`w-4 h-4 shrink-0 ${t.tone}`} />
              </div>
              <p className="text-2xl font-bold leading-none">{t.value}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{t.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Flow + quality ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Supply Chain Position</CardTitle>
            <CardDescription className="text-xs">
              Where every batch currently sits, from collection through to manufacture
            </CardDescription>
          </CardHeader>
          <CardContent>
            {s.funnel.length === 0 ? (
              <Empty label="No batches on the ledger yet" />
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={s.funnel} margin={{ top: 4, right: 8, left: -18, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
                  <XAxis dataKey="stage" tick={{ fontSize: 10 }} interval={0} angle={-12} textAnchor="end" height={48} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip {...tooltipStyle} formatter={(v) => [`${v} batches`, '']} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {s.funnel.map((d, i) => (
                      <Cell key={d.stage} fill={d.stage === 'Rejected' ? '#C7382F' : GREENS[i % GREENS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Quality Outcomes</CardTitle>
            <CardDescription className="text-xs">Laboratory results across all batches</CardDescription>
          </CardHeader>
          <CardContent>
            {s.quality.length === 0 ? (
              <Empty label="No test results yet" />
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie
                    data={s.quality}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={72}
                    paddingAngle={2}
                  >
                    {s.quality.map((d) => (
                      <Cell key={d.name} fill={QUALITY_COLOURS[d.name] ?? '#159A5A'} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} formatter={(v, n) => [`${v} batches`, n]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Volume trend + species ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Collection Volume</CardTitle>
            <CardDescription className="text-xs">Quantity harvested by month</CardDescription>
          </CardHeader>
          <CardContent>
            {s.timeline.length === 0 ? (
              <Empty label="No harvest dates recorded" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={s.timeline} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="kgFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#159A5A" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#159A5A" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    {...tooltipStyle}
                    formatter={(v, n) => [n === 'kg' ? `${v} kg` : `${v} batches`, n === 'kg' ? 'Volume' : 'Batches']}
                  />
                  <Area type="monotone" dataKey="kg" stroke="#159A5A" strokeWidth={2} fill="url(#kgFill)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Volume by Herb</CardTitle>
            <CardDescription className="text-xs">Top species by quantity collected</CardDescription>
          </CardHeader>
          <CardContent>
            {s.species.length === 0 ? (
              <Empty label="No species recorded" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={s.species} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={104} />
                  <Tooltip {...tooltipStyle} formatter={(v) => [`${v} kg`, 'Collected']} />
                  <Bar dataKey="kg" radius={[0, 6, 6, 0]}>
                    {s.species.map((d, i) => (
                      <Cell key={d.name} fill={GREENS[i % GREENS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Network + ledger ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Network Members</CardTitle>
            <CardDescription className="text-xs">Registered participants by role</CardDescription>
          </CardHeader>
          <CardContent>
            {s.roles.length === 0 ? (
              <Empty label="No members registered" />
            ) : (
              <div className="space-y-2">
                {s.roles.map((r, i) => {
                  const pct = s.counts.totalMembers ? (r.value / s.counts.totalMembers) * 100 : 0;
                  return (
                    <div key={r.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="truncate">{r.name}</span>
                        <span className="font-semibold shrink-0 ml-2">{r.value}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: GREENS[i % GREENS.length] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base">Latest Ledger Entries</CardTitle>
              <CardDescription className="text-xs">Most recent recorded events across the chain</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => navigate('/app/audit')}>
              Audit Log <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {s.ledger.length === 0 ? (
              <Empty label="No events recorded yet" />
            ) : (
              s.ledger.map((e) => (
                <div key={e.id} className="flex items-start gap-2.5 rounded-lg border border-border/50 p-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      e.kind === 'product'
                        ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-600'
                        : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600'
                    }`}
                  >
                    {e.kind === 'product' ? <Package className="w-3.5 h-3.5" /> : <FlaskConical className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{e.label}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{e.detail}</p>
                    {e.hash && (
                      <p className="text-[10px] font-mono text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                        <Link2 className="w-2.5 h-2.5 shrink-0" />
                        {e.hash.slice(0, 22)}…
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap">
                    {relative(e.timestamp)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Recent batches ───────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Recent Collections</CardTitle>
            <CardDescription className="text-xs">Newest batches registered on the ledger</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => navigate('/app/timeline')}>
            View All <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          {s.inventory.length === 0 ? (
            <Empty label="No batches registered yet" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch</TableHead>
                    <TableHead>Herb</TableHead>
                    <TableHead>Origin</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Grade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {s.inventory.map((b) => (
                    <TableRow
                      key={b.id}
                      className="cursor-pointer"
                      onClick={() => navigate('/app/timeline')}
                    >
                      <TableCell className="font-mono text-xs">{b.batchNumber}</TableCell>
                      <TableCell className="font-medium">{b.species}</TableCell>
                      <TableCell className="text-muted-foreground text-xs max-w-48 truncate">{b.region}</TableCell>
                      <TableCell className="text-xs">{b.quantity} {b.unit}</TableCell>
                      <TableCell><BatchStatusBadge status={b.status} /></TableCell>
                      <TableCell className="text-xs font-semibold">{b.estimatedGrade ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
      <Truck className="w-6 h-6 opacity-40" />
      <p className="text-xs">{label}</p>
    </div>
  );
}
