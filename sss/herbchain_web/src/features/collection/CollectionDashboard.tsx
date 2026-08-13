import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, Clock, ShieldAlert, Users, ArrowUpRight, ArrowDownRight, LayoutList } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useActiveMembers } from './useActiveMembers';

const MinimalTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border shadow-sm rounded-lg p-2 text-xs">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-muted-foreground">
            <span className="font-medium" style={{ color: entry.color }}>{entry.name}:</span> {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// 1. KPI Data. "Active Farmers" is replaced with a live count at render time —
// the rest are still placeholder figures pending real collection data.
const kpiData = [
  { title: "Herbs Collected Today", value: "4,250 kg", trend: "+15.2%", isPositive: true, icon: Leaf },
  { title: "Pending Collections", value: "18", trend: "-2.0%", isPositive: true, icon: Clock },
  { title: "Quality Checks Pending", value: "5", trend: "+1.5%", isPositive: false, icon: ShieldAlert },
  { title: "Active Farmers", value: "124", trend: "+4.0%", isPositive: true, icon: Users },
];

// 2. Schedule Data (Timeline / Kanban Simulation)
const scheduleData = [
  { time: '09:00 AM', farmer: 'Ramesh K.', type: 'Ashwagandha', qty: '500kg', status: 'Completed' },
  { time: '11:30 AM', farmer: 'Suresh M.', type: 'Tulsi', qty: '200kg', status: 'In Progress' },
  { time: '02:00 PM', farmer: 'Priya S.', type: 'Neem Leaves', qty: '350kg', status: 'Pending' },
  { time: '04:15 PM', farmer: 'Govind R.', type: 'Brahmi', qty: '150kg', status: 'Pending' },
];

// 3. Herb Inventory (Bar Chart)
const inventoryData = [
  { name: 'Ashwagandha', stock: 5000 },
  { name: 'Tulsi', stock: 3200 },
  { name: 'Neem', stock: 4100 },
  { name: 'Brahmi', stock: 1500 },
  { name: 'Shatavari', stock: 2800 },
];

// 4. Collection Trend (Line Chart)
const trendData = [
  { day: 'Mon', amount: 3000 },
  { day: 'Tue', amount: 3500 },
  { day: 'Wed', amount: 3200 },
  { day: 'Thu', amount: 4800 },
  { day: 'Fri', amount: 4100 },
  { day: 'Sat', amount: 5200 },
  { day: 'Sun', amount: 4250 },
];

// 5. Audit Trail Data
const auditData = [
  { id: 'RCV-9012', time: '10:45 AM', event: 'Farmer Ramesh - 50kg Ashwagandha', status: 'Passed' },
  { id: 'RCV-9011', time: '10:15 AM', event: 'Farmer Suresh - 100kg Tulsi', status: 'Testing' },
  { id: 'RCV-9010', time: '09:30 AM', event: 'Wild Collector A. - 20kg Brahmi', status: 'Passed' },
  { id: 'RCV-9009', time: '09:00 AM', event: 'Farmer Priya - 200kg Neem', status: 'Failed' },
  { id: 'RCV-9008', time: '08:15 AM', event: 'Farmer Govind - 75kg Shatavari', status: 'Passed' },
];

export default function CollectionDashboard() {
  // Live counts of Government-approved members, shared with the Farmers and
  // Wild Collectors registry pages.
  const { members: farmers, loading: farmersLoading } = useActiveMembers('Farmer');
  const { members: collectors, loading: collectorsLoading } = useActiveMembers('Wild Collector');

  const kpis = kpiData.map((kpi) =>
    kpi.title === 'Active Farmers'
      ? {
          ...kpi,
          // Real figure, so the invented trend badge is dropped rather than
          // pairing a true number with a made-up delta.
          value: farmersLoading ? '—' : String(farmers.length),
          trend: undefined as string | undefined,
          subtitle: collectorsLoading
            ? undefined
            : `${collectors.length} wild collector${collectors.length === 1 ? '' : 's'}`,
        }
      : { ...kpi, subtitle: undefined as string | undefined },
  );

  return (
    <div className="text-foreground animate-in fade-in duration-500">
      <div className="grid grid-cols-12 gap-6">

        {/* ROW 1: KPIs */}
        <div className="col-span-12 grid grid-cols-4 gap-6">
          {kpis.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <Card key={index} className="border-border shadow-sm rounded-xl bg-card/95 backdrop-blur hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{kpi.title}</p>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-2xl font-bold text-foreground">{kpi.value}</h3>
                      {kpi.trend && (
                        <span className={`flex items-center text-[11px] font-bold px-1.5 py-0.5 rounded ${kpi.isPositive ? 'text-emerald-600 bg-emerald-500/10' : 'text-rose-600 bg-rose-500/10'}`}>
                          {kpi.isPositive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                          {kpi.trend}
                        </span>
                      )}
                    </div>
                    {kpi.subtitle && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">{kpi.subtitle}</p>
                    )}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border">
                    <Icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ROW 2: Core Workspace + Supporting Analytics */}
        <div className="col-span-12 grid grid-cols-12 gap-6 min-h-0">
          
          {/* Main Workspace (8 Col) - Schedule Timeline */}
          <Card className="col-span-12 lg:col-span-8 flex flex-col border-border shadow-sm rounded-xl bg-card/95 backdrop-blur hover:shadow-lg transition-all duration-300 min-h-[400px]">
            <CardHeader className="py-4 border-b border-border">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <LayoutList className="w-4 h-4 text-emerald-600" />
                Today's Collection Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-6 overflow-y-auto min-h-0 bg-muted/30">
              <div className="space-y-4">
                {scheduleData.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 bg-card p-4 rounded-lg border border-border shadow-sm relative overflow-hidden">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                      item.status === 'Completed' ? 'bg-emerald-500' : 
                      item.status === 'In Progress' ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`} />
                    <div className="text-sm font-mono text-muted-foreground w-20">{item.time}</div>
                    <div className="flex-1 grid grid-cols-3 gap-4 items-center">
                      <div className="font-medium text-foreground">{item.farmer}</div>
                      <div className="text-sm text-muted-foreground">{item.type}</div>
                      <div className="text-sm font-semibold text-foreground">{item.qty}</div>
                    </div>
                    <div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                        item.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' : 
                        item.status === 'In Progress' ? 'bg-amber-500/10 text-amber-500' : 'bg-muted text-muted-foreground'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Supporting Analytics (4 Col) */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            {/* Widget 1: Herb Inventory (Bar) */}
            <Card className="flex-1 flex flex-col border-border shadow-sm rounded-xl bg-card/95 backdrop-blur hover:shadow-lg transition-all duration-300 min-h-[250px]">
              <CardHeader className="py-3 border-b border-border">
                <CardTitle className="text-xs font-semibold text-foreground">Herb Inventory (kg)</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-2 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={inventoryData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="opacity-10" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'currentColor' }} className="text-muted-foreground" />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'currentColor' }} width={70} className="text-muted-foreground" />
                    <Tooltip content={<MinimalTooltip />} />
                    <Bar dataKey="stock" fill="#10B981" radius={[0, 4, 4, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Widget 2: Collection Trend (Line) */}
            <Card className="flex-1 flex flex-col border-border shadow-sm rounded-xl bg-card/95 backdrop-blur hover:shadow-lg transition-all duration-300 min-h-[250px]">
              <CardHeader className="py-3 border-b border-border">
                <CardTitle className="text-xs font-semibold text-foreground">Collection Trend (7 Days)</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-2 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'currentColor' }} className="text-muted-foreground" />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'currentColor' }} className="text-muted-foreground" />
                    <Tooltip content={<MinimalTooltip />} />
                    <Line type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981', stroke: '#10B981', strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ROW 3: Audit Trail */}
        <Card className="col-span-12 border-border shadow-sm rounded-xl bg-card/95 backdrop-blur overflow-hidden hover:shadow-lg transition-all duration-300">
          <CardHeader className="py-3 border-b border-border">
            <CardTitle className="text-sm font-semibold text-foreground">Latest Arrivals</CardTitle>
          </CardHeader>
          <div className="p-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="py-2 text-xs font-medium text-muted-foreground h-8">Receipt ID</TableHead>
                  <TableHead className="py-2 text-xs font-medium text-muted-foreground h-8">Time</TableHead>
                  <TableHead className="py-2 text-xs font-medium text-muted-foreground h-8 w-[50%]">Event Details</TableHead>
                  <TableHead className="py-2 text-xs font-medium text-muted-foreground h-8">QA Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditData.map((row) => (
                  <TableRow key={row.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <TableCell className="py-2 font-mono text-xs text-muted-foreground">{row.id}</TableCell>
                    <TableCell className="py-2 text-xs text-muted-foreground">{row.time}</TableCell>
                    <TableCell className="py-2 text-xs font-medium text-foreground">{row.event}</TableCell>
                    <TableCell className="py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.status === 'Passed' ? 'bg-emerald-500/10 text-emerald-500' : 
                        row.status === 'Failed' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {row.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

      </div>
    </div>
  );
}
