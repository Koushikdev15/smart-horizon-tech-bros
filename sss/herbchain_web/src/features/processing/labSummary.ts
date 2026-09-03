import type { Batch, LabCheckIn, LabReport } from '../../types';

/**
 * Narrative summaries for the goods-inward and analytical records.
 *
 * Composed from the values the analyst entered — they read the form, flag what
 * is out of range, and state a conclusion. Nothing is invented: a blank field
 * is simply not mentioned.
 */

const num = (v?: string) => {
  if (!v) return undefined;
  const n = Number(String(v).replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : undefined;
};

/** Values outside the indicative pharmacopoeial limits, as readable phrases. */
function outOfRange(r: LabReport): string[] {
  const flags: string[] = [];

  const over = (v: string | undefined, cap: number, label: string, unit = '%') => {
    const n = num(v);
    if (n !== undefined && n > cap) flags.push(`${label} ${n}${unit} exceeds the ${cap}${unit} limit`);
  };
  const under = (v: string | undefined, floor: number, label: string, unit = '%') => {
    const n = num(v);
    if (n !== undefined && n < floor) flags.push(`${label} ${n}${unit} is below the ${floor}${unit} minimum`);
  };

  over(r.moisture, 10, 'moisture');
  over(r.totalAsh, 5, 'total ash');
  over(r.acidInsolubleAsh, 1, 'acid-insoluble ash');
  under(r.waterSolubleExtractive, 10, 'water-soluble extractive');
  under(r.alcoholSolubleExtractive, 5, 'alcohol-soluble extractive');
  over(r.foreignMatterPercent, 2, 'foreign matter');
  over(r.lead, 10, 'lead', ' ppm');
  over(r.cadmium, 0.3, 'cadmium', ' ppm');
  over(r.arsenic, 3, 'arsenic', ' ppm');
  over(r.mercury, 1, 'mercury', ' ppm');

  return flags;
}

export function summariseCheckIn(batch: Batch, c: LabCheckIn): string {
  const parts: string[] = [];

  parts.push(
    `Goods-inward check for ${batch.batchNumber} — ${batch.species} from ${batch.collectionCenter}, received ` +
      `${c.receivedAt ? new Date(c.receivedAt).toLocaleString('en-IN') : 'today'}` +
      `${c.receivedBy ? ` by ${c.receivedBy}` : ''}.`,
  );

  if (c.transportMode || c.transporter) {
    parts.push(
      `Arrived via ${c.transportMode || 'road'}` +
        `${c.transporter ? ` with ${c.transporter}` : ''}` +
        `${c.vehicleNumber ? `, vehicle ${c.vehicleNumber}` : ''}` +
        `${c.transitDuration ? `, ${c.transitDuration} in transit` : ''}.`,
    );
  }

  // Quantity reconciliation is the number a dispute usually turns on.
  const declared = num(c.declaredWeight);
  const received = num(c.receivedWeight);
  if (declared !== undefined && received !== undefined) {
    const diff = received - declared;
    const pct = declared ? Math.abs((diff / declared) * 100) : 0;
    parts.push(
      diff === 0
        ? `Weight reconciles exactly at ${received} kg.`
        : `Declared ${declared} kg against ${received} kg received — a ${diff > 0 ? 'surplus' : 'shortfall'} of ` +
          `${Math.abs(diff)} kg (${pct.toFixed(1)}%).`,
    );
  }

  const integrity: string[] = [];
  if (c.sealIntact === 'No') integrity.push('seal broken on arrival');
  if (c.tamperEvidence && c.tamperEvidence !== 'None') {
    integrity.push(`tamper evidence ${c.tamperEvidence.toLowerCase()}`);
  }
  if (c.packagingCondition && c.packagingCondition !== 'Intact') {
    integrity.push(`packaging ${c.packagingCondition.toLowerCase()}`);
  }
  parts.push(
    integrity.length
      ? `Consignment integrity concerns: ${integrity.join('; ')}.`
      : 'Seals and packaging intact, no tamper evidence.',
  );

  const contamination = [
    c.mouldPresent === 'Yes' ? 'mould' : null,
    c.pestPresent === 'Yes' ? 'pest activity' : null,
    c.foreignMatterVisible === 'Yes' ? 'foreign matter' : null,
  ].filter(Boolean) as string[];
  parts.push(
    contamination.length
      ? `Visual inspection found ${contamination.join(', ')}.`
      : 'Visual inspection found no mould, pests or foreign matter.',
  );

  if (c.coldChainMaintained === 'No') parts.push('Cold chain was not maintained in transit.');
  if (c.arrivalTemperature) {
    parts.push(
      `Recorded ${c.arrivalTemperature} degrees C on arrival` +
        `${c.arrivalHumidity ? ` at ${c.arrivalHumidity}% RH` : ''}.`,
    );
  }

  parts.push(
    c.documentsReceived?.length
      ? `Documents received: ${c.documentsReceived.join(', ')}.`
      : 'No accompanying documents were recorded.',
  );

  if (c.sampleDrawn === 'Yes') {
    parts.push(
      `Sample ${c.sampleId || 'drawn'}${c.sampleQuantity ? ` (${c.sampleQuantity})` : ''} taken for analysis.`,
    );
  }
  if (c.storageLocation) parts.push(`Stored at ${c.storageLocation} pending testing.`);
  if (c.discrepancyNotes) parts.push(`Discrepancies noted: ${c.discrepancyNotes}`);

  parts.push(
    c.decision === 'Quarantined'
      ? 'Consignment quarantined — not released for testing until resolved.'
      : c.decision === 'Accepted with remarks'
        ? 'Accepted with remarks; proceed to analysis with the above on record.'
        : 'Accepted into the laboratory and cleared for analysis.',
  );

  return parts.join(' ');
}

export function summariseLabReport(batch: Batch, r: LabReport): string {
  const parts: string[] = [];

  parts.push(
    `Laboratory analysis of ${batch.batchNumber} — ${batch.species}` +
      `${batch.botanicalName ? ` (${batch.botanicalName})` : ''}, ` +
      `${batch.quantity}${batch.unit} from ${batch.collectionCenter}.`,
  );

  const processing = [
    r.cleaningCompleted ? 'cleaned' : null,
    r.dryingMethod ? `dried by ${r.dryingMethod.toLowerCase()}` : null,
    r.grindingMethod ? `ground on a ${r.grindingMethod.toLowerCase()}` : null,
    r.sieveSize && r.sieveSize !== 'Not sieved' ? `sieved to ${r.sieveSize}` : null,
  ].filter(Boolean) as string[];
  if (processing.length) parts.push(`Processed: ${processing.join(', ')}.`);

  if (r.outputQuantity) {
    parts.push(`Output ${r.outputQuantity}${r.yieldPercent ? ` at ${r.yieldPercent}% yield` : ''}.`);
  }

  const identity = [
    r.macroscopy ? `macroscopy ${r.macroscopy.toLowerCase()}` : null,
    r.microscopy ? `microscopy ${r.microscopy.toLowerCase()}` : null,
    r.tlcProfile ? `TLC ${r.tlcProfile.toLowerCase()}` : null,
    r.dnaAuthentication ? `DNA ${r.dnaAuthentication.toLowerCase()}` : null,
  ].filter(Boolean) as string[];
  if (identity.length) parts.push(`Identity confirmed by ${identity.join(', ')}.`);

  const assay: string[] = [];
  if (r.moisture) assay.push(`moisture ${r.moisture}%`);
  if (r.totalAsh) assay.push(`total ash ${r.totalAsh}%`);
  if (r.acidInsolubleAsh) assay.push(`acid-insoluble ash ${r.acidInsolubleAsh}%`);
  if (r.waterSolubleExtractive) assay.push(`water-soluble extractive ${r.waterSolubleExtractive}%`);
  if (r.alcoholSolubleExtractive) assay.push(`alcohol-soluble extractive ${r.alcoholSolubleExtractive}%`);
  if (r.volatileOil) assay.push(`volatile oil ${r.volatileOil}%`);
  if (r.markerCompound && r.markerContent) assay.push(`${r.markerCompound} at ${r.markerContent}%`);
  if (assay.length) parts.push(`Measured ${assay.join(', ')}.`);

  const heavy = [
    r.lead ? `Pb ${r.lead}` : null,
    r.cadmium ? `Cd ${r.cadmium}` : null,
    r.arsenic ? `As ${r.arsenic}` : null,
    r.mercury ? `Hg ${r.mercury}` : null,
  ].filter(Boolean) as string[];
  if (heavy.length) parts.push(`Heavy metals (ppm): ${heavy.join(', ')}.`);

  const micro = [
    r.totalPlateCount ? `TPC ${r.totalPlateCount}` : null,
    r.yeastMould ? `yeast and mould ${r.yeastMould}` : null,
    r.eColi ? `E. coli ${r.eColi}` : null,
    r.salmonella ? `Salmonella ${r.salmonella}` : null,
  ].filter(Boolean) as string[];
  if (micro.length) parts.push(`Microbiology: ${micro.join(', ')}.`);

  if (r.aflatoxin) parts.push(`Aflatoxin ${r.aflatoxin}.`);
  if (r.pesticides) parts.push(`Pesticide residue: ${r.pesticides}.`);
  if (r.foreignMatterPercent) parts.push(`Foreign matter ${r.foreignMatterPercent}%.`);

  const sensory = [r.colour, r.odour, r.texture].filter(Boolean).join(', ');
  if (sensory) parts.push(`Sensory: ${sensory}.`);

  const flags = outOfRange(r);
  if (flags.length) {
    parts.push(`Out of specification — ${flags.join('; ')}.`);
  } else if (assay.length || heavy.length) {
    parts.push('All measured parameters fall within pharmacopoeial limits.');
  }

  if (r.remarks) parts.push(`Analyst remarks: ${r.remarks}`);

  parts.push(
    r.overallResult === 'Fail'
      ? 'Batch fails specification and is not released for manufacturing.'
      : r.overallResult === 'Conditional Pass'
        ? 'Conditional pass — released subject to the deviations above.'
        : 'Batch meets specification and is released for manufacturing.',
  );

  if (r.analyst || r.labName) {
    parts.push(
      `Certified by ${r.analyst || 'the analyst'}${r.labName ? ` at ${r.labName}` : ''}` +
        `${r.nablNumber ? ` (NABL ${r.nablNumber})` : ''}` +
        `${r.approvedBy ? `, approved by ${r.approvedBy}` : ''}.`,
    );
  }

  return parts.join(' ');
}
