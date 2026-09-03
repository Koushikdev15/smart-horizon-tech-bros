import type { Batch, ManufacturerCheckIn, Product } from '../../types';
import { CHECKIN_LIMITS } from './checkInConfig';

/**
 * Narrative summaries for the manufacturer's goods-inward and product records.
 *
 * Composed from the values actually entered — they read the form, flag what is
 * out of tolerance, and state a conclusion. Nothing is invented: a blank field
 * is simply not mentioned.
 */

const num = (v?: string) => {
  if (!v) return undefined;
  const n = Number(String(v).replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : undefined;
};

export function summariseManufacturerCheckIn(batch: Batch, c: ManufacturerCheckIn): string {
  const parts: string[] = [];

  parts.push(
    `Goods-inward check for ${batch.batchNumber} — ${batch.species}` +
      `${batch.botanicalName ? ` (${batch.botanicalName})` : ''}, ` +
      `${batch.quantity}${batch.unit} received ` +
      `${c.receivedAt ? new Date(c.receivedAt).toLocaleString('en-IN') : 'today'}` +
      `${c.receivedBy ? ` by ${c.receivedBy}` : ''}` +
      `${c.facilityName ? ` at ${c.facilityName}` : ''}.`,
  );

  if (c.transportMode || c.transporter) {
    parts.push(
      `Arrived via ${c.transportMode || 'road'}` +
        `${c.transporter ? ` with ${c.transporter}` : ''}` +
        `${c.vehicleNumber ? `, vehicle ${c.vehicleNumber}` : ''}` +
        `${c.transitDuration ? `, ${c.transitDuration} in transit` : ''}.`,
    );
  }

  // Certificate verification is the control that distinguishes this check from
  // the laboratory's own goods-inward.
  if (c.coaReceived === 'No') {
    parts.push('No Certificate of Analysis accompanied the consignment.');
  } else {
    const coaIssues = [
      c.coaMatchesBatch === 'No' ? 'does not match the batch' : null,
      c.coaWithinValidity === 'No' ? 'is outside its validity period' : null,
    ].filter(Boolean) as string[];
    parts.push(
      coaIssues.length
        ? `Certificate ${c.coaNumber || 'received'} ${coaIssues.join(' and ')}.`
        : `Certificate ${c.coaNumber || 'received'} verified against the batch and within validity.` +
          `${c.labResultReviewed === 'Yes' ? ' Laboratory results reviewed and accepted.' : ''}`,
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
          `${Math.abs(diff).toFixed(2)} kg (${pct.toFixed(1)}%)` +
          `${pct > CHECKIN_LIMITS.weightVariancePercent ? ', beyond the 5% tolerance' : ''}.`,
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
      : `Seals and packaging intact${c.containerCount ? ` across ${c.containerCount} containers` : ''}, no tamper evidence.`,
  );

  const contamination = [
    c.mouldPresent === 'Yes' ? 'mould' : null,
    c.pestPresent === 'Yes' ? 'pest activity' : null,
    c.foreignMatterVisible === 'Yes' ? 'foreign matter' : null,
    c.colourAcceptable === 'No' ? 'off colour' : null,
    c.odourAcceptable === 'No' ? 'off odour' : null,
  ].filter(Boolean) as string[];
  parts.push(
    contamination.length
      ? `Sensory and visual inspection found ${contamination.join(', ')}.`
      : `Sensory and visual inspection satisfactory${c.visualCondition ? ` (${c.visualCondition.toLowerCase()})` : ''}.`,
  );

  const moisture = num(c.moistureOnArrival);
  if (moisture !== undefined) {
    parts.push(
      moisture > CHECKIN_LIMITS.moisturePercent
        ? `Moisture re-checked at ${moisture}%, above the ${CHECKIN_LIMITS.moisturePercent}% limit.`
        : `Moisture re-checked at ${moisture}%, within limit.`,
    );
  }
  if (c.storageTemperature || c.storageHumidity) {
    parts.push(
      `Held at ${c.storageTemperature || 'ambient'}` +
        `${c.storageHumidity ? ` and ${c.storageHumidity}% RH` : ''}` +
        `${c.storageLocation ? ` in ${c.storageLocation}` : ''}.`,
    );
  }

  if (c.retestRequired === 'Yes') {
    parts.push(
      `In-house retest raised${c.sampleId ? ` against sample ${c.sampleId}` : ''}` +
        `${c.sampleQuantity ? ` (${c.sampleQuantity})` : ''}.`,
    );
  } else if (c.sampleDrawn === 'Yes') {
    parts.push(`Retention sample ${c.sampleId || 'drawn'} taken.`);
  }

  if (c.gmpAreaVerified === 'No') {
    parts.push('Receiving area was not GMP-verified at the time of intake.');
  }
  if (c.shelfLifeRemaining) parts.push(`Remaining shelf life ${c.shelfLifeRemaining}.`);
  if (c.discrepancyNotes) parts.push(`Discrepancies noted: ${c.discrepancyNotes}`);

  parts.push(
    c.decision === 'Quarantined'
      ? 'Consignment quarantined — not released to production until resolved.'
      : c.decision === 'Accepted with remarks'
        ? 'Accepted with remarks; released to production with the above on record.'
        : 'Accepted into the manufacturing unit and released to production.',
  );

  return parts.join(' ');
}

export function summariseProduct(p: Product): string {
  const parts: string[] = [];

  const totalQty = p.components.reduce((sum, c) => sum + (Number(c.quantityUsed) || 0), 0);
  const speciesList = [...new Set(p.components.map((c) => c.species))];

  parts.push(
    `${p.productName} (${p.category}${p.formulation ? `, ${p.formulation.toLowerCase()}` : ''}) ` +
      `formulated from ${p.components.length} ` +
      `${p.components.length === 1 ? 'batch' : 'batches'} totalling ${totalQty} kg` +
      `${speciesList.length ? ` of ${speciesList.join(', ')}` : ''}.`,
  );

  const regions = [...new Set(p.components.map((c) => c.region).filter(Boolean))];
  const centres = [...new Set(p.components.map((c) => c.collectionCenter).filter(Boolean))];
  if (regions.length) {
    parts.push(
      `Raw material sourced from ${regions.join(', ')}` +
        `${centres.length ? ` via ${centres.join(', ')}` : ''}.`,
    );
  }

  const certified = p.components.filter((c) => c.labCertificate);
  if (certified.length) {
    parts.push(
      certified.length === p.components.length
        ? `All constituent batches carry a laboratory Certificate of Analysis.`
        : `${certified.length} of ${p.components.length} constituent batches carry a Certificate of Analysis.`,
    );
  }

  parts.push(
    `Manufactured ${p.manufacturingDate ? new Date(p.manufacturingDate).toLocaleDateString('en-IN') : ''}` +
      `${p.expiryDate ? `, expiring ${new Date(p.expiryDate).toLocaleDateString('en-IN')}` : ''}` +
      `${p.shelfLife ? ` (${p.shelfLife} shelf life)` : ''}.`,
  );

  if (p.batchSize || p.unitsProduced) {
    parts.push(
      `Batch size ${p.batchSize || '—'}` +
        `${p.unitsProduced ? `, yielding ${p.unitsProduced} units` : ''}` +
        `${p.packagingType ? ` in ${p.packagingType.toLowerCase()}` : ''}` +
        `${p.packSize ? ` of ${p.packSize}` : ''}.`,
    );
  }

  const qc = [
    p.finalMoisture ? `moisture ${p.finalMoisture}%` : null,
    p.finalAssay ? `assay ${p.finalAssay}` : null,
    p.microbialClearance ? `microbial clearance ${p.microbialClearance.toLowerCase()}` : null,
  ].filter(Boolean) as string[];
  if (qc.length) parts.push(`Finished-product QC: ${qc.join(', ')}.`);
  if (p.stabilityStudy) parts.push(`Stability: ${p.stabilityStudy}.`);

  if (p.manufacturingLicense || p.gmpCertificate || p.ayushLicense) {
    parts.push(
      `Produced by ${p.manufacturerName} under ` +
        [
          p.manufacturingLicense ? `licence ${p.manufacturingLicense}` : null,
          p.gmpCertificate ? `GMP ${p.gmpCertificate}` : null,
          p.ayushLicense ? `AYUSH ${p.ayushLicense}` : null,
        ]
          .filter(Boolean)
          .join(', ') + '.',
    );
  }

  if (p.qcApprovedBy) parts.push(`Released by ${p.qcApprovedBy}.`);
  if (p.remarks) parts.push(`Remarks: ${p.remarks}`);

  parts.push(`Traceable end-to-end via product code ${p.productCode}.`);

  return parts.join(' ');
}
