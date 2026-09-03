import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  ShieldCheck, Leaf, FlaskConical, Factory,
  Calendar, Package, Award, Loader2, AlertTriangle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ProductTraceability from './ProductTraceability';
import type { Batch, Product } from '../../types';

/**
 * Public product verification — what a phone camera lands on after scanning
 * the QR printed on the pack.
 *
 * Deliberately unauthenticated and standalone: no sidebar, no login, no app
 * chrome. Someone holding the box in a shop should get the provenance in one
 * scroll, on a phone, without an account.
 *
 * It reads `products` (public SELECT policy) and then the constituent batches
 * so the chain from collector to shelf can be shown in full.
 */

/**
 * Stored MRP values already carry a currency symbol, so prefixing another
 * printed "₹₹110". Normalise to exactly one.
 */
const fmtMoney = (v?: string) => {
  if (!v) return '';
  const bare = String(v).replace(/^\s*(₹|Rs\.?|INR)\s*/i, '').trim();
  return `₹${bare}`;
};

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function ProductVerification() {
  const { code } = useParams<{ code: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [downloadingFor, setDownloadingFor] = useState<string | null>(null);

  /** Builds the Certificate of Analysis for one constituent batch. */
  const handleCertificate = async (batch: Batch) => {
    setDownloadingFor(batch.id);
    try {
      // Loaded on demand — a consumer scanning a box should not pay for the
      // PDF engine unless they ask for the certificate.
      const { generateCertificatePdf } = await import('../../lib/certificatePdf');
      await generateCertificatePdf(batch);
    } catch (err) {
      console.error('Certificate generation failed:', err);
    } finally {
      setDownloadingFor(null);
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setNotFound(false);

      // Product codes are printed in upper case but may be typed or shared in
      // any case, so match case-insensitively rather than exactly.
      const { data, error } = await supabase
        .from('products')
        .select('id, payload')
        .ilike('product_code', code ?? '');

      if (cancelled) return;

      if (error || !data?.length) {
        if (error) console.error('Verification lookup failed:', error);
        setNotFound(true);
        setLoading(false);
        return;
      }

      const row = data[0] as { id: string; payload: Product };
      const found: Product = { ...row.payload, id: row.id };
      setProduct(found);

      // Pull each constituent batch so the trace can show the full journey,
      // not just the snapshot captured at formulation time.
      const ids = found.components?.map((c) => c.batchId).filter(Boolean) ?? [];
      if (ids.length) {
        const { data: bRows } = await supabase.from('batches').select('id, payload').in('id', ids);
        if (!cancelled && bRows) {
          setBatches((bRows as { id: string; payload: Batch }[]).map((r) => ({ ...r.payload, id: r.id })));
        }
      }
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#FCFAF2] text-[#002410]">
        <Loader2 className="w-7 h-7 animate-spin text-emerald-700" />
        <p className="text-sm text-emerald-900/60">Verifying product…</p>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-6 text-center bg-[#FCFAF2] text-[#002410]">
        <AlertTriangle className="w-10 h-10 text-amber-600" />
        <h1 className="text-lg font-bold">Product not found</h1>
        <p className="text-sm text-emerald-900/60 max-w-sm">
          No product is registered under the code{' '}
          <span className="font-mono font-semibold">{code}</span>. If you scanned this from a pack,
          the code may be mistyped or the product may not be a genuine AyurTrace+ item.
        </p>
      </div>
    );
  }

  const expired = product.expiryDate ? new Date(product.expiryDate) < new Date() : false;
  const recalled = product.status === 'Recalled';

  return (
    <div className="min-h-screen bg-[#FCFAF2] text-[#002410] pb-16">
      {/* Masthead — the container matches the body grid so the page reads as
          one column of content rather than two misaligned ones. */}
      <header className="bg-gradient-to-br from-[#0B3B20] via-[#0E4527] to-[#08301A] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none">
          <Leaf className="absolute -right-10 -top-8 w-56 h-56 rotate-12" />
          <Leaf className="absolute left-1/3 -bottom-16 w-40 h-40 -rotate-12" />
        </div>
        <div className="relative max-w-5xl mx-auto px-5 sm:px-8 pt-8 pb-16">
          <p className="text-[10px] font-bold tracking-[0.25em] text-[#E0B54A] uppercase">
            Government of India · Ministry of AYUSH
          </p>
          <h1 className="text-2xl font-bold mt-1.5 tracking-tight">AyurTrace+</h1>
          <p className="text-xs text-emerald-100/70 mt-1">Blockchain-verified herb traceability</p>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 -mt-8 space-y-5">
        {/* Verification verdict */}
        <section
          className={`rounded-2xl p-5 shadow-lg shadow-emerald-950/10 border ${
            recalled
              ? 'bg-red-50 border-red-200'
              : expired
                ? 'bg-amber-50 border-amber-200'
                : 'bg-white border-emerald-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {recalled || expired ? (
              <AlertTriangle className={`w-7 h-7 shrink-0 ${recalled ? 'text-red-600' : 'text-amber-600'}`} />
            ) : (
              <ShieldCheck className="w-7 h-7 text-emerald-600 shrink-0" />
            )}
            <div className="min-w-0">
              <h2 className="font-bold text-base leading-tight">
                {recalled
                  ? 'This product has been recalled'
                  : expired
                    ? 'Genuine product — past its expiry date'
                    : 'Genuine verified product'}
              </h2>
              <p className="text-xs text-emerald-900/60 mt-1">
                {recalled
                  ? 'Do not consume. Contact the manufacturer or your retailer.'
                  : expired
                    ? `This product expired on ${fmtDate(product.expiryDate)}. Do not consume.`
                    : 'This code matches a product registered on the AyurTrace+ ledger.'}
              </p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ── Left rail: what the product is ──────────────────────────── */}
        <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-5">
        {/* Product identity */}
        <section className="rounded-2xl bg-white border border-emerald-900/10 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-lg leading-tight">{product.productName}</h3>
            <p className="text-xs text-emerald-900/60 mt-0.5">
              {product.category}
              {product.formulation ? ` · ${product.formulation}` : ''}
            </p>
            <p className="text-[11px] font-mono text-emerald-900/50 mt-1">{product.productCode}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Fact icon={Calendar} label="Manufactured" value={fmtDate(product.manufacturingDate)} />
            <Fact icon={Calendar} label="Expires" value={fmtDate(product.expiryDate)} />
            <Fact icon={Factory} label="Manufacturer" value={product.manufacturerName} />
            {product.packagingType && (
              <Fact icon={Package} label="Packaging" value={`${product.packagingType}${product.packSize ? ` · ${product.packSize}` : ''}`} />
            )}
            {product.batchSize && <Fact icon={Package} label="Batch Size" value={product.batchSize} />}
            {product.mrp && <Fact icon={Package} label="MRP" value={fmtMoney(product.mrp)} />}
          </div>

          {(product.manufacturingLicense || product.gmpCertificate || product.ayushLicense) && (
            <div className="flex flex-wrap gap-2 pt-1">
              {product.manufacturingLicense && <Chip label={`Licence ${product.manufacturingLicense}`} />}
              {product.gmpCertificate && <Chip label={`GMP ${product.gmpCertificate}`} />}
              {product.ayushLicense && <Chip label={`AYUSH ${product.ayushLicense}`} />}
            </div>
          )}
        </section>

        {/* Consumer label */}
        {(product.dosage || product.indications || product.contraindications || product.storageConditions) && (
          <section className="rounded-2xl bg-white border border-emerald-900/10 p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900/50">Usage</h3>
            {product.dosage && <LabelLine label="Dosage" value={product.dosage} />}
            {product.indications && <LabelLine label="Indications" value={product.indications} />}
            {product.contraindications && <LabelLine label="Contraindications" value={product.contraindications} />}
            {product.storageConditions && <LabelLine label="Storage" value={product.storageConditions} />}
          </section>
        )}

        {/* Finished-product QC */}
        {(product.finalMoisture || product.finalAssay || product.microbialClearance || product.stabilityStudy) && (
          <section className="rounded-2xl bg-white border border-emerald-900/10 p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900/50">
              Finished-Product Quality
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {product.finalMoisture && <Fact icon={FlaskConical} label="Moisture" value={`${product.finalMoisture}%`} />}
              {product.finalAssay && <Fact icon={FlaskConical} label="Assay" value={product.finalAssay} />}
              {product.microbialClearance && (
                <Fact icon={ShieldCheck} label="Microbial" value={product.microbialClearance} />
              )}
              {product.stabilityStudy && <Fact icon={Award} label="Stability" value={product.stabilityStudy} />}
            </div>
            {product.qcApprovedBy && (
              <p className="text-[11px] text-emerald-900/50">Released by {product.qcApprovedBy}</p>
            )}
          </section>
        )}

        </div>

        {/* ── Right column: where it came from ────────────────────────── */}
        <div className="lg:col-span-7 space-y-5">
          <section className="space-y-3">
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <h3 className="text-sm font-bold text-emerald-900">Where this came from</h3>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">
                {product.components.length === 1
                  ? '1 traced batch'
                  : `${product.components.length} traced batches`}
              </span>
            </div>

            <ProductTraceability
              product={product}
              batches={batches}
              downloadingFor={downloadingFor}
              onCertificate={handleCertificate}
            />
          </section>

          {product.aiSummary && (
            <section className="rounded-2xl bg-emerald-900 text-emerald-50 p-5 shadow-sm">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E0B54A] mb-2">
                Provenance Statement
              </h3>
              <p className="text-xs leading-relaxed text-emerald-100/85">{product.aiSummary}</p>
            </section>
          )}
        </div>
        </div>

        <footer className="text-center text-[11px] text-emerald-900/40 pt-6 pb-2 space-y-1 border-t border-emerald-900/10 mt-2">
          <p className="font-semibold text-emerald-900/55">Verified against the AyurTrace+ ledger</p>
          <p>Ministry of AYUSH, Government of India</p>
        </footer>
      </main>
    </div>
  );
}

function Fact({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-3.5 h-3.5 text-emerald-700/60 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-emerald-900/45 font-semibold">{label}</p>
        <p className="text-xs font-semibold break-words">{value}</p>
      </div>
    </div>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
      {label}
    </span>
  );
}

function LabelLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-emerald-900/45 font-semibold">{label}</p>
      <p className="text-xs leading-relaxed">{value}</p>
    </div>
  );
}
