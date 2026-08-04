import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import PageHeader from '../../../components/PageHeader';
import BatchStatusBadge from '../../../components/BatchStatusBadge';
import StatsCard from '../../../components/StatsCard';
import { mockPayments } from '../../../lib/mockData';
import { CreditCard, TrendingUp, ArrowUpRight, Eye, ShieldCheck, Landmark } from 'lucide-react';
import type { Payment } from '../../../types';

const stageTotals = [
  { stage: 'Collection', total: '₹8.4L', count: 156, released: '₹7.8L' },
  { stage: 'Processing', total: '₹2.9L', count: 142, released: '₹2.5L' },
  { stage: 'Manufacturing', total: '₹18.2L', count: 138, released: '₹16.9L' },
  { stage: 'Supply Chain', total: '₹3.1L', count: 136, released: '₹2.9L' },
];

const stageColors: Record<string, string> = {
  'Collection': 'text-primary',
  'Processing': 'text-amber-600',
  'Manufacturing': 'text-blue-600',
  'Supply Chain': 'text-cyan-600',
};

export default function GovPayments() {
  const [selected, setSelected] = useState<Payment | null>(null);

  // Generate mock bank details based on recipient name
  const getMockBankDetails = (recipient: string) => {
    const hash = recipient.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const bankName = hash % 2 === 0 ? 'State Bank of India' : 'HDFC Bank';
    const accNo = `39480${hash}1928`;
    const ifsc = hash % 2 === 0 ? 'SBIN0004820' : 'HDFC0000128';
    return { bankName, accNo, ifsc };
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Payment Ledger"
        description="Track all payment releases across the supply chain stages"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard title="Total Released (YTD)" value="₹30.1L" icon={CreditCard} iconColor="text-primary" iconBg="bg-primary/6 dark:bg-primary/14" trend="up" trendValue="+22%" subtext="vs last year" />
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
              <div className="text-xs text-primary mt-1 font-medium">{s.released} released</div>
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
                <TableHead className="text-right">Actions</TableHead>
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
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-primary cursor-pointer"
                      onClick={() => setSelected(p)}
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      {selected && (() => {
        const bank = getMockBankDetails(selected.recipient);
        return (
          <Dialog open onOpenChange={() => setSelected(null)}>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg font-bold font-heading">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <span>Transaction Details: </span>
                  <span className="font-mono text-primary">{selected.id}</span>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {/* Status and Amount Header */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/40">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Release Amount</p>
                    <p className="text-2xl font-black text-foreground">₹{selected.amount.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">State</p>
                    <BatchStatusBadge status={selected.status} />
                  </div>
                </div>

                {/* Recipient Details & Bank Account Details */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Landmark className="w-3.5 h-3.5" /> Recipient Bank Account
                  </h4>
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-border bg-card text-xs">
                    <div>
                      <p className="text-muted-foreground">Account Holder Name</p>
                      <p className="font-semibold text-foreground mt-0.5">{selected.recipient}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ecosystem Role</p>
                      <p className="font-semibold text-foreground mt-0.5">{selected.recipientRole || selected.stage}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Bank Name</p>
                      <p className="font-semibold text-foreground mt-0.5">{bank.bankName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">IFSC Code</p>
                      <p className="font-mono font-semibold text-foreground mt-0.5">{bank.ifsc}</p>
                    </div>
                    <div className="col-span-2 border-t border-border/40 pt-2 mt-1">
                      <p className="text-muted-foreground">Account Number</p>
                      <p className="font-mono font-semibold text-foreground mt-0.5">{bank.accNo}</p>
                    </div>
                  </div>
                </div>

                {/* Blockchain Proof */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Ledger Verification
                  </h4>
                  <div className="p-3 rounded-lg border border-border bg-card text-xs space-y-1.5 font-mono">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Associated Batch ID:</span>
                      <span className="font-semibold text-foreground">{selected.batchId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tx Hash:</span>
                      <span className="font-semibold text-primary truncate max-w-56">{selected.blockchainTxId || '0x2a4c6b8d0e... (Pending)'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Release Date:</span>
                      <span className="text-foreground">{new Date(selected.releasedAt || selected.createdAt).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {selected.remarks && (
                  <div className="p-3 rounded-lg bg-primary/6 border border-primary/20 text-xs">
                    <p className="font-bold text-primary mb-0.5">Authorization Notes</p>
                    <p className="text-muted-foreground">{selected.remarks}</p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <Button variant="outline" size="sm" onClick={() => setSelected(null)} className="h-8 text-xs">
                    Dismiss
                  </Button>
                  <Button size="sm" className="h-8 text-xs bg-primary text-white" onClick={() => window.print()}>
                    Print Receipt
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}
    </div>
  );
}
