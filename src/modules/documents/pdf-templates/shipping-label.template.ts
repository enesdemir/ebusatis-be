import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import {
  baseStyles,
  buildTable,
} from '../../../common/services/pdf-template-helpers';

export interface ShippingLabelData {
  boxBarcode: string;
  boxNumber: number;
  totalBoxes: number;
  qrDataUrl: string;
  shipmentNumber: string;
  salesOrderNumber?: string;
  customerName: string;
  customerAddress?: string;
  carrierName?: string;
  trackingNumber?: string;
  weightKg?: number;
  dimensionsCm?: string;
}

/**
 * SHIPPING_LABEL PDF — per-box shipping label with QR + barcode.
 *
 * 1 label per A5 page (so thermal-printer operators can print each
 * box separately). Layout has the QR in the top-right, the customer
 * block in the left column, tracking + box metadata at the bottom.
 */
export const buildShippingLabelsPdf = (
  labels: ShippingLabelData[],
  tenantName?: string,
): TDocumentDefinitions => {
  const pages: Content[] = labels.map((label, i) =>
    buildLabelPage(label, tenantName, i < labels.length - 1),
  );

  return {
    pageSize: 'A5',
    pageMargins: [24, 24, 24, 24],
    content: pages,
    styles: {
      ...baseStyles,
      labelHeader: { fontSize: 14, bold: true, color: '#111827' },
      labelKey: { fontSize: 8, color: '#6b7280' },
      labelVal: { fontSize: 10, color: '#111827' },
      labelBoxCount: { fontSize: 18, bold: true, color: '#1d4ed8' },
    },
  };
};

const buildLabelPage = (
  label: ShippingLabelData,
  tenantName: string | undefined,
  pageBreakAfter: boolean,
): Content => ({
  stack: [
    buildTable({
      widths: ['*', 120],
      layout: {
        hLineColor: () => '#111827',
        vLineColor: () => '#111827',
        paddingLeft: () => 8,
        paddingRight: () => 8,
        paddingTop: () => 6,
        paddingBottom: () => 6,
      },
      rows: [
        [
          {
            stack: [
              { text: tenantName ?? 'EBusatis', style: 'labelHeader' },
              {
                text: 'SHIPPING LABEL',
                style: 'labelKey',
                margin: [0, 2, 0, 6],
              },
              { text: 'Alıcı', style: 'labelKey' },
              { text: label.customerName, style: 'labelVal' },
              {
                text: label.customerAddress ?? '-',
                style: 'labelVal',
                margin: [0, 2, 0, 6],
              },
            ],
          },
          {
            image: label.qrDataUrl,
            width: 120,
            alignment: 'right',
          },
        ],
      ],
    }),
    buildTable({
      widths: ['*', '*'],
      layout: {
        hLineColor: () => '#111827',
        vLineColor: () => '#111827',
        paddingLeft: () => 8,
        paddingRight: () => 8,
        paddingTop: () => 6,
        paddingBottom: () => 6,
      },
      rows: [
        [
          {
            stack: [
              { text: 'Koli', style: 'labelKey' },
              {
                text: `${label.boxNumber} / ${label.totalBoxes}`,
                style: 'labelBoxCount',
              },
            ],
          },
          {
            stack: [
              { text: 'Barkod', style: 'labelKey' },
              { text: label.boxBarcode, style: 'labelVal' },
              { text: 'Sevk No', style: 'labelKey', margin: [0, 4, 0, 0] },
              { text: label.shipmentNumber, style: 'labelVal' },
              ...(label.salesOrderNumber
                ? [
                    {
                      text: 'Sipariş No',
                      style: 'labelKey',
                      margin: [0, 4, 0, 0] as [number, number, number, number],
                    },
                    { text: label.salesOrderNumber, style: 'labelVal' },
                  ]
                : []),
            ],
          },
        ],
        [
          {
            stack: [
              { text: 'Kargo Firması', style: 'labelKey' },
              { text: label.carrierName ?? '-', style: 'labelVal' },
              {
                text: 'Tracking',
                style: 'labelKey',
                margin: [0, 4, 0, 0],
              },
              { text: label.trackingNumber ?? '-', style: 'labelVal' },
            ],
          },
          {
            stack: [
              { text: 'Ağırlık', style: 'labelKey' },
              {
                text: label.weightKg ? `${label.weightKg} kg` : '-',
                style: 'labelVal',
              },
              {
                text: 'Ebat',
                style: 'labelKey',
                margin: [0, 4, 0, 0],
              },
              { text: label.dimensionsCm ?? '-', style: 'labelVal' },
            ],
          },
        ],
      ],
    }),
  ],
  pageBreak: pageBreakAfter ? 'after' : undefined,
});
