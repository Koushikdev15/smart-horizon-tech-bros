import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '../../../components/PageHeader';
import BatchStatusBadge from '../../../components/BatchStatusBadge';
import { useActiveMembers } from '../useActiveMembers';
import {
  Search, Eye, Phone, MapPin, TreePine, Loader2, AlertCircle, User,
  Mail, Leaf, ScrollText, Users, Clock, Landmark, CalendarDays,
} from 'lucide-react';
import type { Member } from '../../../types';

const NOT_RECORDED = '—';

export default function WildCollectors() {
  const { members, loading, error } = useActiveMembers('Wild Collector');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Member | null>(null);

  const q = search.toLowerCase();
  const filtered = members.filter((m) =>
    (m.name ?? '').toLowerCase().includes(q) ||
    (m.ayurvedicId ?? '').toLowerCase().includes(q) ||
    (m.region ?? '').toLowerCase().includes(q) ||
    (m.phone ?? '').toLowerCase().includes(q) ||
    (m.wildCollectorDetails?.permit ?? '').toLowerCase().includes(q)
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Wild Collectors"
        description="Government-approved forest herb collectors available to your collection centre"
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, ID, zone, permit..."
          className="pl-9 h-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Wild Collector Registry {!loading && `(${filtered.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading approved collectors…</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
              <p className="text-sm font-medium">Couldn&apos;t load wild collectors</p>
              <p className="text-xs text-muted-foreground max-w-sm">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <TreePine className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm font-medium">
                {members.length === 0
                  ? 'No approved wild collectors yet'
                  : 'No collectors match your search'}
              </p>
              <p className="text-xs text-muted-foreground max-w-sm">
                {members.length === 0
                  ? 'Collectors appear here once the Government portal approves their registration.'
                  : 'Try a different name, ID, zone or permit number.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Collector</TableHead>
                  <TableHead>Ayurvedic ID</TableHead>
                  <TableHead>Zone / Region</TableHead>
                  <TableHead>Forest Permit</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Primary Herbs</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((m) => (
                  <TableRow key={m.id} className="table-row-hover">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 dark:bg-primary/16 flex items-center justify-center text-xs font-bold text-primary">
                          {(m.name ?? '?').charAt(0)}
                        </div>
                        <span className="text-sm font-medium">{m.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{m.ayurvedicId}</TableCell>
                    <TableCell className="text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {m.wildCollectorDetails?.zone || m.region || NOT_RECORDED}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {m.wildCollectorDetails?.permit || NOT_RECORDED}
                    </TableCell>
                    <TableCell className="text-sm">{m.wildCollectorDetails?.exp || NOT_RECORDED}</TableCell>
                    <TableCell className="text-sm max-w-[180px] truncate" title={m.wildCollectorDetails?.herbs}>
                      {m.wildCollectorDetails?.herbs || NOT_RECORDED}
                    </TableCell>
                    <TableCell><BatchStatusBadge status={m.status} /></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => setSelected(m)} className="h-7 px-2">
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selected && (
        <Dialog open onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Wild Collector Profile</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                  {(selected.name ?? '?').charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold">{selected.name}</h3>
                  <p className="text-sm text-muted-foreground font-mono">{selected.ayurvedicId}</p>
                  <BatchStatusBadge status={selected.status} className="mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: MapPin, label: 'Collection Zone', value: selected.wildCollectorDetails?.zone || selected.region },
                  { icon: ScrollText, label: 'Forest Permit', value: selected.wildCollectorDetails?.permit },
                  { icon: Phone, label: 'Phone', value: selected.phone },
                  { icon: Mail, label: 'Email', value: selected.email },
                  { icon: Users, label: 'Tribe / Community', value: selected.wildCollectorDetails?.tribe },
                  { icon: Clock, label: 'Experience', value: selected.wildCollectorDetails?.exp },
                  { icon: Leaf, label: 'Herbs Collected', value: selected.wildCollectorDetails?.herbs },
                  { icon: Landmark, label: 'Bank Details', value: selected.wildCollectorDetails?.bank },
                  {
                    icon: CalendarDays,
                    label: 'Registered',
                    value: selected.registeredDate
                      ? new Date(selected.registeredDate).toLocaleDateString('en-IN')
                      : undefined,
                  },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="p-2.5 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Icon className="w-3 h-3" />{label}
                    </p>
                    <p className="text-sm font-medium mt-0.5 break-words">{value || NOT_RECORDED}</p>
                  </div>
                ))}
              </div>

              {selected.address && (
                <div className="p-2.5 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3" />Address
                  </p>
                  <p className="text-sm font-medium mt-0.5">{selected.address}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
