import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, PackageCheck, ClipboardCheck, Activity, ArrowUpRight, ArrowDownRight, GitCommit } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Minimal Custom Tooltip for Recharts
const MinimalTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border shadow-sm rounded-lg p-2 text-xs">
        <p className="font-semibold text-foreground mb-1">{label || payload[0].payload.name}</p>
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

// 1. KPI Data
const kpiData = [
  { title: "Total Members", value: "2,845", trend: "+12.5%", isPositive: true, icon: Users },
  { title: "Active Batches", value: "15,230", trend: "+8.2%", isPositive: true, icon: PackageCheck },
  { title: "Pending Approvals", value: "142", trend: "-2.4%", isPositive: false, icon: ClipboardCheck },
  { title: "System Health", value: "99.99%", trend: "0.0%", isPositive: true, icon: Activity },
];

// 2. Bar Chart Data (Monthly Operations)
const barData = [
  { month: 'Jan', ops: 4000 },
  { month: 'Feb', ops: 3000 },
  { month: 'Mar', ops: 5000 },
  { month: 'Apr', ops: 4500 },
  { month: 'May', ops: 6000 },
  { month: 'Jun', ops: 5500 },
];

// 3. Donut Chart Data (Member Distribution)
const donutData = [
  { name: 'Farmers', value: 450, color: '#3B82F6' },
  { name: 'Collections', value: 300, color: '#10B981' },
  { name: 'Labs', value: 150, color: '#F59E0B' },
  { name: 'Manufacturers', value: 200, color: '#8B5CF6' },
];

// 4. Audit Trail Data
const auditData = [
  { id: 'EVT-001', time: '10:45 AM', action: 'New Manufacturer Approved', entity: 'Gov Admin', status: 'Success' },
  { id: 'EVT-002', time: '10:30 AM', action: 'Smart Contract Deployed', entity: 'System', status: 'Success' },
  { id: 'EVT-003', time: '09:15 AM', action: 'Lab Audit Failed', entity: 'Ayush Lab Hub', status: 'Failed' },
  { id: 'EVT-004', time: '08:50 AM', action: 'Batch BT-102 Minted', entity: 'Kerala Farmers Node', status: 'Success' },
  { id: 'EVT-005', time: '08:00 AM', action: 'Daily Backup Completed', entity: 'System', status: 'Success' },
];

// 5. Node Map Data (Simulating a Supply Chain topology using ScatterChart)
const nodeData = [
  { x: 10, y: 50, z: 200, name: 'Farms' },
  { x: 30, y: 70, z: 250, name: 'Collection' },
  { x: 50, y: 40, z: 300, name: 'Processing' },
  { x: 70, y: 60, z: 350, name: 'Manufacturer' },
  { x: 90, y: 50, z: 200, name: 'Retail' },
];

export default function EnterpriseDashboard() {
  return (
    <div className="text-foreground animate-in fade-in duration-500">
      <div className="grid grid-cols-12 gap-6">
        
        {/* ROW 1: KPIs */}
        <div className="col-span-12 grid grid-cols-4 gap-6">
          {kpiData.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <Card key={index} className="border-border shadow-sm rounded-xl bg-card/95 backdrop-blur hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{kpi.title}</p>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-2xl font-bold text-foreground">{kpi.value}</h3>
                      <span className={`flex items-center text-[11px] font-bold px-1.5 py-0.5 rounded ${kpi.isPositive ? 'text-emerald-600 bg-emerald-500/10' : 'text-rose-600 bg-rose-500/10'}`}>
                        {kpi.isPositive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                        {kpi.trend}
                      </span>
                    </div>
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
          
          {/* Main Workspace (8 Col) - Topological Node Map */}
          <Card className="col-span-12 lg:col-span-8 flex flex-col border-border shadow-sm rounded-xl bg-card/95 backdrop-blur hover:shadow-lg transition-all duration-300 min-h-[400px]">
            <CardHeader className="py-4 border-b border-border">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-indigo-500" />
                Live Supply Chain Topology
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-4 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" vertical={false} />
                  <XAxis type="number" dataKey="x" hide domain={[0, 100]} />
                  <YAxis type="number" dataKey="y" hide domain={[0, 100]} />
                  <ZAxis type="number" dataKey="z" range={[400, 1000]} />
                  <Tooltip content={<MinimalTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Nodes" data={nodeData} fill="#6366F1">
                    {nodeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#14B8A6'][index % 5]} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Supporting Analytics (4 Col) */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            {/* Widget 1: Monthly Operations */}
            <Card className="flex-1 flex flex-col border-border shadow-sm rounded-xl bg-card/95 backdrop-blur hover:shadow-lg transition-all duration-300 min-h-[250px]">
              <CardHeader className="py-3 border-b border-border">
                <CardTitle className="text-xs font-semibold text-foreground">Monthly Operations</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-2 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'currentColor' }} className="text-muted-foreground" />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'currentColor' }} className="text-muted-foreground" />
                    <Tooltip content={<MinimalTooltip />} />
                    <Bar dataKey="ops" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Widget 2: Member Distribution */}
            <Card className="flex-1 flex flex-col border-border shadow-sm rounded-xl bg-card/95 backdrop-blur hover:shadow-lg transition-all duration-300 min-h-[250px]">
              <CardHeader className="py-3 border-b border-border">
                <CardTitle className="text-xs font-semibold text-foreground">Member Distribution</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-2 min-h-0 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius="60%" outerRadius="80%" paddingAngle={2} dataKey="value">
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<MinimalTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ROW 3: Audit Trail */}
        <Card className="col-span-12 border-border shadow-sm rounded-xl bg-card/95 backdrop-blur overflow-hidden hover:shadow-lg transition-all duration-300">
          <CardHeader className="py-3 border-b border-border">
            <CardTitle className="text-sm font-semibold text-foreground">Recent Audit Activities</CardTitle>
          </CardHeader>
          <div className="p-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="py-2 text-xs font-medium text-muted-foreground h-8">Event ID</TableHead>
                  <TableHead className="py-2 text-xs font-medium text-muted-foreground h-8">Timestamp</TableHead>
                  <TableHead className="py-2 text-xs font-medium text-muted-foreground h-8">Action</TableHead>
                  <TableHead className="py-2 text-xs font-medium text-muted-foreground h-8">Entity</TableHead>
                  <TableHead className="py-2 text-xs font-medium text-muted-foreground h-8">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditData.map((row) => (
                  <TableRow key={row.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <TableCell className="py-2 font-mono text-xs text-muted-foreground">{row.id}</TableCell>
                    <TableCell className="py-2 text-xs text-muted-foreground">{row.time}</TableCell>
                    <TableCell className="py-2 text-xs font-medium text-foreground">{row.action}</TableCell>
                    <TableCell className="py-2 text-xs text-muted-foreground">{row.entity}</TableCell>
                    <TableCell className="py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.status === 'Success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
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
