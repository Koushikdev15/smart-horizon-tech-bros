import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '../../../components/PageHeader';
import BatchStatusBadge from '../../../components/BatchStatusBadge';
import { mockFarmers } from '../../../lib/mockData';
import { Search, Star, Eye, Phone, MapPin, Package, User } from 'lucide-react';
import type { Farmer } from '../../../types';

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

export default function Farmers() {
  const [farmers] = useState<Farmer[]>(mockFarmers);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Farmer | null>(null);

  const filtered = farmers.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.farmerId.toLowerCase().includes(search.toLowerCase()) ||
    f.village.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader title="Farmers" description="Registered farmers in your collection region" />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by name, ID, village..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Farmer Registry ({filtered.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Farmer</TableHead>
                <TableHead>Farmer ID</TableHead>
                <TableHead>Village / Region</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Total Collections</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((f) => (
                <TableRow key={f.id} className="table-row-hover">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 dark:bg-primary/16 flex items-center justify-center text-xs font-bold text-primary">{f.name.charAt(0)}</div>
                      <span className="text-sm font-medium">{f.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{f.farmerId}</TableCell>
                  <TableCell className="text-sm"><span className="flex items-center gap-1 text-muted-foreground"><MapPin className="w-3 h-3" />{f.village}, {f.region}</span></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{f.phone}</TableCell>
                  <TableCell className="text-sm font-medium">{f.totalCollections}</TableCell>
                  <TableCell>{f.rating ? <StarRating value={f.rating} /> : '-'}</TableCell>
                  <TableCell><BatchStatusBadge status={f.status} /></TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => setSelected(f)} className="h-7 px-2"><Eye className="w-3.5 h-3.5" /></Button>
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
            <DialogHeader><DialogTitle>Farmer Profile</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">{selected.name.charAt(0)}</div>
                <div>
                  <h3 className="font-bold">{selected.name}</h3>
                  <p className="text-sm text-muted-foreground">{selected.farmerId}</p>
                  {selected.rating && <StarRating value={selected.rating} />}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: MapPin, label: 'Village', value: selected.village },
                  { icon: MapPin, label: 'Region', value: selected.region },
                  { icon: Phone, label: 'Phone', value: selected.phone },
                  { icon: Package, label: 'Total Collections', value: `${selected.totalCollections} batches` },
                  { icon: User, label: 'Last Collection', value: selected.lastCollection ? new Date(selected.lastCollection).toLocaleDateString('en-IN') : 'N/A' },
                  { icon: User, label: 'Bank Details', value: selected.bankDetails || 'Not provided' },
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
