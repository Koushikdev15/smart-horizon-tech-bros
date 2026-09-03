import {
  Leaf, FlaskConical, Factory, Truck, Tractor, TreePine,
} from 'lucide-react';
import type { Batch, BatchTimelineEvent } from '../types';

/**
 * Derives an ordered farm-to-factory chain from a batch record.
 *
 * Kept free of any UI so both the internal traceability panel and the public
 * verification page (which has its own palette and no app chrome) can render
 * the same chain of custody from one source of truth.
 *
 * The batch's own `timeline` array is stored newest-first and padded with empty
 * placeholder events for stages not yet reached, so replaying it directly puts
 * the laboratory above the harvest that preceded it and prints "Invalid Date"
 * for every future step. This builds the chain in fixed order instead, and each
 * stage pulls its own facts from the batch.
 */

export type StageStatus = 'Completed' | 'In Progress' | 'Pending' | 'Rejected';

export interface Fact {
  label: string;
  value: string;
}

export interface Stage {
  key: string;
  label: string;
  icon: React.ElementType;
  status: StageStatus;
  actor?: string;
  organisation?: string;
  timestamp?: string;
  location?: string;
  facts: Fact[];
  narrative?: string;
  /** Laboratory only — opens the Certificate of Analysis. */
  certificate?: string;
}

