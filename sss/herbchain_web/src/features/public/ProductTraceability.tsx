import { useState } from 'react';
import {
  Leaf, Factory, Truck, Award, ShieldCheck, Clock, MapPin, ChevronDown,
  Package, GitMerge,
} from 'lucide-react';
import type { Batch, Product, ProductComponent } from '../../types';
import { buildStages, onDay, when, type Stage } from '../../lib/traceStages';

/**
 * Product traceability — the merge of every batch that went into a product.
 *
 * A batch trace is a single line. A product trace is a confluence: one or more
 * batches, each with its own grower, collection centre and laboratory, all
 * flowing into one manufacturing run. Rendering each batch as an isolated chain
 * loses exactly the thing a consumer is asking about — that this box is the
 * sum of these particular harvests.
 *
 * So each batch gets a lane covering its independent life (harvest → collection
 * → laboratory), the lanes visibly converge, and the shared trunk below carries
 * the steps the batches went through together: formulation, release, and
 * distribution.
 */

interface Props {
  product: Product;
  batches: Batch[];
  onCertificate: (batch: Batch) => void;
  downloadingFor?: string | null;
}

/** A trunk step is reached-and-finished, reached-and-ongoing, or not reached. */
type StepState = 'done' | 'active' | 'pending';

/** The stages a batch passes through on its own, before the merge. */
const LANE_KEYS = ['harvest', 'collection', 'laboratory'];

export default function ProductTraceability({
  product,
  batches,
  onCertificate,
  downloadingFor,
}: Props) {
  const lanes = product.components.map((component) => ({
    component,
    batch: batches.find((b) => b.id === component.batchId),
  }));

  const laneCount = lanes.length;
  const multi = laneCount > 1;

  return (
    <div className="space-y-0">
      {/* ── Tributaries: one lane per batch ──────────────────────────────── */}
      <div
        className={`grid gap-3 ${
          laneCount >= 3 ? 'md:grid-cols-3' : laneCount === 2 ? 'md:grid-cols-2' : 'grid-cols-1'
        }`}
      >
        {lanes.map(({ component, batch }, i) => (
          <BatchLane
            key={component.batchId}
            index={i}
            total={laneCount}
            component={component}
            batch={batch}
            onCertificate={onCertificate}
            downloading={downloadingFor === component.batchId}
          />
        ))}
      </div>

      {/* ── Confluence ───────────────────────────────────────────────────── */}
      <MergeConnector laneCount={laneCount} />

      <div className="flex flex-col items-center -mt-1">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-800 text-white px-3.5 py-1.5 shadow-md ring-4 ring-emerald-800/10">
          <GitMerge className="w-3.5 h-3.5" />
          <span className="text-[11px] font-bold">
            {multi ? `${laneCount} batches combined` : 'Single batch'}
          </span>
        </div>
        <span className="w-px h-4 bg-emerald-700/40" />
      </div>

      {/* ── Shared trunk ─────────────────────────────────────────────────── */}
      <TrunkStages product={product} batches={batches} />
    </div>
  );
}

/**
 * The converging lines.
 *
 * Drawn in a stretched viewBox so the curves land on each lane's centre
 * whatever the container width. `vector-effect` keeps the stroke an even
 * weight despite the non-uniform scaling.
 *
 * Below the md breakpoint the lanes stack vertically, so a horizontal fan would
 * be a lie — a single connector is shown there instead.
 */
