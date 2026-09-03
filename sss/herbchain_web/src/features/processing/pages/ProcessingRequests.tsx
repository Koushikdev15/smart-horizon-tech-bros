import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageHeader from '../../../components/PageHeader';
import BatchStatusBadge from '../../../components/BatchStatusBadge';
import BatchTraceability from '../../../components/BatchTraceability';
import { toast } from 'sonner';
import {
  FlaskConical, Leaf, MapPin, Sparkles, FileCheck, Award, ClipboardCheck,
  Lock, CheckCircle2, PackageCheck, Loader2,
} from 'lucide-react';
import type { Batch, BatchTimelineEvent, LabCheckIn, LabReport } from '../../../types';
import { useBatchStore, useBatchesLive } from '../../../store/useBatchStore';
import { useAuthStore } from '../../../store/authStore';
import { TextField, SelectField, TestField, ChoiceField, NotesField } from '../../../components/FormFields';
import { summariseCheckIn, summariseLabReport } from '../labSummary';
import {
  DRYING_METHODS, GRINDING_METHODS, SIEVE_SIZES, TRANSPORT_MODES, PACKAGING_TYPES,
  PACKAGING_CONDITIONS, ARRIVAL_CONDITIONS, CHECK_IN_DOCUMENTS, CHECK_IN_DECISIONS,
  YES_NO, TAMPER_OPTIONS, COLD_CHAIN_OPTIONS, OVERALL_RESULTS, LIMITS,
} from '../labFormConfig';

const emptyCheckIn = {
  receivedAt: new Date().toISOString().slice(0, 16),
  receivedBy: '',
  transporter: '',
  vehicleNumber: '',
  transportMode: '',
  transitDuration: '',
  sealIntact: 'Yes',
  tamperEvidence: 'None',
  packagingType: '',
  packageCount: '',
  packagingCondition: 'Intact',
  declaredWeight: '',
  receivedWeight: '',
  coldChainMaintained: 'Not required',
  arrivalTemperature: '',
  arrivalHumidity: '',
  visualCondition: '',
  mouldPresent: 'No',
  pestPresent: 'No',
  foreignMatterVisible: 'No',
  odourOnArrival: '',
  sampleDrawn: 'Yes',
  sampleQuantity: '',
  sampleId: '',
  storageLocation: '',
  discrepancyNotes: '',
  decision: 'Accepted',
};

const emptyReport = {
  cleaningCompleted: false,
  dryingMethod: '', grindingMethod: '', sieveSize: '', temperature: '', humidity: '',
  moisture: '', storageCondition: '', outputQuantity: '', yieldPercent: '',
  macroscopy: '', microscopy: '', tlcProfile: '', dnaAuthentication: 'Pass',
  totalAsh: '', acidInsolubleAsh: '', waterSolubleExtractive: '', alcoholSolubleExtractive: '',
  foreignMatterPercent: '', volatileOil: '', markerCompound: '', markerContent: '',
  lead: '', cadmium: '', arsenic: '', mercury: '', pesticides: 'Pass', aflatoxin: '',
  totalPlateCount: '', yeastMould: '', eColi: 'Pass', salmonella: 'Pass',
  visualInspection: '', odour: '', colour: '', texture: '',
  labName: '', nablNumber: '', analyst: '', approvedBy: '',
  testDate: new Date().toISOString().split('T')[0],
  certificateNumber: '', overallResult: 'Pass', remarks: '',
};