/** Formats a date, or returns undefined rather than the string "Invalid Date". */
export function when(value?: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/** Date only — for a harvest, the time of day is noise. */
export function onDay(value?: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** The most recent real event for a stage, ignoring empty placeholders. */
function eventFor(batch: Batch, stage: BatchTimelineEvent['stage']): BatchTimelineEvent | undefined {
  return batch.timeline?.find(
    (e) => e.stage === stage && e.status !== 'Pending' && Boolean(e.timestamp),
  );
}

const REACHED: Record<Batch['status'], number> = {
  Collection: 1,
  Processing: 2,
  Manufacturing: 3,
  'Supply Chain': 4,
  Completed: 5,
  Rejected: 0,
};

export function buildStages(batch: Batch): Stage[] {
  const reached = REACHED[batch.status] ?? 0;
  const rejected = batch.status === 'Rejected';
  const rejectEvent = batch.timeline?.find((e) => e.status === 'Rejected');

  /** Completed if the chain has moved past this step, else the live one. */
  const stateFor = (index: number, done: boolean): StageStatus => {
    if (rejected && rejectEvent) {
      // Everything up to the rejecting stage happened; the rest never will.
      return done ? 'Completed' : 'Rejected';
    }
    if (done) return 'Completed';
    return index === reached ? 'In Progress' : 'Pending';
  };

  const collectionEvent = eventFor(batch, 'Collection');
  const labCheckIn = batch.labCheckIn;
  const report = batch.labReport;
  const mfg = batch.manufacturerCheckIn;

  const CollectorIcon = batch.collectorType === 'Wild Collector' ? TreePine : Tractor;

  const stages: Stage[] = [];

  // ── 1. Harvest ────────────────────────────────────────────────────────────
  stages.push({
    key: 'harvest',
    label: batch.collectorType === 'Wild Collector' ? 'Wild Collection' : 'Farm Harvest',
    icon: CollectorIcon,
    status: 'Completed', // a batch cannot exist without having been harvested
    actor: batch.collectorName,
    organisation: batch.collectorType ?? 'Collector',
    timestamp: batch.harvestDate,
    location: [batch.region, batch.gpsLocation].filter(Boolean).join(' · '),
    facts: [
      { label: 'Species', value: batch.species },
      ...(batch.botanicalName ? [{ label: 'Botanical', value: batch.botanicalName }] : []),
      { label: 'Quantity', value: `${batch.quantity} ${batch.unit}` },
      ...(batch.estimatedGrade ? [{ label: 'Grade', value: batch.estimatedGrade }] : []),
    ],
  });

  // ── 2. Collection centre ──────────────────────────────────────────────────
  stages.push({
    key: 'collection',
    label: 'Collection Centre',
    icon: Leaf,
    status: stateFor(1, reached >= 1 || Boolean(collectionEvent)),
    actor: collectionEvent?.user,
    organisation: batch.collectionCenter,
    timestamp: collectionEvent?.timestamp,
    location: batch.region,
    facts: [
      { label: 'Received', value: `${batch.quantity} ${batch.unit}` },
      ...(batch.moisture !== undefined ? [{ label: 'Moisture', value: `${batch.moisture}%` }] : []),
      ...(batch.estimatedGrade ? [{ label: 'Grade', value: batch.estimatedGrade }] : []),
    ],
    narrative: batch.aiSummary,
  });

  // ── 3. Processing & laboratory ────────────────────────────────────────────
  const labDone = Boolean(report);
  const quarantined = labCheckIn?.decision === 'Quarantined';
  stages.push({
    key: 'laboratory',
    label: 'Processing & Laboratory',
    icon: FlaskConical,
    status: quarantined
      ? 'In Progress'
      : stateFor(2, labDone || reached >= 3),
    actor: report?.analyst ?? labCheckIn?.receivedBy,
    organisation: report?.labName ?? labCheckIn?.labName,
    timestamp: report?.testDate ?? labCheckIn?.receivedAt,
    location: labCheckIn?.storageLocation ?? report?.labName,
    facts: [
      ...(labCheckIn ? [{ label: 'Goods-in', value: labCheckIn.decision }] : []),
      ...(report?.moisture ? [{ label: 'Moisture', value: `${report.moisture}%` }] : []),
      ...(report?.dnaAuthentication ? [{ label: 'DNA', value: report.dnaAuthentication }] : []),
      ...(report?.overallResult ? [{ label: 'Result', value: report.overallResult }] : []),
      ...(report?.nablNumber ? [{ label: 'NABL', value: report.nablNumber }] : []),
    ],
    narrative: report?.aiSummary ?? labCheckIn?.aiSummary,
    certificate: report ? report.certificateNumber ?? batch.labCertificate : undefined,
  });

  // ── 4. Manufacturing ──────────────────────────────────────────────────────
  const mfgDone = Boolean(batch.usedInProducts?.length);
  stages.push({
    key: 'manufacturing',
    label: 'Manufacturing',
    icon: Factory,
    status: stateFor(3, mfgDone || reached >= 4),
    actor: mfg?.receivedBy,
    organisation: mfg?.facilityName,
    timestamp: mfg?.receivedAt,
    location: mfg?.storageLocation ?? mfg?.facilityName,
    facts: [
      ...(mfg ? [{ label: 'Goods-in', value: mfg.decision }] : []),
      ...(mfg?.receivedWeight ? [{ label: 'Received', value: `${mfg.receivedWeight} kg` }] : []),
      ...(batch.usedInProducts?.length
        ? [{ label: 'Product', value: batch.usedInProducts.join(', ') }]
        : []),
    ],
    narrative: mfg?.aiSummary,
  });

  // ── 5. Distribution ───────────────────────────────────────────────────────
  const supplyEvent = eventFor(batch, 'Supply Chain');
  stages.push({
    key: 'supply',
    label: 'Distribution',
    icon: Truck,
    status: stateFor(4, reached >= 5 || Boolean(supplyEvent)),
    actor: supplyEvent?.user,
    organisation: supplyEvent?.organization ?? batch.warehouse,
    timestamp: supplyEvent?.timestamp ?? batch.dispatchDate,
    location: batch.destination ?? batch.warehouse,
    facts: [
      ...(batch.vehicleNumber ? [{ label: 'Vehicle', value: batch.vehicleNumber }] : []),
      ...(batch.deliveryStatus ? [{ label: 'Status', value: batch.deliveryStatus }] : []),
    ],
  });

  return stages;
}
