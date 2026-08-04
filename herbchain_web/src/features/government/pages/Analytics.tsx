import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import PageHeader from '../../../components/PageHeader';
import StatsCard from '../../../components/StatsCard';
import { TrendingUp, Package, CreditCard, ShieldCheck, BarChart3 } from 'lucide-react';

const monthlyBatches = [
  { name: 'Jan', batches: 42, revenue: 1240000, compliance: 95 },
  { name: 'Feb', batches: 58, revenue: 1580000, compliance: 96 },
  { name: 'Mar', batches: 65, revenue: 1850000, compliance: 94 },
  { name: 'Apr', batches: 72, revenue: 2100000, compliance: 98 },
  { name: 'May', batches: 88, revenue: 2540000, compliance: 99 },
  { name: 'Jun', batches: 94, revenue: 2890000, compliance: 98 },
  { name: 'Jul', batches: 47, revenue: 1420000, compliance: 97 },
];

const herbVolume = [
  { herb: 'Ashwagandha', kg: 4500 },
  { herb: 'Brahmi', kg: 2200 },
  { herb: 'Neem', kg: 6000 },
  { herb: 'Tulsi', kg: 3200 },
  { herb: 'Amla', kg: 5100 },
  { herb: 'Shatavari', kg: 1800 },
];

const regionData = [
  { region: 'Kerala', batches: 42 },
  { region: 'Rajasthan', batches: 28 },
  { region: 'Uttarakhand', batches: 20 },
  { region: 'Maharashtra', batches: 18 },
  { region: 'Gujarat', batches: 14 },
  { region: 'Tamil Nadu', batches: 12 },
];

const qualityRadar = [
  { quality: 'Moisture', A: 94 }, { quality: 'Purity', A: 97 }, { quality: 'DNA Auth', A: 99 },
  { quality: 'Heavy Metals', A: 88 }, { quality: 'Pesticides', A: 92 }, { quality: 'Microbial', A: 96 },
];

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#06b6d4', '#8b5cf6', '#ef4444'];

export default function Analytics() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Analytics & Reports"
        description="System-wide performance metrics and trend analysis"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard title="Total Batches (YTD)" value="466" icon={Package} iconColor="text-emerald-600" iconBg="bg-emerald-50 dark:bg-emerald-950/40" trend="up" trendValue="+24%" subtext="vs last year" />
        <StatsCard title="Revenue (YTD)" value="₹1.36 Cr" icon={CreditCard} iconColor="text-blue-600" iconBg="bg-blue-50 dark:bg-blue-950/40" trend="up" trendValue="+31%" />
        <StatsCard title="Avg Compliance" value="96.7%" icon={ShieldCheck} iconColor="text-violet-600" iconBg="bg-violet-50 dark:bg-violet-950/40" trend="up" trendValue="+1.2%" />
        <StatsCard title="Rejection Rate" value="4.2%" icon={TrendingUp} iconColor="text-red-600" iconBg="bg-red-50 dark:bg-red-950/40" trend="down" trendValue="-0.8%" subtext="vs last month" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Batch Throughput</CardTitle>
            <CardDescription>Number of batches processed per month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyBatches} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" strokeOpacity={0.08} />
                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="batches" fill="#10b981" radius={[4,4,0,0]} name="Batches" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Herb Volume by Species (kg)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={herbVolume} layout="vertical" barSize={14}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" strokeOpacity={0.08} />
                <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis dataKey="herb" type="category" fontSize={11} tickLine={false} axisLine={false} width={80} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: 'none' }} />
                <Bar dataKey="kg" radius={[0,4,4,0]} name="Volume (kg)">
                  {herbVolume.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyBatches}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" strokeOpacity={0.08} />
                <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/100000).toFixed(1)}L`} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: 'none' }} formatter={(v: unknown) => [`₹${(Number(v)/100000).toFixed(2)}L`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Batches by Region</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={regionData} cx="50%" cy="50%" outerRadius={80} dataKey="batches" nameKey="region">
                  {regionData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '10px', border: 'none' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1 mt-2">
              {regionData.map((d, i) => (
                <div key={d.region} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-muted-foreground">{d.region}</span>
                  <span className="font-semibold ml-auto">{d.batches}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quality Radar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-500" /> Average Quality Parameters (%)
          </CardTitle>
          <CardDescription>Aggregated quality scores across all batches this quarter</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={qualityRadar}>
              <PolarGrid stroke="currentColor" strokeOpacity={0.15} />
              <PolarAngleAxis dataKey="quality" fontSize={11} />
              <Radar dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
              <Tooltip contentStyle={{ borderRadius: '10px', border: 'none' }} formatter={(v: unknown) => [`${v}%`, 'Score']} />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
