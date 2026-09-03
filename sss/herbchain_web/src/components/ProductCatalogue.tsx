import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import QrCodeImage from './QrCode';
import { useProductStore, useProductsLive } from '../store/useProductStore';
import { verifyUrlFor, verifyBaseUrl, isUnreachableFromPhone } from '../lib/verifyUrl';
import type { Product } from '../types';
import {
  Package, Search, QrCode as QrIcon, ExternalLink, Leaf, Calendar,
  AlertTriangle, Loader2, Boxes, CheckCircle2, Factory, Printer,
} from 'lucide-react';

/**
 * The released-product catalogue.
 *
 * Shared by the Manufacturer's "Available Products" and the Government's
 * "Product Tracking" so the two never drift apart — the only difference is that
 * the regulator sees which manufacturer released each product, and gets a count
 * of manufacturers alongside the other totals.
 */

const fmt = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/** Days until expiry; negative once past. */
const daysLeft = (expiry?: string) => {
  if (!expiry) return null;
  const d = new Date(expiry);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
};

interface Props {
  /** Show the releasing manufacturer — the regulator's view spans all of them. */
  showManufacturer?: boolean;
  /** Copy for the empty state, which differs by who is looking. */
  emptyHint?: string;
}

export default function ProductCatalogue({ showManufacturer = false, emptyHint }: Props) {
  useProductsLive();
  const products = useProductStore((s) => s.products);
  const loading = useProductStore((s) => s.loading);
  const error = useProductStore((s) => s.error);

  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.productName.toLowerCase().includes(q) ||
        p.productCode.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.manufacturerName?.toLowerCase().includes(q) ||
        // Searchable by what went into it, not just what it is called.
        p.components.some(
          (c) => c.species.toLowerCase().includes(q) || c.batchNumber.toLowerCase().includes(q),
        ),
    );
  }, [products, search]);

  const stats = useMemo(() => {
    const released = products.filter((p) => p.status === 'Released').length;
    const expiring = products.filter((p) => {
      const d = daysLeft(p.expiryDate);
      return d !== null && d >= 0 && d <= 180;
    }).length;
    const expired = products.filter((p) => {
      const d = daysLeft(p.expiryDate);
      return d !== null && d < 0;
    }).length;
    const batches = new Set(products.flatMap((p) => p.components.map((c) => c.batchId))).size;
    const makers = new Set(products.map((p) => p.manufacturerName).filter(Boolean)).size;
    return { released, expiring, expired, batches, makers };
  }, [products]);

  const tiles = [
    { label: 'Released', value: stats.released, icon: CheckCircle2, tone: 'text-emerald-600' },
    ...(showManufacturer
      ? [{ label: 'Manufacturers', value: stats.makers, icon: Factory, tone: 'text-indigo-600' }]
      : []),
    { label: 'Source Batches', value: stats.batches, icon: Boxes, tone: 'text-blue-600' },
    { label: 'Expiring ≤ 6 mo', value: stats.expiring, icon: Calendar, tone: 'text-amber-600' },
    { label: 'Expired', value: stats.expired, icon: AlertTriangle, tone: 'text-red-600' },
  ];

  return (
    <div className="space-y-6">
      <div className={`grid grid-cols-2 gap-3 ${showManufacturer ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
        {tiles.map((t) => (
          <Card key={t.label}>
            <CardContent className="py-4 flex items-center gap-3">
              <t.icon className={`w-5 h-5 shrink-0 ${t.tone}`} />
              <div className="min-w-0">
                <p className="text-xl font-bold leading-none">{t.value}</p>
                <p className="text-[11px] text-muted-foreground mt-1 truncate">{t.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by product, code, category, herb or batch number…"
          className="pl-9 h-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <Card>
          <CardContent className="py-4 flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Could not load products: {error}
          </CardContent>
        </Card>
      )}

      {loading && products.length === 0 ? (
        <Card>
          <CardContent className="py-14 flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <p className="text-sm">Loading products…</p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center space-y-2">
            <Package className="w-8 h-8 text-muted-foreground/50 mx-auto" />
            <p className="text-sm text-muted-foreground">
              {products.length === 0 ? 'No products have been released yet.' : 'No products match that search.'}
            </p>
            {products.length === 0 && emptyHint && (
              <p className="text-xs text-muted-foreground">{emptyHint}</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              showManufacturer={showManufacturer}
              onShowQr={() => setViewing(p)}
            />
          ))}
        </div>
      )}

      {viewing && <ProductQrDialog product={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

function ProductCard({
  product: p,
  showManufacturer,
  onShowQr,
}: {
  product: Product;
  showManufacturer: boolean;
  onShowQr: () => void;
}) {
  const left = daysLeft(p.expiryDate);
  const expired = left !== null && left < 0;
  const soon = left !== null && left >= 0 && left <= 180;
  const totalQty = p.components.reduce((s, c) => s + (Number(c.quantityUsed) || 0), 0);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="py-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-sm truncate">{p.productName}</h3>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  p.status === 'Recalled'
                    ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400'
                    : expired
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                }`}
              >
                {p.status === 'Recalled' ? 'Recalled' : expired ? 'Expired' : p.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {p.category}
              {p.formulation ? ` · ${p.formulation}` : ''}
            </p>
            <p className="text-[11px] font-mono text-muted-foreground mt-0.5">{p.productCode}</p>
            {showManufacturer && (
              <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
                <Factory className="w-3 h-3 shrink-0" />
                {p.manufacturerName}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <Detail label="Manufactured" value={fmt(p.manufacturingDate)} />
          <Detail
            label="Expires"
            value={fmt(p.expiryDate)}
            tone={expired ? 'text-red-600' : soon ? 'text-amber-600' : undefined}
          />
          {p.batchSize && <Detail label="Batch Size" value={p.batchSize} />}
          {p.unitsProduced && <Detail label="Units" value={p.unitsProduced} />}
        </div>

        {/* What it was made from — the traceability at a glance. */}
        <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5 space-y-1.5">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
            <Leaf className="w-3 h-3" />
            {p.components.length} source {p.components.length === 1 ? 'batch' : 'batches'} · {totalQty} kg
          </p>
          <div className="flex flex-wrap gap-1">
            {p.components.map((c) => (
              <span
                key={c.batchId}
                className="text-[10px] px-1.5 py-0.5 rounded bg-background border border-border/60"
                title={`${c.batchNumber} — ${c.collectorName}, ${c.region}`}
              >
                {c.species} <span className="text-muted-foreground">{c.quantityUsed}{c.unit}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={onShowQr}>
            <QrIcon className="w-3.5 h-3.5 mr-1" /> QR Code
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-8 text-xs"
            onClick={() => window.open(`/verify/${p.productCode}`, '_blank')}
          >
            <ExternalLink className="w-3.5 h-3.5 mr-1" /> Trace Page
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Detail({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
      <p className={`font-medium ${tone ?? ''}`}>{value}</p>
    </div>
  );
}

function ProductQrDialog({ product, onClose }: { product: Product; onClose: () => void }) {
  // Built from the configured base (or current origin), not the URL stored at
  // creation, so a code created on localhost still resolves today.
  const url = verifyUrlFor(product.productCode);
  const unreachable = isUnreachableFromPhone();

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrIcon className="w-5 h-5 text-primary" /> Product QR Code
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center p-4 space-y-4">
          <div className="p-4 bg-white rounded-2xl border-2 border-primary/20 shadow-sm">
            <QrCodeImage value={url} size={200} />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-bold">{product.productName}</p>
            <p className="text-xs font-mono text-muted-foreground">{product.productCode}</p>
            <p className="text-[11px] text-muted-foreground break-all">{url}</p>
          </div>

          {unreachable ? (
            <div className="w-full rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> A phone cannot open this code
              </p>
              <p>
                It points at <span className="font-mono">{verifyBaseUrl()}</span>, which only this
                machine can reach. Open the app on your network address instead, or set{' '}
                <span className="font-mono">VITE_PUBLIC_BASE_URL</span> in{' '}
                <span className="font-mono">.env</span>.
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
              <Printer className="w-3.5 h-3.5 mr-1" /> Print Label
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
