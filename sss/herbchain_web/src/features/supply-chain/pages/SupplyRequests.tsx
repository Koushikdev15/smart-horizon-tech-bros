import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '../../../components/PageHeader';
import QrCodeImage from '../../../components/QrCode';
import { TextField, SelectField, NotesField } from '../../../components/FormFields';
import { useProductStore, useProductsLive } from '../../../store/useProductStore';
import { useAuthStore } from '../../../store/authStore';
import { verifyUrlFor } from '../../../lib/verifyUrl';
import type { Product, ProductDistribution } from '../../../types';
import { toast } from 'sonner';
import {
  Truck, Package, Leaf, Factory, Search, QrCode as QrIcon, ExternalLink,
  Loader2, AlertTriangle, CheckCircle2, Calendar, MapPin,
} from 'lucide-react';

const DELIVERY_STATUS = [
  'Ready for Dispatch', 'In Transit', 'Out for Delivery', 'Delivered', 'Delayed',
] as const;

const fmt = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const daysLeft = (expiry?: string) => {
  if (!expiry) return null;
  const d = new Date(expiry);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
};

const BLANK = {
  warehouse: '', transporter: '', vehicleNumber: '', destination: '',
  dispatchDate: new Date().toISOString().slice(0, 10), expectedDelivery: '',
  deliveryStatus: 'Ready for Dispatch', unitsDispatched: '', temperature: '',
  handledBy: '', remarks: '',
};

/**
 * Shipment requests — the finished products a manufacturer has released and
 * that Supply Chain now has to move.
 *
 * Reads live products from Supabase (the previous version listed hard-coded
 * `mockBatches` and its dispatch form only set local state, so nothing it did
 * ever left the browser). Dispatch details now persist against the product and
 * appear on its public trace page.
 */
