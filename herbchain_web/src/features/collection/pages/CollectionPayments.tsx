import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PageHeader from '../../../components/PageHeader';
import BatchStatusBadge from '../../../components/BatchStatusBadge';
import StatsCard from '../../../components/StatsCard';
import { mockPayments } from '../../../lib/mockData';
import { CreditCard, TrendingUp, CheckCircle2 } from 'lucide-react';

const myPayments = mockPayments.filter(p => p.stage === 'Collection' || p.recipientRole === 'Collection Center');

export default function CollectionPayments() {
  const released = myPayments.filter(p => p.status === 'Released').reduce((s, p) => s + p.amount, 0);
  const pending = myPayments.filter(p => p.status === 'Pending').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader title="Payments" description="Track your earnings from herb collections" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="Total Released" value={`₹${released.toLocaleString('en-IN')}`} icon={CheckCircle2} iconColor="text-emerald-600" iconBg="bg-emerald-50 dark:bg-emerald-950/40" />
        <StatsCard title="Pending Release" value={`₹${pending.toLocaleString('en-IN')}`} icon={TrendingUp} iconColor="text-amber-600" iconBg="bg-amber-50 dark:bg-amber-950/40" />
        <StatsCard title="Total Transactions" value={myPayments.length} icon={CreditCard} iconColor="text-blue-600" iconBg="bg-blue-50 dark:bg-blue-950/40" />
      </div>

      {/* Payment stages visual */}
      <Card className="overflow-hidden">
        <CardHeader><CardTitle className="text-base">Payment Flow</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-0 overflow-x-auto pb-2">
            {['Collection Completed','↓','Payment Released','↓','Processing Completed','↓','Manufacturing','↓','Final Settlement'].map((step, i) => (
              step === '↓' ? (
                <div key={i} className="text-muted-foreground font-bold px-2 text-lg">→</div>
              ) : (
                <div key={i} className={`flex-1 min-w-32 p-3 rounded-lg text-center text-xs font-medium border shrink-0 ${i === 0 || i === 4 ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' : 'bg-muted/50 border-border text-muted-foreground'}`}>
                  {step}
                </div>
              )
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Payment History</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment ID</TableHead>
                <TableHead>Batch ID</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Released On</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myPayments.map((p) => (
                <TableRow key={p.id} className="table-row-hover">
                  <TableCell className="font-mono text-xs">{p.id}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{p.batchId}</TableCell>
                  <TableCell className="text-sm">{p.stage}</TableCell>
                  <TableCell className="text-sm font-bold text-emerald-700 dark:text-emerald-400">₹{p.amount.toLocaleString('en-IN')}</TableCell>
                  <TableCell><BatchStatusBadge status={p.status} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.releasedAt ? new Date(p.releasedAt).toLocaleDateString('en-IN') : '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-40 truncate">{p.remarks || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
