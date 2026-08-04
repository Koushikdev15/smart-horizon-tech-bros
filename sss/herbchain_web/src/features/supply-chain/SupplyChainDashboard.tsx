import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, PackageCheck, AlertOctagon, Warehouse, ArrowUpRight, ArrowDownRight, Map } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const MinimalTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border shadow-sm rounded-lg p-2 text-xs">
        <p className="font-semibold text-foreground mb-1">{label || payload[0].payload.name}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-muted-foreground">
            <span className="font-medium" style={{ color: entry.color || '#0891B2' }}>{entry.name}:</span> {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// 1. KPI Data
const kpiData = [
  { title: "Active Shipments", value: "112", trend: "+5.0%", isPositive: true, icon: Truck },
  { title: "Delivered Today", value: "48", trend: "+12.4%", isPositive: true, icon: PackageCheck },
  { title: "Delayed Shipments", value: "3", trend: "-1.0%", isPositive: true, icon: AlertOctagon }, // Green because less delays
  { title: "Warehouse Capacity", value: "72%", trend: "+2.1%", isPositive: false, icon: Warehouse },
];

// 2. Geospatial Map Data (Simulated Mapbox view via Recharts Scatter)
const mapData = [
  { x: 15, y: 70, z: 200, name: 'KL-Hub' },
  { x: 35, y: 40, z: 250, name: 'TN-Transit' },
  { x: 60, y: 65, z: 300, name: 'KA-Distributor' },
  { x: 80, y: 20, z: 350, name: 'MH-Retail' },
];

// 3. Shipment Status (Donut Chart)
const donutData = [
  { name: 'In Transit', value: 65, color: '#0EA5E9' }, // Cyan/Blue
  { name: 'Loading', value: 25, color: '#F59E0B' }, // Amber
  { name: 'Delivered', value: 48, color: '#10B981' }, // Emerald
];

// 4. Delivery Performance (Bar Chart)
const barData = [
  { day: 'Mon', onTime: 40, delayed: 2 },
  { day: 'Tue', onTime: 45, delayed: 3 },
  { day: 'Wed', onTime: 38, delayed: 1 },
  { day: 'Thu', onTime: 50, delayed: 4 },
  { day: 'Fri', onTime: 42, delayed: 2 },
  { day: 'Sat', onTime: 55, delayed: 0 },
  { day: 'Sun', onTime: 48, delayed: 3 },
];

// 5. Audit Trail Data
const auditData = [
  { id: 'SHP-9021', time: '10:45 AM', update: 'Truck DL-492 arrived at Retailer Hub', location: 'Mumbai, MH', status: 'Delivered' },
  { id: 'SHP-9020', time: '09:30 AM', update: 'Temperature spike detected (+8°C)', location: 'Highway 44, TN', status: 'Warning' },
  { id: 'SHP-9019', time: '08:15 AM', update: 'Consignment loaded successfully', location: 'Kochi Port, KL', status: 'Loading' },
  { id: 'SHP-9018', time: '07:00 AM', update: 'Vehicle dispatched', location: 'Mysuru Hub, KA', status: 'In Transit' },
  { id: 'SHP-9017', time: '06:45 AM', update: 'Customs clearance pending', location: 'Chennai Port, TN', status: 'Delayed' },
];

export default function SupplyChainDashboard() {
  return (
    <div className="text-foreground animate-in fade-in duration-500">
      <div className="grid grid-cols-12 gap-6">
        
        {/* ROW 1: KPIs */}
        <div className="col-span-12 grid grid-cols-4 gap-6">
          {kpiData.map((kpi, index) => {
            const Icon = kpi.icon;
            // Delay is colored red only if it's the delayed stat and the trend is bad, but here we just follow isPositive
            const isDelayedStat = kpi.title === 'Delayed Shipments';
            return (
              <Card key={index} className="border-border shadow-sm rounded-xl bg-card/95 backdrop-blur hover:scale-[1.02] hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{kpi.title}</p>
                    <div className="flex items-baseline gap-2">
                      <h3 className={`text-2xl font-bold ${isDelayedStat ? 'text-rose-500' : 'text-foreground'}`}>{kpi.value}</h3>
                      <span className={`flex items-center text-[11px] font-bold px-1.5 py-0.5 rounded ${kpi.isPositive ? 'text-cyan-500 bg-cyan-500/10' : 'text-rose-500 bg-rose-500/10'}`}>
                        {kpi.isPositive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                        {kpi.trend}
                      </span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border">
                    <Icon className={`w-5 h-5 ${isDelayedStat ? 'text-rose-500' : 'text-muted-foreground'}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ROW 2: Core Workspace + Supporting Analytics */}
        <div className="col-span-12 grid grid-cols-12 gap-6 min-h-0">
          
          {/* Main Workspace (8 Col) - Geospatial Map Simulation */}
          <Card className="col-span-12 lg:col-span-8 flex flex-col border-border shadow-sm rounded-xl bg-card/95 backdrop-blur hover:shadow-lg transition-all duration-300 min-h-[400px]">
            <CardHeader className="py-4 border-b border-border">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Map className="w-4 h-4 text-cyan-600" />
                Live Shipment Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 min-h-0 relative bg-muted/30 overflow-hidden rounded-b-xl">
              {/* Simulated Map Background */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-400 via-slate-200 to-slate-100 dark:from-slate-600 dark:via-slate-800 dark:to-slate-900"></div>
              <ResponsiveContainer width="100%" height="100%" className="relative z-10">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" vertical={false} horizontal={false} />
                  <XAxis type="number" dataKey="x" hide domain={[0, 100]} />
                  <YAxis type="number" dataKey="y" hide domain={[0, 100]} />
                  <ZAxis type="number" dataKey="z" range={[300, 800]} />
                  <Tooltip content={<MinimalTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'currentColor' }} />
                  <Scatter name="Transit Nodes" data={mapData} fill="#0EA5E9">
                    {mapData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#0EA5E9', '#10B981', '#F59E0B', '#3B82F6'][index % 4]} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              {/* Overlay lines to simulate routes */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" style={{ zIndex: 5 }}>
                <line x1="20%" y1="70%" x2="40%" y2="40%" stroke="#0EA5E9" strokeWidth="2" strokeDasharray="4 4" />
                <line x1="40%" y1="40%" x2="65%" y2="65%" stroke="#0EA5E9" strokeWidth="2" strokeDasharray="4 4" />
                <line x1="65%" y1="65%" x2="85%" y2="20%" stroke="#0EA5E9" strokeWidth="2" strokeDasharray="4 4" />
              </svg>
            </CardContent>
          </Card>

          {/* Supporting Analytics (4 Col) */}
          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            {/* Widget 1: Delivery Performance (Stacked Bar) */}
            <Card className="flex-1 flex flex-col border-border shadow-sm rounded-xl bg-card/95 backdrop-blur hover:shadow-lg transition-all duration-300 min-h-[250px]">
              <CardHeader className="py-3 border-b border-border">
                <CardTitle className="text-xs font-semibold text-foreground">Delivery Performance</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-2 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'currentColor' }} className="text-muted-foreground" />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'currentColor' }} className="text-muted-foreground" />
                    <Tooltip content={<MinimalTooltip />} />
                    <Bar dataKey="onTime" name="On Time" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} maxBarSize={30} />
                    <Bar dataKey="delayed" name="Delayed" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Widget 2: Shipment Status (Donut) */}
            <Card className="flex-1 flex flex-col border-border shadow-sm rounded-xl bg-card/95 backdrop-blur hover:shadow-lg transition-all duration-300 min-h-[250px]">
              <CardHeader className="py-3 border-b border-border">
                <CardTitle className="text-xs font-semibold text-foreground">Current Shipment Status</CardTitle>
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
            <CardTitle className="text-sm font-semibold text-foreground">Latest Logistics Updates</CardTitle>
          </CardHeader>
          <div className="p-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="py-2 text-xs font-medium text-muted-foreground h-8">Shipment ID</TableHead>
                  <TableHead className="py-2 text-xs font-medium text-muted-foreground h-8">Timestamp</TableHead>
                  <TableHead className="py-2 text-xs font-medium text-muted-foreground h-8 w-[40%]">Update Event</TableHead>
                  <TableHead className="py-2 text-xs font-medium text-muted-foreground h-8">Location</TableHead>
                  <TableHead className="py-2 text-xs font-medium text-muted-foreground h-8">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditData.map((row) => (
                  <TableRow key={row.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <TableCell className="py-2 font-mono text-xs text-muted-foreground">{row.id}</TableCell>
                    <TableCell className="py-2 text-xs text-muted-foreground">{row.time}</TableCell>
                    <TableCell className="py-2 text-xs font-medium text-foreground">{row.update}</TableCell>
                    <TableCell className="py-2 text-xs text-muted-foreground">{row.location}</TableCell>
                    <TableCell className="py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-500' : 
                        row.status === 'Delayed' ? 'bg-rose-500/10 text-rose-500' :
                        row.status === 'Warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-cyan-500/10 text-cyan-500'
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
