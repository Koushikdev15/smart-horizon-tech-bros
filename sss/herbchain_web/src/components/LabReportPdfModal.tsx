import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Award, Download, Printer, ShieldCheck, FlaskConical, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Batch } from '../types';
import { buildRows } from '../lib/certificateRows';

interface LabReportPdfModalProps {
  batch: Batch;
  onClose: () => void;
}

/**
 * Certificate of Analysis for a tested batch.
 *
 * Every value shown comes from the analytical record the laboratory saved
 * against this batch. If a batch has not been tested there is nothing to
 * certify, so the dialog says so rather than displaying placeholder results —
 * a certificate that asserts tests which were never run is worse than none.
 */
export default function LabReportPdfModal({ batch, onClose }: LabReportPdfModalProps) {
  const [downloading, setDownloading] = useState(false);
  const report = batch.labReport;
  const rows = report ? buildRows(report) : [];

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // The PDF engine is a few hundred KB and most people never download,
      // so it is fetched on the first click rather than shipped up front.
      const { generateCertificatePdf } = await import('../lib/certificatePdf');
      await generateCertificatePdf(batch);
      toast.success('Certificate downloaded');
    } catch (err) {
      console.error('Certificate generation failed:', err);
      toast.error('Could not generate the certificate', {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setDownloading(false);
    }
  };

  const issued = report?.testDate ? new Date(report.testDate) : null;
  const failed = report?.overallResult === 'Fail';

  const facts: [string, string][] = [
    ['Certificate No.', report?.certificateNumber || batch.labCertificate || '—'],
    ['Batch Number', batch.batchNumber],
    ['Botanical Name', batch.botanicalName || '—'],
    ['Common Name', batch.species],
    ['Quantity', `${batch.quantity} ${batch.unit}`],
    ['Collection Centre', batch.collectionCenter],
    ['Collector', batch.collectorName],
    ['Region of Origin', batch.region],
    ['Harvest Date', batch.harvestDate ? new Date(batch.harvestDate).toLocaleDateString('en-IN') : '—'],
    ['Date of Analysis', issued ? issued.toLocaleDateString('en-IN') : '—'],
    ['Testing Laboratory', report?.labName || '—'],
    ['NABL Accreditation', report?.nablNumber || '—'],
  ];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0 border border-border/80 shadow-2xl rounded-2xl print:p-0 print:border-none print:shadow-none bg-card">
        {/* Control bar — excluded from print */}
        <div className="flex items-center justify-between px-6 py-4 bg-muted/40 border-b border-border/50 shrink-0 print:hidden rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm font-heading">Certificate of Analysis</span>
          </div>
          <div className="flex items-center gap-2">
            {report && (
              <>
                <Button size="sm" onClick={handleDownload} disabled={downloading} className="h-8 gap-1.5 text-xs">
                  {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  {downloading ? 'Generating…' : 'Download PDF'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.print()} className="h-8 gap-1.5 text-xs">
                  <Printer className="w-3.5 h-3.5" /> Print
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 text-xs">
              Close
            </Button>
          </div>
        </div>

        {!report ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 px-8 text-center">
            <FlaskConical className="w-10 h-10 text-muted-foreground/50" />
            <h3 className="font-heading font-semibold text-base">No analytical record yet</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Batch {batch.batchNumber} has not completed laboratory analysis, so there are no results to certify.
              The certificate becomes available once the laboratory submits its report.
            </p>
          </div>
        ) : (
          <div className="p-8 md:p-12 relative overflow-hidden print:p-0 print:bg-white text-foreground print:text-black">
            <div className="absolute inset-4 border-2 border-amber-600/20 dark:border-amber-600/10 pointer-events-none rounded-xl print:border-amber-600 print:inset-0" />
            <div className="absolute inset-5 border border-amber-600/10 dark:border-amber-600/5 pointer-events-none rounded-lg print:border-amber-600/50 print:inset-1" />

            <div className="relative z-10 space-y-8">
              {/* Issuing authority */}
              <div className="text-center space-y-2 border-b border-amber-600/20 dark:border-amber-600/10 pb-6 print:border-amber-600/30">
                <p className="text-[10px] font-bold tracking-[0.25em] text-amber-600 dark:text-amber-500 uppercase leading-none">
                  Government of India
                </p>
                <h2 className="text-lg md:text-xl font-extrabold font-heading uppercase tracking-wider print:text-black">
                  Ministry of AYUSH
                </h2>
                <p className="text-[11px] text-muted-foreground font-medium italic print:text-gray-600">
                  HerbChain · AyurTrace+ — Blockchain-verified Herb Traceability
                </p>
                <div className="flex justify-center items-center gap-2 mt-3">
                  <span className="h-px w-8 bg-amber-600/35" />
                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                  <span className="h-px w-8 bg-amber-600/35" />
                </div>
              </div>

              <div className="text-center space-y-1">
                <h1 className="text-xl md:text-2xl font-bold font-heading uppercase tracking-wide print:text-black">
                  Certificate of Analysis
                </h1>
                <p className="text-xs text-muted-foreground print:text-gray-600">
                  Tested against the Ayurvedic Pharmacopoeia of India
                </p>
              </div>

              {/* Sample identification */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-muted/30 dark:bg-muted/10 border border-border/40 print:bg-gray-50 print:border-gray-300">
                {facts.map(([label, value]) => (
                  <div key={label}>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold print:text-gray-500">
                      {label}
                    </p>
                    <p className="text-sm font-semibold break-words">{value}</p>
                  </div>
                ))}
              </div>

              {/* Results */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground print:text-black">
                  Analytical Results
                </h3>
                <div className="border border-border/60 rounded-xl overflow-x-auto print:border-gray-300">
                  <table className="w-full text-left border-collapse text-xs print:text-black">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border/60 print:bg-gray-100 print:border-gray-300">
                        <th className="p-3 font-semibold text-muted-foreground print:text-gray-700">Parameter</th>
                        <th className="p-3 font-semibold text-muted-foreground print:text-gray-700">Specification</th>
                        <th className="p-3 font-semibold text-muted-foreground print:text-gray-700">Result</th>
                        <th className="p-3 font-semibold text-right text-muted-foreground print:text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 print:divide-gray-200">
                      {rows.map((r, i) => (
                        <tr key={i}>
                          <td className="p-3 font-medium">{r.parameter}</td>
                          <td className="p-3 text-muted-foreground print:text-gray-600 font-mono">{r.spec}</td>
                          <td className="p-3 font-mono font-medium">{r.result}</td>
                          <td className="p-3 text-right">
                            <span
                              className={
                                r.verdict === 'Pass'
                                  ? 'font-bold text-success text-[10px] uppercase'
                                  : r.verdict === 'Fail'
                                    ? 'font-bold text-destructive text-[10px] uppercase'
                                    : 'font-medium text-muted-foreground text-[10px] uppercase'
                              }
                            >
                              {r.verdict === '—' ? 'Reported' : r.verdict}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {rows.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-muted-foreground">
                            No individual test parameters were recorded for this batch.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Verdict */}
              <div
                className={`rounded-xl px-5 py-4 text-white font-heading font-bold text-sm uppercase tracking-wide ${
                  failed ? 'bg-destructive' : 'bg-success'
                } print:text-black print:border print:border-gray-400 print:bg-white`}
              >
                {failed
                  ? 'Result: does not conform to specification'
                  : report.overallResult === 'Conditional Pass'
                    ? 'Result: conforms — conditional release'
                    : 'Result: conforms to specification'}
              </div>

              {report.aiSummary && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground print:text-black">
                    Analytical Summary
                  </h4>
                  <p className="text-[11px] leading-relaxed text-muted-foreground print:text-gray-600">
                    {report.aiSummary}
                  </p>
                </div>
              )}

              {/* Provenance */}
              <div className="space-y-2 pt-4 border-t border-border/40 print:border-gray-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground print:text-black">
                  Blockchain Verification
                </h4>
                <div className="p-3 rounded-lg bg-muted/20 dark:bg-muted/5 border border-border/30 text-[11px] space-y-1.5 font-mono print:bg-gray-50 print:border-gray-300">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground print:text-gray-500">Batch record:</span>
                    <span className="font-semibold truncate">{batch.batchNumber}</span>
                  </div>
                  {batch.blockchainHash && (
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground print:text-gray-500">Transaction hash:</span>
                      <span className="font-semibold truncate">{batch.blockchainHash}</span>
                    </div>
                  )}
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground print:text-gray-500">Verify at:</span>
                    <span className="font-semibold truncate">/verify/{batch.batchNumber}</span>
                  </div>
                </div>
              </div>

              {/* Sign-off */}
              <div className="flex justify-between items-end pt-8 md:pt-12 gap-4 text-xs print:text-black">
                <div className="space-y-1">
                  <div className="w-36 h-px bg-border/60 print:bg-gray-400" />
                  <p className="font-semibold">{report.analyst || 'Analyst'}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tested by</p>
                </div>
                <div className="w-14 h-14 shrink-0 rounded-full border-2 border-dashed border-amber-600/30 flex items-center justify-center text-[8px] font-bold text-amber-600/60 uppercase text-center leading-none p-1 rotate-12 print:border-amber-600 print:text-amber-600">
                  Ministry of AYUSH Certified
                </div>
                <div className="space-y-1 text-right">
                  <div className="w-36 h-px bg-border/60 ml-auto print:bg-gray-400" />
                  <p className="font-semibold">{report.approvedBy || 'Quality Manager'}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Approved by</p>
                </div>
              </div>

              <p className="text-[10px] text-center text-muted-foreground pt-4 print:text-gray-500">
                This certificate relates only to the sample identified above. Reproduction except in full is not permitted.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
