import type {
  Content,
  TableCell,
  TDocumentDefinitions,
} from 'pdfmake/interfaces';

/**
 * Shared building blocks for PDF templates.
 *
 * Each template is responsible for the meaningful body and totals;
 * the helpers here keep the chrome (header, signature block, footer)
 * uniform across the eight document types delivered in Sprint 7.
 */

export interface DocumentChrome {
  /** The big title in the page header (e.g. "PURCHASE ORDER"). */
  title: string;
  /** Document number / reference shown next to the title. */
  documentNumber: string;
  /** Optional ISO date string; defaults to today. */
  issueDate?: Date;
  /** Tenant company name printed in the header. */
  tenantName?: string;
  /** Optional tenant tagline / address line under the name. */
  tenantTagline?: string;
  /** Optional QR data-URL embedded in the top-right corner. */
  qrDataUrl?: string;
}

/** Standardised page header used by every document. */
export const buildHeader = (chrome: DocumentChrome): Content => {
  return {
    columns: [
      [
        { text: chrome.tenantName ?? 'EBusatis', style: 'tenantName' },
        chrome.tenantTagline
          ? { text: chrome.tenantTagline, style: 'tenantTagline' }
          : '',
      ],
      [
        { text: chrome.title, style: 'docTitle', alignment: 'right' },
        {
          text: chrome.documentNumber,
          style: 'docNumber',
          alignment: 'right',
        },
        {
          text: (chrome.issueDate ?? new Date()).toLocaleDateString('tr-TR'),
          style: 'docMeta',
          alignment: 'right',
        },
        chrome.qrDataUrl
          ? {
              image: chrome.qrDataUrl,
              width: 70,
              alignment: 'right',
              margin: [0, 4, 0, 0],
            }
          : '',
      ],
    ],
    margin: [0, 0, 0, 16],
  };
};

/** Two-column key/value block (uses the table layout so it stays neat). */
export const buildKeyValueBlock = (
  rows: Array<[string, string | undefined]>,
): Content => ({
  table: {
    widths: [120, '*'],
    body: rows.map(([k, v]) => [
      { text: k, style: 'kvKey' },
      { text: v ?? '-', style: 'kvVal' },
    ]),
  },
  layout: 'noBorders',
  margin: [0, 0, 0, 12],
});

/** Generic signature row at the bottom of contractual documents. */
export const buildSignatureRow = (
  preparedBy?: string,
  approvedBy?: string,
): Content => ({
  columns: [
    {
      stack: [
        { text: 'Hazırlayan', style: 'sigLabel' },
        { text: preparedBy ?? '-', style: 'sigName' },
        {
          canvas: [
            { type: 'line', x1: 0, y1: 0, x2: 180, y2: 0, lineWidth: 0.5 },
          ],
        },
      ],
    },
    {
      stack: [
        { text: 'Onaylayan', style: 'sigLabel' },
        { text: approvedBy ?? '-', style: 'sigName' },
        {
          canvas: [
            { type: 'line', x1: 0, y1: 0, x2: 180, y2: 0, lineWidth: 0.5 },
          ],
        },
      ],
    },
  ],
  margin: [0, 30, 0, 0],
});

/**
 * Build a complete table `Content` block in one call.
 *
 * pdfmake's `TableCell` is a deeply-discriminated union, so plain
 * object literals don't narrow well — wrapping the construction here
 * lets per-template code stay untyped at the cell level while the
 * helper takes responsibility for the cast to `Content`.
 *
 * Pass `widths`, optional `headerRows`, the rows themselves and an
 * optional pdfmake layout name (`'lightHorizontalLines'` etc.).
 */
export const buildTable = (params: {
  widths: Array<string | number>;
  headerRows?: number;
  rows: Array<Array<unknown>>;
  /** Either a builtin pdfmake layout name or a custom layout object. */
  layout?: string | Record<string, unknown>;
}): Content => ({
  table: {
    widths: params.widths,
    headerRows: params.headerRows,
    body: params.rows as TableCell[][],
  },
  layout: params.layout as never,
});

/** Locale-aware money formatter — rounded to 2 decimals. */
export const fmtMoney = (
  amount: number | string | undefined,
  currency = '',
): string => {
  if (amount === undefined || amount === null) return '-';
  const n = Number(amount);
  if (Number.isNaN(n)) return '-';
  const formatted = n.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return currency ? `${formatted} ${currency}` : formatted;
};

/** Compact date formatter used inside tables. */
export const fmtDate = (date: Date | string | undefined): string => {
  if (!date) return '-';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('tr-TR');
};

/** Style sheet shared by every Sprint 7 template. */
export const baseStyles: TDocumentDefinitions['styles'] = {
  tenantName: { fontSize: 14, bold: true },
  tenantTagline: { fontSize: 9, color: '#6b7280' },
  docTitle: { fontSize: 16, bold: true, color: '#1d4ed8' },
  docNumber: { fontSize: 11, color: '#111827' },
  docMeta: { fontSize: 9, color: '#6b7280' },
  sectionHeader: {
    fontSize: 11,
    bold: true,
    color: '#111827',
    margin: [0, 12, 0, 6],
  },
  kvKey: { fontSize: 9, color: '#6b7280' },
  kvVal: { fontSize: 10, color: '#111827' },
  tableHead: { fontSize: 9, bold: true, fillColor: '#f3f4f6' },
  tableCell: { fontSize: 9 },
  totalRow: { fontSize: 10, bold: true },
  noteText: { fontSize: 9, color: '#374151', italics: true },
  sigLabel: { fontSize: 8, color: '#6b7280' },
  sigName: { fontSize: 10, bold: true, margin: [0, 4, 0, 16] },
};
