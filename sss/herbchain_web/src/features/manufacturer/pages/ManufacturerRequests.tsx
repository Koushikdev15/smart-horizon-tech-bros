import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '../../../components/PageHeader';
import BatchStatusBadge from '../../../components/BatchStatusBadge';
import BatchTraceability from '../../../components/BatchTraceability';
import LabReportPdfModal from '../../../components/LabReportPdfModal';
import { TextField, SelectField, ChoiceField, NotesField } from '../../../components/FormFields';

import { toast } from 'sonner';
import {
  Factory, Leaf, Award, Package, ClipboardCheck, CheckCircle2,
  Sparkles, AlertTriangle, Loader2,
} from 'lucide-react';
import type { Batch, ManufacturerCheckIn } from '../../../types';
import { useBatchStore, useBatchesLive } from '../../../store/useBatchStore';
import { useAuthStore } from '../../../store/authStore';
import { summariseManufacturerCheckIn } from '../checkInSummary';
import {
  YES_NO, TAMPER, TRANSPORT_MODES, PACKAGING_CONDITION,
  VISUAL_CONDITION, CHECKIN_DECISIONS, CHECKIN_LIMITS,
} from '../checkInConfig';

type CheckInForm = Record<string, string>;

const BLANK: CheckInForm = {
  receivedAt: '', receivedBy: '', facilityName: '',
  transporter: '', vehicleNumber: '', transportMode: '', transitDuration: '',
  coaReceived: 'Yes', coaNumber: '', coaMatchesBatch: 'Yes', coaWithinValidity: 'Yes',
  labResultReviewed: 'Yes',
  sealIntact: 'Yes', tamperEvidence: 'None', packagingCondition: 'Intact', containerCount: '',
  declaredWeight: '', receivedWeight: '',
  visualCondition: 'Good', colourAcceptable: 'Yes', odourAcceptable: 'Yes',
  mouldPresent: 'No', pestPresent: 'No', foreignMatterVisible: 'No',
  moistureOnArrival: '', storageTemperature: '', storageHumidity: '',
  retestRequired: 'No', sampleDrawn: 'Yes', sampleId: '', sampleQuantity: '',
  gmpAreaVerified: 'Yes', storageLocation: '', shelfLifeRemaining: '',
  discrepancyNotes: '', decision: 'Accepted',
};

/** Section wrapper — keeps the long form readable. */
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

