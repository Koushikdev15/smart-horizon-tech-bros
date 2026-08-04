import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import PageHeader from '../../../components/PageHeader';
import BatchStatusBadge from '../../../components/BatchStatusBadge';
import StatsCard from '../../../components/StatsCard';
import { mockAuditLogs } from '../../../lib/mockData';
import { Search, Link as ChainIcon, Database, Eye, Terminal, ShieldCheck, Fingerprint } from 'lucide-react';
import type { AuditLog } from '../../../types';

export default function AuditLogs() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<AuditLog | null>(null);
  const [showRaw, setShowRaw] = useState(false);

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
        <StatsCard title="Avg Block Time" value="2.4s" icon={ChainIcon} iconColor="text-primary" iconBg="bg-primary/6 dark:bg-primary/14" />
      </div>

      {/* Blockchain health */}
      <Card className="border-primary/25 dark:border-primary/30 bg-primary/5 dark:bg-primary/8">
        <CardContent className="py-3 flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-medium text-primary dark:text-primary">Blockchain Network: Healthy — All nodes synced — Last block: #{(1429847).toLocaleString()}</span>
        </CardContent>
      </Card>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search transactions..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transaction History</CardTitle>
          <CardDescription>All blockchain-recorded events in AyuTrace+</CardDescription>
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
                <TableHead className="text-right">Actions</TableHead>
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
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-primary cursor-pointer"
                      onClick={() => { setSelected(log); setShowRaw(false); }}
                      title="View Blockchain details"
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

      {/* Audit Log Dialog */}
      {selected && (
        <Dialog open onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg font-bold font-heading">
                <Database className="w-5 h-5 text-primary" />
                <span>Transaction Proof: </span>
                <span className="font-mono text-primary">{selected.id}</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-2 text-sm">
              {/* Top Summary Info */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-border bg-muted/30">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Transaction Type</p>
                  <p className="font-semibold mt-0.5">{selected.type}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Verification State</p>
                  <div className="mt-0.5"><BatchStatusBadge status={selected.status} /></div>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Initiating Authority</p>
                  <p className="font-semibold mt-0.5">{selected.entity}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Initiator</p>
                  <p className="font-semibold mt-0.5">{selected.userName} (ID: {selected.userId})</p>
                </div>
              </div>

              {/* Cryptographic Hashes */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Ledger Proof
                </h4>
                <div className="p-3 rounded-lg border border-border bg-card font-mono text-xs space-y-2">
                  <div>
                    <p className="text-muted-foreground text-[10px] font-sans font-semibold">Transaction Hash</p>
                    <code className="text-primary font-bold break-all block mt-0.5">{selected.txHash}</code>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-t border-border/40 pt-2 mt-2">
                    <div>
                      <p className="text-muted-foreground text-[10px] font-sans font-semibold">Block Height</p>
                      <p className="font-bold text-foreground mt-0.5">#{selected.blockNumber?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-[10px] font-sans font-semibold">Consensus Timestamp</p>
                      <p className="text-foreground mt-0.5 text-[11px] font-sans">
                        {new Date(selected.timestamp).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction Action */}
              <div className="p-3 rounded-lg bg-primary/6 border border-primary/20 text-xs">
                <p className="font-bold text-primary mb-0.5 flex items-center gap-1">
                  <Fingerprint className="w-3.5 h-3.5" /> Event Description
                </p>
                <p className="text-muted-foreground mt-0.5">{selected.action}</p>
              </div>

              {/* Expandable Technical Details Button & Code Block */}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRaw(!showRaw)}
                  className="h-8 text-xs gap-1.5 w-full flex justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5 text-muted-foreground" /> Raw Block Payload</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{showRaw ? 'Hide' : 'Expand'}</span>
                </Button>
                
                {showRaw && (
                  <pre className="p-3 rounded-lg bg-black text-green-400 font-mono text-[10px] overflow-x-auto max-h-40 border border-green-950">
                    {JSON.stringify({
                      tx_hash: selected.txHash,
                      block_height: selected.blockNumber,
                      timestamp: selected.timestamp,
                      transaction: {
                        id: selected.id,
                        type: selected.type,
                        sender: selected.userId,
                        organization: selected.entity,
                        action: selected.action,
                      },
                      blockchain_status: selected.status,
                      consensus: 'Hyperledger Fabric RAFT PBFT',
                      valid: true,
                      signature: 'MEQCID6V9...Xj6B= (secp256r1 ECDSA)',
                    }, null, 2)}
                  </pre>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => setSelected(null)} className="h-8 text-xs">
                  Close
                </Button>
                <Button size="sm" className="h-8 text-xs bg-primary text-white" onClick={() => window.open(`https://sepolia.etherscan.io/tx/${selected.txHash}`, '_blank')}>
                  View on Explorer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
