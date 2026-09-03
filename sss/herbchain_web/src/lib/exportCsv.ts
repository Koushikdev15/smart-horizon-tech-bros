/**
 * CSV export for the government reporting screens.
 *
 * Reports used to "download" a few hand-written lines of placeholder text; this
 * writes the real rows it is given.
 */

/**
 * Escapes one field.
 *
 * A leading =, +, - or @ makes a spreadsheet treat the value as a formula, so
 * such fields are prefixed with a quote. Batch remarks are free text entered by
 * users, and a CSV opened in Excel should not execute any of it.
 */
function cell(value: unknown): string {
  if (value === null || value === undefined) return '';
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers.map(cell).join(','), ...rows.map((r) => r.map(cell).join(','))].join('\r\n');
}

export function downloadCsv(filename: string, headers: string[], rows: unknown[][]): void {
  // The BOM makes Excel read it as UTF-8, so botanical names and ₹ survive.
  const blob = new Blob(['﻿' + toCsv(headers, rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
