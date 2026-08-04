import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PageHeader from '../../../components/PageHeader';
import BatchStatusBadge from '../../../components/BatchStatusBadge';
import StatsCard from '../../../components/StatsCard';
import { mockPayments } from '../../../lib/mockData';
import { CreditCard, TrendingUp, ArrowUpRight } from 'lucide-react';

const stageTotals = [
  { stage: 'Collection', total: '₹8.4L', count: 156, released: '₹7.8L' },
  { stage: 'Processing', total: '₹2.9L', count: 142, released: '₹2.5L' },
  { stage: 'Manufacturing', total: '₹18.2L', count: 138, released: '₹16.9L' },
  { stage: 'Supply Chain', total: '₹3.1L', count: 136, released: '₹2.9L' },
];

const stageColors: Record<string, string> = {
  'Collection': 'text-emerald-600',
  'Processing': 'text-amber-600',
  'Manufacturing': 'text-blue-600',
  'Supply Chain': 'text-cyan-600',
};

export default function GovPayments() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Payment Ledger"
        description="Track all payment releases across the supply chain stages"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard title="Total Released (YTD)" value="₹30.1L" icon={CreditCard} iconColor="text-emerald-600" iconBg="bg-emerald-50 dark:bg-emerald-950/40" trend="up" trendValue="+22%" subtext="vs last year" />
        <StatsCard title="Pending Release" value="₹2.8L" icon={TrendingUp} iconColor="text-amber-600" iconBg="bg-amber-50 dark:bg-amber-950/40" />
        <StatsCard title="Transactions" value="572" icon={ArrowUpRight} iconColor="text-blue-600" iconBg="bg-blue-50 dark:bg-blue-950/40" />
        <StatsCard title="On Hold" value="₹0.4L" icon={CreditCard} iconColor="text-red-600" iconBg="bg-red-50 dark:bg-red-950/40" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stageTotals.map((s) => (
          <Card key={s.stage} className="stat-card">
            <CardHeader className="pb-2">
              <CardTitle className={`text-sm font-semibold ${stageColors[s.stage]}`}>{s.stage}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{s.total}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.count} transactions</div>
              <div className="text-xs text-emerald-600 mt-1 font-medium">{s.released} released</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Payment Transactions</CardTitle>
          <CardDescription>Linked to Batch IDs on blockchain</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment ID</TableHead>
                <TableHead>Batch ID</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Blockchain TX</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPayments.map((p) => (
                <TableRow key={p.id} className="table-row-hover">
                  <TableCell className="font-mono text-xs font-medium">{p.id}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{p.batchId}</TableCell>
                  <TableCell className={`text-sm font-medium ${stageColors[p.stage]}`}>{p.stage}</TableCell>
                  <TableCell className="text-sm">{p.recipient}</TableCell>
                  <TableCell className="text-sm font-semibold">₹{p.amount.toLocaleString('en-IN')}</TableCell>
                  <TableCell><BatchStatusBadge status={p.status} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {p.releasedAt ? new Date(p.releasedAt).toLocaleDateString('en-IN') : new Date(p.createdAt).toLocaleDateString('en-IN')}
                  </TableCell>
                  <TableCell>
                    {p.blockchainTxId ? <code className="blockchain-hash">{p.blockchainTxId.slice(0, 10)}...</code> : <span className="text-xs text-muted-foreground">-</span>}
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
