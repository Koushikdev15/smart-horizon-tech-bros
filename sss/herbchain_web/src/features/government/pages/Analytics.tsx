import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import PageHeader from '../../../components/PageHeader';
import { useNetworkStats } from '../useNetworkStats';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  AreaChart, Area, PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { Loader2, BarChart3, Droplets, Sprout, FlaskConical } from 'lucide-react';

/**
 * Network analytics, computed from the live ledger.
 *
 * Every series on this page used to be a hard-coded array in this file —
 * monthlyBatches, herbVolume, regionData, qualityRadar. They never changed.
 */

const GREENS = ['#0B7A46', '#159A5A', '#2FB673', '#5FCB93', '#8FDCB4', '#B9E9D0', '#D6F2E3', '#E9F8F0'];
const QUALITY_COLOURS: Record<string, string> = {
  Passed: '#159A5A',
  Conditional: '#D9A02B',
  Failed: '#C7382F',
  'Awaiting test': '#B7C3BC',
};
const SOURCE_COLOURS: Record<string, string> = {
  Cultivated: '#159A5A',
  'Wild-collected': '#2E7D8F',
};

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

function Empty({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-muted-foreground">
      <BarChart3 className="w-6 h-6 opacity-40" />
      <p className="text-xs">{label}</p>
    </div>
  );
}

