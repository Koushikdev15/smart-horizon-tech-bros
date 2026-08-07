import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import PageHeader from '../../../components/PageHeader';
import BatchStatusBadge from '../../../components/BatchStatusBadge';
import { Search, PauseCircle, PlayCircle, Leaf, FlaskConical, Factory, Truck, Shield, Users, Eye, CheckCircle, Loader2, Tractor, TreePine } from 'lucide-react';
import type { Member } from '../../../types';
import { supabase } from '../../../lib/supabase';

const roleIcons: Record<string, React.ElementType> = {
  'Collection Center': Leaf,
  'Farmer': Tractor,
  'Wild Collector': TreePine,
  'Processing & Laboratory': FlaskConical,
  'Manufacturer': Factory,
  'Supply Chain': Truck,
  'Government': Shield,
};

export default function ActiveMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [selected, setSelected] = useState<Member | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('registeredDate', { ascending: false });

      if (error) {
        console.error('Error fetching members: ', error);
        toast.error('Failed to load members from database');
      } else {
        setMembers((data ?? []) as Member[]);
      }
      setLoading(false);
    };

    fetchMembers();

    // Keep the list live as registrations/approvals come in elsewhere.
    const channel = supabase
      .channel('members-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'members' }, () => {
        fetchMembers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = members.filter((m) => {
    const matchSearch = m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.organizationName?.toLowerCase().includes(search.toLowerCase()) ||
      m.ayurvedicId?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'All' || m.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleToggle = async (id: string, current: string) => {
    const next = current === 'Active' ? 'Suspended' : 'Active';
    toast.loading(`Updating status...`, { id: 'statusUpdate' });
    const { error } = await supabase.from('members').update({ status: next }).eq('id', id);
    toast.dismiss('statusUpdate');
    if (error) {
      toast.error('Failed to update status: ' + error.message);
    } else {
      setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, status: next as Member['status'] } : m)));
      toast.success(`Member ${next === 'Active' ? 'reactivated' : 'suspended'} successfully.`);
    }
  };

  const handleApprove = async (id: string) => {
    toast.loading('Approving member...', { id: 'statusUpdate' });
    const { error } = await supabase.from('members').update({ status: 'Active' }).eq('id', id);
    toast.dismiss('statusUpdate');
    if (error) {
      toast.error('Failed to approve member: ' + error.message);
    } else {
      setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, status: 'Active' } : m)));
      toast.success('Member approved successfully.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Active Members"
        description="View and manage all registered ecosystem stakeholders"
        badge={<span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium"><Users className="w-3 h-3" />{members.filter(m => m.status === 'Active').length} Active</span>}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search members..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['All', 'Collection Center', 'Farmer', 'Wild Collector', 'Processing & Laboratory', 'Manufacturer', 'Supply Chain'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${roleFilter === role ? 'bg-primary text-white border-primary/50' : 'border-border text-muted-foreground hover:border-primary/35'}`}
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
              {loading && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading members...
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!loading && filtered.map((m) => {
                const RoleIcon = roleIcons[m.role] || Leaf;
                return (
                  <TableRow key={m.id} className="table-row-hover">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 dark:bg-primary/16 flex items-center justify-center text-xs font-bold text-primary">{m.name?.charAt(0) || '?'}</div>
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
                    <TableCell className="text-xs text-muted-foreground">
                      {m.registeredDate ? 
                        (m.registeredDate as any)?.toDate ? (m.registeredDate as any).toDate().toLocaleDateString('en-IN') : new Date(m.registeredDate).toLocaleDateString('en-IN')
                        : '-'
                      }
                    </TableCell>
                    <TableCell><BatchStatusBadge status={m.status} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary cursor-pointer"
                          onClick={() => setSelected(m)}
                          title="View Profile Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {(m.status === 'Active' || m.status === 'Suspended') && (
                          <Button size="sm" variant="ghost" onClick={() => handleToggle(m.id, m.status)} className="h-7 px-2 text-xs">
                            {m.status === 'Active' ? <><PauseCircle className="w-3.5 h-3.5 mr-1 text-amber-500" />Suspend</> : <><PlayCircle className="w-3.5 h-3.5 mr-1 text-primary" />Activate</>}
                          </Button>
                        )}
                        {m.status === 'Pending' && (
                          <Button size="sm" variant="ghost" onClick={() => handleApprove(m.id)} className="h-7 px-2 text-xs text-primary">
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!loading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No members found in the database.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Member Details Dialog */}
      {selected && (
        <Dialog open onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg font-bold font-heading">
                <Users className="w-5 h-5 text-primary" />
                <span>Member Profile: </span>
                <span className="text-primary">{selected.name}</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-2 text-sm">
              {/* Member Card Header */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/40">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                  {selected.name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="font-semibold text-base">{selected.name}</p>
                  <p className="text-xs text-muted-foreground">{selected.organizationName}</p>
                </div>
                <div className="ml-auto">
                  <BatchStatusBadge status={selected.status} />
                </div>
              </div>

              {/* Personal details */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-border bg-card text-xs">
                <div>
                  <p className="text-muted-foreground font-semibold">Ayurvedic ID</p>
                  <p className="font-mono font-semibold text-foreground mt-0.5">{selected.ayurvedicId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold">Registered Date</p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {selected.registeredDate ? 
                      (selected.registeredDate as any)?.toDate ? (selected.registeredDate as any).toDate().toLocaleDateString('en-IN') : new Date(selected.registeredDate).toLocaleDateString('en-IN')
                      : '-'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold">Role Name</p>
                  <p className="font-semibold text-foreground mt-0.5">{selected.role}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold">Region</p>
                  <p className="font-semibold text-foreground mt-0.5">{selected.region || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold">Email</p>
                  <p className="font-semibold text-foreground mt-0.5">{selected.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold">Phone</p>
                  <p className="font-semibold text-foreground mt-0.5">{selected.phone}</p>
                </div>
                <div className="col-span-2 border-t border-border/40 pt-2 mt-1">
                  <p className="text-muted-foreground font-semibold">Office Address</p>
                  <p className="text-foreground mt-0.5 leading-relaxed">{selected.address}</p>
                </div>
              </div>

              {/* License Details & Legal Details */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Compliance & License Details</h4>
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-border bg-card text-xs">
                  <div>
                    <p className="text-muted-foreground">License Number</p>
                    <p className="font-mono font-semibold text-foreground mt-0.5">{selected.licenseNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">GST Identification No.</p>
                    <p className="font-mono font-semibold text-foreground mt-0.5">{selected.gst || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Income Tax PAN</p>
                    <p className="font-mono font-semibold text-foreground mt-0.5">{selected.pan || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">GMP Certification</p>
                    <p className="font-semibold text-foreground mt-0.5">{selected.gmpCertificate || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">NABL Certificate</p>
                    <p className="font-semibold text-foreground mt-0.5">{selected.nablCertificate || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Drug License</p>
                    <p className="font-semibold text-foreground mt-0.5">{selected.drugLicense || selected.manufacturingLicense || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Capacity / Fleet Details if present */}
              {(selected.warehouseCapacity || selected.vehicleDetails) && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Facility & Capacity</h4>
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-border bg-card text-xs">
                    {selected.warehouseCapacity && (
                      <div>
                        <p className="text-muted-foreground">Storage/Warehouse Capacity</p>
                        <p className="font-semibold text-foreground mt-0.5">{selected.warehouseCapacity}</p>
                      </div>
                    )}
                    {selected.vehicleDetails && (
                      <div>
                        <p className="text-muted-foreground">Logistics Fleet Info</p>
                        <p className="font-semibold text-foreground mt-0.5">{selected.vehicleDetails}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => setSelected(null)} className="h-8 text-xs">
                  Close Profile
                </Button>
                <Button
                  size="sm"
                  className="h-8 text-xs bg-primary text-white"
                  onClick={() => {
                    toast.success(`Downloading profile of ${selected.name}...`);
                    const mockContent = `AyuTrace+ Certified Member Profile\n---------------------------------\nName: ${selected.name}\nRole: ${selected.role}\nAyurvedic ID: ${selected.ayurvedicId}\nStatus: ${selected.status}\nRegion: ${selected.region}\nEmail: ${selected.email}\nPhone: ${selected.phone}\nAddress: ${selected.address}`;
                    const blob = new Blob([mockContent], { type: 'text/plain;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${selected.name?.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_profile.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                >
                  Download Profile
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
