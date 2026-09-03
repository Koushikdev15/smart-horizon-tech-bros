import type { LabReport } from '../types';

/**
 * The results table, derived from whatever the analyst actually recorded.
 *
 * Kept free of any PDF dependency so the on-screen certificate preview can use
 * it without pulling the (large) PDF engine into the main bundle — that is
 * loaded on demand, only when someone downloads.
 *
 * Parameters the analyst left blank are omitted rather than invented, so the
 * certificate never claims a test that was not run.
 */

export interface Row {
  parameter: string;
  spec: string;
  result: string;
  verdict: 'Pass' | 'Fail' | '—';
}

const num = (v?: string) => {
  if (!v) return undefined;
  const n = Number(String(v).replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : undefined;
};

export function buildRows(r: LabReport): Row[] {
  const rows: Row[] = [];

  /** A measured value judged against a ceiling (NMT) or a floor (NLT). */
  const limitRow = (
    value: string | undefined,
    parameter: string,
    spec: string,
    cap?: number,
    floor?: number,
    unit = '%',
  ) => {
    if (!value) return;
    const n = num(value);
    let verdict: Row['verdict'] = '—';
    if (n !== undefined) {
      if (cap !== undefined) verdict = n <= cap ? 'Pass' : 'Fail';
      else if (floor !== undefined) verdict = n >= floor ? 'Pass' : 'Fail';
    }
    rows.push({ parameter, spec, result: `${value}${unit}`, verdict });
  };

  /** A qualitative observation; only an explicit Pass/Fail is treated as a verdict. */
  const plainRow = (value: string | undefined, parameter: string, spec: string) => {
    if (!value) return;
    const verdict: Row['verdict'] =
      /^pass$/i.test(value) ? 'Pass' : /^fail$/i.test(value) ? 'Fail' : '—';
    rows.push({ parameter, spec, result: value, verdict });
  };

  // Identity
  plainRow(r.macroscopy, 'Macroscopic Examination', 'Conforms to reference');
  plainRow(r.microscopy, 'Microscopic Examination', 'Conforms to reference');
  plainRow(r.tlcProfile, 'TLC / HPTLC Profile', 'Matches reference standard');
  plainRow(r.dnaAuthentication, 'DNA Barcode Authentication', 'Positive species match');

  // Pharmacopoeial
  limitRow(r.moisture, 'Moisture Content', 'NMT 10.0%', 10);
  limitRow(r.totalAsh, 'Total Ash', 'NMT 5.0%', 5);
  limitRow(r.acidInsolubleAsh, 'Acid-Insoluble Ash', 'NMT 1.0%', 1);
  limitRow(r.waterSolubleExtractive, 'Water-Soluble Extractive', 'NLT 10.0%', undefined, 10);
  limitRow(r.alcoholSolubleExtractive, 'Alcohol-Soluble Extractive', 'NLT 5.0%', undefined, 5);
  limitRow(r.foreignMatterPercent, 'Foreign Matter', 'NMT 2.0%', 2);
  limitRow(r.volatileOil, 'Volatile Oil', 'Reported');

  if (r.markerCompound && r.markerContent) {
    rows.push({
      parameter: `Assay — ${r.markerCompound}`,
      spec: 'As per monograph',
      result: `${r.markerContent}%`,
      verdict: '—',
    });
  }

  // Contaminants
  limitRow(r.lead, 'Lead (Pb)', 'NMT 10.0 ppm', 10, undefined, ' ppm');
  limitRow(r.cadmium, 'Cadmium (Cd)', 'NMT 0.3 ppm', 0.3, undefined, ' ppm');
  limitRow(r.arsenic, 'Arsenic (As)', 'NMT 3.0 ppm', 3, undefined, ' ppm');
  limitRow(r.mercury, 'Mercury (Hg)', 'NMT 1.0 ppm', 1, undefined, ' ppm');
  plainRow(r.aflatoxin, 'Aflatoxin (B1, B2, G1, G2)', 'NMT 0.5 ppb');
  plainRow(r.pesticides, 'Pesticide Residue', 'Within permissible limits');

  // Microbiology
  plainRow(r.totalPlateCount, 'Total Plate Count', 'NMT 10^5 cfu/g');
  plainRow(r.yeastMould, 'Yeast & Mould Count', 'NMT 10^3 cfu/g');
  plainRow(r.eColi, 'Escherichia coli', 'Absent');
  plainRow(r.salmonella, 'Salmonella spp.', 'Absent');

  // Sensory
  plainRow(r.colour, 'Colour', 'Characteristic');
  plainRow(r.odour, 'Odour', 'Characteristic');
  plainRow(r.texture, 'Texture', 'Characteristic');

  return rows;
}
