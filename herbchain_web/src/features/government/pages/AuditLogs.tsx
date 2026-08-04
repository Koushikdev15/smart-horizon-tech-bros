import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PageHeader from '../../../components/PageHeader';
import BatchStatusBadge from '../../../components/BatchStatusBadge';
import StatsCard from '../../../components/StatsCard';
import { mockAuditLogs } from '../../../lib/mockData';
import { Search, Link as ChainIcon, Database } from 'lucide-react';

export default function AuditLogs() {
  const [search, setSearch] = useState('');

  const filtered = mockAuditLogs.filter((l) =>
    l.txHash.includes(search) ||
    l.type.toLowerCase().includes(search.toLowerCase()) ||
    l.entity.toLowerCase().includes(search.toLowerCase()) ||
    l.action.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Blockchain Audit Logs"
        description="Immutable ledger of all critical ecosystem events"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard title="Total Transactions" value="24,892" icon={ChainIcon} iconColor="text-violet-600" iconBg="bg-violet-50 dark:bg-violet-950/40" trend="up" trendValue="+8,432" subtext="today" />
        <StatsCard title="Committed Blocks" value="1,429,847" icon={Database} iconColor="text-blue-600" iconBg="bg-blue-50 dark:bg-blue-950/40" />
        <StatsCard title="Failed TX" value="3" icon={ChainIcon} iconColor="text-red-600" iconBg="bg-red-50 dark:bg-red-950/40" />
        <StatsCard title="Avg Block Time" value="2.4s" icon={ChainIcon} iconColor="text-emerald-600" iconBg="bg-emerald-50 dark:bg-emerald-950/40" />
      </div>

      {/* Blockchain health */}
      <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
        <CardContent className="py-3 flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Blockchain Network: Healthy — All nodes synced — Last block: #{(1429847).toLocaleString()}</span>
        </CardContent>
      </Card>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search transactions..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transaction History</CardTitle>
          <CardDescription>All blockchain-recorded events in AYUTRACE+</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-40">TX Hash</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Block</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((log) => (
                <TableRow key={log.id} className="table-row-hover">
                  <TableCell>
                    <code className="blockchain-hash">{log.txHash.slice(0, 14)}...</code>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{log.type}</TableCell>
                  <TableCell className="text-sm">{log.entity}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{log.userName}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-48 truncate">{log.action}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{log.blockNumber?.toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell><BatchStatusBadge status={log.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
