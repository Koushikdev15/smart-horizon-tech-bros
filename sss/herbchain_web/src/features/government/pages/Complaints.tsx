import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import PageHeader from '../../../components/PageHeader';
import BatchStatusBadge from '../../../components/BatchStatusBadge';
import { mockComplaints } from '../../../lib/mockData';
import { AlertTriangle, Search, MessageSquare, CheckCircle } from 'lucide-react';
import type { Complaint } from '../../../types';

export default function Complaints() {
  const [complaints, setComplaints] = useState<Complaint[]>(mockComplaints);
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [resolution, setResolution] = useState('');
  const [search, setSearch] = useState('');

  const filtered = complaints.filter((c) =>
    c.batchId.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase()) ||
    c.type.toLowerCase().includes(search.toLowerCase())
  );

  const handleResolve = (id: string) => {
    setComplaints((prev) => prev.map((c) => c.id === id ? { ...c, status: 'Resolved', resolution } : c));
    toast.success('Complaint resolved and logged to blockchain.');
    setSelected(null);
    setResolution('');
  };

  const groupBy = (source: Complaint['source']) => filtered.filter((c) => c.source === source);

  const priorityColor: Record<string, string> = {
    High: 'text-red-600',
    Medium: 'text-amber-600',
    Low: 'text-gray-500',
  };

  const ComplaintTable = ({ items }: { items: Complaint[] }) => (
    items.length === 0 ? (
      <div className="text-center py-8 text-muted-foreground text-sm">No complaints in this category</div>
    ) : (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Complaint ID</TableHead>
            <TableHead>Batch ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Filed</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((c) => (
            <TableRow key={c.id} className="table-row-hover">
              <TableCell className="font-mono text-xs font-medium">{c.id}</TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">{c.batchId}</TableCell>
              <TableCell className="text-sm">{c.type}</TableCell>
              <TableCell className={`text-sm font-medium ${priorityColor[c.priority]}`}>{c.priority}</TableCell>
              <TableCell className="text-sm max-w-48 truncate text-muted-foreground">{c.description}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString('en-IN')}</TableCell>
              <TableCell><BatchStatusBadge status={c.status} /></TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="ghost" onClick={() => { setSelected(c); setResolution(c.resolution || ''); }} className="h-7 px-2">
                  <MessageSquare className="w-3.5 h-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Complaints Management"
        description="Monitor and resolve complaints from all ecosystem stakeholders"
        badge={<span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-700 font-medium"><AlertTriangle className="w-3 h-3" />{complaints.filter(c => c.status === 'Open').length} Open</span>}
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search complaints..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="pt-4">
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all" className="text-xs">All ({filtered.length})</TabsTrigger>
              <TabsTrigger value="processing" className="text-xs">Processing</TabsTrigger>
              <TabsTrigger value="supply" className="text-xs">Supply Chain</TabsTrigger>
              <TabsTrigger value="consumer" className="text-xs">Consumer</TabsTrigger>
            </TabsList>
            <TabsContent value="all"><ComplaintTable items={filtered} /></TabsContent>
            <TabsContent value="processing"><ComplaintTable items={groupBy('Processing')} /></TabsContent>
            <TabsContent value="supply"><ComplaintTable items={groupBy('Supply Chain')} /></TabsContent>
            <TabsContent value="consumer"><ComplaintTable items={groupBy('Consumer')} /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {selected && (
        <Dialog open onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Complaint Detail: {selected.id}</DialogTitle>
              <DialogDescription>Batch {selected.batchId}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Type</p><p className="font-medium">{selected.type}</p></div>
                <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Priority</p><p className={`font-medium ${priorityColor[selected.priority]}`}>{selected.priority}</p></div>
                <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Source</p><p className="font-medium">{selected.source}</p></div>
                <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Status</p><BatchStatusBadge status={selected.status} /></div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Description</p>
                <p>{selected.description}</p>
              </div>
              {selected.status !== 'Resolved' && selected.status !== 'Closed' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Resolution / Action Taken</label>
                  <textarea
                    className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Describe resolution..."
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                  />
                  <Button className="w-full bg-primary hover:bg-primary text-white" onClick={() => handleResolve(selected.id)} disabled={!resolution}>
                    <CheckCircle className="w-4 h-4 mr-1.5" /> Mark as Resolved
                  </Button>
                </div>
              )}
              {selected.resolution && (
                <div className="p-3 rounded-lg bg-primary/6 dark:bg-primary/12 border border-primary/25 dark:border-primary/30">
                  <p className="text-xs text-primary dark:text-primary font-medium mb-1">Resolution</p>
                  <p className="text-sm">{selected.resolution}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
