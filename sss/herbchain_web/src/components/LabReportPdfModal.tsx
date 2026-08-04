import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Award, Printer, ShieldCheck, Check } from 'lucide-react';
import type { Batch } from '../types';

interface LabReportPdfModalProps {
  batch: Batch;
  onClose: () => void;
}

export default function LabReportPdfModal({ batch, onClose }: LabReportPdfModalProps) {
  const handlePrint = () => {
    window.print();
  };

  // Mock lab test values based on herb species
  const getTestResults = (species: string) => {
    switch (species.toLowerCase()) {
      case 'ashwagandha':
        return [
          { test: 'Phytochemical Assay (Withanolides)', standard: '≥ 2.5% w/w', found: '2.84% w/w', status: 'PASS' },
          { test: 'Moisture Content', standard: '≤ 10.0%', found: '8.2%', status: 'PASS' },
          { test: 'Total Heavy Metals (Pb, As, Hg, Cd)', standard: '≤ 10.0 ppm', found: '1.45 ppm', status: 'PASS' },
          { test: 'Lead (Pb) Content', standard: '≤ 2.5 ppm', found: '0.62 ppm', status: 'PASS' },
          { test: 'DNA Barcode Authentication', standard: 'Positive Match', found: 'Authentic W. somnifera', status: 'PASS' },
        ];
      case 'brahmi':
        return [
          { test: 'Phytochemical Assay (Bacosides)', standard: '≥ 2.0% w/w', found: '2.35% w/w', status: 'PASS' },
          { test: 'Moisture Content', standard: '≤ 8.0%', found: '6.5%', status: 'PASS' },
          { test: 'Total Heavy Metals (Pb, As, Hg, Cd)', standard: '≤ 10.0 ppm', found: '0.98 ppm', status: 'PASS' },
          { test: 'Lead (Pb) Content', standard: '≤ 2.5 ppm', found: '0.31 ppm', status: 'PASS' },
          { test: 'DNA Barcode Authentication', standard: 'Positive Match', found: 'Authentic B. monnieri', status: 'PASS' },
        ];
      default:
        return [
          { test: 'Phytochemical Active Ingredient', standard: 'Standard Ayurvedic Limit', found: 'Passed Specifications', status: 'PASS' },
          { test: 'Moisture Content', standard: '≤ 10.0%', found: '7.4%', status: 'PASS' },
          { test: 'Total Heavy Metals (Pb, As, Hg, Cd)', standard: '≤ 10.0 ppm', found: '1.20 ppm', status: 'PASS' },
          { test: 'Lead (Pb) Content', standard: '≤ 2.5 ppm', found: '0.45 ppm', status: 'PASS' },
          { test: 'DNA Barcode Authentication', standard: 'Positive Match', found: 'Authentic strain verified', status: 'PASS' },
        ];
    }
  };

  const results = getTestResults(batch.species);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0 border border-border/80 shadow-2xl rounded-2xl print:p-0 print:border-none print:shadow-none bg-card">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="flex items-center justify-between px-6 py-4 bg-muted/40 border-b border-border/50 shrink-0 print:hidden rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm font-heading">Quality Certificate Preview</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="h-8 gap-1.5 text-xs">
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </Button>
            <Button size="sm" onClick={onClose} className="h-8 text-xs">
              Close
            </Button>
          </div>
        </div>

        {/* Certificate Body (Printable Area) */}
        <div className="p-8 md:p-12 relative overflow-hidden print:p-0 print:bg-white text-foreground print:text-black">
          {/* Certificate Border Frame */}
          <div className="absolute inset-4 border-2 border-amber-600/20 dark:border-amber-600/10 pointer-events-none rounded-xl print:border-amber-600 print:inset-0" />
          <div className="absolute inset-5 border border-amber-600/10 dark:border-amber-600/5 pointer-events-none rounded-lg print:border-amber-600/50 print:inset-1" />

          {/* Content Wrapper */}
          <div className="relative z-10 space-y-8">
            {/* Header */}
            <div className="text-center space-y-2 border-b border-amber-600/20 dark:border-amber-600/10 pb-6 print:border-amber-600/30">
              <p className="text-[10px] font-bold tracking-[0.25em] text-amber-600 dark:text-amber-500 uppercase leading-none">Government of India</p>
              <h2 className="text-lg md:text-xl font-extrabold font-heading text-foreground uppercase tracking-wider print:text-black">Ministry of AYUSH</h2>
              <p className="text-[11px] text-muted-foreground font-medium italic print:text-gray-600">National Herb Quality Traceability & Standards Laboratory</p>
              <div className="flex justify-center items-center gap-2 mt-3 print:text-black">
                <span className="h-px w-8 bg-amber-600/35" />
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <span className="h-px w-8 bg-amber-600/35" />
              </div>
            </div>

            {/* Title */}
            <div className="text-center space-y-1">
              <h1 className="text-xl md:text-2xl font-bold font-heading uppercase tracking-wide text-foreground print:text-black">Certificate of Analysis</h1>
              <p className="text-xs text-muted-foreground print:text-gray-600">Issued under AYUSH GMP compliance code 110-B</p>
            </div>

            {/* Summary Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-muted/30 dark:bg-muted/10 border border-border/40 print:bg-gray-50 print:border-gray-300 print:text-black">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold print:text-gray-500">Certificate ID</p>
                <p className="text-sm font-bold font-mono text-amber-600 dark:text-amber-500">{batch.labCertificate || 'LAB-CERT-2026-MOCK'}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold print:text-gray-500">Batch Number</p>
                <p className="text-sm font-bold font-mono">{batch.batchNumber}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold print:text-gray-500">Botanical Name</p>
                <p className="text-sm font-semibold italic">{batch.botanicalName}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold print:text-gray-500">Species</p>
                <p className="text-sm font-semibold">{batch.species}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold print:text-gray-500">Origin Region</p>
                <p className="text-sm font-semibold">{batch.region}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold print:text-gray-500">Date of Inspection</p>
                <p className="text-sm font-semibold">{new Date().toLocaleDateString('en-IN')}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold print:text-gray-500">Estimated Grade</p>
                <p className="text-sm font-bold text-success">{batch.estimatedGrade || 'Passed'}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold print:text-gray-500">Sample Quantity</p>
                <p className="text-sm font-semibold">{batch.quantity} {batch.unit}</p>
              </div>
            </div>

            {/* Test Results Table */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground print:text-black">Standard Quality Analysis Summary</h3>
              <div className="border border-border/60 rounded-xl overflow-hidden print:border-gray-300">
                <table className="w-full text-left border-collapse text-xs print:text-black">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border/60 print:bg-gray-100 print:border-gray-300">
                      <th className="p-3 font-semibold text-muted-foreground print:text-gray-700">Test parameter / Phytochemical assay</th>
                      <th className="p-3 font-semibold text-muted-foreground print:text-gray-700">Standard Specification Limit</th>
                      <th className="p-3 font-semibold text-muted-foreground print:text-gray-700">Observed Value</th>
                      <th className="p-3 font-semibold text-right text-muted-foreground print:text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 print:divide-gray-200">
                    {results.map((r, i) => (
                      <tr key={i} className="hover:bg-muted/10 print:hover:bg-transparent">
                        <td className="p-3 font-medium">{r.test}</td>
                        <td className="p-3 text-muted-foreground print:text-gray-600 font-mono">{r.standard}</td>
                        <td className="p-3 font-mono font-medium">{r.found}</td>
                        <td className="p-3 text-right">
                          <span className="inline-flex items-center gap-0.5 font-bold text-success text-[10px] bg-success/8 dark:bg-success/12 px-2 py-0.5 rounded-full border border-success/20 print:bg-white print:border-none print:p-0">
                            <Check className="w-3 h-3 text-success shrink-0" /> {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Blockchain Proof & Remarks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/40 print:border-gray-200 print:text-black">
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground print:text-black">Blockchain Integrity Verification</h4>
                <div className="p-3 rounded-lg bg-muted/20 dark:bg-muted/5 border border-border/30 text-[11px] space-y-1.5 font-mono print:bg-gray-50 print:border-gray-300">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground print:text-gray-500">Record Hash:</span>
                    <span className="font-semibold text-foreground truncate max-w-40 print:text-black">{batch.blockchainHash ? batch.blockchainHash.slice(0, 16) : '0x8f3a...'}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground print:text-gray-500">Consensus Stage:</span>
                    <span className="text-success font-semibold flex items-center gap-0.5"><Check className="w-3 h-3 text-success" /> Committed (#1429847)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground print:text-gray-500">IPFS Document URI:</span>
                    <span className="text-amber-600 font-semibold truncate max-w-40">ipfs://QmX9z7a...</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground print:text-black">Lab Remarks & Certification</h4>
                <p className="text-[11px] leading-relaxed text-muted-foreground print:text-gray-600">
                  This batch has been subjected to complete physical, chemical, and biological testing in accordance with
                  the Ayurvedic Pharmacopoeia of India (API). Heavy metal trace elements and moisture indices are within compliant levels. Batch certified for release.
                </p>
              </div>
            </div>

            {/* Footer Signatures */}
            <div className="flex justify-between items-end pt-8 md:pt-12 text-center text-xs print:text-black">
              <div className="space-y-1">
                <div className="h-6 flex items-center justify-center font-heading italic text-muted-foreground print:text-gray-700">Dr. Kavita Singh</div>
                <div className="w-36 h-px bg-border/60 mx-auto print:bg-gray-400" />
                <p className="text-[10px] font-bold text-muted-foreground print:text-gray-500 uppercase tracking-wider">Chief Analyst</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                {/* Simulated Seal */}
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-amber-600/30 flex items-center justify-center text-[8px] font-bold text-amber-600/60 uppercase text-center leading-none p-1 rotate-12 print:border-amber-600 print:text-amber-600">
                  Ministry of AYUSH Certified
                </div>
              </div>
              <div className="space-y-1">
                <div className="h-6 flex items-center justify-center font-heading italic text-muted-foreground print:text-gray-700">Dr. Priya Nair</div>
                <div className="w-36 h-px bg-border/60 mx-auto print:bg-gray-400" />
                <p className="text-[10px] font-bold text-muted-foreground print:text-gray-500 uppercase tracking-wider">Lab Administrator</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
