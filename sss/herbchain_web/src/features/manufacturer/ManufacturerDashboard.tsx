import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Factory, PackageOpen, PackageCheck, Settings2, ArrowUpRight, ArrowDownRight, ServerCog } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const MinimalTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border shadow-sm rounded-lg p-2 text-xs">
        <p className="font-semibold text-foreground mb-1">{label || payload[0].payload.name}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-muted-foreground">
            <span className="font-medium" style={{ color: entry.color || '#2563EB' }}>{entry.name}:</span> {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// 1. KPI Data
const kpiData = [
  { title: "Production Orders", value: "34", trend: "+12.0%", isPositive: true, icon: Factory },
  { title: "Manufactured Today", value: "12,500", trend: "+8.4%", isPositive: true, icon: PackageOpen },
  { title: "Packaging Pending", value: "2,150", trend: "-5.2%", isPositive: true, icon: PackageCheck },
  { title: "Production Efficiency", value: "96.8%", trend: "+1.1%", isPositive: true, icon: Settings2 },
];

// 2. Machine Status Board Data
const machineData = [
  { id: 'M-01', name: 'Tablet Press Line A', product: 'Ashwagandha Vati', progress: 85, status: 'Running' },
  { id: 'M-02', name: 'Capsule Filler Line B', product: 'Tulsi Extract', progress: 45, status: 'Running' },
  { id: 'M-03', name: 'Syrup Bottling Line', product: 'Brahmi Syrup', progress: 100, status: 'Completed' },
  { id: 'M-04', name: 'Powder Mixer', product: 'Triphala Churna', progress: 15, status: 'Starting' },
  { id: 'M-05', name: 'Blister Packaging', product: 'Ashwagandha Vati', progress: 0, status: 'Maintenance' },
];

// 3. Finished Products (Donut Chart)
const donutData = [
  { name: 'Tablets', value: 45000, color: '#3B82F6' },
  { name: 'Capsules', value: 30000, color: '#10B981' },
  { name: 'Syrups', value: 15000, color: '#F59E0B' },
  { name: 'Powders', value: 10000, color: '#8B5CF6' },
];

// 4. Production Trend (Bar Chart)
const trendData = [
  { day: 'Mon', units: 10000 },
  { day: 'Tue', units: 12500 },
  { day: 'Wed', units: 11000 },
  { day: 'Thu', units: 14000 },
  { day: 'Fri', units: 13500 },
  { day: 'Sat', units: 15000 },
  { day: 'Sun', units: 12500 },
];

// 5. Audit Trail Data
const auditData = [
  { id: 'MFG-2099', time: '10:45 AM', milestone: 'QR Batch #1029 Generated & Minted', line: 'Packaging', status: 'Success' },
  { id: 'MFG-2098', time: '09:30 AM', milestone: 'Batch BT-100 Formulated', line: 'Mixing', status: 'Success' },
  { id: 'MFG-2097', time: '08:15 AM', milestone: 'Quality Check Failed: Tablet Hardness', line: 'Tablet Press A', status: 'Failed' },
  { id: 'MFG-2096', time: '07:00 AM', milestone: 'Syrup Bottling Completed (5000 units)', line: 'Bottling', status: 'Success' },
  { id: 'MFG-2095', time: '06:45 AM', milestone: 'Machine M-05 Scheduled Maintenance', line: 'Packaging', status: 'Warning' },
];

export default function ManufacturerDashboard() {
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
          
          {/* Main Workspace (8 Col) - Active Machine Status Board */}
          <Card className="col-span-12 lg:col-span-8 flex flex-col border-border shadow-sm rounded-xl bg-card/95 backdrop-blur hover:shadow-lg transition-all duration-300 min-h-[400px]">
            <CardHeader className="py-4 border-b border-border">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ServerCog className="w-4 h-4 text-blue-600" />
                Live Manufacturing Workflow
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-6 overflow-y-auto min-h-0 bg-muted/30">
              <div className="space-y-4">
                {machineData.map((machine) => (
                  <div key={machine.id} className="bg-card border border-border p-4 rounded-xl shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-muted-foreground bg-muted px-2 py-1 rounded">{machine.id}</span>
                        <span className="font-semibold text-foreground">{machine.name}</span>
                        <span className="text-xs font-medium text-muted-foreground">• {machine.product}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                        machine.status === 'Running' ? 'bg-emerald-500/10 text-emerald-500' :
                        machine.status === 'Completed' ? 'bg-blue-500/10 text-blue-500' :
                        machine.status === 'Maintenance' ? 'bg-rose-500/10 text-rose-500' : 'bg-muted text-muted-foreground'
                      }`}>
                        {machine.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${
                            machine.progress === 100 ? 'bg-blue-500' : 
                            machine.status === 'Maintenance' ? 'bg-rose-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${machine.progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-muted-foreground w-8">{machine.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Supporting Analytics (4 Col) */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            {/* Widget 1: Production Trend (Bar) */}
            <Card className="flex-1 flex flex-col border-border shadow-sm rounded-xl bg-card/95 backdrop-blur hover:shadow-lg transition-all duration-300 min-h-[250px]">
              <CardHeader className="py-3 border-b border-border">
                <CardTitle className="text-xs font-semibold text-foreground">Production Trend (Units)</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-2 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'currentColor' }} className="text-muted-foreground" />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'currentColor' }} className="text-muted-foreground" />
                    <Tooltip content={<MinimalTooltip />} />
                    <Bar dataKey="units" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Widget 2: Finished Products (Donut) */}
            <Card className="flex-1 flex flex-col border-border shadow-sm rounded-xl bg-card/95 backdrop-blur hover:shadow-lg transition-all duration-300 min-h-[250px]">
              <CardHeader className="py-3 border-b border-border">
                <CardTitle className="text-xs font-semibold text-foreground">Finished Products by Type</CardTitle>
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
            <CardTitle className="text-sm font-semibold text-foreground">Latest Manufacturing Milestones</CardTitle>
          </CardHeader>
          <div className="p-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="py-2 text-xs font-medium text-muted-foreground h-8">Log ID</TableHead>
                  <TableHead className="py-2 text-xs font-medium text-muted-foreground h-8">Timestamp</TableHead>
                  <TableHead className="py-2 text-xs font-medium text-muted-foreground h-8 w-[40%]">Milestone</TableHead>
                  <TableHead className="py-2 text-xs font-medium text-muted-foreground h-8">Line / Machine</TableHead>
                  <TableHead className="py-2 text-xs font-medium text-muted-foreground h-8">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditData.map((row) => (
                  <TableRow key={row.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <TableCell className="py-2 font-mono text-xs text-muted-foreground">{row.id}</TableCell>
                    <TableCell className="py-2 text-xs text-muted-foreground">{row.time}</TableCell>
                    <TableCell className="py-2 text-xs font-medium text-foreground">{row.milestone}</TableCell>
                    <TableCell className="py-2 text-xs text-muted-foreground">{row.line}</TableCell>
                    <TableCell className="py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.status === 'Success' ? 'bg-emerald-500/10 text-emerald-500' : 
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