function MergeConnector({ laneCount }: { laneCount: number }) {
  if (laneCount <= 1) {
    return <div className="flex justify-center"><span className="w-px h-5 bg-emerald-700/40" /></div>;
  }

  const columns = Math.min(laneCount, 3);
  const centres = Array.from({ length: columns }, (_, i) => ((i + 0.5) * 100) / columns);

  return (
    <>
      {/* Stacked lanes: one straight join */}
      <div className="flex justify-center md:hidden">
        <span className="w-px h-5 bg-emerald-700/40" />
      </div>

      {/* Side-by-side lanes: fan into the trunk */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="hidden md:block w-full h-8"
        aria-hidden="true"
      >
        {centres.map((x) => (
          <path
            key={x}
            d={`M ${x} 0 C ${x} 55, 50 45, 50 100`}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
            className="text-emerald-700/40"
          />
        ))}
      </svg>
    </>
  );
}

function BatchLane({
  index,
  total,
  component,
  batch,
  onCertificate,
  downloading,
}: {
  index: number;
  total: number;
  component: ProductComponent;
  batch?: Batch;
  onCertificate: (batch: Batch) => void;
  downloading: boolean;
}) {
  const stages = batch ? buildStages(batch).filter((s) => LANE_KEYS.includes(s.key)) : [];

  return (
    <div className="rounded-2xl bg-white border border-emerald-900/10 shadow-[0_1px_3px_rgba(0,36,16,0.06),0_8px_24px_-12px_rgba(0,36,16,0.18)] overflow-hidden">
      {/* Lane header */}
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/60 px-4 py-3 border-b border-emerald-900/10">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white border border-emerald-900/10 flex items-center justify-center shrink-0">
            <Leaf className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-sm truncate">{component.species}</p>
              {total > 1 && (
                <span className="text-[9px] font-bold text-emerald-700/60 shrink-0">
                  {index + 1}/{total}
                </span>
              )}
            </div>
            {component.botanicalName && (
              <p className="text-[10px] italic text-emerald-900/50 truncate">{component.botanicalName}</p>
            )}
            <p className="text-[10px] text-emerald-900/60 mt-0.5">
              {component.quantityUsed} {component.unit} used ·{' '}
              <span className="font-mono">{component.batchNumber}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Lane stages */}
      <div className="px-4 py-3">
        {stages.length > 0 ? (
          stages.map((stage, i) => (
            <LaneStage
              key={stage.key}
              stage={stage}
              last={i === stages.length - 1}
              onCertificate={batch && stage.certificate ? () => onCertificate(batch) : undefined}
              downloading={downloading}
            />
          ))
        ) : (
          // The batch row could not be loaded — fall back to what the product
          // itself recorded at formulation time.
          <div className="space-y-1 text-[11px] text-emerald-900/60">
            <p className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 shrink-0" />
              {component.collectorName} · {component.region}
            </p>
            <p className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 shrink-0" />
              Harvested {onDay(component.harvestDate) ?? '—'}
            </p>
            <p className="flex items-center gap-1.5">
              <Factory className="w-3 h-3 shrink-0" />
              {component.collectionCenter}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function LaneStage({
  stage,
  last,
  onCertificate,
  downloading,
}: {
  stage: Stage;
  last: boolean;
  onCertificate?: () => void;
  downloading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const Icon = stage.icon;
  const done = stage.status === 'Completed';
  const live = stage.status === 'In Progress';
  const pending = stage.status === 'Pending';
  const stamp = stage.key === 'harvest' ? onDay(stage.timestamp) : when(stage.timestamp);

  return (
    <div className="flex gap-2.5">
      <div className="flex flex-col items-center shrink-0">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center ${
            done
              ? 'bg-emerald-700 text-white ring-2 ring-emerald-700/15'
              : live
                ? 'bg-amber-500 text-white ring-2 ring-amber-500/20'
                : 'bg-emerald-900/8 text-emerald-900/35'
          }`}
        >
          <Icon className="w-3 h-3" />
        </div>
        {!last && <span className="w-px flex-1 bg-emerald-700/25 my-1" />}
      </div>

      <div className={`min-w-0 flex-1 ${last ? 'pb-0' : 'pb-3'} ${pending ? 'opacity-55' : ''}`}>
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-[11px] font-bold">{stage.label}</p>
          {!done && (
            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-emerald-900/5 text-emerald-900/45 font-semibold uppercase">
              {stage.status}
            </span>
          )}
        </div>

        {(stage.actor || stage.organisation) && (
          <p className="text-[10px] text-emerald-900/60 truncate">
            {stage.actor}
            {stage.actor && stage.organisation ? ' · ' : ''}
            {stage.organisation}
          </p>
        )}
        {stamp && (
          <p className="text-[9px] text-emerald-900/45 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 shrink-0" />
            {stamp}
          </p>
        )}
        {stage.location && (
          <p className="text-[9px] text-emerald-900/45 flex items-center gap-1">
            <MapPin className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate">{stage.location}</span>
          </p>
        )}

        {stage.facts.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {stage.facts.slice(0, 4).map((f) => (
              <span
                key={f.label}
                className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-100"
              >
                <span className="text-emerald-900/50">{f.label}: </span>
                <span className="font-semibold text-emerald-900/80">{f.value}</span>
              </span>
            ))}
          </div>
        )}

        {stage.certificate && onCertificate && (
          <button
            type="button"
            onClick={onCertificate}
            disabled={downloading}
            className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300/70 rounded-full px-2 py-1 transition-colors disabled:opacity-60"
          >
            <Award className="w-3 h-3" />
            {downloading ? 'Preparing…' : `Certificate ${stage.certificate}`}
          </button>
        )}

        {stage.narrative && (
          <div className="mt-1">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center gap-1 text-[9px] font-medium text-emerald-900/45 hover:text-emerald-900/75"
            >
              <ChevronDown className={`w-2.5 h-2.5 transition-transform ${open ? 'rotate-180' : ''}`} />
              {open ? 'Hide' : 'Details'}
            </button>
            {open && (
              <p className="mt-1 text-[9px] leading-relaxed text-emerald-900/60 bg-emerald-50/60 rounded p-1.5">
                {stage.narrative}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** The steps every batch went through together, once merged into the product. */
function TrunkStages({ product, batches }: { product: Product; batches: Batch[] }) {
  // Facility is recorded per batch at goods-inward, but a batch can be drawn on
  // by several manufacturers — so the first facility found may belong to a
  // different company than the one that made *this* product. Only trust it when
  // it agrees with the product's own manufacturer; otherwise say nothing rather
  // than credit the wrong plant.
  const dist = product.distribution;
  const productMaker = product.manufacturerName?.trim().toLowerCase();
  const facility = batches.find(
    (b) => b.manufacturerCheckIn?.facilityName?.trim().toLowerCase() === productMaker,
  )?.manufacturerCheckIn;

  const steps = [
    {
      key: 'manufacturing',
      icon: Factory,
      label: 'Manufacturing',
      actor: product.producedBy,
      organisation: product.manufacturerName,
      timestamp: product.manufacturingDate,
      location: facility?.facilityName ?? facility?.storageLocation,
      facts: [
        ...(product.formulation ? [{ label: 'Formulation', value: product.formulation }] : []),
        ...(product.batchSize ? [{ label: 'Batch size', value: product.batchSize }] : []),
        ...(product.unitsProduced ? [{ label: 'Units', value: product.unitsProduced }] : []),
        ...(product.manufacturingLicense ? [{ label: 'Licence', value: product.manufacturingLicense }] : []),
      ],
      state: 'done' as const,
      dateOnly: true,
    },
    {
      key: 'release',
      icon: ShieldCheck,
      label: 'Quality Release',
      actor: product.qcApprovedBy,
      organisation: product.manufacturerName,
      timestamp: product.createdAt,
      location: undefined,
      facts: [
        ...(product.finalMoisture ? [{ label: 'Moisture', value: `${product.finalMoisture}%` }] : []),
        ...(product.finalAssay ? [{ label: 'Assay', value: product.finalAssay }] : []),
        ...(product.microbialClearance ? [{ label: 'Microbial', value: product.microbialClearance }] : []),
        ...(product.stabilityStudy ? [{ label: 'Stability', value: product.stabilityStudy }] : []),
      ],
      state: (product.status === 'Released' ? 'done' : 'pending') as StepState,
      // createdAt is a real instant, so the time of day is genuine here.
      dateOnly: false,
    },
    {
      key: 'pack',
      icon: Package,
      label: 'Packed & Coded',
      actor: undefined,
      organisation: product.manufacturerName,
      timestamp: product.manufacturingDate,
      location: undefined,
      facts: [
        ...(product.packagingType ? [{ label: 'Pack', value: product.packagingType }] : []),
        ...(product.packSize ? [{ label: 'Size', value: product.packSize }] : []),
        { label: 'Code', value: product.productCode },
      ],
      state: 'done' as const,
      dateOnly: true,
    },
    {
      // Populated once Supply Chain records a dispatch against the product.
      key: 'market',
      icon: Truck,
      label: dist?.deliveryStatus === 'Delivered' ? 'Delivered' : 'Distribution',
      actor: dist?.handledBy,
      organisation: dist?.transporter ?? dist?.warehouse,
      timestamp: dist?.dispatchDate,
      location: dist?.destination,
      facts: [
        ...(dist ? [{ label: 'Status', value: dist.deliveryStatus }] : []),
        ...(dist?.vehicleNumber ? [{ label: 'Vehicle', value: dist.vehicleNumber }] : []),
        ...(dist?.expectedDelivery
          ? [{ label: 'Due', value: onDay(dist.expectedDelivery) ?? dist.expectedDelivery }]
          : []),
      ],
      // Three states, not two: a product that has shipped but not yet arrived
      // has genuinely reached this step, and greying it out said otherwise.
      state: (dist?.deliveryStatus === 'Delivered'
        ? 'done'
        : dist
          ? 'active'
          : 'pending') as StepState,
      dateOnly: true,
    },
  ];

  return (
    <div className="rounded-2xl bg-white border border-emerald-900/10 shadow-[0_1px_3px_rgba(0,36,16,0.06),0_8px_24px_-12px_rgba(0,36,16,0.18)] p-4">
      {steps.map((step, i) => {
        const Icon = step.icon;
        const last = i === steps.length - 1;
        const done = step.state === 'done';
        const active = step.state === 'active';
        // `when` never returns undefined for a valid date, so the old
        // `when(...) ?? onDay(...)` fallback could never reach onDay.
        const stamp = step.dateOnly ? onDay(step.timestamp) : when(step.timestamp);
        return (
          <div key={step.key} className="flex gap-2.5">
            <div className="flex flex-col items-center shrink-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  done
                    ? 'bg-emerald-800 text-white ring-2 ring-emerald-800/15'
                    : active
                      ? 'bg-amber-500 text-white ring-2 ring-amber-500/20'
                      : 'bg-emerald-900/8 text-emerald-900/35'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              {!last && <span className="w-px flex-1 bg-emerald-700/25 my-1" />}
            </div>

            <div className={`min-w-0 flex-1 ${last ? 'pb-0' : 'pb-4'} ${step.state === 'pending' ? 'opacity-55' : ''}`}>
              <p className="text-xs font-bold">{step.label}</p>
              {(step.actor || step.organisation) && (
                <p className="text-[10px] text-emerald-900/60 truncate">
                  {step.actor}
                  {step.actor && step.organisation ? ' · ' : ''}
                  {step.organisation}
                </p>
              )}
              {stamp && (
                <p className="text-[9px] text-emerald-900/45 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5 shrink-0" />
                  {stamp}
                </p>
              )}
              {step.location && (
                <p className="text-[9px] text-emerald-900/45 flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5 shrink-0" />
                  <span className="truncate">{step.location}</span>
                </p>
              )}
              {step.state === 'pending' && !stamp && (
                <p className="text-[9px] text-emerald-900/40 italic">Not yet reached</p>
              )}
              {step.facts.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {step.facts.map((f) => (
                    <span
                      key={f.label}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-100"
                    >
                      <span className="text-emerald-900/50">{f.label}: </span>
                      <span className="font-semibold text-emerald-900/80">{f.value}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
