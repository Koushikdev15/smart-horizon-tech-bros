import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import type { Batch, LabReport } from '../types';
import { buildRows } from './certificateRows';

/**
 * Certificate of Analysis, drawn as vector primitives rather than captured as a
 * screenshot of the DOM. Text stays selectable, searchable and crisp at any
 * zoom, and prints correctly on any printer — which matters for a document
 * people file, forward and re-print. The only bitmap is the verification QR.
 *
 * Every value comes from the batch's stored `labReport`. Parameters the analyst
 * left blank are omitted rather than invented, so the certificate never claims
 * a test that was not run.
 */

const INK = { r: 0, g: 36, b: 16 };          // Deep Forest
const BAND = { r: 11, g: 59, b: 32 };        // Primary container
const GOLD = { r: 201, g: 154, b: 46 };      // Ayurvedic Gold
const SAGE = { r: 122, g: 158, b: 126 };
const PAPER = { r: 252, g: 250, b: 242 };    // Warm ivory
const PASS = { r: 46, g: 106, b: 65 };
const FAIL = { r: 186, g: 26, b: 26 };
const MUTED = { r: 108, g: 118, b: 110 };

const PAGE_W = 210;
const PAGE_H = 297;
const M = 16; // page margin

const setFill = (d: jsPDF, c: { r: number; g: number; b: number }) => d.setFillColor(c.r, c.g, c.b);
const setText = (d: jsPDF, c: { r: number; g: number; b: number }) => d.setTextColor(c.r, c.g, c.b);
const setDraw = (d: jsPDF, c: { r: number; g: number; b: number }) => d.setDrawColor(c.r, c.g, c.b);

/** Fine concentric arcs in the margin — a security-print flourish. */
function guilloche(doc: jsPDF, cx: number, cy: number, rings: number, radius: number) {
  doc.setLineWidth(0.12);
  setDraw(doc, SAGE);
  for (let i = 0; i < rings; i++) {
    doc.circle(cx, cy, radius * (1 - i / rings), 'S');
  }
}

/**
 * Vertical zones, measured from the top of the page.
 * Content flows between CONTENT_TOP and CONTENT_BOTTOM; the sign-off strip and
 * footer band sit at fixed positions on the final page, so a long results table
 * can never run underneath them.
 */
const BAND_H = 38;
const CONTENT_TOP = BAND_H + 12;
const FOOTER_H = 16;
const SIG_Y = PAGE_H - FOOTER_H - 15;
const VERIFY_H = 20; // QR block edge length
const CONTENT_BOTTOM = SIG_Y - 6;
const ROW_H = 5.5;

/** Paints the page ground and the security flourishes. */
function paintPage(doc: jsPDF) {
  setFill(doc, PAPER);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
  guilloche(doc, 8, 150, 6, 7);
  guilloche(doc, PAGE_W - 8, 150, 6, 7);
}

/** Full masthead — first page only. */
function masthead(doc: jsPDF, batch: Batch, r: LabReport) {
  setFill(doc, BAND);
  doc.rect(0, 0, PAGE_W, BAND_H, 'F');
  setFill(doc, GOLD);
  doc.rect(0, BAND_H, PAGE_W, 1.2, 'F');

  setText(doc, { r: 255, g: 255, b: 255 });
  doc.setFontSize(19);
  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFICATE OF ANALYSIS', M, 17);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  setText(doc, { r: 170, g: 205, b: 180 });
  doc.text('HerbChain · AyurTrace+  |  Ministry of AYUSH, Government of India', M, 24);
  doc.text('Blockchain-verified Ayurvedic herb traceability', M, 29.5);

  doc.setFontSize(7.5);
  setText(doc, GOLD);
  doc.text('CERTIFICATE NO.', PAGE_W - M, 15, { align: 'right' });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  setText(doc, { r: 255, g: 255, b: 255 });
  doc.text(r.certificateNumber || `LAB-${batch.batchNumber}`, PAGE_W - M, 21, { align: 'right' });
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  setText(doc, { r: 170, g: 205, b: 180 });
  const issued = r.testDate ? new Date(r.testDate) : new Date();
  doc.text(`Issued ${issued.toLocaleDateString('en-IN')}`, PAGE_W - M, 27, { align: 'right' });
}

