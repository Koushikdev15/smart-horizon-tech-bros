import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '../../../components/PageHeader';
import QrCode from '../../../components/QrCode';
import { TextField, SelectField, NotesField } from '../../../components/FormFields';

import { toast } from 'sonner';
import {
  Leaf, Sparkles, Loader2, CheckCircle2, AlertTriangle,
  QrCode as QrIcon, ExternalLink, Boxes,
} from 'lucide-react';
import type { Batch, Product, ProductComponent } from '../../../types';
import { useBatchStore, useBatchesLive } from '../../../store/useBatchStore';
import { useProductStore, useProductsLive } from '../../../store/useProductStore';
import { useAuthStore } from '../../../store/authStore';
import { summariseProduct } from '../checkInSummary';
import { verifyUrlFor, verifyBaseUrl, isUnreachableFromPhone } from '../../../lib/verifyUrl';
import {
  PRODUCT_CATEGORIES, PACKAGING_TYPES, FORMULATIONS, QC_RESULTS,
} from '../checkInConfig';

const BLANK = {
  productName: '', category: '', formulation: '',
  manufacturingDate: new Date().toISOString().slice(0, 10), expiryDate: '', shelfLife: '',
  batchSize: '', unitsProduced: '', packagingType: '', packSize: '',
  manufacturingLicense: '', gmpCertificate: '', ayushLicense: '',
  finalMoisture: '', finalAssay: '', microbialClearance: 'Pass', stabilityStudy: '',
  qcApprovedBy: '', producedBy: '',
  dosage: '', indications: '', contraindications: '', storageConditions: '', mrp: '',
  remarks: '',
};

