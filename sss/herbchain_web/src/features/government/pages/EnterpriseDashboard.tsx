import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Activity, Leaf as LeafIcon, AlertTriangle, CheckCircle2, MoreHorizontal } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const statCards = [
  { title: 'Total Shipments In-Transit', value: '1,240', subtext: '+12% from last week', tone: 'emerald', icon: Package },
  { title: 'Active Nodes', value: '45', subtext: 'All systems operational', tone: 'gray', icon: Activity },
  { title: 'Total Verified Herbs (kg)', value: '8,450', subtext: '+400kg today', tone: 'emerald', icon: LeafIcon },
  { title: 'Flagged / Delayed', value: '3', subtext: 'Requires attention', tone: 'red', icon: AlertTriangle },
];

const ledgerEntries = [
  { id: 1, label: 'Batch #Ashwagandha-092 verified', hash: '0x7aB...9f2', time: '2 mins ago' },
  { id: 2, label: 'Batch #Turmeric-071 minted', hash: '0x3cE...a41', time: '9 mins ago' },
  { id: 3, label: 'Batch #Brahmi-058 verified', hash: '0x9F1...d67', time: '18 mins ago' },
  { id: 4, label: 'Batch #Neem-114 shipped', hash: '0x2bA...5c9', time: '32 mins ago' },
  { id: 5, label: 'Batch #Tulsi-203 verified', hash: '0x8D4...12e', time: '47 mins ago' },
];

const inventory = [
  { herb: 'Ashwagandha', origin: 'Kerala', status: 'In Transit', grade: 'A+' },
  { herb: 'Turmeric', origin: 'Tamil Nadu', status: 'Processing', grade: 'A' },
  { herb: 'Brahmi', origin: 'Uttarakhand', status: 'Stored', grade: 'A+' },
  { herb: 'Neem', origin: 'Rajasthan', status: 'In Transit', grade: 'B+' },
  { herb: 'Tulsi', origin: 'Karnataka', status: 'Stored', grade: 'A' },
];

const mapNodes = [
  { id: 'kerala', label: 'Kerala Farms', x: 16, y: 80 },
  { id: 'kochi', label: 'Kochi Collection', x: 30, y: 60 },
  { id: 'chennai', label: 'Chennai Processing', x: 55, y: 46 },
  { id: 'bangalore', label: 'Bengaluru Hub', x: 42, y: 28 },
  { id: 'mumbai', label: 'Mumbai Distribution', x: 68, y: 14 },
];

const mapRoutes = [
  'M16,80 C24,70 26,64 30,60',
  'M30,60 C40,52 48,48 55,46',
  'M55,46 C50,38 46,34 42,28',
  'M42,28 C52,22 60,18 68,14',
];

const statusPill: Record<string, string> = {
  'In Transit': 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  'Stored': 'bg-slate-500/15 text-slate-300 border border-slate-500/30',
  'Processing': 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30',
};

export default function EnterpriseDashboard() {
  return (
    <div className="text-foreground animate-in fade-in duration-500 space-y-6">
      {/* Section A: Quick Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((kpi) => {
          const Icon = kpi.icon;
          const subColor = kpi.tone === 'emerald' ? 'text-[#10B981]' : kpi.tone === 'red' ? 'text-[#EF4444]' : 'text-muted-foreground';
          return (
            <Card key={kpi.title} className="stat-card rounded-xl hover:scale-100">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <p className="text-sm text-muted-foreground">{kpi.title}</p>
                  <div className="w-9 h-9 rounded-lg bg-[#10B981]/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4.5 h-4.5 text-[#10B981]" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-foreground mt-2">{kpi.value}</h3>
                <p className={`text-xs font-medium mt-1 ${subColor}`}>{kpi.subtext}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Section B: Main Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Left 60%: Live Tracking Map */}
        <Card className="lg:col-span-6 rounded-xl overflow-hidden hover:scale-100 hover:shadow-sm">
          <CardHeader className="border-b border-border py-4">
            <CardTitle className="text-sm font-semibold">Live Supply Chain Routes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative h-[340px] bg-[#0B1220] overflow-hidden">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <pattern id="dashboardGrid" width="8" height="8" patternUnits="userSpaceOnUse">
                    <path d="M 8 0 L 0 0 0 8" fill="none" stroke="#334155" strokeWidth="0.15" />
                  </pattern>
                </defs>
                <rect width="100" height="100" fill="url(#dashboardGrid)" />
                {mapRoutes.map((d, i) => (
                  <path key={i} d={d} fill="none" stroke="#10B981" strokeWidth="0.6" strokeLinecap="round" strokeDasharray="2 2" opacity="0.7">
                    <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1.5s" repeatCount="indefinite" />
                  </path>
                ))}
              </svg>
              {mapNodes.map((node) => (
                <div
                  key={node.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5"
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                >
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-60" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#10B981] ring-2 ring-[#0B1220]" />
                  </span>
                  <span className="text-[10px] text-slate-300 bg-[#0B1220]/80 px-1.5 py-0.5 rounded whitespace-nowrap">{node.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right 40%: Recent Blockchain Transactions */}
        <Card className="lg:col-span-4 rounded-xl hover:scale-100 hover:shadow-sm">
          <CardHeader className="border-b border-border py-4">
            <CardTitle className="text-sm font-semibold">Latest Ledger Entries</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {ledgerEntries.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-muted/50 transition-colors">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] mt-0.5 shrink-0 drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{entry.label}</p>
                    <p className="blockchain-hash mt-1 inline-block">{entry.hash}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{entry.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section C: Inventory Overview Table */}
      <Card className="rounded-xl overflow-hidden hover:scale-100 hover:shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <span className="text-sm font-semibold font-heading">Critical Herb Inventory</span>
          <Button variant="outline" size="sm">View All</Button>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent border-b border-border">
                <TableHead className="text-xs">Herb Name</TableHead>
                <TableHead className="text-xs">Origin</TableHead>
                <TableHead className="text-xs">Current Status</TableHead>
                <TableHead className="text-xs">Quality Grade</TableHead>
                <TableHead className="text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((row, i) => (
                <TableRow
                  key={row.herb}
                  className={`border-b border-border last:border-0 hover:bg-muted/40 transition-colors ${i % 2 === 1 ? 'bg-muted/10' : ''}`}
                >
                  <TableCell className="font-medium text-sm">{row.herb}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{row.origin}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusPill[row.status]}`}>
                      {row.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm font-semibold text-[#F59E0B]">{row.grade}</TableCell>
                  <TableCell className="text-right">
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <MoreHorizontal className="w-4 h-4 inline-block" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