export default function SupplyRequests() {
  useProductsLive();
  const products = useProductStore((s) => s.products);
  const patchProduct = useProductStore((s) => s.patchProduct);
  const loading = useProductStore((s) => s.loading);
  const user = useAuthStore((s) => s.user);

  const [search, setSearch] = useState('');
  const [dispatching, setDispatching] = useState<Product | null>(null);
  const [viewingQr, setViewingQr] = useState<Product | null>(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // A recalled product must never be dispatched.
  const dispatchable = useMemo(
    () => products.filter((p) => p.status !== 'Recalled'),
    [products],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return dispatchable;
    return dispatchable.filter(
      (p) =>
        p.productName.toLowerCase().includes(q) ||
        p.productCode.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.manufacturerName?.toLowerCase().includes(q) ||
        p.distribution?.destination?.toLowerCase().includes(q),
    );
  }, [dispatchable, search]);

  const stats = useMemo(() => {
    const awaiting = dispatchable.filter((p) => !p.distribution).length;
    const inTransit = dispatchable.filter(
      (p) => p.distribution && !['Delivered'].includes(p.distribution.deliveryStatus),
    ).length;
    const delivered = dispatchable.filter(
      (p) => p.distribution?.deliveryStatus === 'Delivered',
    ).length;
    return { awaiting, inTransit, delivered };
  }, [dispatchable]);

  const openDispatch = (p: Product) => {
    const d = p.distribution;
    setForm({
      ...BLANK,
      warehouse: d?.warehouse ?? '',
      transporter: d?.transporter ?? '',
      vehicleNumber: d?.vehicleNumber ?? '',
      destination: d?.destination ?? '',
      dispatchDate: d?.dispatchDate ?? BLANK.dispatchDate,
      expectedDelivery: d?.expectedDelivery ?? '',
      deliveryStatus: d?.deliveryStatus ?? 'Ready for Dispatch',
      unitsDispatched: d?.unitsDispatched ?? p.unitsProduced ?? '',
      temperature: d?.temperature ?? '',
      handledBy: d?.handledBy ?? user?.name ?? '',
      remarks: d?.remarks ?? '',
    });
    setDispatching(p);
  };

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatching) return;

    setSaving(true);
    const record: ProductDistribution = {
      warehouse: form.warehouse || undefined,
      transporter: form.transporter || undefined,
      vehicleNumber: form.vehicleNumber || undefined,
      destination: form.destination || undefined,
      dispatchDate: form.dispatchDate || undefined,
      expectedDelivery: form.expectedDelivery || undefined,
      deliveryStatus: form.deliveryStatus as ProductDistribution['deliveryStatus'],
      unitsDispatched: form.unitsDispatched || undefined,
      temperature: form.temperature || undefined,
      handledBy: form.handledBy || undefined,
      remarks: form.remarks || undefined,
      updatedAt: new Date().toISOString(),
    };

    try {
      await patchProduct(dispatching.id, {
        distribution: record,
        timeline: [
          {
            stage: 'Supply Chain',
            timestamp: record.updatedAt,
            organization: user?.organizationName || 'Supply Chain',
            user: record.handledBy || user?.name || 'Logistics',
            status: record.deliveryStatus === 'Delivered' ? 'Completed' : 'In Progress',
            remarks:
              `${record.deliveryStatus}` +
              `${record.destination ? ` to ${record.destination}` : ''}` +
              `${record.vehicleNumber ? ` — vehicle ${record.vehicleNumber}` : ''}.`,
          },
          ...(dispatching.timeline ?? []),
        ],
      });
      toast.success(
        record.deliveryStatus === 'Delivered'
          ? 'Delivery recorded. Product lifecycle complete.'
          : `Shipment updated — ${record.deliveryStatus}.`,
      );
      setDispatching(null);
    } catch {
      toast.error('Could not save the shipment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Shipment Requests"
        description="Finished products released by manufacturers, ready for dispatch and delivery"
      />

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Awaiting Dispatch', value: stats.awaiting, icon: Package, tone: 'text-amber-600' },
          { label: 'In Transit', value: stats.inTransit, icon: Truck, tone: 'text-cyan-600' },
          { label: 'Delivered', value: stats.delivered, icon: CheckCircle2, tone: 'text-emerald-600' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="py-4 flex items-center gap-3">
              <s.icon className={`w-5 h-5 shrink-0 ${s.tone}`} />
              <div className="min-w-0">
                <p className="text-xl font-bold leading-none">{s.value}</p>
                <p className="text-[11px] text-muted-foreground mt-1 truncate">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by product, code, manufacturer or destination…"
          className="pl-9 h-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

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
            <Truck className="w-8 h-8 text-muted-foreground/50 mx-auto" />
            <p className="text-sm text-muted-foreground">
              {products.length === 0
                ? 'No products have been released for distribution yet.'
                : 'No shipments match that search.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map((p) => (
            <ShipmentCard
              key={p.id}
              product={p}
              onDispatch={() => openDispatch(p)}
              onShowQr={() => setViewingQr(p)}
            />
          ))}
        </div>
      )}

      {dispatching && (
        <Dialog open onOpenChange={() => setDispatching(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-cyan-600" />
                Dispatch: {dispatching.productName}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleDispatch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <TextField label="Warehouse" value={form.warehouse} onChange={(v) => set('warehouse', v)} placeholder="Dispatch origin" />
                <TextField label="Destination" value={form.destination} onChange={(v) => set('destination', v)} required placeholder="Distributor or retailer" />
                <TextField label="Transporter" value={form.transporter} onChange={(v) => set('transporter', v)} />
                <TextField label="Vehicle Number" value={form.vehicleNumber} onChange={(v) => set('vehicleNumber', v)} placeholder="TN-38-XX-0000" />
                <TextField label="Dispatch Date" type="date" value={form.dispatchDate} onChange={(v) => set('dispatchDate', v)} required />
                <TextField label="Expected Delivery" type="date" value={form.expectedDelivery} onChange={(v) => set('expectedDelivery', v)} />
                <TextField label="Units Dispatched" value={form.unitsDispatched} onChange={(v) => set('unitsDispatched', v)} />
                <TextField label="Transit Temperature" value={form.temperature} onChange={(v) => set('temperature', v)} placeholder="e.g. 22 C" />
                <TextField label="Handled By" value={form.handledBy} onChange={(v) => set('handledBy', v)} />
                <SelectField label="Delivery Status" value={form.deliveryStatus} onChange={(v) => set('deliveryStatus', v)} options={DELIVERY_STATUS} required />
                <NotesField label="Remarks" value={form.remarks} onChange={(v) => set('remarks', v)} />
              </div>

              <Button type="submit" disabled={saving} className="w-full h-11 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold">
                {saving ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving shipment…</span>
                ) : (
                  <span className="flex items-center gap-2"><Truck className="w-5 h-5" /> Record Shipment</span>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {viewingQr && (
        <Dialog open onOpenChange={() => setViewingQr(null)}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <QrIcon className="w-5 h-5 text-primary" /> Product QR Code
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center p-4 space-y-4">
              <div className="p-4 bg-white rounded-2xl border-2 border-primary/20 shadow-sm">
                <QrCodeImage value={verifyUrlFor(viewingQr.productCode)} size={200} />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-bold">{viewingQr.productName}</p>
                <p className="text-xs font-mono text-muted-foreground">{viewingQr.productCode}</p>
              </div>
              <Button
                variant="outline"
                className="w-full rounded-xl text-xs"
                onClick={() => window.open(`/verify/${viewingQr.productCode}`, '_blank')}
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1" /> Open Trace Page
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function ShipmentCard({
  product: p,
  onDispatch,
  onShowQr,
}: {
  product: Product;
  onDispatch: () => void;
  onShowQr: () => void;
}) {
  const d = p.distribution;
  const left = daysLeft(p.expiryDate);
  const expired = left !== null && left < 0;
  const delivered = d?.deliveryStatus === 'Delivered';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="py-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950/50 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5 text-cyan-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-sm truncate">{p.productName}</h3>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  delivered
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                    : d
                      ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                }`}
              >
                {d?.deliveryStatus ?? 'Awaiting Dispatch'}
              </span>
              {expired && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400">
                  Expired
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{p.category}</p>
            <p className="text-[11px] font-mono text-muted-foreground mt-0.5">{p.productCode}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
              <Factory className="w-3 h-3 shrink-0" />
              {p.manufacturerName}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Manufactured</p>
            <p className="font-medium">{fmt(p.manufacturingDate)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Expires</p>
            <p className={`font-medium ${expired ? 'text-red-600' : ''}`}>{fmt(p.expiryDate)}</p>
          </div>
          {p.unitsProduced && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Units</p>
              <p className="font-medium">{p.unitsProduced}</p>
            </div>
          )}
          {p.packagingType && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Packaging</p>
              <p className="font-medium truncate">{p.packagingType}</p>
            </div>
          )}
        </div>

        {/* Shipment detail once dispatched */}
        {d ? (
          <div className="rounded-lg border border-cyan-500/20 bg-cyan-50/50 dark:bg-cyan-950/20 p-2.5 space-y-1">
            {d.destination && (
              <p className="text-[11px] flex items-center gap-1.5">
                <MapPin className="w-3 h-3 shrink-0 text-cyan-600" />
                <span className="truncate">{d.destination}</span>
              </p>
            )}
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Calendar className="w-3 h-3 shrink-0" />
              Dispatched {fmt(d.dispatchDate)}
              {d.expectedDelivery ? ` · due ${fmt(d.expectedDelivery)}` : ''}
            </p>
            {d.vehicleNumber && (
              <p className="text-[11px] text-muted-foreground">
                {d.transporter ? `${d.transporter} · ` : ''}
                {d.vehicleNumber}
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-border/50 bg-muted/30 p-2.5">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-1.5">
              <Leaf className="w-3 h-3" />
              {p.components.length} source {p.components.length === 1 ? 'batch' : 'batches'}
            </p>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {p.components.map((c) => (
                <span
                  key={c.batchId}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-background border border-border/60"
                >
                  {c.species}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 h-8 text-xs bg-cyan-600 hover:bg-cyan-700 text-white"
            onClick={onDispatch}
            disabled={expired}
            title={expired ? 'Product is past its expiry date' : undefined}
          >
            <Truck className="w-3.5 h-3.5 mr-1" />
            {d ? 'Update Shipment' : 'Dispatch'}
          </Button>
          <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={onShowQr}>
            <QrIcon className="w-3.5 h-3.5 mr-1" /> QR Code
          </Button>
        </div>

        {expired && (
          <p className="text-[10px] text-red-600 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            Past expiry — dispatch blocked.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
