import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import StatsCard from '../../components/StatsCard';
import BatchStatusBadge from '../../components/BatchStatusBadge';
import DataTable from '../../components/DataTable';
import MapSizeFixer from '../../components/MapSizeFixer';
import { useAppStore } from '../../store/appStore';
import {
  Users, Package, ShieldCheck, AlertTriangle, CreditCard,
  Leaf, FlaskConical, Factory, Truck, CheckCircle2, Clock, TrendingUp, Link as ChainIcon
} from 'lucide-react';
import { mockAuditLogs } from '../../lib/mockData';
import type { AuditLog } from '../../types';
import type { ColumnDef } from '@tanstack/react-table';

const CHART_FOREST = 'oklch(0.40 0.13 152)';
const CHART_BLUE = 'oklch(0.55 0.18 250)';
const CHART_SAFFRON = 'oklch(0.74 0.16 68)';
const CHART_CYAN = 'oklch(0.65 0.15 200)';

const monthlyData = [
  { name: 'Jan', batches: 42, revenue: 1240000, compliance: 95 },
  { name: 'Feb', batches: 58, revenue: 1580000, compliance: 96 },
  { name: 'Mar', batches: 65, revenue: 1850000, compliance: 94 },
  { name: 'Apr', batches: 72, revenue: 2100000, compliance: 98 },
  { name: 'May', batches: 88, revenue: 2540000, compliance: 99 },
  { name: 'Jun', batches: 94, revenue: 2890000, compliance: 98 },
  { name: 'Jul', batches: 47, revenue: 1420000, compliance: 97 },
];

const membersSparkline = [38, 40, 41, 44, 45, 47, 48];
const batchesSparkline = [62, 70, 65, 78, 88, 94, 94];
const revenueSparkline = [9.8, 11.2, 12.5, 15.8, 21.0, 24.5, 14.2];

const roleDistribution = [
  { name: 'Collection Centers', value: 48, color: CHART_FOREST },
  { name: 'Processing & Labs', value: 32, color: CHART_SAFFRON },
  { name: 'Manufacturers', value: 28, color: CHART_BLUE },
  { name: 'Supply Chain', value: 18, color: CHART_CYAN },
];
const roleTotal = roleDistribution.reduce((s, d) => s + d.value, 0);

const recentActivity = [
  { action: 'Batch BATCH-2026-0047 forwarded to processing', time: '5 min ago', type: 'info' },
  { action: 'Lab certificate issued for BATCH-2026-0042', time: '32 min ago', type: 'success' },
  { action: 'BATCH-2026-0038 rejected — heavy metals test failed', time: '2 hrs ago', type: 'error' },
  { action: 'New member Ananya Krishnan registered, pending approval', time: '3 hrs ago', type: 'warning' },
  { action: 'Payment ₹45,000 released to Rajasthan Herb Center', time: '5 hrs ago', type: 'success' },
  { action: 'Complaint CMP-003 filed by consumer', time: '7 hrs ago', type: 'warning' },
];

const typeColors: Record<string, string> = {
  info: 'bg-blue-500', success: 'bg-success', error: 'bg-destructive', warning: 'bg-warning',
};

const mapClusters = [
  { center: [10.8505, 76.2711] as [number, number], radius: 22, color: CHART_FOREST, title: 'Kerala Herb Cluster', desc: '48 active collections · Western Ghats' },
  { center: [30.3165, 78.0322] as [number, number], radius: 15, color: CHART_FOREST, title: 'Himalayan Wild Harvest', desc: '12 active collectors · Uttarakhand' },
  { center: [28.7041, 77.1025] as [number, number], radius: 18, color: CHART_SAFFRON, title: 'Delhi Processing Hub', desc: '8 NABL certified labs' },
  { center: [19.0760, 72.8777] as [number, number], radius: 20, color: CHART_BLUE, title: 'Mumbai Manufacturing Center', desc: '12 active production lines' },
  { center: [22.5726, 88.3639] as [number, number], radius: 14, color: CHART_CYAN, title: 'Kolkata Distribution Hub', desc: '4 logistics partners' },
  { center: [13.0827, 80.2707] as [number, number], radius: 16, color: CHART_BLUE, title: 'Chennai Manufacturing', desc: 'AyurNature Products' },
];

