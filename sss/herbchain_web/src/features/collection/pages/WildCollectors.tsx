import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '../../../components/PageHeader';
import BatchStatusBadge from '../../../components/BatchStatusBadge';
import { mockWildCollectors } from '../../../lib/mockData';
import { Search, Star, Eye, Phone, MapPin, Package, TreePine } from 'lucide-react';
import type { WildCollector } from '../../../types';

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <Star key={s} className={`w-3 h-3 ${s <= Math.round(value) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{value?.toFixed(1)}</span>
    </div>
  );
}

export default function WildCollectors() {
  const [collectors] = useState<WildCollector[]>(mockWildCollectors);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<WildCollector | null>(null);

  const filtered = collectors.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.collectorId.toLowerCase().includes(search.toLowerCase()) ||
    c.village.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader title="Wild Collectors" description="Certified forest herb collectors with valid permits" />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name, ID, village..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Wild Collector Registry ({filtered.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Collector</TableHead>
                <TableHead>Collector ID</TableHead>
                <TableHead>Village / Region</TableHead>
                <TableHead>Forest Permit</TableHead>
                <TableHead>Collections</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} className="table-row-hover">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-950/50 flex items-center justify-center text-xs font-bold text-teal-700">{c.name.charAt(0)}</div>
                      <span className="text-sm font-medium">{c.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{c.collectorId}</TableCell>
                  <TableCell className="text-sm text-muted-foreground"><span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.village}, {c.region}</span></TableCell>
                  <TableCell className="font-mono text-xs text-primary dark:text-primary">{c.forestPermitNo || 'N/A'}</TableCell>
                  <TableCell className="text-sm font-medium">{c.totalCollections}</TableCell>
                  <TableCell>{c.rating ? <StarRating value={c.rating} /> : '-'}</TableCell>
                  <TableCell><BatchStatusBadge status={c.status} /></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => setSelected(c)} className="h-7 px-2"><Eye className="w-3.5 h-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selected && (
        <Dialog open onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Wild Collector Profile</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center text-xl font-bold text-teal-700">{selected.name.charAt(0)}</div>
                <div>
                  <h3 className="font-bold">{selected.name}</h3>
                  <p className="text-sm text-muted-foreground">{selected.collectorId}</p>
                  {selected.rating && <StarRating value={selected.rating} />}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: MapPin, label: 'Village', value: selected.village },
                  { icon: MapPin, label: 'Region', value: selected.region },
                  { icon: Phone, label: 'Phone', value: selected.phone },
                  { icon: TreePine, label: 'Forest Permit', value: selected.forestPermitNo || 'N/A' },
                  { icon: Package, label: 'Total Collections', value: `${selected.totalCollections} batches` },
                  { icon: Package, label: 'Last Collection', value: selected.lastCollection ? new Date(selected.lastCollection).toLocaleDateString('en-IN') : 'N/A' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="p-2.5 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Icon className="w-3 h-3" />{label}</p>
                    <p className="text-sm font-medium mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