export default function Analytics() {
  const s = useNetworkStats();

  if (s.loading && s.counts.batches === 0) {
    return (
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Computing analytics…</p>
      </div>
    );
  }

  const avgBatchKg = s.counts.batches ? Math.round(s.counts.totalKg / s.counts.batches) : 0;
  const testedPct = s.counts.batches
    ? Math.round((s.counts.tested / s.counts.batches) * 100)
    : 0;

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Analytics"
        description="Network performance computed from live batch, product and member records"
      />

      {/* Derived indicators */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Average Batch Size',
            value: `${avgBatchKg} kg`,
            sub: `across ${s.counts.batches} batches`,
            icon: Sprout,
            tone: 'text-emerald-600',
          },
          {
            label: 'Lab Coverage',
            value: `${testedPct}%`,
            sub: `${s.counts.tested} of ${s.counts.batches} tested`,
            icon: FlaskConical,
            tone: 'text-blue-600',
          },
          {
            label: 'Average Moisture',
            value: s.avgMoisture === null ? '—' : `${s.avgMoisture.toFixed(1)}%`,
            sub: s.avgMoisture === null ? 'no readings yet' : 'limit 10% (API)',
            icon: Droplets,
            tone:
              s.avgMoisture !== null && s.avgMoisture > 10 ? 'text-amber-600' : 'text-emerald-600',
          },
          {
            label: 'Batches per Product',
            value: s.counts.products
              ? (s.products.reduce((t, p) => t + p.components.length, 0) / s.counts.products).toFixed(1)
              : '—',
            sub: `${s.counts.products} products released`,
            icon: BarChart3,
            tone: 'text-indigo-600',
          },
        ].map((t) => (
          <Card key={t.label}>
            <CardContent className="py-4 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[11px] font-medium text-muted-foreground leading-tight">{t.label}</p>
                <t.icon className={`w-4 h-4 shrink-0 ${t.tone}`} />
              </div>
              <p className="text-2xl font-bold leading-none">{t.value}</p>
              <p className="text-[10px] text-muted-foreground">{t.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Volume trend + sourcing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Collection Volume &amp; Batch Count</CardTitle>
            <CardDescription className="text-xs">By month of harvest</CardDescription>
          </CardHeader>
          <CardContent>
            {s.timeline.length === 0 ? (
              <Empty label="No harvest dates recorded" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={s.timeline} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="anKg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#159A5A" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#159A5A" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="kg" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="n" orientation="right" tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />
                  <Area yAxisId="kg" type="monotone" dataKey="kg" name="Volume (kg)" stroke="#159A5A" strokeWidth={2} fill="url(#anKg)" />
                  <Line yAxisId="n" type="monotone" dataKey="batches" name="Batches" stroke="#2E7D8F" strokeWidth={2} dot={{ r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Sourcing Mix</CardTitle>
            <CardDescription className="text-xs">Cultivated vs wild-collected, by weight</CardDescription>
          </CardHeader>
          <CardContent>
            {s.sourcing.length === 0 ? (
              <Empty label="No collector types recorded" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={s.sourcing} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                    {s.sourcing.map((d) => (
                      <Cell key={d.name} fill={SOURCE_COLOURS[d.name] ?? '#159A5A'} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} formatter={(v, n) => [`${v} kg`, n]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Regions + species */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Volume by Region</CardTitle>
            <CardDescription className="text-xs">Collection districts by weight</CardDescription>
          </CardHeader>
          <CardContent>
            {s.regions.length === 0 ? (
              <Empty label="No regions recorded" />
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={s.regions} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={92} />
                  <Tooltip {...tooltipStyle} formatter={(v, n) => [n === 'kg' ? `${v} kg` : `${v}`, n === 'kg' ? 'Volume' : 'Batches']} />
                  <Bar dataKey="kg" radius={[0, 6, 6, 0]}>
                    {s.regions.map((d, i) => <Cell key={d.name} fill={GREENS[i % GREENS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Volume by Herb</CardTitle>
            <CardDescription className="text-xs">Top species collected</CardDescription>
          </CardHeader>
          <CardContent>
            {s.species.length === 0 ? (
              <Empty label="No species recorded" />
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={s.species} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={104} />
                  <Tooltip {...tooltipStyle} formatter={(v) => [`${v} kg`, 'Collected']} />
                  <Bar dataKey="kg" radius={[0, 6, 6, 0]}>
                    {s.species.map((d, i) => <Cell key={d.name} fill={GREENS[i % GREENS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quality + labs + products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Quality Outcomes</CardTitle>
            <CardDescription className="text-xs">Laboratory verdicts</CardDescription>
          </CardHeader>
          <CardContent>
            {s.quality.length === 0 ? (
              <Empty label="No results yet" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={s.quality} dataKey="value" nameKey="name" innerRadius={42} outerRadius={70} paddingAngle={2}>
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Laboratory Throughput</CardTitle>
            <CardDescription className="text-xs">Batches certified per laboratory</CardDescription>
          </CardHeader>
          <CardContent>
            {s.labs.length === 0 ? (
              <Empty label="No laboratories recorded" />
            ) : (
              <div className="space-y-2 pt-1">
                {s.labs.map((l, i) => {
                  const max = s.labs[0]?.value || 1;
                  return (
                    <div key={l.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="truncate">{l.name}</span>
                        <span className="font-semibold shrink-0 ml-2">{l.value}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(l.value / max) * 100}%`, background: GREENS[i % GREENS.length] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Product Categories</CardTitle>
            <CardDescription className="text-xs">Finished products by dosage form</CardDescription>
          </CardHeader>
          <CardContent>
            {s.categories.length === 0 ? (
              <Empty label="No products released" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={s.categories} margin={{ top: 4, right: 8, left: -22, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={52} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip {...tooltipStyle} formatter={(v) => [`${v} products`, '']} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {s.categories.map((d, i) => <Cell key={d.name} fill={GREENS[i % GREENS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Product release trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Product Releases</CardTitle>
          <CardDescription className="text-xs">Finished products by month of manufacture</CardDescription>
        </CardHeader>
        <CardContent>
          {s.productTrend.length === 0 ? (
            <Empty label="No products released yet" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={s.productTrend} margin={{ top: 4, right: 12, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip {...tooltipStyle} formatter={(v) => [`${v} products`, 'Released']} />
                <Line type="monotone" dataKey="products" stroke="#0B7A46" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