export default function ManufacturerRequests() {
  // Live batches from Supabase, shared across every role.
  useBatchesLive();
  const storeBatches = useBatchStore((s) => s.batches);
  const patchBatch = useBatchStore((s) => s.patchBatch);
  const rejectBatch = useBatchStore((s) => s.rejectBatch);
  const user = useAuthStore((s) => s.user);

  const batches = storeBatches.filter(
    (b) => b.status === 'Manufacturing' || b.status === 'Completed',
  );

  const [selected, setSelected] = useState<Batch | null>(null);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [pdfBatch, setPdfBatch] = useState<Batch | null>(null);
  const [processing, setProcessing] = useState(false);
  const [form, setForm] = useState<CheckInForm>(BLANK);
  const [summary, setSummary] = useState('');

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const openCheckIn = (batch: Batch) => {
    setSelected(batch);
    setSummary('');
    setForm({
      ...BLANK,
      receivedAt: new Date().toISOString().slice(0, 16),
      receivedBy: user?.name ?? '',
      facilityName: user?.organizationName ?? '',
      coaNumber: batch.labCertificate ?? '',
      declaredWeight: String(batch.quantity ?? ''),
    });
    setShowCheckIn(true);
  };

  // Live reconciliation — the figure a dispute usually turns on, so it is
  // surfaced while the receiver is still standing at the consignment.
  const declared = Number(form.declaredWeight);
  const received = Number(form.receivedWeight);
  const variance =
    declared > 0 && received > 0 ? ((received - declared) / declared) * 100 : null;
  const varianceFlagged =
    variance !== null && Math.abs(variance) > CHECKIN_LIMITS.weightVariancePercent;

  const buildRecord = (): ManufacturerCheckIn => ({
    receivedAt: form.receivedAt,
    receivedBy: form.receivedBy,
    facilityName: form.facilityName || undefined,
    transporter: form.transporter || undefined,
    vehicleNumber: form.vehicleNumber || undefined,
    transportMode: form.transportMode || undefined,
    transitDuration: form.transitDuration || undefined,
    coaReceived: form.coaReceived as 'Yes' | 'No',
    coaNumber: form.coaNumber || undefined,
    coaMatchesBatch: form.coaMatchesBatch as 'Yes' | 'No',
    coaWithinValidity: form.coaWithinValidity as 'Yes' | 'No',
    labResultReviewed: form.labResultReviewed as 'Yes' | 'No',
    sealIntact: form.sealIntact as 'Yes' | 'No',
    tamperEvidence: form.tamperEvidence as ManufacturerCheckIn['tamperEvidence'],
    packagingCondition: form.packagingCondition || undefined,
    containerCount: form.containerCount || undefined,
    declaredWeight: form.declaredWeight || undefined,
    receivedWeight: form.receivedWeight || undefined,
    weightVariance: variance !== null ? `${variance.toFixed(1)}%` : undefined,
    visualCondition: form.visualCondition || undefined,
    colourAcceptable: form.colourAcceptable as 'Yes' | 'No',
    odourAcceptable: form.odourAcceptable as 'Yes' | 'No',
    mouldPresent: form.mouldPresent as 'Yes' | 'No',
    pestPresent: form.pestPresent as 'Yes' | 'No',
    foreignMatterVisible: form.foreignMatterVisible as 'Yes' | 'No',
    moistureOnArrival: form.moistureOnArrival || undefined,
    storageTemperature: form.storageTemperature || undefined,
    storageHumidity: form.storageHumidity || undefined,
    retestRequired: form.retestRequired as 'Yes' | 'No',
    sampleDrawn: form.sampleDrawn as 'Yes' | 'No',
    sampleId: form.sampleId || undefined,
    sampleQuantity: form.sampleQuantity || undefined,
    gmpAreaVerified: form.gmpAreaVerified as 'Yes' | 'No',
    storageLocation: form.storageLocation || undefined,
    shelfLifeRemaining: form.shelfLifeRemaining || undefined,
    discrepancyNotes: form.discrepancyNotes || undefined,
    decision: form.decision as ManufacturerCheckIn['decision'],
  });

  const handleGenerateSummary = () => {
    if (!selected) return;
    setSummary(summariseManufacturerCheckIn(selected, buildRecord()));
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    if (!summary) {
      toast.error('Generate the check-in summary before completing.');
      return;
    }

    setProcessing(true);
    const record: ManufacturerCheckIn = { ...buildRecord(), aiSummary: summary };

    try {
      await patchBatch(
        selected.id,
        { manufacturerCheckIn: record },
        {
          stage: 'Manufacturing',
          timestamp: new Date().toISOString(),
          organization: record.facilityName || 'Manufacturer',
          user: record.receivedBy || 'Receiving Officer',
          status: record.decision === 'Quarantined' ? 'Pending' : 'Completed',
          remarks: `Goods-inward check-in — ${record.decision}. ${summary}`,
        },
      );

      setShowCheckIn(false);
      setSelected(null);
      setSummary('');
      toast.success(
        record.decision === 'Quarantined'
          ? 'Check-in recorded — batch quarantined and held from production.'
          : 'Check-in complete. Batch is now available in Create Product.',
      );
    } catch {
      toast.error('Could not save the check-in. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !rejectionReason.trim()) {
      toast.error('Please enter a reason for rejection.');
      return;
    }
    setProcessing(true);
    await rejectBatch(selected.id, 'Manufacturer', rejectionReason);
    setProcessing(false);
    setShowRejectForm(false);
    setRejectionReason('');
    setSelected(null);
    toast.error('Batch has been rejected.');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Manufacturing Requests"
        description="Certified batches from processing units — check each consignment in before it can be formulated into a product"
      />

      <div className="space-y-3">
        {batches.map((batch) => {
          const checkIn = batch.manufacturerCheckIn;
          const isCheckedIn = Boolean(checkIn);
          const quarantined = checkIn?.decision === 'Quarantined';

          return (
            <Card key={batch.id} className="hover:shadow-md transition-all duration-200">
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center shrink-0">
                    <Factory className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-sm">{batch.batchNumber}</span>
                      <BatchStatusBadge status={batch.status} />
                      {isCheckedIn && (
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            quarantined
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                          }`}
                        >
                          {quarantined ? 'Quarantined' : 'Checked In'}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Leaf className="w-3 h-3" />
                        {batch.species}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {batch.quantity} {batch.unit}
                      </span>
                      {batch.labCertificate && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPdfBatch(batch);
                          }}
                          className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold hover:text-primary/80 cursor-pointer"
                        >
                          <Award className="w-3.5 h-3.5" />
                          {batch.labCertificate} (PDF)
                        </button>
                      )}
                    </div>
                    {isCheckedIn && (
                      <div className="mt-1.5 flex items-center gap-2">
                        <ClipboardCheck className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground">
                          Received {checkIn?.receivedAt ? new Date(checkIn.receivedAt).toLocaleDateString('en-IN') : '—'}
                          {checkIn?.receivedBy ? ` by ${checkIn.receivedBy}` : ''} — {checkIn?.decision}
                        </span>
                      </div>
                    )}
                    {batch.usedInProducts?.length ? (
                      <div className="mt-1 flex items-center gap-2">
                        <Package className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs font-medium">
                          Used in {batch.usedInProducts.join(', ')}
                        </span>
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelected(batch);
                        setShowCheckIn(false);
                      }}
                      className="h-7 text-xs"
                    >
                      Timeline
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => openCheckIn(batch)}
                      variant={isCheckedIn ? 'outline' : 'default'}
                      className={`h-7 text-xs ${isCheckedIn ? '' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                    >
                      {isCheckedIn ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Re-check In
                        </>
                      ) : (
                        <>
                          <ClipboardCheck className="w-3 h-3 mr-1" /> Check In
                        </>
                      )}
                    </Button>
                    {!isCheckedIn && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelected(batch);
                          setShowRejectForm(true);
                        }}
                        className="h-7 text-xs"
                      >
                        Reject
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {batches.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No certified batches are awaiting manufacturing.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Timeline */}
      {selected && !showCheckIn && !showRejectForm && (
        <Dialog open onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-mono">{selected.batchNumber}</DialogTitle>
            </DialogHeader>
            <BatchTraceability batch={selected} />
          </DialogContent>
        </Dialog>
      )}

      {/* Reject */}
      {selected && showRejectForm && (
        <Dialog
          open
          onOpenChange={() => {
            setSelected(null);
            setShowRejectForm(false);
            setRejectionReason('');
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                Reject Batch: {selected.batchNumber}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleReject} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  Reason for Rejection <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Enter the specific reason for rejecting this batch"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowRejectForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="destructive" disabled={processing}>
                  {processing ? 'Rejecting…' : 'Confirm Rejection'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Goods-inward check-in */}
      {selected && showCheckIn && (
        <Dialog
          open
          onOpenChange={() => {
            setSelected(null);
            setShowCheckIn(false);
          }}
        >
          <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-blue-600" />
                Goods-Inward Check In: {selected.batchNumber}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCheckIn} className="space-y-4">
              <Section title="Receipt" step={1}>
                <TextField label="Received At" type="datetime-local" value={form.receivedAt} onChange={(v) => set("receivedAt", v)} required />
                <TextField label="Received By" value={form.receivedBy} onChange={(v) => set('receivedBy', v)} required placeholder="Receiving officer" />
                <TextField label="Manufacturing Unit" value={form.facilityName} onChange={(v) => set('facilityName', v)} span />
              </Section>

              <Section title="Inbound Consignment" step={2}>
                <SelectField label="Transport Mode" value={form.transportMode} onChange={(v) => set('transportMode', v)} options={TRANSPORT_MODES} />
                <TextField label="Transporter" value={form.transporter} onChange={(v) => set('transporter', v)} placeholder="Carrier name" />
                <TextField label="Vehicle Number" value={form.vehicleNumber} onChange={(v) => set('vehicleNumber', v)} placeholder="TN-38-XX-0000" />
                <TextField label="Time in Transit" value={form.transitDuration} onChange={(v) => set('transitDuration', v)} placeholder="e.g. 14 hours" />
              </Section>

              <Section title="Certificate of Analysis" step={3}>
                <ChoiceField label="CoA received with consignment?" value={form.coaReceived} onChange={(v) => set('coaReceived', v)} options={YES_NO} />
                <TextField label="Certificate Number" value={form.coaNumber} onChange={(v) => set('coaNumber', v)} placeholder="LAB-2026-0148" />
                <ChoiceField label="CoA matches this batch?" value={form.coaMatchesBatch} onChange={(v) => set('coaMatchesBatch', v)} options={YES_NO} />
                <ChoiceField label="CoA within validity?" value={form.coaWithinValidity} onChange={(v) => set('coaWithinValidity', v)} options={YES_NO} />
                <ChoiceField label="Laboratory results reviewed?" value={form.labResultReviewed} onChange={(v) => set('labResultReviewed', v)} options={YES_NO} />
              </Section>

              <Section title="Consignment Integrity" step={4}>
                <ChoiceField label="Seals intact?" value={form.sealIntact} onChange={(v) => set('sealIntact', v)} options={YES_NO} />
                <ChoiceField label="Tamper evidence" value={form.tamperEvidence} onChange={(v) => set('tamperEvidence', v)} options={TAMPER} />
                <SelectField label="Packaging Condition" value={form.packagingCondition} onChange={(v) => set('packagingCondition', v)} options={PACKAGING_CONDITION} />
                <TextField label="Container Count" value={form.containerCount} onChange={(v) => set('containerCount', v)} placeholder="e.g. 12 sacks" />
              </Section>

              <Section title="Quantity Reconciliation" step={5}>
                <TextField label="Declared Weight (kg)" value={form.declaredWeight} onChange={(v) => set('declaredWeight', v)} />
                <TextField label="Received Weight (kg)" value={form.receivedWeight} onChange={(v) => set('receivedWeight', v)} required />
                {variance !== null && (
                  <div
                    className={`md:col-span-2 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                      varianceFlagged
                        ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                        : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                    }`}
                  >
                    {varianceFlagged && <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                    Variance {variance > 0 ? '+' : ''}
                    {variance.toFixed(1)}%
                    {varianceFlagged
                      ? ` — beyond the ${CHECKIN_LIMITS.weightVariancePercent}% tolerance, record a discrepancy note below.`
                      : ' — within tolerance.'}
                  </div>
                )}
              </Section>

              <Section title="Condition on Arrival" step={6}>
                <SelectField label="Overall Visual Condition" value={form.visualCondition} onChange={(v) => set('visualCondition', v)} options={VISUAL_CONDITION} />
                <TextField label="Moisture Re-check (%)" value={form.moistureOnArrival} onChange={(v) => set('moistureOnArrival', v)} limit={`NMT ${CHECKIN_LIMITS.moisturePercent}%`} />
                <ChoiceField label="Colour acceptable?" value={form.colourAcceptable} onChange={(v) => set('colourAcceptable', v)} options={YES_NO} />
                <ChoiceField label="Odour acceptable?" value={form.odourAcceptable} onChange={(v) => set('odourAcceptable', v)} options={YES_NO} />
                <ChoiceField label="Mould present?" value={form.mouldPresent} onChange={(v) => set('mouldPresent', v)} options={YES_NO} />
                <ChoiceField label="Pest activity?" value={form.pestPresent} onChange={(v) => set('pestPresent', v)} options={YES_NO} />
                <ChoiceField label="Foreign matter visible?" value={form.foreignMatterVisible} onChange={(v) => set('foreignMatterVisible', v)} options={YES_NO} />
                <TextField label="Storage Temperature" value={form.storageTemperature} onChange={(v) => set('storageTemperature', v)} placeholder="e.g. 24 C" />
                <TextField label="Storage Humidity (% RH)" value={form.storageHumidity} onChange={(v) => set('storageHumidity', v)} />
              </Section>

              <Section title="In-house QA & Storage" step={7}>
                <ChoiceField label="In-house retest required?" value={form.retestRequired} onChange={(v) => set('retestRequired', v)} options={YES_NO} />
                <ChoiceField label="Retention sample drawn?" value={form.sampleDrawn} onChange={(v) => set('sampleDrawn', v)} options={YES_NO} />
                <TextField label="Sample ID" value={form.sampleId} onChange={(v) => set('sampleId', v)} placeholder="MFG-SMP-0001" />
                <TextField label="Sample Quantity" value={form.sampleQuantity} onChange={(v) => set('sampleQuantity', v)} placeholder="e.g. 250 g" />
                <ChoiceField label="GMP receiving area verified?" value={form.gmpAreaVerified} onChange={(v) => set('gmpAreaVerified', v)} options={YES_NO} />
                <TextField label="Storage Location" value={form.storageLocation} onChange={(v) => set('storageLocation', v)} placeholder="Raw material store, Rack B-4" />
                <TextField label="Remaining Shelf Life" value={form.shelfLifeRemaining} onChange={(v) => set('shelfLifeRemaining', v)} placeholder="e.g. 22 months" />
                <NotesField label="Discrepancy Notes" value={form.discrepancyNotes} onChange={(v) => set('discrepancyNotes', v)} placeholder="Anything that differs from the paperwork…" />
              </Section>

              <Section title="Decision" step={8}>
                <SelectField label="Check-in Decision" value={form.decision} onChange={(v) => set('decision', v)} options={CHECKIN_DECISIONS} required span />
              </Section>

              {/* Summary gate */}
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Check-in Summary
                  </h4>
                  <Button type="button" size="sm" variant="outline" onClick={handleGenerateSummary} className="h-7 text-xs">
                    {summary ? 'Regenerate' : 'Generate Summary'}
                  </Button>
                </div>
                {summary ? (
                  <p className="text-xs leading-relaxed text-muted-foreground">{summary}</p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Generate the summary to review what will be written to the batch record before completing check-in.
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={processing || !summary}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                {processing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving check-in…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5" />
                    Complete Check In
                  </span>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {pdfBatch && <LabReportPdfModal batch={pdfBatch} onClose={() => setPdfBatch(null)} />}
    </div>
  );
}