const auditColumns: ColumnDef<AuditLog>[] = [
  { accessorKey: 'txHash', header: 'Tx Hash', cell: ({ getValue }) => <code className="blockchain-hash">{(getValue() as string).slice(0, 12)}...</code> },
  { accessorKey: 'type', header: 'Type', cell: ({ getValue }) => <span className="text-sm font-medium">{getValue() as string}</span> },
  { accessorKey: 'entity', header: 'Entity', cell: ({ getValue }) => <span className="text-sm">{getValue() as string}</span> },
  { accessorKey: 'userName', header: 'User', cell: ({ getValue }) => <span className="text-sm text-muted-foreground">{getValue() as string}</span> },
  { accessorKey: 'action', header: 'Action', cell: ({ getValue }) => <span className="text-xs text-muted-foreground line-clamp-1 max-w-64 block">{getValue() as string}</span> },
  { accessorKey: 'blockNumber', header: 'Block', cell: ({ getValue }) => <span className="text-xs font-mono">{(getValue() as number)?.toLocaleString()}</span> },
  {
    accessorKey: 'timestamp',
    header: 'Timestamp',
    cell: ({ getValue }) => (
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {new Date(getValue() as string).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
      </span>
    ),
  },
  { accessorKey: 'status', header: 'Status', cell: ({ getValue }) => <BatchStatusBadge status={getValue() as string} /> },
];

function TabPanel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
      {children}
    </motion.div>
  );
}