/** Renders a generated summary, or a prompt to generate one. */
function SummaryPanel({
  summary,
  generating,
  onGenerate,
  hint,
}: {
  summary: string;
  generating: boolean;
  onGenerate: () => void;
  hint: string;
}) {
  return (
    <Card className="border-primary/25">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-primary" /> AI Summary
        </CardTitle>
        <Button
          type="button"
          variant="outline"
          onClick={onGenerate}
          disabled={generating}
          className="h-8 text-xs border-primary/30 text-primary"
        >
          {generating ? (
            <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Generating…</>
          ) : (
            <><Sparkles className="w-3.5 h-3.5 mr-1.5" />{summary ? 'Regenerate' : 'Generate AI Summary'}</>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {summary ? (
          <p className="text-sm leading-relaxed p-3 rounded-lg bg-primary/6 border border-primary/20">{summary}</p>
        ) : (
          <p className="text-sm text-muted-foreground text-center p-3 rounded-lg bg-muted/50 border border-dashed border-border">
            {hint}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default function ProcessingRequests() {
  useBatchesLive();
  const storeBatches = useBatchStore((s) => s.batches);
  const patchBatch = useBatchStore((s) => s.patchBatch);
  const rejectBatch = useBatchStore((s) => s.rejectBatch);
  const user = useAuthStore((s) => s.user);

  const batches = storeBatches.filter((b) => b.status === 'Processing');

  const [selected, setSelected] = useState<Batch | null>(null);
  const [dialog, setDialog] = useState<'timeline' | 'checkin' | 'process' | 'reject' | null>(null);
  const [processing, setProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const [checkIn, setCheckIn] = useState({ ...emptyCheckIn });
  const [documents, setDocuments] = useState<string[]>([]);
  const [checkInSummary, setCheckInSummary] = useState('');

  const [report, setReport] = useState({ ...emptyReport });
  const [reportSummary, setReportSummary] = useState('');
  const [generating, setGenerating] = useState(false);

  const setC = (k: string, v: string) => setCheckIn((f) => ({ ...f, [k]: v }));
  const setR = (k: string, v: string | boolean) => setReport((f) => ({ ...f, [k]: v }));

  const close = () => {
    setSelected(null);
    setDialog(null);
    setRejectionReason('');
  };

  const openCheckIn = (batch: Batch) => {
    setSelected(batch);
    // Prefill what the consignment already tells us.
    setCheckIn({
      ...emptyCheckIn,
      receivedBy: user?.name ?? '',
      declaredWeight: String(batch.quantity ?? ''),
      vehicleNumber: batch.vehicleNumber ?? '',
    });
    setDocuments([]);
    setCheckInSummary('');
    setDialog('checkin');
  };

  const openProcess = (batch: Batch) => {
    setSelected(batch);
    setReport({
      ...emptyReport,
      labName: user?.organizationName ?? '',
      analyst: user?.name ?? '',
      // Carry the received weight forward as the starting input quantity.
      outputQuantity: batch.labCheckIn?.receivedWeight ? `${batch.labCheckIn.receivedWeight} kg` : '',
      certificateNumber: `LAB-${batch.batchNumber.replace(/^BATCH-/, '')}`,
    });
    setReportSummary('');
    setDialog('process');
  };

  const toggleDocument = (doc: string) =>
    setDocuments((d) => (d.includes(doc) ? d.filter((x) => x !== doc) : [...d, doc]));

  const weightVariance = (() => {
    const d = Number(checkIn.declaredWeight);
    const r = Number(checkIn.receivedWeight);
    if (!Number.isFinite(d) || !Number.isFinite(r) || !d || !checkIn.receivedWeight) return null;
    const diff = r - d;
    return { diff, pct: (diff / d) * 100 };
  })();

  const buildCheckIn = (): LabCheckIn => ({
    ...(checkIn as unknown as LabCheckIn),
    receivedAt: new Date(checkIn.receivedAt).toISOString(),
    labName: user?.organizationName,
    documentsReceived: documents,
    weightVariance: weightVariance ? `${weightVariance.diff.toFixed(2)} kg (${weightVariance.pct.toFixed(1)}%)` : undefined,
  });

  const generateCheckInSummary = async () => {
    if (!selected) return;
    if (!checkIn.receivedBy.trim()) {
      toast.error('Enter who received the consignment first.');
      return;
    }
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 900));
    setCheckInSummary(summariseCheckIn(selected, buildCheckIn()));
    setGenerating(false);
    toast.success('Check-in summary generated.');
  };

  const generateReportSummary = async () => {
    if (!selected) return;
    if (!report.moisture && !report.totalAsh) {
      toast.error('Enter at least the moisture or ash values first.');
      return;
    }
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 1200));
    setReportSummary(summariseLabReport(selected, report as unknown as LabReport));
    setGenerating(false);
    toast.success('Laboratory summary generated.');
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    if (!checkIn.receivedBy.trim()) return toast.error('Received by is required.');
    if (!checkIn.receivedWeight.trim()) return toast.error('Enter the weight actually received.');
    if (!checkInSummary) return toast.error('Generate the AI summary before completing check-in.');

    setProcessing(true);
    const record: LabCheckIn = { ...buildCheckIn(), aiSummary: checkInSummary };

    const event: BatchTimelineEvent = {
      stage: 'Laboratory',
      timestamp: new Date().toISOString(),
      organization: user?.organizationName ?? 'Processing & Laboratory',
      user: checkIn.receivedBy,
      status: record.decision === 'Quarantined' ? 'Pending' : 'In Progress',
      remarks: `Checked in — ${record.decision}. ${checkInSummary}`,
    };

    try {
      await patchBatch(selected.id, { labCheckIn: record }, event);
      toast.success(
        record.decision === 'Quarantined'
          ? 'Batch checked in and quarantined. Testing stays locked until it is released.'
          : 'Check-in complete. Processing is now unlocked.',
      );
      close();
    } catch (err) {
      toast.error(`Check-in could not be saved: ${err instanceof Error ? err.message : 'unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    if (!reportSummary) return toast.error('Generate the AI summary before issuing the certificate.');
    if (!report.analyst.trim()) return toast.error('Analyst name is required to sign the certificate.');

    setProcessing(true);
    const record: LabReport = { ...(report as unknown as LabReport), aiSummary: reportSummary };
    const failed = record.overallResult === 'Fail';

    const event: BatchTimelineEvent = {
      stage: 'Laboratory',
      timestamp: new Date().toISOString(),
      organization: user?.organizationName ?? 'Processing & Laboratory',
      user: report.analyst,
      status: failed ? 'Rejected' : 'Completed',
      remarks: reportSummary,
      documents: report.certificateNumber ? [`${report.certificateNumber}.pdf`] : undefined,
    };

    try {
      // One write, not two: the report and the status change land together, so a
      // realtime refresh can never interleave and persist a payload that has the
      // new status but has lost the report.
      await patchBatch(
        selected.id,
        {
          labReport: record,
          labCertificate: report.certificateNumber,
          moisture: Number(report.moisture) || undefined,
          heavyMetals: record.lead ? `Pb ${record.lead} ppm` : undefined,
          pesticides: record.pesticides,
          dnaAuthentication: record.dnaAuthentication,
          status: failed ? 'Rejected' : 'Manufacturing',
          currentStage: failed ? 'Processing & Laboratory' : 'Manufacturing',
        },
        event,
      );

      toast[failed ? 'error' : 'success'](
        failed
          ? 'Batch failed specification and has been rejected.'
          : 'Lab certificate issued. Batch forwarded to Manufacturer.',
      );
      close();
    } catch (err) {
      toast.error(`Report could not be saved: ${err instanceof Error ? err.message : 'unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !rejectionReason.trim()) return toast.error('Enter a reason for rejection.');
    setProcessing(true);
    await rejectBatch(selected.id, 'Processing & Laboratory', rejectionReason);
    setProcessing(false);
    close();
    toast.error('Batch has been rejected.');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Batch Requests"
        description="Check in each consignment on arrival, then run laboratory analysis"
      />

      <div className="space-y-3">
        {batches.map((batch) => {
          const ci = batch.labCheckIn;
          const quarantined = ci?.decision === 'Quarantined';
          const canProcess = Boolean(ci) && !quarantined;

          return (
            <Card key={batch.id} className="hover:shadow-md transition-all duration-200">
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center shrink-0">
                    <FlaskConical className="w-5 h-5 text-amber-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-sm">{batch.batchNumber}</span>
                      <BatchStatusBadge status={batch.status} />
                      {ci ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            quarantined
                              ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400'
                              : 'bg-primary/10 text-primary'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          {quarantined ? 'Quarantined' : 'Checked in'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                          <PackageCheck className="w-3 h-3" /> Awaiting check-in
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3 mt-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Leaf className="w-3 h-3" />{batch.species}
                        {batch.botanicalName ? ` (${batch.botanicalName})` : ''}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{batch.region}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {batch.quantity} {batch.unit} · {batch.collectorType}
                      </span>
                    </div>

                    {ci?.aiSummary && (
                      <div className="mt-2 p-2 rounded-lg bg-primary/6 border border-primary/25">
                        <p className="text-xs text-primary font-medium flex items-center gap-1">
                          <ClipboardCheck className="w-3 h-3" /> Check-in Summary
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ci.aiSummary}</p>
                      </div>
                    )}

                    {batch.aiSummary && (
                      <div className="mt-2 p-2 rounded-lg bg-muted/50 border border-border">
                        <p className="text-xs font-medium flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Collection Summary
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{batch.aiSummary}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0 w-[132px]">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => { setSelected(batch); setDialog('timeline'); }}
                    >
                      View Timeline
                    </Button>

                    {/* Check-in gates everything below it. */}
                    <Button
                      size="sm"
                      variant={ci ? 'outline' : 'default'}
                      className={`h-7 text-xs ${ci ? '' : 'bg-primary hover:bg-primary/90 text-white'}`}
                      onClick={() => openCheckIn(batch)}
                    >
                      {ci ? (
                        <><CheckCircle2 className="w-3 h-3 mr-1" />Checked In</>
                      ) : (
                        <><ClipboardCheck className="w-3 h-3 mr-1" />Check In</>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      disabled={!canProcess}
                      title={
                        !ci
                          ? 'Complete check-in before processing this batch'
                          : quarantined
                            ? 'Batch is quarantined — resolve the check-in discrepancy first'
                            : undefined
                      }
                      className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                      onClick={() => openProcess(batch)}
                    >
                      {canProcess ? <FlaskConical className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
                      Process
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 text-xs"
                      onClick={() => { setSelected(batch); setDialog('reject'); }}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {batches.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">No pending batch requests</div>
        )}
      </div>

      {/* ── Timeline ─────────────────────────────────────────────── */}
      {selected && dialog === 'timeline' && (
        <Dialog open onOpenChange={close}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="font-mono">{selected.batchNumber}</span>
                <BatchStatusBadge status={selected.status} />
              </DialogTitle>
            </DialogHeader>
            <BatchTraceability batch={selected} />
          </DialogContent>
        </Dialog>
      )}

      {/* ── Check-In ─────────────────────────────────────────────── */}
      {selected && dialog === 'checkin' && (
        <Dialog open onOpenChange={close}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-primary" />
                Check In Batch: {selected.batchNumber}
              </DialogTitle>
            </DialogHeader>

            <p className="text-sm text-muted-foreground -mt-2">
              Record the consignment exactly as it arrived. Processing stays locked until this is complete.
            </p>

            <form onSubmit={handleCheckIn} className="space-y-5">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Receipt</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Received At<span className="text-red-500 ml-0.5">*</span></Label>
                    <Input
                      type="datetime-local"
                      className="h-9"
                      value={checkIn.receivedAt}
                      onChange={(e) => setC('receivedAt', e.target.value)}
                      required
                    />
                  </div>
                  <TextField label="Received By" value={checkIn.receivedBy} onChange={(v) => setC('receivedBy', v)} placeholder="Technician name" required />
                  <SelectField label="Transport Mode" value={checkIn.transportMode} onChange={(v) => setC('transportMode', v)} options={TRANSPORT_MODES} />
                  <TextField label="Transporter" value={checkIn.transporter} onChange={(v) => setC('transporter', v)} placeholder="Carrier name" />
                  <TextField label="Vehicle Number" value={checkIn.vehicleNumber} onChange={(v) => setC('vehicleNumber', v)} placeholder="TN 38 AB 1234" />
                  <TextField label="Time in Transit" value={checkIn.transitDuration} onChange={(v) => setC('transitDuration', v)} placeholder="6 hours" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Consignment Integrity</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ChoiceField label="Seal Intact?" value={checkIn.sealIntact} onChange={(v) => setC('sealIntact', v)} options={YES_NO} />
                  <ChoiceField label="Tamper Evidence" value={checkIn.tamperEvidence} onChange={(v) => setC('tamperEvidence', v)} options={TAMPER_OPTIONS} />
                  <SelectField label="Packaging Type" value={checkIn.packagingType} onChange={(v) => setC('packagingType', v)} options={PACKAGING_TYPES} />
                  <TextField label="Number of Packages" value={checkIn.packageCount} onChange={(v) => setC('packageCount', v)} placeholder="4" />
                  <SelectField label="Packaging Condition" value={checkIn.packagingCondition} onChange={(v) => setC('packagingCondition', v)} options={PACKAGING_CONDITIONS} span />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Quantity Reconciliation</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextField label="Declared Weight (kg)" value={checkIn.declaredWeight} onChange={(v) => setC('declaredWeight', v)} placeholder="25" />
                  <TextField label="Received Weight (kg)" value={checkIn.receivedWeight} onChange={(v) => setC('receivedWeight', v)} placeholder="24.6" required />
                  {weightVariance && (
                    <div className="md:col-span-2">
                      <div
                        className={`text-xs rounded-lg px-3 py-2 border ${
                          Math.abs(weightVariance.pct) > 5
                            ? 'border-red-300 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                            : 'border-primary/25 bg-primary/6 text-primary'
                        }`}
                      >
                        Variance: {weightVariance.diff > 0 ? '+' : ''}{weightVariance.diff.toFixed(2)} kg
                        {' '}({weightVariance.pct.toFixed(1)}%)
                        {Math.abs(weightVariance.pct) > 5 && ' — exceeds the 5% tolerance, record a discrepancy note below.'}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Condition on Arrival</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ChoiceField label="Cold Chain Maintained?" value={checkIn.coldChainMaintained} onChange={(v) => setC('coldChainMaintained', v)} options={COLD_CHAIN_OPTIONS} />
                  <SelectField label="Overall Visual Condition" value={checkIn.visualCondition} onChange={(v) => setC('visualCondition', v)} options={ARRIVAL_CONDITIONS} />
                  <TextField label="Temperature on Arrival (°C)" value={checkIn.arrivalTemperature} onChange={(v) => setC('arrivalTemperature', v)} placeholder="28" />
                  <TextField label="Humidity on Arrival (%)" value={checkIn.arrivalHumidity} onChange={(v) => setC('arrivalHumidity', v)} placeholder="60" />
                  <ChoiceField label="Mould Present?" value={checkIn.mouldPresent} onChange={(v) => setC('mouldPresent', v)} options={YES_NO} />
                  <ChoiceField label="Pest Activity?" value={checkIn.pestPresent} onChange={(v) => setC('pestPresent', v)} options={YES_NO} />
                  <ChoiceField label="Foreign Matter Visible?" value={checkIn.foreignMatterVisible} onChange={(v) => setC('foreignMatterVisible', v)} options={YES_NO} />
                  <TextField label="Odour on Arrival" value={checkIn.odourOnArrival} onChange={(v) => setC('odourOnArrival', v)} placeholder="Characteristic, no must" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Documents & Custody</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-sm font-medium">Documents Received</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {CHECK_IN_DOCUMENTS.map((doc) => {
                        const active = documents.includes(doc);
                        return (
                          <button
                            key={doc}
                            type="button"
                            onClick={() => toggleDocument(doc)}
                            className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                              active
                                ? 'border-primary bg-primary/10 text-primary font-semibold'
                                : 'border-border text-muted-foreground hover:border-primary/40'
                            }`}
                          >
                            {doc}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <ChoiceField label="Sample Drawn for Analysis?" value={checkIn.sampleDrawn} onChange={(v) => setC('sampleDrawn', v)} options={YES_NO} />
                  <TextField label="Sample Quantity" value={checkIn.sampleQuantity} onChange={(v) => setC('sampleQuantity', v)} placeholder="250 g" />
                  <TextField label="Sample ID" value={checkIn.sampleId} onChange={(v) => setC('sampleId', v)} placeholder="SMP-2026-0148" />
                  <TextField label="Storage Location" value={checkIn.storageLocation} onChange={(v) => setC('storageLocation', v)} placeholder="Rack B-12, cold room" />
                  <NotesField label="Discrepancy Notes" value={checkIn.discrepancyNotes} onChange={(v) => setC('discrepancyNotes', v)} placeholder="Anything that differs from the declared consignment" />
                  <SelectField label="Check-In Decision" value={checkIn.decision} onChange={(v) => setC('decision', v)} options={CHECK_IN_DECISIONS} placeholder="Select decision" required span />
                </CardContent>
              </Card>

              <SummaryPanel
                summary={checkInSummary}
                generating={generating}
                onGenerate={generateCheckInSummary}
                hint="Fill in the receipt details above, then generate the check-in summary."
              />

              <Button type="submit" disabled={processing} className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold">
                {processing ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Recording check-in…</span>
                ) : (
                  <span className="flex items-center gap-2"><ClipboardCheck className="w-5 h-5" />Complete Check-In</span>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Process / laboratory analysis ────────────────────────── */}
      {selected && dialog === 'process' && (
        <Dialog open onOpenChange={close}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-amber-600" />
                Laboratory Analysis: {selected.batchNumber}
              </DialogTitle>
            </DialogHeader>

            {selected.labCheckIn && (
              <div className="rounded-lg border border-primary/25 bg-primary/6 px-3 py-2 -mt-2">
                <p className="text-xs font-medium text-primary flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Checked in {new Date(selected.labCheckIn.receivedAt).toLocaleString('en-IN')} by {selected.labCheckIn.receivedBy}
                  {' · '}{selected.labCheckIn.receivedWeight} kg received
                </p>
              </div>
            )}

            <form onSubmit={handleProcess} className="space-y-5">
              <Card className="border-amber-200 dark:border-amber-800">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Processing</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 md:col-span-2">
                    <input
                      type="checkbox"
                      id="cleaning"
                      checked={report.cleaningCompleted}
                      onChange={(e) => setR('cleaningCompleted', e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <Label htmlFor="cleaning" className="text-sm">Cleaning completed</Label>
                  </div>
                  <SelectField label="Drying Method" value={report.dryingMethod} onChange={(v) => setR('dryingMethod', v)} options={DRYING_METHODS} />
                  <SelectField label="Grinding Method" value={report.grindingMethod} onChange={(v) => setR('grindingMethod', v)} options={GRINDING_METHODS} />
                  <SelectField label="Sieve Size" value={report.sieveSize} onChange={(v) => setR('sieveSize', v)} options={SIEVE_SIZES} />
                  <TextField label="Process Temperature (°C)" value={report.temperature} onChange={(v) => setR('temperature', v)} placeholder="45" />
                  <TextField label="Process Humidity (%)" value={report.humidity} onChange={(v) => setR('humidity', v)} placeholder="55" />
                  <TextField label="Storage Condition" value={report.storageCondition} onChange={(v) => setR('storageCondition', v)} placeholder="Cool, dry, airtight" />
                  <TextField label="Output Quantity" value={report.outputQuantity} onChange={(v) => setR('outputQuantity', v)} placeholder="22 kg" />
                  <TextField label="Yield (%)" value={report.yieldPercent} onChange={(v) => setR('yieldPercent', v)} placeholder="88" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Identity & Authentication</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextField label="Macroscopy" value={report.macroscopy} onChange={(v) => setR('macroscopy', v)} placeholder="Conforms to reference" />
                  <TextField label="Microscopy" value={report.microscopy} onChange={(v) => setR('microscopy', v)} placeholder="Characteristic starch grains present" />
                  <TextField label="TLC / HPTLC Profile" value={report.tlcProfile} onChange={(v) => setR('tlcProfile', v)} placeholder="Matches reference standard" />
                  <TestField label="DNA Authentication" value={report.dnaAuthentication} onChange={(v) => setR('dnaAuthentication', v)} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Pharmacopoeial Parameters</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <TextField label="Moisture" value={report.moisture} onChange={(v) => setR('moisture', v)} placeholder="8.4" limit={LIMITS.moisture} />
                  <TextField label="Total Ash" value={report.totalAsh} onChange={(v) => setR('totalAsh', v)} placeholder="4.2" limit={LIMITS.totalAsh} />
                  <TextField label="Acid-Insoluble Ash" value={report.acidInsolubleAsh} onChange={(v) => setR('acidInsolubleAsh', v)} placeholder="0.6" limit={LIMITS.acidInsolubleAsh} />
                  <TextField label="Water-Soluble Extractive" value={report.waterSolubleExtractive} onChange={(v) => setR('waterSolubleExtractive', v)} placeholder="14" limit={LIMITS.waterSolubleExtractive} />
                  <TextField label="Alcohol-Soluble Extractive" value={report.alcoholSolubleExtractive} onChange={(v) => setR('alcoholSolubleExtractive', v)} placeholder="7" limit={LIMITS.alcoholSolubleExtractive} />
                  <TextField label="Foreign Matter" value={report.foreignMatterPercent} onChange={(v) => setR('foreignMatterPercent', v)} placeholder="0.8" limit={LIMITS.foreignMatterPercent} />
                  <TextField label="Volatile Oil (%)" value={report.volatileOil} onChange={(v) => setR('volatileOil', v)} placeholder="0.4" />
                  <TextField label="Marker Compound" value={report.markerCompound} onChange={(v) => setR('markerCompound', v)} placeholder="Withanolides" />
                  <TextField label="Marker Content (%)" value={report.markerContent} onChange={(v) => setR('markerContent', v)} placeholder="2.5" />
                </CardContent>
              </Card>

              <Card className="border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-blue-500" />Contaminants
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <TextField label="Lead (Pb)" value={report.lead} onChange={(v) => setR('lead', v)} placeholder="0.8" limit={LIMITS.lead} />
                  <TextField label="Cadmium (Cd)" value={report.cadmium} onChange={(v) => setR('cadmium', v)} placeholder="0.05" limit={LIMITS.cadmium} />
                  <TextField label="Arsenic (As)" value={report.arsenic} onChange={(v) => setR('arsenic', v)} placeholder="0.4" limit={LIMITS.arsenic} />
                  <TextField label="Mercury (Hg)" value={report.mercury} onChange={(v) => setR('mercury', v)} placeholder="0.02" limit={LIMITS.mercury} />
                  <TextField label="Aflatoxin" value={report.aflatoxin} onChange={(v) => setR('aflatoxin', v)} placeholder="Not detected" limit={LIMITS.aflatoxin} />
                  <TestField label="Pesticide Residue" value={report.pesticides} onChange={(v) => setR('pesticides', v)} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Microbiology</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <TextField label="Total Plate Count" value={report.totalPlateCount} onChange={(v) => setR('totalPlateCount', v)} placeholder="2x10^3" limit={LIMITS.totalPlateCount} />
                  <TextField label="Yeast & Mould" value={report.yeastMould} onChange={(v) => setR('yeastMould', v)} placeholder="1x10^2" limit={LIMITS.yeastMould} />
                  <TestField label="E. coli" value={report.eColi} onChange={(v) => setR('eColi', v)} />
                  <TestField label="Salmonella" value={report.salmonella} onChange={(v) => setR('salmonella', v)} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Sensory & Visual</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextField label="Visual Inspection" value={report.visualInspection} onChange={(v) => setR('visualInspection', v)} placeholder="Uniform powder, no foreign matter" />
                  <TextField label="Odour" value={report.odour} onChange={(v) => setR('odour', v)} placeholder="Characteristic" />
                  <TextField label="Colour" value={report.colour} onChange={(v) => setR('colour', v)} placeholder="Light brown, uniform" />
                  <TextField label="Texture" value={report.texture} onChange={(v) => setR('texture', v)} placeholder="Fine powder" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Certification & Sign-Off</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <TextField label="Laboratory Name" value={report.labName} onChange={(v) => setR('labName', v)} placeholder="Kerala AYUSH Processing Unit" />
                  <TextField label="NABL Accreditation No." value={report.nablNumber} onChange={(v) => setR('nablNumber', v)} placeholder="TC-9876" />
                  <TextField label="Analyst" value={report.analyst} onChange={(v) => setR('analyst', v)} placeholder="Name of the testing analyst" required />
                  <TextField label="Approved By" value={report.approvedBy} onChange={(v) => setR('approvedBy', v)} placeholder="Quality manager" />
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Test Date</Label>
                    <Input type="date" className="h-9" value={report.testDate} onChange={(e) => setR('testDate', e.target.value)} />
                  </div>
                  <TextField label="Certificate Number" value={report.certificateNumber} onChange={(v) => setR('certificateNumber', v)} placeholder="LAB-2026-0148" />
                  <SelectField label="Overall Result" value={report.overallResult} onChange={(v) => setR('overallResult', v)} options={OVERALL_RESULTS} placeholder="Select result" required span />
                  <NotesField label="Analyst Remarks" value={report.remarks} onChange={(v) => setR('remarks', v)} placeholder="Observations, deviations, retest notes" />
                </CardContent>
              </Card>

              <SummaryPanel
                summary={reportSummary}
                generating={generating}
                onGenerate={generateReportSummary}
                hint="Enter the test results above, then generate the laboratory summary."
              />

              <Button
                type="submit"
                disabled={processing}
                className={`w-full h-11 font-semibold text-white ${
                  report.overallResult === 'Fail' ? 'bg-destructive hover:bg-destructive/90' : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {processing ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Issuing certificate…</span>
                ) : report.overallResult === 'Fail' ? (
                  <span className="flex items-center gap-2"><FileCheck className="w-5 h-5" />Record Failure & Reject Batch</span>
                ) : (
                  <span className="flex items-center gap-2"><FileCheck className="w-5 h-5" />Issue Certificate & Forward to Manufacturer</span>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Reject ───────────────────────────────────────────────── */}
      {selected && dialog === 'reject' && (
        <Dialog open onOpenChange={close}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-destructive">Reject Batch: {selected.batchNumber}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleReject} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Reason for Rejection<span className="text-red-500 ml-0.5">*</span></Label>
                <Input
                  placeholder="Why is this batch being rejected?"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={close}>Cancel</Button>
                <Button type="submit" variant="destructive" disabled={processing}>
                  {processing ? 'Rejecting…' : 'Confirm Rejection'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
