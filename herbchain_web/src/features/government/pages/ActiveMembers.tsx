import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import PageHeader from '../../../components/PageHeader';
import BatchStatusBadge from '../../../components/BatchStatusBadge';
import { mockMembers } from '../../../lib/mockData';
import { Search, PauseCircle, PlayCircle, Leaf, FlaskConical, Factory, Truck, Shield, Users } from 'lucide-react';
import type { Member } from '../../../types';

const roleIcons: Record<string, React.ElementType> = {
  'Collection Center': Leaf,
  'Processing & Laboratory': FlaskConical,
  'Manufacturer': Factory,
  'Supply Chain': Truck,
  'Government': Shield,
};

export default function ActiveMembers() {
  const [members, setMembers] = useState<Member[]>(mockMembers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');

  const filtered = members.filter((m) => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.organizationName.toLowerCase().includes(search.toLowerCase()) ||
      m.ayurvedicId.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'All' || m.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleToggle = (id: string, current: string) => {
    const next = current === 'Active' ? 'Suspended' : 'Active';
    setMembers((prev) => prev.map((m) => m.id === id ? { ...m, status: next as Member['status'] } : m));
    toast.success(`Member ${next === 'Active' ? 'reactivated' : 'suspended'} successfully.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Active Members"
        description="View and manage all registered ecosystem stakeholders"
        badge={<span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium"><Users className="w-3 h-3" />{members.filter(m => m.status === 'Active').length} Active</span>}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search members..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['All', 'Collection Center', 'Processing & Laboratory', 'Manufacturer', 'Supply Chain'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${roleFilter === role ? 'bg-emerald-600 text-white border-emerald-600' : 'border-border text-muted-foreground hover:border-emerald-400/50'}`}
            >{role}</button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Member Registry ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Ayurvedic ID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m) => {
                const RoleIcon = roleIcons[m.role] || Leaf;
                return (
                  <TableRow key={m.id} className="table-row-hover">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-xs font-bold text-emerald-700">{m.name.charAt(0)}</div>
                        <div>
                          <p className="text-sm font-medium">{m.name}</p>
                          <p className="text-xs text-muted-foreground">{m.phone}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{m.ayurvedicId}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs">
                        <RoleIcon className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="truncate max-w-32">{m.role}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm max-w-40 truncate">{m.organizationName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{m.region || '-'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(m.registeredDate).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell><BatchStatusBadge status={m.status} /></TableCell>
                    <TableCell className="text-right">
                      {(m.status === 'Active' || m.status === 'Suspended') && (
                        <Button size="sm" variant="ghost" onClick={() => handleToggle(m.id, m.status)} className="h-7 px-2 text-xs">
                          {m.status === 'Active' ? <><PauseCircle className="w-3.5 h-3.5 mr-1 text-amber-500" />Suspend</> : <><PlayCircle className="w-3.5 h-3.5 mr-1 text-emerald-500" />Activate</>}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