function Section({ title, step, children }: { title: string; step: number; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
          {step}
        </span>
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

/** Six random base-36 characters — enough to make a product code unguessable. */
const randomSuffix = () =>
  Array.from({ length: 6 }, () => Math.floor(Math.random() * 36).toString(36).toUpperCase()).join('');

export default function CreateProduct() {
  useBatchesLive();
  useProductsLive();

  const batches = useBatchStore((s) => s.batches);
  const patchBatch = useBatchStore((s) => s.patchBatch);
  const addProduct = useProductStore((s) => s.addProduct);
  const user = useAuthStore((s) => s.user);

  /**
   * Only batches whose goods-inward check has actually cleared may be
   * formulated. A quarantined batch is deliberately excluded — that is the
   * whole point of quarantining it.
   */
  const eligible = useMemo(
    () =>
      batches.filter(
        (b) => b.manufacturerCheckIn && b.manufacturerCheckIn.decision !== 'Quarantined',
      ),
    [batches],
  );

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  /** Quantity drawn from each batch, keyed by batch id. */
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [form, setForm] = useState(BLANK);
  const [summary, setSummary] = useState('');
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<Product | null>(null);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const toggle = (batch: Batch) => {
    setSummary('');
    setSelectedIds((ids) =>
      ids.includes(batch.id) ? ids.filter((i) => i !== batch.id) : [...ids, batch.id],
    );
    setQuantities((q) =>
      q[batch.id] ? q : { ...q, [batch.id]: String(batch.quantity ?? '') },
    );
  };

  const chosen = eligible.filter((b) => selectedIds.includes(b.id));

  const components: ProductComponent[] = chosen.map((b) => ({
    batchId: b.id,
    batchNumber: b.batchNumber,
    species: b.species,
    botanicalName: b.botanicalName,
    quantityUsed: Number(quantities[b.id]) || 0,
    unit: b.unit,
    collectionCenter: b.collectionCenter,
    collectorName: b.collectorName,
    collectorType: b.collectorType,
    region: b.region,
    harvestDate: b.harvestDate,
    labCertificate: b.labCertificate,
  }));

  const totalQuantity = components.reduce((s, c) => s + c.quantityUsed, 0);

  // A quantity drawn cannot exceed what was received — catching this here is
  // cheaper than reconciling a negative stock balance later.
  const overdrawn = chosen.filter((b) => (Number(quantities[b.id]) || 0) > (b.quantity ?? 0));

  const buildProduct = (): Product => {
    const productCode = `AYUR-PRD-${randomSuffix()}`;
    return {
      id: productCode,
      productCode,
      productName: form.productName,
      category: form.category,
      formulation: form.formulation || undefined,
      components,
      manufacturingDate: form.manufacturingDate,
      expiryDate: form.expiryDate,
      shelfLife: form.shelfLife || undefined,
      batchSize: form.batchSize || undefined,
      unitsProduced: form.unitsProduced || undefined,
      packagingType: form.packagingType || undefined,
      packSize: form.packSize || undefined,
      manufacturerName: user?.organizationName || user?.name || 'Manufacturer',
      manufacturingLicense: form.manufacturingLicense || undefined,
      gmpCertificate: form.gmpCertificate || undefined,
      ayushLicense: form.ayushLicense || undefined,
      finalMoisture: form.finalMoisture || undefined,
      finalAssay: form.finalAssay || undefined,
      microbialClearance: form.microbialClearance as Product['microbialClearance'],
      stabilityStudy: form.stabilityStudy || undefined,
      qcApprovedBy: form.qcApprovedBy || undefined,
      producedBy: form.producedBy || undefined,
      dosage: form.dosage || undefined,
      indications: form.indications || undefined,
      contraindications: form.contraindications || undefined,
      storageConditions: form.storageConditions || undefined,
      mrp: form.mrp || undefined,
      remarks: form.remarks || undefined,
      qrCode: verifyUrlFor(productCode),
      timeline: [],
      createdAt: new Date().toISOString(),
      status: 'Released',
    };
  };

  const handleGenerateSummary = () => {
    if (!components.length || !form.productName) {
      toast.error('Select at least one batch and name the product first.');
      return;
    }
    setSummary(summariseProduct(buildProduct()));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!components.length) {
      toast.error('Select at least one checked-in batch.');
      return;
    }
    if (overdrawn.length) {
      toast.error(`Quantity exceeds what was received for ${overdrawn.map((b) => b.batchNumber).join(', ')}.`);
      return;
    }
    if (!summary) {
      toast.error('Generate the product summary before releasing.');
      return;
    }

    setSaving(true);
    const draft = buildProduct();
    const product: Product = {
      ...draft,
      aiSummary: summary,
      timeline: [
        {
          stage: 'Manufacturing',
          timestamp: new Date().toISOString(),
          organization: draft.manufacturerName,
          user: form.producedBy || user?.name || 'Production Manager',
          status: 'Completed',
          remarks:
            `${draft.productName} released from ${components.length} ` +
            `${components.length === 1 ? 'batch' : 'batches'} (${components.map((c) => c.batchNumber).join(', ')}).`,
        },
      ],
    };

    try {
      const saved = await addProduct(product);

      // Record the consumption on each constituent batch so the link is
      // visible from the batch side too, not only from the product.
      await Promise.all(
        chosen.map((b) =>
          patchBatch(b.id, {
            usedInProducts: [...(b.usedInProducts ?? []), saved.productCode],
          }),
        ),
      );

      setCreated(saved);
      setSelectedIds([]);
      setQuantities({});
      setForm(BLANK);
      setSummary('');
      toast.success('Product released. QR code generated.');
    } catch {
      toast.error('Could not save the product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Create Product"
        description="Formulate a finished product from one or more checked-in batches, and generate its traceability QR code"
      />

      {/* ── Batch selection ─────────────────────────────────────────────── */}
      <Card>
        <CardContent className="py-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-heading font-semibold text-sm flex items-center gap-2">
                <Boxes className="w-4 h-4 text-blue-600" />
                Available Batches
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Only batches that have completed goods-inward check-in can be used.
              </p>
            </div>
            {selectedIds.length > 0 && (
              <span className="text-xs font-semibold text-blue-600 shrink-0">
                {selectedIds.length} selected · {totalQuantity} kg
              </span>
            )}
          </div>

          {eligible.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <AlertTriangle className="w-8 h-8 text-muted-foreground/50 mx-auto" />
              <p className="text-sm text-muted-foreground">
                No batches are checked in yet.
              </p>
              <p className="text-xs text-muted-foreground">
                Complete a goods-inward check in <span className="font-medium">Requests</span> to make a batch available here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {eligible.map((batch) => {
                const isSelected = selectedIds.includes(batch.id);
                const qty = Number(quantities[batch.id]) || 0;
                const tooMuch = qty > (batch.quantity ?? 0);
                return (
                  <div
                    key={batch.id}
                    className={`rounded-xl border p-3 transition-colors ${
                      isSelected ? 'border-blue-500/60 bg-blue-50/50 dark:bg-blue-950/20' : 'border-border/60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggle(batch)}
                        className="w-4 h-4 mt-0.5 rounded shrink-0 accent-blue-600"
                        aria-label={`Use batch ${batch.batchNumber}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-sm">{batch.batchNumber}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                            Checked In
                          </span>
                          {batch.usedInProducts?.length ? (
                            <span className="text-[10px] text-muted-foreground">
                              already in {batch.usedInProducts.length}{' '}
                              {batch.usedInProducts.length === 1 ? 'product' : 'products'}
                            </span>
                          ) : null}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Leaf className="w-3 h-3" />
                            {batch.species}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {batch.quantity} {batch.unit} received
                          </span>
                          <span className="text-xs text-muted-foreground">{batch.region}</span>
                          {batch.labCertificate && (
                            <span className="text-xs text-muted-foreground font-mono">{batch.labCertificate}</span>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="shrink-0 w-32">
                          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            Quantity used
                          </Label>
                          <Input
                            className={`h-8 text-sm ${tooMuch ? 'border-destructive' : ''}`}
                            value={quantities[batch.id] ?? ''}
                            onChange={(e) => {
                              setSummary('');
                              setQuantities((q) => ({ ...q, [batch.id]: e.target.value }));
                            }}
                            placeholder={`max ${batch.quantity}`}
                          />
                          {tooMuch && (
                            <p className="text-[10px] text-destructive mt-0.5">
                              Exceeds {batch.quantity} {batch.unit}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Product details ─────────────────────────────────────────────── */}
      <form onSubmit={handleCreate} className="space-y-4">
        <fieldset disabled={selectedIds.length === 0} className="space-y-4 disabled:opacity-50">
          <Section title="Product Identity" step={1}>
            <TextField label="Product Name" value={form.productName} onChange={(v) => set('productName', v)} required placeholder="e.g. Ashwagandha Capsules 500 mg" />
            <SelectField label="Category" value={form.category} onChange={(v) => set('category', v)} options={PRODUCT_CATEGORIES} required />
            <SelectField label="Formulation Type" value={form.formulation} onChange={(v) => set('formulation', v)} options={FORMULATIONS} span />
          </Section>

          <Section title="Manufacturing Record" step={2}>
            <TextField label="Manufacturing Date" type="date" value={form.manufacturingDate} onChange={(v) => set('manufacturingDate', v)} required />
            <TextField label="Expiry Date" type="date" value={form.expiryDate} onChange={(v) => set('expiryDate', v)} required />
            <TextField label="Shelf Life" value={form.shelfLife} onChange={(v) => set('shelfLife', v)} placeholder="e.g. 24 months" />
            <TextField label="Batch Size" value={form.batchSize} onChange={(v) => set('batchSize', v)} placeholder="e.g. 100 kg" />
            <TextField label="Units Produced" value={form.unitsProduced} onChange={(v) => set('unitsProduced', v)} placeholder="e.g. 10000" />
            <SelectField label="Packaging Type" value={form.packagingType} onChange={(v) => set('packagingType', v)} options={PACKAGING_TYPES} required />
            <TextField label="Pack Size" value={form.packSize} onChange={(v) => set('packSize', v)} placeholder="e.g. 60 capsules" />
            <TextField label="Produced By" value={form.producedBy} onChange={(v) => set('producedBy', v)} placeholder="Production manager" />
          </Section>

          <Section title="Licensing" step={3}>
            <TextField label="Manufacturing Licence" value={form.manufacturingLicense} onChange={(v) => set('manufacturingLicense', v)} placeholder="e.g. AY/MFG/2024/1182" />
            <TextField label="GMP Certificate" value={form.gmpCertificate} onChange={(v) => set('gmpCertificate', v)} />
            <TextField label="AYUSH Licence" value={form.ayushLicense} onChange={(v) => set('ayushLicense', v)} span />
          </Section>

          <Section title="Finished-Product QC" step={4}>
            <TextField label="Final Moisture (%)" value={form.finalMoisture} onChange={(v) => set('finalMoisture', v)} />
            <TextField label="Final Assay" value={form.finalAssay} onChange={(v) => set('finalAssay', v)} placeholder="e.g. Withanolides 2.6%" />
            <SelectField label="Microbial Clearance" value={form.microbialClearance} onChange={(v) => set('microbialClearance', v)} options={QC_RESULTS} />
            <TextField label="Stability Study" value={form.stabilityStudy} onChange={(v) => set('stabilityStudy', v)} placeholder="e.g. 6 months accelerated, passed" />
            <TextField label="QC Approved By" value={form.qcApprovedBy} onChange={(v) => set('qcApprovedBy', v)} span placeholder="Quality manager releasing the product" />
          </Section>

          <Section title="Consumer Label" step={5}>
            <TextField label="Dosage" value={form.dosage} onChange={(v) => set('dosage', v)} placeholder="e.g. 1–2 capsules twice daily after meals" />
            <TextField label="MRP" value={form.mrp} onChange={(v) => set('mrp', v)} placeholder="e.g. 450" />
            <TextField label="Indications" value={form.indications} onChange={(v) => set('indications', v)} span />
            <TextField label="Contraindications" value={form.contraindications} onChange={(v) => set('contraindications', v)} span />
            <TextField label="Storage Conditions" value={form.storageConditions} onChange={(v) => set('storageConditions', v)} span placeholder="Store below 25 C, away from direct sunlight" />
            <NotesField label="Remarks" value={form.remarks} onChange={(v) => set('remarks', v)} />
          </Section>

          {/* Summary gate */}
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Product Summary
              </h4>
              <Button type="button" size="sm" variant="outline" onClick={handleGenerateSummary} className="h-7 text-xs">
                {summary ? 'Regenerate' : 'Generate Summary'}
              </Button>
            </div>
            {summary ? (
              <p className="text-xs leading-relaxed text-muted-foreground">{summary}</p>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Generate the summary to review the full provenance statement before releasing the product.
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={saving || !summary || overdrawn.length > 0}
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Releasing product…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <QrIcon className="w-5 h-5" /> Release Product & Generate QR Code
              </span>
            )}
          </Button>
        </fieldset>
      </form>

      {created && (
        <ProductQrDialog product={created} onClose={() => setCreated(null)} />
      )}
    </div>
  );
}

function ProductQrDialog({ product, onClose }: { product: Product; onClose: () => void }) {
  // Built from the current origin, not from the URL stored at creation time —
  // otherwise a product created on localhost carries a dead QR forever.
  const verifyUrl = verifyUrlFor(product.productCode);
  const unreachable = isUnreachableFromPhone();

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Product Released
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-4 space-y-4">
          <div className="p-4 bg-white rounded-2xl border-2 border-primary/20 shadow-sm">
            <QrCode value={verifyUrl} size={200} />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-bold">{product.productName}</p>
            <p className="text-xs font-mono text-muted-foreground">{product.productCode}</p>
            <p className="text-[11px] text-muted-foreground break-all">{verifyUrl}</p>
          </div>

          {unreachable ? (
            <div className="w-full rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                A phone cannot open this code
              </p>
              <p>
                It points at <span className="font-mono">{verifyBaseUrl()}</span>, which only this
                machine can reach. Open the app on your network address instead, or set{' '}
                <span className="font-mono">VITE_PUBLIC_BASE_URL</span> in{' '}
                <span className="font-mono">.env</span> — the code is rebuilt from wherever you load
                the app, so no product needs recreating.
              </p>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground text-center">
              Scan with any phone camera to view the full farm-to-shelf trace.
            </p>
          )}
          <div className="w-full pt-3 border-t border-border flex gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl text-xs"
              onClick={() => window.open(`/verify/${product.productCode}`, '_blank')}
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1" /> Open Portal
            </Button>
            <Button className="flex-1 rounded-xl text-xs" onClick={() => window.print()}>
              Print Label
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