export default function GovernmentDashboard() {
  const { setActiveNavItem } = useAppStore();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-heading">Government Admin Portal</h2>
          <p className="text-sm text-muted-foreground mt-0.5">AYUTRACE+ Master Control Center — Ministry of AYUSH</p>
        </div>
        <Badge className="bg-success/15 text-success border-success/30 hover:bg-success/15 px-3 py-1.5 text-xs font-semibold">
          <div className="w-2 h-2 bg-success rounded-full mr-2 animate-pulse" />
          Blockchain: Online
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatsCard title="Total Members" value="1,284" icon={Users} iconColor="text-violet-600" iconBg="bg-violet-50 dark:bg-violet-950/40" trend="up" trendValue="+12" subtext="this week" sparkline={membersSparkline} delayIndex={0} />
        <StatsCard title="Collection Centers" value="48" icon={Leaf} iconColor="text-emerald-600" iconBg="bg-emerald-50 dark:bg-emerald-950/40" trend="up" trendValue="+3" subtext="this month" delayIndex={1} />
        <StatsCard title="Processing Units" value="32" icon={FlaskConical} iconColor="text-amber-600" iconBg="bg-amber-50 dark:bg-amber-950/40" delayIndex={2} />
        <StatsCard title="Manufacturers" value="28" icon={Factory} iconColor="text-blue-600" iconBg="bg-blue-50 dark:bg-blue-950/40" delayIndex={3} />
        <StatsCard title="Supply Chain" value="18" icon={Truck} iconColor="text-cyan-600" iconBg="bg-cyan-50 dark:bg-cyan-950/40" delayIndex={4} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatsCard title="Active Batches" value="94" icon={Package} iconColor="text-indigo-600" iconBg="bg-indigo-50 dark:bg-indigo-950/40" subtext="in pipeline" sparkline={batchesSparkline} delayIndex={5} />
        <StatsCard title="Pending Approvals" value="8" icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-50 dark:bg-amber-950/40"
          className="cursor-pointer" onClick={() => setActiveNavItem('approvals')} delayIndex={6} />
        <StatsCard title="Pending Complaints" value="3" icon={AlertTriangle} iconColor="text-red-600" iconBg="bg-red-50 dark:bg-red-950/40" delayIndex={7} />
        <StatsCard title="Completed Products" value="847" icon={CheckCircle2} iconColor="text-emerald-600" iconBg="bg-emerald-50 dark:bg-emerald-950/40" trend="up" trendValue="+94" subtext="this month" delayIndex={8} />
        <StatsCard title="Revenue (Jul)" value="₹14.2L" icon={CreditCard} iconColor="text-green-600" iconBg="bg-green-50 dark:bg-green-950/40" trend="up" trendValue="+18%" subtext="vs last month" sparkline={revenueSparkline} delayIndex={9} />
      </div>

      {/* Charts + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trends */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Monthly Statistics
            </CardTitle>
            <CardDescription>Batch throughput and revenue trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" strokeOpacity={0.1} />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/100000).toFixed(1)}L`} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                <Bar yAxisId="left" dataKey="batches" fill={CHART_FOREST} radius={[4,4,0,0]} name="Batches" />
                <Bar yAxisId="right" dataKey="revenue" fill={CHART_BLUE} radius={[4,4,0,0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Member Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative" style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={roleDistribution} cx="50%" cy="50%" innerRadius={54} outerRadius={75} paddingAngle={3} dataKey="value" isAnimationActive={false}>
                    {roleDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '10px', border: 'none' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold font-heading">{roleTotal}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Members</span>
              </div>
            </div>
            <div className="space-y-1.5 mt-2">
              {roleDistribution.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-muted-foreground">{d.name}</span>
                  </div>
                  <span className="font-semibold">{d.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="h-9">
          <TabsTrigger value="activity" className="text-xs">Recent Activity</TabsTrigger>
          <TabsTrigger value="audit" className="text-xs">Blockchain Audit</TabsTrigger>
          <TabsTrigger value="map" className="text-xs">Live Supply Map</TabsTrigger>
          <TabsTrigger value="compliance" className="text-xs">Compliance Trend</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="mt-4">
          <TabPanel>
            <Card>
              <CardHeader><CardTitle className="text-base">Activity Feed</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {recentActivity.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.05, ease: 'easeOut' }}
                    className="flex items-start gap-3"
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${typeColors[item.type]}`} />
                    <div className="flex-1">
                      <p className="text-sm">{item.action}</p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </TabPanel>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <TabPanel>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ChainIcon className="w-4 h-4 text-primary" /> Blockchain Ledger
                </CardTitle>
                <CardDescription>Immutable record of all ecosystem transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable columns={auditColumns} data={mockAuditLogs} searchPlaceholder="Search audit logs..." exportFilename="blockchain-audit-log" pageSize={5} />
              </CardContent>
            </Card>
          </TabPanel>
        </TabsContent>

        <TabsContent value="map" className="mt-4">
          <TabPanel>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Geospatial Traceability Map</CardTitle>
                <CardDescription>Live tracking of collection clusters and supply routes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full rounded-xl overflow-hidden border border-border">
                  <MapContainer center={[21.1458, 79.0882]} zoom={5} style={{ height: '100%', width: '100%' }}>
                    <MapSizeFixer />
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
                    {mapClusters.map((c) => (
                      <CircleMarker key={c.title} center={c.center} radius={c.radius} fillColor={c.color} color={c.color} fillOpacity={0.5} weight={2}>
                        <Popup><strong>{c.title}</strong><br />{c.desc}</Popup>
                      </CircleMarker>
                    ))}
                  </MapContainer>
                </div>
                <div className="flex flex-wrap gap-3 mt-3">
                  {[
                    { color: CHART_FOREST, label: 'Collection Centers' },
                    { color: CHART_SAFFRON, label: 'Processing & Labs' },
                    { color: CHART_BLUE, label: 'Manufacturers' },
                    { color: CHART_CYAN, label: 'Supply Chain Hubs' },
                  ].map((l) => (
                    <div key={l.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }} />
                      {l.label}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabPanel>
        </TabsContent>

        <TabsContent value="compliance" className="mt-4">
          <TabPanel>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-success" /> Compliance Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" strokeOpacity={0.1} />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis domain={[90, 100]} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                    <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} formatter={(v: unknown) => [`${v}%`, 'Compliance']} />
                    <Line type="monotone" dataKey="compliance" stroke={CHART_FOREST} strokeWidth={2.5} dot={{ r: 4, fill: CHART_FOREST }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabPanel>
        </TabsContent>
      </Tabs>
    </div>
  );
}
