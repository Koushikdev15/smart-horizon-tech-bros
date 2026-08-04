import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import PageHeader from '../../../components/PageHeader';
import BatchStatusBadge from '../../../components/BatchStatusBadge';
import StatsCard from '../../../components/StatsCard';
import { mockReports } from '../../../lib/mockData';
import { toast } from 'sonner';
import { FileText, Download, TrendingUp, CreditCard, ShieldCheck, Users } from 'lucide-react';

const typeIcons: Record<string, React.ElementType> = {
  'Compliance': ShieldCheck,
  'Financial': CreditCard,
  'Quality': TrendingUp,
  'Batch Summary': FileText,
  'Member Activity': Users,
};

const typeColors: Record<string, string> = {
  'Compliance': 'text-violet-600',
  'Financial': 'text-primary',
  'Quality': 'text-amber-600',
  'Batch Summary': 'text-blue-600',
  'Member Activity': 'text-cyan-600',
};

export default function Reports() {
  const [filter, setFilter] = useState<string>('All');

  const types = ['All', 'Compliance', 'Financial', 'Quality', 'Batch Summary', 'Member Activity'];
  const filtered = filter === 'All' ? mockReports : mockReports.filter((r) => r.type === filter);
  const ready = mockReports.filter((r) => r.status === 'Ready').length;

  const handleDownload = (title: string, format: string) => {
    toast.success(`Downloading "${title}"...`);
    
    let mockContent = '';
    let mimeType = 'text/plain';
    const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_report.${format.toLowerCase()}`;
    
    if (format.toUpperCase() === 'CSV') {
      mockContent = `"Report Title","Generated At","Period"\n"${title}","${new Date().toISOString()}","Monthly"\n`;
      mimeType = 'text/csv;charset=utf-8;';
    } else {
      mockContent = `%PDF-1.4\n% AyuTrace+ Certified Report: ${title}\n% Generated: ${new Date().toLocaleDateString('en-IN')}`;
      mimeType = 'application/pdf';
    }
    
    const blob = new Blob([mockContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Reports"
        description="Generate and download system reports across compliance, finance, and quality"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard title="Total Reports" value={mockReports.length} icon={FileText} iconColor="text-primary" iconBg="bg-primary/6 dark:bg-primary/14" />
        <StatsCard title="Ready to Download" value={ready} icon={Download} iconColor="text-blue-600" iconBg="bg-blue-50 dark:bg-blue-950/40" />
        <StatsCard title="This Month" value={mockReports.filter((r) => r.period.includes('Jul 2026')).length} icon={TrendingUp} iconColor="text-amber-600" iconBg="bg-amber-50 dark:bg-amber-950/40" />
        <StatsCard title="Generating" value={mockReports.filter((r) => r.status === 'Generating').length} icon={ShieldCheck} iconColor="text-violet-600" iconBg="bg-violet-50 dark:bg-violet-950/40" />
      </div>

      <div className="flex flex-wrap gap-2">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${filter === t ? 'bg-primary text-white border-primary/50' : 'border-border text-muted-foreground hover:bg-muted'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Available Reports</CardTitle>
          <CardDescription>Generated from live system data, updated periodically</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Generated</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => {
                const Icon = typeIcons[r.type] || FileText;
                return (
                  <TableRow key={r.id} className="table-row-hover">
                    <TableCell className="text-sm font-medium max-w-72">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 shrink-0 ${typeColors[r.type]}`} />
                        <span className="truncate">{r.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className={`text-sm ${typeColors[r.type]}`}>{r.type}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.period}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(r.generatedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{r.format}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.sizeKb > 0 ? `${(r.sizeKb / 1024).toFixed(2)} MB` : '—'}</TableCell>
                    <TableCell><BatchStatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={r.status !== 'Ready'}
                        onClick={() => handleDownload(r.title, r.format)}
                        className="h-7 text-xs"
                      >
                        <Download className="w-3 h-3 mr-1" /> Download
                      </Button>
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
