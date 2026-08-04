import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Html5Qrcode } from 'html5-qrcode';
import BlockchainTimeline from '../../components/BlockchainTimeline';
import BatchStatusBadge from '../../components/BatchStatusBadge';
import EmptyState from '../../components/EmptyState';
import MapSizeFixer from '../../components/MapSizeFixer';
import { mockBatches } from '../../lib/mockData';
import {
  Search, Leaf, QrCode, Shield, MapPin, CalendarDays, Package,
  FlaskConical, Factory, Truck, CheckCircle2, Award, Recycle, Globe, ScanLine,
} from 'lucide-react';
import type { Batch, BatchTimelineEvent } from '../../types';

// Fix leaflet icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png', iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png' });

const COORD_MAP: Record<string, [number, number]> = {
  'Kerala': [10.8505, 76.2711],
  'Uttarakhand': [30.3165, 78.0322],
  'Delhi': [28.7041, 77.1025],
  'Maharashtra': [19.0760, 72.8777],
  'Rajasthan': [27.0238, 74.2179],
  'Gujarat': [22.3072, 73.1812],
  'Odisha': [20.9517, 85.0985],
  'Madhya Pradesh': [23.2599, 77.4126],
};

const stageCoords: Record<string, [number, number]> = {
  'Collection': [10.8505, 76.2711],
  'Processing': [28.7041, 77.1025],
  'Laboratory': [28.7041, 77.1025],
  'Manufacturing': [22.3072, 73.1812],
  'Supply Chain': [19.0760, 72.8777],
};

const JOURNEY_STEPS = [
  { icon: Leaf, label: 'Collection', stage: 'Collection' },
  { icon: FlaskConical, label: 'Processing', stage: 'Processing' },
  { icon: Award, label: 'Lab Cert', stage: 'Laboratory' },
  { icon: Factory, label: 'Manufacturing', stage: 'Manufacturing' },
  { icon: Truck, label: 'Supply Chain', stage: 'Supply Chain' },
  { icon: CheckCircle2, label: 'You ✓', stage: 'Consumer Verification' },
];

