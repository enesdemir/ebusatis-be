import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import {
  baseStyles,
  buildTable,
} from '../../../common/services/pdf-template-helpers';

export interface KartelaLabel {
  kartelaNumber: string;
  barcode: string;
  productName?: string;
  variantName?: string;
  sku?: string;
  shadeGroup?: string;
  shadeReference?: string;
  actualGSM?: number;
  quantity?: number;
  unit?: string;
  qrDataUrl: string;
  warehouseName?: string;
  locationCode?: string;
}

/**
 * KARTELA_LABEL PDF — printable QR-coded label sheet.
 *
 * Lays out 2 columns × 4 rows = 8 labels per A4 page. Each label
 * card carries the QR (scanned at the cutting table to pull the
 * roll), the human-readable kartela number, key shade / GSM data
 * and the warehouse / location for picking.
 */
export const buildKartelaLabelsPdf = (
  labels: KartelaLabel[],
  tenantName?: string,
): TDocumentDefinitions => {
  const cards: Content[] = labels.map((label) => buildLabelCard(label));

  // Group cards into rows of 2.
  const grid: Content[] = [];
  for (let i = 0; i < cards.length; i += 2) {
    grid.push({
      columns: [cards[i] ?? '', cards[i + 1] ?? ''],
      columnGap: 8,
      margin: [0, 0, 0, 8],
    });
  }

  return {
    pageMargins: [24, 36, 24, 36],
    content: [
      {
        text: `${tenantName ?? 'EBusatis'} — Kartela Etiketleri`,
        style: 'tenantName',
        alignment: 'center',
        margin: [0, 0, 0, 12],
      },
      ...grid,
    ],
    styles: {
      ...baseStyles,
      labelTitle: { fontSize: 11, bold: true, color: '#111827' },
      labelSub: { fontSize: 8, color: '#6b7280' },
      labelKey: { fontSize: 7, color: '#9ca3af' },
      labelVal: { fontSize: 9, color: '#111827' },
    },
  };
};

const buildLabelCard = (label: KartelaLabel): Content =>
  buildTable({
    widths: ['*', 70],
    layout: {
      hLineColor: () => '#e5e7eb',
      vLineColor: () => '#e5e7eb',
      paddingLeft: () => 8,
      paddingRight: () => 8,
      paddingTop: () => 6,
      paddingBottom: () => 6,
    },
    rows: [
      [
        {
          stack: [
            { text: label.kartelaNumber, style: 'labelTitle' },
            {
              text: `${label.productName ?? '-'}${label.variantName ? ` — ${label.variantName}` : ''}`,
              style: 'labelSub',
              margin: [0, 2, 0, 6],
            },
            {
              columns: [
                {
                  width: '*',
                  stack: [
                    { text: 'Barkod', style: 'labelKey' },
                    { text: label.barcode, style: 'labelVal' },
                  ],
                },
                {
                  width: '*',
                  stack: [
                    { text: 'Miktar', style: 'labelKey' },
                    {
                      text:
                        label.quantity !== undefined
                          ? `${label.quantity} ${label.unit ?? ''}`.trim()
                          : '-',
                      style: 'labelVal',
                    },
                  ],
                },
              ],
              columnGap: 8,
            },
            {
              columns: [
                {
                  width: '*',
                  stack: [
                    { text: 'Renk', style: 'labelKey' },
                    {
                      text: label.shadeGroup
                        ? `${label.shadeGroup}${label.shadeReference ? ` / ${label.shadeReference}` : ''}`
                        : '-',
                      style: 'labelVal',
                    },
                  ],
                },
                {
                  width: '*',
                  stack: [
                    { text: 'GSM', style: 'labelKey' },
                    {
                      text: label.actualGSM ? String(label.actualGSM) : '-',
                      style: 'labelVal',
                    },
                  ],
                },
              ],
              columnGap: 8,
              margin: [0, 4, 0, 0],
            },
            {
              columns: [
                {
                  width: '*',
                  stack: [
                    { text: 'Depo', style: 'labelKey' },
                    { text: label.warehouseName ?? '-', style: 'labelVal' },
                  ],
                },
                {
                  width: '*',
                  stack: [
                    { text: 'Lokasyon', style: 'labelKey' },
                    { text: label.locationCode ?? '-', style: 'labelVal' },
                  ],
                },
              ],
              columnGap: 8,
              margin: [0, 4, 0, 0],
            },
          ],
        },
        {
          image: label.qrDataUrl,
          width: 70,
          alignment: 'right',
        },
      ],
    ],
  });
