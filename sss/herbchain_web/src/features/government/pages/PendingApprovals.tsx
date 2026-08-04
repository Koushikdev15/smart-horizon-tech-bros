import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import PageHeader from '../../../components/PageHeader';
import BatchStatusBadge from '../../../components/BatchStatusBadge';
import { mockMembers } from '../../../lib/mockData';
import { CheckCircle, XCircle, Eye, Leaf, FlaskConical, Factory, Truck, Shield } from 'lucide-react';
import type { Member } from '../../../types';

const roleIcons: Record<string, React.ElementType> = {
  'Collection Center': Leaf,
  'Processing & Laboratory': FlaskConical,
  'Manufacturer': Factory,
  'Supply Chain': Truck,
  'Government': Shield,
};

export default function PendingApprovals() {
  const [members, setMembers] = useState<Member[]>(mockMembers);
  const [selected, setSelected] = useState<Member | null>(null);

  const pending = members.filter((m) => m.status === 'Pending');

  const handleAction = (id: string, action: 'Active' | 'Rejected' | 'Suspended') => {
    setMembers((prev) => prev.map((m) => m.id === id ? { ...m, status: action } : m));
    const actionLabel = action === 'Active' ? 'Approved' : action;
    toast.success(`Member ${actionLabel.toLowerCase()}. ${action === 'Active' ? 'Credentials will be issued via email.' : ''}`);
    setSelected(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Pending Approvals"
        description="Review and process new member registration requests"
        badge={<Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">{pending.length} Pending</Badge>}
      />

      {pending.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <CheckCircle className="w-12 h-12 text-primary mx-auto mb-3" />
            <h3 className="font-semibold">All clear!</h3>
            <p className="text-sm text-muted-foreground mt-1">No pending approvals at this time.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending Registration Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((m) => {
                  const RoleIcon = roleIcons[m.role] || Leaf;
                  return (
                    <TableRow key={m.id} className="table-row-hover">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/16 flex items-center justify-center text-xs font-bold text-primary">
                            {m.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{m.name}</p>
                            <p className="text-xs text-muted-foreground">{m.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm">
                          <RoleIcon className="w-3.5 h-3.5 text-muted-foreground" />
                          {m.role}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{m.organizationName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{m.region}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(m.registeredDate).toLocaleDateString('en-IN')}</TableCell>
                      <TableCell><BatchStatusBadge status={m.status} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <Button size="sm" variant="ghost" onClick={() => setSelected(m)} className="h-7 px-2">
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" onClick={() => handleAction(m.id, 'Active')} className="h-7 px-2 bg-primary hover:bg-primary text-white">
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleAction(m.id, 'Rejected')} className="h-7 px-2 border-red-200 text-red-600 hover:bg-red-50">
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Detail Dialog */}
      {selected && (
        <Dialog open onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Registration Details</DialogTitle>
              <DialogDescription>Review member information before approval</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {[
                ['Full Name', selected.name],
                ['Organization', selected.organizationName],
                ['Role', selected.role],
                ['Email', selected.email],
                ['Phone', selected.phone],
                ['Region', selected.region || 'N/A'],
                ['GST', selected.gst || 'N/A'],
                ['PAN', selected.pan || 'N/A'],
                ['License', selected.licenseNumber || 'N/A'],
                ['Applied On', new Date(selected.registeredDate).toLocaleDateString('en-IN')],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={() => handleAction(selected.id, 'Active')} className="flex-1 bg-primary hover:bg-primary text-white">
                <CheckCircle className="w-4 h-4 mr-1.5" /> Approve & Issue Credentials
              </Button>
              <Button variant="outline" onClick={() => handleAction(selected.id, 'Rejected')} className="flex-1 border-red-200 text-red-600 hover:bg-red-50">
                <XCircle className="w-4 h-4 mr-1.5" /> Reject
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
