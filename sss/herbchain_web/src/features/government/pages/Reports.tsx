import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PageHeader from '../../../components/PageHeader';
import { useNetworkStats } from '../useNetworkStats';
import { useAuditTrail } from '../useAuditTrail';
import { downloadCsv } from '../../../lib/exportCsv';
import { toast } from 'sonner';
import {
  FileSpreadsheet, Download, Loader2, Boxes, Package, ScrollText,
  FlaskConical, MapPin, ShieldAlert,
} from 'lucide-react';

/**
 * Reports, generated from the live ledger at the moment you ask for them.
 *
 * The previous version listed a fixed set of pretend files and "downloaded" a
 * couple of hand-written lines — a CSV containing only its own title, or a
 * string beginning "%PDF-1.4" that was not a PDF. These build real rows from
 * the current data.
 */

interface ReportDef {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  /** Rows available right now — shown so an empty report is obvious up front. */
  count: number;
  build: () => { headers: string[]; rows: unknown[][] };
}

export default function Reports() {
  const s = useNetworkStats();
  const audit = useAuditTrail();
  const [busy, setBusy] = useState<string | null>(null);

  const batches = s.inventoryAll ?? [];

  const reports: ReportDef[] = [
    {
      id: 'batch-register',
      title: 'Batch Register',
      description: 'Every batch on the ledger with origin, collector, quantity and current stage',
      icon: Boxes,
      count: batches.length,
      build: () => ({
        headers: [
          'Batch Number', 'Species', 'Botanical Name', 'Quantity', 'Unit', 'Grade',
          'Collector', 'Collector Type', 'Collection Centre', 'Region', 'Harvest Date',
          'Status', 'Lab Certificate', 'Lab Result', 'Used In Products',
        ],
        rows: batches.map((b) => [
          b.batchNumber, b.species, b.botanicalName ?? '', b.quantity, b.unit,
          b.estimatedGrade ?? '', b.collectorName, b.collectorType ?? '',
          b.collectionCenter, b.region, b.harvestDate, b.status,
          b.labCertificate ?? '', b.labReport?.overallResult ?? '',
          (b.usedInProducts ?? []).join('; '),
        ]),
      }),
    },
    {
      id: 'quality',
      title: 'Quality & Compliance',
      description: 'Laboratory results per batch against pharmacopoeial limits',
      icon: FlaskConical,
      count: batches.filter((b) => b.labReport).length,
      build: () => ({
        headers: [
          'Batch Number', 'Species', 'Laboratory', 'NABL', 'Certificate', 'Test Date',
          'Moisture %', 'Total Ash %', 'Lead ppm', 'Cadmium ppm', 'Arsenic ppm',
          'Mercury ppm', 'DNA Authentication', 'Pesticides', 'Overall Result', 'Analyst',
        ],
        rows: batches
          .filter((b) => b.labReport)
          .map((b) => {
            const r = b.labReport!;
            return [
              b.batchNumber, b.species, r.labName ?? '', r.nablNumber ?? '',
              r.certificateNumber ?? b.labCertificate ?? '', r.testDate ?? '',
              r.moisture ?? '', r.totalAsh ?? '', r.lead ?? '', r.cadmium ?? '',
              r.arsenic ?? '', r.mercury ?? '', r.dnaAuthentication ?? '',
              r.pesticides ?? '', r.overallResult ?? '', r.analyst ?? '',
            ];
          }),
      }),
    },
    {
      id: 'products',
      title: 'Product Register',
      description: 'Released products, their source batches and distribution status',
      icon: Package,
      count: s.products.length,
      build: () => ({
        headers: [
          'Product Code', 'Product Name', 'Category', 'Formulation', 'Manufacturer',
          'Manufactured', 'Expires', 'Batch Size', 'Units', 'Packaging', 'MRP',
          'Licence', 'Source Batches', 'Source Herbs', 'Delivery Status', 'Destination',
        ],
        rows: s.products.map((p) => [
          p.productCode, p.productName, p.category, p.formulation ?? '',
          p.manufacturerName, p.manufacturingDate, p.expiryDate,
          p.batchSize ?? '', p.unitsProduced ?? '', p.packagingType ?? '', p.mrp ?? '',
          p.manufacturingLicense ?? '',
          p.components.map((c) => c.batchNumber).join('; '),
          p.components.map((c) => `${c.species} ${c.quantityUsed}${c.unit}`).join('; '),
          p.distribution?.deliveryStatus ?? 'Not dispatched',
          p.distribution?.destination ?? '',
        ]),
      }),
    },
    {
      id: 'traceability',
      title: 'Traceability Matrix',
      description: 'One row per product-batch link — the farm-to-shelf mapping',
      icon: MapPin,
      count: s.products.reduce((t, p) => t + p.components.length, 0),
      build: () => ({
        headers: [
          'Product Code', 'Product Name', 'Batch Number', 'Species', 'Quantity Used',
          'Unit', 'Collector', 'Collector Type', 'Collection Centre', 'Region',
          'Harvest Date', 'Lab Certificate',
        ],
        rows: s.products.flatMap((p) =>
          p.components.map((c) => [
            p.productCode, p.productName, c.batchNumber, c.species, c.quantityUsed,
            c.unit, c.collectorName, c.collectorType ?? '', c.collectionCenter,
            c.region, c.harvestDate, c.labCertificate ?? '',
          ]),
        ),
      }),
    },
    {
      id: 'exceptions',
      title: 'Exception Report',
      description: 'Rejected, quarantined, failed and expired items requiring attention',
      icon: ShieldAlert,
      count: s.counts.flagged,
      build: () => {
        const rows: unknown[][] = [];
        batches.forEach((b) => {
          const issues: string[] = [];
          if (b.status === 'Rejected') issues.push('Batch rejected');
          if (b.labCheckIn?.decision === 'Quarantined') issues.push('Quarantined at laboratory');
          if (b.manufacturerCheckIn?.decision === 'Quarantined') issues.push('Quarantined at manufacturer');
          if (b.labReport?.overallResult === 'Fail') issues.push('Failed laboratory testing');
          if (issues.length) {
            rows.push([
              'Batch', b.batchNumber, b.species, b.collectionCenter, b.region,
              issues.join('; '), b.harvestDate,
            ]);
          }
        });
        s.products.forEach((p) => {
          const issues: string[] = [];
          if (p.status === 'Recalled') issues.push('Product recalled');
          if (p.expiryDate && new Date(p.expiryDate) < new Date()) issues.push('Past expiry');
          if (issues.length) {
            rows.push([
              'Product', p.productCode, p.productName, p.manufacturerName, '',
              issues.join('; '), p.expiryDate,
            ]);
          }
        });
        return {
          headers: ['Type', 'Reference', 'Name', 'Organisation', 'Region', 'Issues', 'Date'],
          rows,
        };
      },
    },
    {
      id: 'audit',
      title: 'Full Audit Trail',
      description: 'Every recorded event across batches and products',
      icon: ScrollText,
      count: audit.counts.total,
      build: () => ({
        headers: ['Timestamp', 'Entity', 'Type', 'Stage', 'Status', 'Organisation', 'User', 'Remarks'],
        rows: audit.events.map((e) => [
          e.timestamp, e.entity, e.entityKind, e.stage, e.status,
          e.organization, e.user, e.remarks ?? '',
        ]),
      }),
    },
  ];

  const handleDownload = (r: ReportDef) => {
    setBusy(r.id);
    try {
      const { headers, rows } = r.build();
      if (!rows.length) {
        toast.error(`${r.title} has no rows yet.`);
        return;
      }
      downloadCsv(
        `ayurtrace-${r.id}-${new Date().toISOString().slice(0, 10)}.csv`,
        headers,
        rows,
      );
      toast.success(`${r.title} — ${rows.length} rows exported.`);
    } catch (err) {
      console.error('Report generation failed:', err);
      toast.error('Could not generate that report.');
    } finally {
      setBusy(null);
    }
  };

  if (s.loading && s.counts.batches === 0) {
    return (
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading ledger…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Reports"
        description="Generated from the live ledger at the moment you download them"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {reports.map((r) => (
          <Card key={r.id} className="hover:shadow-md transition-shadow">
            <CardContent className="py-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center shrink-0">
                <r.icon className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">{r.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>
                <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3 h-3 shrink-0" />
                  {r.count.toLocaleString('en-IN')} {r.count === 1 ? 'row' : 'rows'} available
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs shrink-0"
                disabled={busy === r.id || r.count === 0}
                onClick={() => handleDownload(r)}
              >
                {busy === r.id
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <><Download className="w-3.5 h-3.5 mr-1" /> CSV</>}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Files are UTF-8 CSV with a byte-order mark, so botanical names and currency symbols
        open correctly in Excel.
      </p>
    </div>
  );
}