function JourneyStepper({ batch }: { batch: Batch }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const expandedEvent = expanded ? batch.timeline.find((t) => t.stage === expanded) : null;

  return (
    <div>
      <div className="flex items-center overflow-x-auto pb-2">
        {JOURNEY_STEPS.map((step, i) => {
          const ev = batch.timeline.find((t) => t.stage === step.stage);
          const isComplete = ev?.status === 'Completed';
          const isRejected = ev?.status === 'Rejected';
          const isActive = expanded === step.stage;
          return (
            <div key={step.stage} className="flex items-center">
              <button
                onClick={() => ev && setExpanded(isActive ? null : step.stage)}
                disabled={!ev}
                className="flex flex-col items-center min-w-16 disabled:cursor-default"
              >
                <motion.div
                  whileHover={ev ? { scale: 1.08 } : undefined}
                  whileTap={ev ? { scale: 0.95 } : undefined}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isComplete ? 'bg-emerald-500 border-emerald-500' : isRejected ? 'bg-red-600 border-red-600' : 'bg-gray-800 border-gray-600'
                  } ${isActive ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-gray-950' : ''}`}
                >
                  <step.icon className={`w-4 h-4 ${isComplete || isRejected ? 'text-white' : 'text-gray-500'}`} />
                </motion.div>
                <p className="text-[10px] text-gray-400 mt-1 text-center whitespace-nowrap">{step.label}</p>
              </button>
              {i < JOURNEY_STEPS.length - 1 && <div className={`h-0.5 w-8 mx-1 shrink-0 ${isComplete ? 'bg-emerald-500' : 'bg-gray-700'}`} />}
            </div>
          );
        })}
      </div>
      <AnimatePresence mode="wait">
        {expandedEvent && (
          <motion.div
            key={expanded}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 p-3 rounded-lg bg-gray-800/60 border border-gray-700 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <span className="font-semibold text-white">{expandedEvent.stage}</span>
                <span className="text-xs text-gray-400">
                  {new Date(expandedEvent.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-gray-400 text-xs">{expandedEvent.organization} — {expandedEvent.user}</p>
              {expandedEvent.remarks && <p className="text-gray-300 text-xs mt-1.5">{expandedEvent.remarks}</p>}
              {expandedEvent.blockchainTxId && (
                <code className="blockchain-hash text-[10px] mt-2 inline-block">{expandedEvent.blockchainTxId}</code>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FarmerStory({ batch }: { batch: Batch }) {
  const isWild = batch.collectorType === 'Wild Collector';
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-900/40 border border-emerald-700/50 flex items-center justify-center text-lg font-bold text-emerald-400 shrink-0">
            {batch.collectorName.charAt(0)}
          </div>
          <div>
            <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wide">
              Meet the {isWild ? 'Wild Collector' : 'Farmer'}
            </p>
            <h4 className="text-lg font-bold text-white font-heading mt-0.5">{batch.collectorName}</h4>
            <p className="text-sm text-gray-400 mt-1 leading-relaxed">
              {isWild ? 'Sustainably wild-harvested' : 'Grown and harvested'} in {batch.region}, registered with{' '}
              <span className="text-gray-300">{batch.collectionCenter}</span>. This batch was collected on{' '}
              {new Date(batch.harvestDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QrScanDialog({ open, onOpenChange, onDecoded }: { open: boolean; onOpenChange: (v: boolean) => void; onDecoded: (text: string) => void }) {
  const [error, setError] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const elementId = 'qr-reader-region';

  // Keep latest callbacks in refs so the scan effect only restarts when `open` changes,
  // not on every parent re-render (onDecoded/onOpenChange are fresh functions each render).
  const onDecodedRef = useRef(onDecoded);
  const onOpenChangeRef = useRef(onOpenChange);
  useEffect(() => { onDecodedRef.current = onDecoded; onOpenChangeRef.current = onOpenChange; });

  useEffect(() => {
    if (!open) return;
    setError('');
    let cancelled = false;
    // Html5Qrcode.stop() throws if scanning was never actually started — only call it once
    // start() has genuinely resolved, otherwise just tear down the DOM via clear().
    let started = false;

    // Html5Qrcode's constructor synchronously throws if its target element isn't in the DOM
    // yet, and the dialog's contents mount async with its open animation — defer a frame and
    // guard the whole thing so a camera/DOM-timing failure never crashes the page.
    const raf = requestAnimationFrame(async () => {
      const el = document.getElementById(elementId);
      if (!el || cancelled) {
        if (!cancelled) setError('Scanner failed to initialize. Please try again.');
        return;
      }
      try {
        const scanner = new Html5Qrcode(elementId);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 220 },
          (decodedText) => {
            onDecodedRef.current(decodedText);
            onOpenChangeRef.current(false);
          },
          () => {},
        );
        started = true;
      } catch {
        if (!cancelled) setError('Camera access denied or unavailable. Close this and enter the Batch ID manually instead.');
      }
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (!scanner) return;
      if (started) {
        scanner.stop()
          .catch(() => {})
          .finally(() => { try { scanner.clear(); } catch { /* no-op */ } });
      } else {
        try { scanner.clear(); } catch { /* no-op */ }
      }
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white"><ScanLine className="w-4 h-4 text-emerald-400" /> Scan Product QR Code</DialogTitle>
        </DialogHeader>
        <div id={elementId} className="rounded-xl overflow-hidden bg-black min-h-56" />
        {error && <p className="text-xs text-red-400 text-center">{error}</p>}
      </DialogContent>
    </Dialog>
  );
}

export default function ConsumerPortal() {
  const params = useParams<{ batchId?: string }>();
  const [inputId, setInputId] = useState(params.batchId || '');
  const [batch, setBatch] = useState<Batch | null>(() =>
    params.batchId ? mockBatches.find(b => b.batchNumber === params.batchId || b.id === params.batchId) || null : null
  );
  const [searching, setSearching] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(Boolean(params.batchId));

  const runSearch = async (id: string) => {
    if (!id.trim()) return;
    setSearching(true);
    await new Promise(r => setTimeout(r, 900));
    const found = mockBatches.find(b =>
      b.batchNumber.toLowerCase() === id.toLowerCase() ||
      b.qrCode?.toLowerCase() === id.toLowerCase()
    );
    setBatch(found || null);
    setSearching(false);
    setHasSearched(true);
  };

  const handleSearch = () => runSearch(inputId);
  const handleScanned = (text: string) => {
    setInputId(text);
    runSearch(text);
  };

  const mapCoords = batch ? (COORD_MAP[batch.region] || [20.5937, 78.9629]) : [20.5937, 78.9629];
  const routeCoords: [number, number][] = batch
    ? batch.timeline.filter((t: BatchTimelineEvent) => t.status === 'Completed').map((t) => stageCoords[t.stage] || (mapCoords as [number, number]))
    : [];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-gray-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-emerald-400 font-heading">AYUTRACE+</h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">Consumer Verification Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs text-gray-400">Blockchain: Live</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            <QrCode className="w-3.5 h-3.5" /> QR Verified Product Traceability
          </div>
          <h2 className="text-3xl font-bold font-heading bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
            Verify Your Ayurvedic Product
          </h2>
          <p className="text-gray-400 max-w-md mx-auto text-sm">
            Scan the QR code on your product or enter the Batch ID to view its complete origin, processing, and quality journey.
          </p>
        </motion.div>

        {/* Search */}
        <div className="flex gap-2 max-w-lg mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Enter Batch ID (e.g. BATCH-2026-0033)"
              value={inputId}
              onChange={e => setInputId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="pl-9 bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-emerald-500"
            />
          </div>
          <Button onClick={() => setScanOpen(true)} variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white shrink-0">
            <ScanLine className="w-4 h-4" />
          </Button>
          <Button onClick={handleSearch} disabled={searching || !inputId} className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
            {searching ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Verify'}
          </Button>
        </div>

        {searching && (
          <div className="space-y-4 max-w-3xl mx-auto">
            <Skeleton className="h-32 w-full bg-gray-800" />
            <Skeleton className="h-20 w-full bg-gray-800" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Skeleton className="h-64 w-full bg-gray-800" />
              <Skeleton className="h-64 w-full bg-gray-800" />
            </div>
          </div>
        )}

        {!searching && !batch && !hasSearched && (
          <EmptyState
            tone="dark"
            icon={QrCode}
            title="No product verified yet"
            description="Enter a Batch ID or scan a QR code to view its complete blockchain-verified journey from farm to shelf."
            action={{ label: 'Try Demo: BATCH-2026-0033', onClick: () => { setInputId('BATCH-2026-0033'); runSearch('BATCH-2026-0033'); }, icon: Search }}
          />
        )}

        {!searching && !batch && hasSearched && (
          <EmptyState
            tone="dark"
            icon={Search}
            title={`No batch found for "${inputId}"`}
            description="Check the Batch ID and try again, or use the QR scan button above."
            action={{ label: 'Try Demo: BATCH-2026-0033', onClick: () => { setInputId('BATCH-2026-0033'); runSearch('BATCH-2026-0033'); }, icon: Search }}
          />
        )}

        {!searching && batch && (
          <div className="space-y-6">
            {/* Product Identity */}
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm text-gray-400">{batch.batchNumber}</span>
                      <BatchStatusBadge status={batch.status} />
                    </div>
                    <h3 className="text-2xl font-bold font-heading text-white">{batch.productName || batch.species}</h3>
                    {batch.botanicalName && <p className="text-sm italic text-gray-400">{batch.botanicalName}</p>}
                    {batch.productCategory && <Badge className="mt-1 bg-blue-900/50 text-blue-300 border-blue-700">{batch.productCategory}</Badge>}
                  </div>
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="pulse-ring flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-900/30 border border-emerald-700/50"
                  >
                    <Shield className="w-5 h-5 text-emerald-400" />
                    <div>
                      <p className="text-xs text-emerald-400 font-semibold">BLOCKCHAIN VERIFIED</p>
                      <p className="text-[10px] text-gray-400">Ministry of AYUSH</p>
                    </div>
                  </motion.div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                  {[
                    { icon: Leaf, label: 'Herb', value: batch.species },
                    { icon: MapPin, label: 'Origin', value: batch.region },
                    { icon: CalendarDays, label: 'Harvested', value: new Date(batch.harvestDate).toLocaleDateString('en-IN') },
                    { icon: Package, label: 'Quantity', value: `${batch.quantity} ${batch.unit}` },
                    ...(batch.manufacturingDate ? [{ icon: Factory, label: 'Manufactured', value: new Date(batch.manufacturingDate).toLocaleDateString('en-IN') }] : []),
                    ...(batch.expiryDate ? [{ icon: CalendarDays, label: 'Expiry', value: new Date(batch.expiryDate).toLocaleDateString('en-IN') }] : []),
                    ...(batch.estimatedGrade ? [{ icon: Award, label: 'Grade', value: batch.estimatedGrade }] : []),
                    { icon: Globe, label: 'Collector', value: batch.collectorName },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="p-3 rounded-lg bg-gray-800 border border-gray-700">
                      <p className="text-xs text-gray-500 flex items-center gap-1"><Icon className="w-3 h-3" />{label}</p>
                      <p className="text-sm font-medium text-white mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>

                {batch.blockchainHash && (
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-xs text-gray-500">Blockchain Hash:</span>
                    <code className="text-xs text-emerald-400 bg-emerald-900/30 px-2 py-0.5 rounded border border-emerald-800">{batch.blockchainHash}</code>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Supply chain journey — interactive stepper */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader><CardTitle className="text-sm text-gray-300">Supply Chain Journey</CardTitle></CardHeader>
              <CardContent>
                <JourneyStepper batch={batch} />
              </CardContent>
            </Card>

            {/* AI Summary */}
            {batch.aiSummary && (
              <Card className="bg-emerald-950/30 border-emerald-800/50">
                <CardContent className="pt-4">
                  <p className="text-xs text-emerald-400 font-semibold mb-1.5 flex items-center gap-1.5">
                    <span className="text-base">🤖</span> AI Quality Analysis
                  </p>
                  <p className="text-sm text-gray-300 leading-relaxed">{batch.aiSummary}</p>
                </CardContent>
              </Card>
            )}

            {/* Farmer story */}
            <FarmerStory batch={batch} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Blockchain Timeline */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader><CardTitle className="text-sm text-gray-300">Complete Batch Timeline</CardTitle></CardHeader>
                <CardContent>
                  <BlockchainTimeline events={batch.timeline} />
                </CardContent>
              </Card>

              {/* Supply chain map */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader><CardTitle className="text-sm text-gray-300">Journey Map</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-[350px] rounded-xl overflow-hidden border border-gray-700">
                    <MapContainer center={mapCoords as [number, number]} zoom={4} style={{ height: '100%', width: '100%' }}>
                      <MapSizeFixer />
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      {batch.gpsLocation && (() => {
                        const [lat, lng] = batch.gpsLocation.split(',').map(Number);
                        return (
                          <Marker position={[lat, lng]}>
                            <Popup><strong>Collection Point</strong><br />{batch.collectionCenter}<br />{batch.region}</Popup>
                          </Marker>
                        );
                      })()}
                      {routeCoords.length > 1 && <Polyline positions={routeCoords} color="#10b981" weight={3} dashArray="8,4" />}
                    </MapContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sustainability */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader><CardTitle className="text-sm text-gray-300 flex items-center gap-2"><Recycle className="w-4 h-4 text-emerald-400" />Sustainability Information</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { title: 'Sustainable Harvesting', desc: 'Collected using government-approved sustainable methods preserving biodiversity.', icon: Leaf },
                    { title: 'NABL Lab Certified', desc: 'Quality tested in nationally accredited laboratory with full traceability.', icon: Award },
                    { title: 'Blockchain Immutable', desc: 'Every stage permanently recorded on blockchain — zero tampering possible.', icon: Shield },
                  ].map(({ title, desc, icon: Icon }) => (
                    <div key={title} className="p-4 rounded-xl bg-gray-800/60 border border-gray-700">
                      <div className="w-8 h-8 rounded-lg bg-emerald-900/50 flex items-center justify-center mb-2">
                        <Icon className="w-4 h-4 text-emerald-400" />
                      </div>
                      <p className="text-sm font-semibold text-white">{title}</p>
                      <p className="text-xs text-gray-400 mt-1">{desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <footer className="border-t border-white/10 mt-16 py-6 text-center text-xs text-gray-500">
        <p>AYUTRACE+ Consumer Portal · Powered by Ministry of AYUSH · Government of India</p>
        <p className="mt-1">All data is blockchain-verified and tamper-proof</p>
      </footer>

      <QrScanDialog open={scanOpen} onOpenChange={setScanOpen} onDecoded={handleScanned} />
    </div>
  );
}