/**
 * Slim running header for continuation pages. A page of a controlled document
 * that becomes separated from page 1 must still identify itself.
 */
function continuationHeader(doc: jsPDF, batch: Batch, r: LabReport) {
  setFill(doc, BAND);
  doc.rect(0, 0, PAGE_W, 14, 'F');
  setFill(doc, GOLD);
  doc.rect(0, 14, PAGE_W, 0.8, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  setText(doc, { r: 255, g: 255, b: 255 });
  doc.text('CERTIFICATE OF ANALYSIS (continued)', M, 9);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  setText(doc, { r: 170, g: 205, b: 180 });
  doc.text(
    `${r.certificateNumber || `LAB-${batch.batchNumber}`}  ·  Batch ${batch.batchNumber}`,
    PAGE_W - M,
    9,
    { align: 'right' },
  );
}

/** Section heading with the gold rule beneath it. */
function heading(doc: jsPDF, label: string, y: number, width: number) {
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  setText(doc, INK);
  doc.text(label, M, y);
  setDraw(doc, GOLD);
  doc.setLineWidth(0.4);
  doc.line(M, y + 1.6, M + width, y + 1.6);
}

/** Builds the document. Split from the save step so it can be exercised in tests. */
export async function buildCertificate(batch: Batch): Promise<jsPDF> {
  const r: LabReport = batch.labReport ?? {};
  const rows = buildRows(r);
  const failed = r.overallResult === 'Fail';
  const verdictColor = failed ? FAIL : PASS;

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.setFont('helvetica');

  paintPage(doc);
  masthead(doc, batch, r);

  let y = CONTENT_TOP;

  /** Starts a continuation page and resets the cursor below its running header. */
  const newPage = () => {
    doc.addPage();
    paintPage(doc);
    continuationHeader(doc, batch, r);
    y = 24;
  };

  /** Ensures `need` mm are available before drawing. */
  const reserve = (need: number) => {
    if (y + need > CONTENT_BOTTOM) newPage();
  };

  // ── Sample identification ────────────────────────────────────────────────
  heading(doc, 'SAMPLE IDENTIFICATION', y, 45);
  y += 8;

  const facts: [string, string][] = [
    ['Batch Number', batch.batchNumber],
    ['Botanical Name', batch.botanicalName || '—'],
    ['Common Name', batch.species],
    ['Quantity', `${batch.quantity} ${batch.unit}`],
    ['Collection Centre', batch.collectionCenter],
    ['Collector', `${batch.collectorName}${batch.collectorType ? ` (${batch.collectorType})` : ''}`],
    ['Region of Origin', batch.region],
    ['Harvest Date', batch.harvestDate ? new Date(batch.harvestDate).toLocaleDateString('en-IN') : '—'],
    ['Testing Laboratory', r.labName || '—'],
  ];
  if (r.nablNumber) facts.push(['NABL Accreditation', r.nablNumber]);
  if (r.sieveSize) facts.push(['Particle Size', r.sieveSize]);
  if (r.outputQuantity) facts.push(['Processed Output', r.outputQuantity]);

  // Three columns keeps the identity block to four rows.
  const COLS = 3;
  const colW = (PAGE_W - M * 2) / COLS;
  facts.forEach(([label, value], i) => {
    const x = M + (i % COLS) * colW;
    const ly = y + Math.floor(i / COLS) * 8;
    doc.setFontSize(6.6);
    doc.setFont('helvetica', 'normal');
    setText(doc, MUTED);
    doc.text(label.toUpperCase(), x, ly);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    setText(doc, INK);
    doc.text(doc.splitTextToSize(String(value), colW - 4)[0] ?? '—', x, ly + 4);
  });
  y += Math.ceil(facts.length / COLS) * 8 + 3;

  // ── Results table ────────────────────────────────────────────────────────
  const cols = { p: M, s: M + 74, r: M + 120, v: PAGE_W - M };

  const tableHead = () => {
    setFill(doc, BAND);
    doc.rect(M, y, PAGE_W - M * 2, 6.6, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    setText(doc, { r: 255, g: 255, b: 255 });
    doc.text('PARAMETER', cols.p + 2, y + 4.4);
    doc.text('SPECIFICATION', cols.s, y + 4.4);
    doc.text('RESULT', cols.r, y + 4.4);
    doc.text('STATUS', cols.v - 2, y + 4.4, { align: 'right' });
    y += 6.6;
  };

  reserve(20);
  heading(doc, 'ANALYTICAL RESULTS', y, 40);
  y += 6.5;
  tableHead();

  if (rows.length === 0) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    setText(doc, MUTED);
    doc.text('No individual test parameters were recorded for this batch.', M + 2, y + 5);
    y += 10;
  }

  rows.forEach((row, i) => {
    if (y + ROW_H > CONTENT_BOTTOM) {
      newPage();
      tableHead();
    }

    if (i % 2 === 0) {
      doc.setFillColor(244, 241, 232);
      doc.rect(M, y, PAGE_W - M * 2, ROW_H, 'F');
    }

    const base = y + ROW_H - 2.1;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    setText(doc, INK);
    doc.text(doc.splitTextToSize(row.parameter, 70)[0], cols.p + 2, base);
    setText(doc, MUTED);
    doc.text(doc.splitTextToSize(row.spec, 44)[0], cols.s, base);
    setText(doc, INK);
    doc.setFont('helvetica', 'bold');
    doc.text(doc.splitTextToSize(row.result, 32)[0], cols.r, base);

    if (row.verdict === '—') {
      setText(doc, MUTED);
      doc.setFont('helvetica', 'normal');
      doc.text('REPORTED', cols.v - 2, base, { align: 'right' });
    } else {
      setText(doc, row.verdict === 'Pass' ? PASS : FAIL);
      doc.text(row.verdict.toUpperCase(), cols.v - 2, base, { align: 'right' });
    }
    y += ROW_H;
  });

  setDraw(doc, SAGE);
  doc.setLineWidth(0.2);
  doc.line(M, y, PAGE_W - M, y);
  y += 6;

  // ── Verdict ──────────────────────────────────────────────────────────────
  reserve(18);
  setFill(doc, verdictColor);
  doc.roundedRect(M, y, PAGE_W - M * 2, 14, 2, 2, 'F');
  setText(doc, { r: 255, g: 255, b: 255 });
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text(
    failed
      ? 'RESULT: DOES NOT CONFORM TO SPECIFICATION'
      : r.overallResult === 'Conditional Pass'
        ? 'RESULT: CONFORMS — CONDITIONAL RELEASE'
        : 'RESULT: CONFORMS TO SPECIFICATION',
    M + 5,
    y + 9,
  );
  y += 17;

  // ── Analytical summary ───────────────────────────────────────────────────
  if (r.aiSummary) {
    doc.setFontSize(7.5);
    const lines: string[] = doc.splitTextToSize(r.aiSummary, PAGE_W - M * 2);
    reserve(6 + lines.length * 3.4);
    doc.setFont('helvetica', 'bold');
    setText(doc, INK);
    doc.text('ANALYTICAL SUMMARY', M, y);
    y += 4.5;
    doc.setFont('helvetica', 'normal');
    setText(doc, MUTED);
    doc.text(lines, M, y);
    y += lines.length * 3.4 + 2;
  }

  if (r.remarks) {
    doc.setFontSize(7.5);
    const lines: string[] = doc.splitTextToSize(`Analyst remarks: ${r.remarks}`, PAGE_W - M * 2);
    reserve(4 + lines.length * 3.4);
    doc.setFont('helvetica', 'italic');
    setText(doc, MUTED);
    doc.text(lines, M, y);
    y += lines.length * 3.4 + 3;
  }

  // ── Verification block ───────────────────────────────────────────────────
  // Flows with the content rather than sitting at a fixed offset, so page one
  // fills naturally instead of leaving a void above a pinned block.
  reserve(VERIFY_H + 4);
  const verifyY = y;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ayurtrace.in';
  const verifyUrl = `${origin}/verify/${batch.batchNumber}`;

  try {
    const qr = await QRCode.toDataURL(verifyUrl, {
      margin: 0,
      width: 256,
      color: { dark: '#002410', light: '#FCFAF2' },
    });
    doc.addImage(qr, 'PNG', PAGE_W - M - VERIFY_H, verifyY, VERIFY_H, VERIFY_H);
  } catch {
    // A missing QR must not block the certificate.
  }

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  setText(doc, INK);
  doc.text('BLOCKCHAIN VERIFICATION', M, verifyY + 4);
  doc.setFont('helvetica', 'normal');
  setText(doc, MUTED);
  doc.setFontSize(6.8);
  doc.text(`Batch record: ${batch.batchNumber}`, M, verifyY + 9);
  let vy = verifyY + 13;
  if (batch.blockchainHash) {
    doc.text(`Tx hash: ${doc.splitTextToSize(batch.blockchainHash, 110)[0]}`, M, vy);
    vy += 4;
  }
  doc.text(doc.splitTextToSize(`Scan to verify: ${verifyUrl}`, 110)[0], M, vy);
  y = verifyY + VERIFY_H + 4;

  // Sign-off — pinned to the foot of whichever page the flow ended on.
  setDraw(doc, INK);
  doc.setLineWidth(0.3);
  doc.line(M, SIG_Y, M + 55, SIG_Y);
  doc.line(PAGE_W - M - 55, SIG_Y, PAGE_W - M, SIG_Y);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  setText(doc, INK);
  doc.text(r.analyst || 'Analyst', M, SIG_Y + 4.5);
  doc.text(r.approvedBy || 'Quality Manager', PAGE_W - M, SIG_Y + 4.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  setText(doc, MUTED);
  doc.text('Tested by', M, SIG_Y + 8.8);
  doc.text('Approved by', PAGE_W - M, SIG_Y + 8.8, { align: 'right' });

  if (r.labName) {
    doc.setFontSize(7.2);
    doc.text(
      `${r.labName}${r.nablNumber ? `  ·  NABL ${r.nablNumber}` : ''}`,
      PAGE_W / 2,
      SIG_Y + 8.8,
      { align: 'center' },
    );
  }

  // ── Footer band on every page ────────────────────────────────────────────
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    setFill(doc, BAND);
    doc.rect(0, PAGE_H - FOOTER_H, PAGE_W, FOOTER_H, 'F');
    setFill(doc, GOLD);
    doc.rect(0, PAGE_H - FOOTER_H, PAGE_W, 0.8, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.4);
    setText(doc, { r: 170, g: 205, b: 180 });
    doc.text(
      'This certificate relates only to the sample identified above. Results are recorded on the AyurTrace+ ledger',
      PAGE_W / 2,
      PAGE_H - 10,
      { align: 'center' },
    );
    doc.text(
      'and may be independently verified by scanning the code. Reproduction except in full is not permitted.',
      PAGE_W / 2,
      PAGE_H - 6.5,
      { align: 'center' },
    );
    doc.text(r.certificateNumber || `LAB-${batch.batchNumber}`, M, PAGE_H - 3.2);
    doc.text(`Page ${p} of ${pages}`, PAGE_W - M, PAGE_H - 3.2, { align: 'right' });
  }

  return doc;
}

export function certificateFileName(batch: Batch): string {
  const r = batch.labReport ?? {};
  return `${r.certificateNumber || batch.batchNumber}-certificate-of-analysis.pdf`;
}

export async function generateCertificatePdf(batch: Batch): Promise<void> {
  const doc = await buildCertificate(batch);
  doc.save(certificateFileName(batch));
}
