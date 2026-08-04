import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FlaskConical, TestTube, Cpu, Activity, ArrowUpRight, ArrowDownRight, GitPullRequest } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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

// 1. KPI Data
const kpiData = [
  { title: "Active Batches", value: "42", trend: "+5.1%", isPositive: true, icon: FlaskConical },
  { title: "Pending Lab Tests", value: "12", trend: "-1.5%", isPositive: true, icon: TestTube },
  { title: "Machines Running", value: "8/10", trend: "80%", isPositive: true, icon: Cpu },
  { title: "Processing Efficiency", value: "94.5%", trend: "+2.3%", isPositive: true, icon: Activity },
];

// 2. Flow Diagram Data (Simulated Pipeline)
const pipelineStages = [
  { id: '1', name: 'Raw Material Intake', status: 'done', count: 120 },
  { id: '2', name: 'Cleaning & Sorting', status: 'active', count: 45 },
  { id: '3', name: 'Drying (Temp/Humidity)', status: 'active', count: 22 },
  { id: '4', name: 'Extraction / Pulverizing', status: 'pending', count: 0 },
  { id: '5', name: 'QA Lab Testing', status: 'pending', count: 0 },
];

// 3. Laboratory Results (Donut Chart)
const donutData = [
  { name: 'Passed', value: 380, color: '#10B981' }, // Emerald
  { name: 'Needs Rework', value: 25, color: '#F59E0B' }, // Amber
  { name: 'Rejected', value: 15, color: '#EF4444' }, // Red
];

// 4. Processing Trend (Line Chart)
const trendData = [
  { day: 'Mon', volume: 1200 },
  { day: 'Tue', volume: 1350 },
  { day: 'Wed', volume: 1100 },
  { day: 'Thu', volume: 1600 },
  { day: 'Fri', volume: 1450 },
  { day: 'Sat', volume: 1700 },
  { day: 'Sun', volume: 1550 },
];

// 5. Audit Trail Data
const auditData = [
  { id: 'LAB-5542', time: '10:45 AM', notes: 'Heavy Metals check', inspector: 'Dr. Smith', status: 'Passed' },
  { id: 'LAB-5541', time: '09:30 AM', notes: 'Microbial Load check', inspector: 'Dr. Jones', status: 'Passed' },
  { id: 'LAB-5540', time: '08:15 AM', notes: 'Active Principle check', inspector: 'Dr. Smith', status: 'Passed' },
  { id: 'LAB-5539', time: '07:00 AM', notes: 'Pesticide Residue check', inspector: 'Dr. Lee', status: 'Passed' },
  { id: 'LAB-5538', time: '06:45 AM', notes: 'Heavy Metals check', inspector: 'Dr. Jones', status: 'Rejected' },
];

export default function ProcessingDashboard() {
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
          
          {/* Main Workspace (8 Col) - Pipeline Flow */}
          <Card className="col-span-12 lg:col-span-8 flex flex-col border-border shadow-sm rounded-xl bg-card/95 backdrop-blur hover:shadow-lg transition-all duration-300 min-h-[400px]">
            <CardHeader className="py-4 border-b border-border">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <GitPullRequest className="w-4 h-4 text-amber-600" />
                Live Batch Processing Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-8 min-h-0 bg-muted/30 flex flex-col justify-center">
              <div className="relative flex justify-between items-center w-full max-w-4xl mx-auto">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-border -translate-y-1/2 z-0"></div>
                
                {pipelineStages.map((stage, idx) => (
                  <div key={stage.id} className="relative z-10 flex flex-col items-center gap-3 w-32">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 ${
                      stage.status === 'done' ? 'bg-amber-500 border-amber-100 text-white' :
                      stage.status === 'active' ? 'bg-card border-amber-500 text-amber-600 shadow-md animate-pulse' :
                      'bg-muted border-border text-muted-foreground'
                    }`}>
                      <span className="font-bold text-sm">{idx + 1}</span>
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] font-bold text-foreground leading-tight">{stage.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{stage.count} batches</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Supporting Analytics (4 Col) */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            {/* Widget 1: Lab Results (Donut) */}
            <Card className="flex-1 flex flex-col border-border shadow-sm rounded-xl bg-card/95 backdrop-blur hover:shadow-lg transition-all duration-300 min-h-[250px]">
              <CardHeader className="py-3 border-b border-border">
                <CardTitle className="text-xs font-semibold text-foreground">Laboratory Results (30d)</CardTitle>
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

            {/* Widget 2: Processing Trend (Line) */}
            <Card className="flex-1 flex flex-col border-border shadow-sm rounded-xl bg-card/95 backdrop-blur hover:shadow-lg transition-all duration-300 min-h-[250px]">
              <CardHeader className="py-3 border-b border-border">
                <CardTitle className="text-xs font-semibold text-foreground">Processing Volume (kg)</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-2 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'currentColor' }} className="text-muted-foreground" />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'currentColor' }} className="text-muted-foreground" />
                    <Tooltip content={<MinimalTooltip />} />
                    <Line type="monotone" dataKey="volume" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, fill: '#F59E0B', stroke: '#F59E0B', strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ROW 3: Audit Trail */}
        <Card className="col-span-12 border-border shadow-sm rounded-xl bg-card/95 backdrop-blur overflow-hidden hover:shadow-lg transition-all duration-300">
          <CardHeader className="py-3 border-b border-border">
            <CardTitle className="text-sm font-semibold text-foreground">Latest QA Sign-offs</CardTitle>
          </CardHeader>
          <div className="p-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="py-2 text-xs font-medium text-muted-foreground h-8">Batch ID</TableHead>
                  <TableHead className="py-2 text-xs font-medium text-muted-foreground h-8">Time</TableHead>
                  <TableHead className="py-2 text-xs font-medium text-muted-foreground h-8 w-[40%]">Inspector Notes</TableHead>
                  <TableHead className="py-2 text-xs font-medium text-muted-foreground h-8">Inspector</TableHead>
                  <TableHead className="py-2 text-xs font-medium text-muted-foreground h-8">Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditData.map((row) => (
                  <TableRow key={row.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <TableCell className="py-2 font-mono text-xs text-muted-foreground">{row.id}</TableCell>
                    <TableCell className="py-2 text-xs text-muted-foreground">{row.time}</TableCell>
                    <TableCell className="py-2 text-xs font-medium text-foreground">{row.notes}</TableCell>
                    <TableCell className="py-2 text-xs text-muted-foreground">{row.inspector}</TableCell>
                    <TableCell className="py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.status === 'Passed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
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
