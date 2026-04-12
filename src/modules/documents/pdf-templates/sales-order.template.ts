import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import {
  baseStyles,
  buildHeader,
  buildKeyValueBlock,
  buildSignatureRow,
  buildTable,
  fmtDate,
  fmtMoney,
} from '../../../common/services/pdf-template-helpers';

export interface SoPdfData {
  orderNumber: string;
  workflowStatus?: string;
  orderType?: 'FABRIC' | 'PRODUCT';
  paymentType?: string;
  issueDate?: Date;
  customerName?: string;
  customerAddress?: string;
  expectedDeliveryDate?: Date;
  warehouseName?: string;
  currencySymbol?: string;
  totalAmount?: number;
  taxAmount?: number;
  grandTotal?: number;
  note?: string;
  internalNote?: string;
  qrDataUrl?: string;
  tenantName?: string;
  preparedBy?: string;
  approvedBy?: string;
  lines: Array<{
    lineNumber?: number;
    productName?: string;
    sku?: string;
    quantity?: number;
    unitPrice?: number;
    discountPct?: number;
    lineTotal?: number;
  }>;
}

/**
 * SALES_ORDER_CONFIRMATION PDF — customer-facing confirmation.
 *
 * Differs from the supplier PO in tone (customer instead of supplier
 * block, internal notes hidden), pricing detail (per-line discount
 * column) and signature block layout.
 */
export const buildSalesOrderPdf = (data: SoPdfData): TDocumentDefinitions => {
  const currency = data.currencySymbol ?? '';

  return {
    content: [
      buildHeader({
        title: 'SİPARİŞ ONAY BELGESİ',
        documentNumber: data.orderNumber,
        issueDate: data.issueDate,
        tenantName: data.tenantName,
        tenantTagline:
          data.orderType === 'PRODUCT' ? 'Ürün Siparişi' : 'Kumaş Siparişi',
        qrDataUrl: data.qrDataUrl,
      }),

      { text: 'MÜŞTERİ', style: 'sectionHeader' },
      buildKeyValueBlock([
        ['Ad', data.customerName],
        ['Adres', data.customerAddress],
      ]),

      { text: 'KOŞULLAR', style: 'sectionHeader' },
      buildKeyValueBlock([
        ['Beklenen Teslimat', fmtDate(data.expectedDeliveryDate)],
        ['Sevk Deposu', data.warehouseName],
        ['Ödeme', data.paymentType],
        ['Durum', data.workflowStatus],
      ]),

      { text: 'KALEMLER', style: 'sectionHeader' },
      buildTable({
        widths: [25, '*', 50, 60, 40, 70],
        headerRows: 1,
        layout: 'lightHorizontalLines',
        rows: [
          [
            { text: '#', style: 'tableHead' },
            { text: 'Ürün', style: 'tableHead' },
            { text: 'Miktar', style: 'tableHead', alignment: 'right' },
            { text: 'Birim', style: 'tableHead', alignment: 'right' },
            { text: 'İnd %', style: 'tableHead', alignment: 'right' },
            { text: 'Toplam', style: 'tableHead', alignment: 'right' },
          ],
          ...data.lines.map((line, i) => [
            { text: String(line.lineNumber ?? i + 1), style: 'tableCell' },
            {
              text: [
                { text: line.productName ?? '-', bold: true },
                line.sku
                  ? {
                      text: `\nSKU: ${line.sku}`,
                      fontSize: 8,
                      color: '#6b7280',
                    }
                  : '',
              ],
              style: 'tableCell',
            },
            {
              text: String(line.quantity ?? 0),
              style: 'tableCell',
              alignment: 'right',
            },
            {
              text: fmtMoney(line.unitPrice),
              style: 'tableCell',
              alignment: 'right',
            },
            {
              text: line.discountPct ? `${line.discountPct}%` : '-',
              style: 'tableCell',
              alignment: 'right',
            },
            {
              text: fmtMoney(line.lineTotal, currency),
              style: 'tableCell',
              alignment: 'right',
            },
          ]),
        ],
      }),

      { text: 'TOPLAMLAR', style: 'sectionHeader' },
      buildKeyValueBlock([
        ['Ara Toplam', fmtMoney(data.totalAmount, currency)],
        ['Vergi', fmtMoney(data.taxAmount, currency)],
        ['Genel Toplam', fmtMoney(data.grandTotal, currency)],
      ]),

      data.note
        ? {
            text: `Müşteri Notu: ${data.note}`,
            style: 'noteText',
            margin: [0, 12, 0, 0],
          }
        : '',

      buildSignatureRow(data.preparedBy, data.approvedBy),
    ],
    styles: baseStyles,
  };
};
