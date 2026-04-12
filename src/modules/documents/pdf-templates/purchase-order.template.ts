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

export interface PoPdfData {
  orderNumber: string;
  revisionNumber?: number;
  workflowStatus?: string;
  issueDate?: Date;
  supplierName?: string;
  supplierAddress?: string;
  expectedDeliveryDate?: Date;
  paymentTerms?: string;
  currencySymbol?: string;
  totalAmount?: number;
  taxAmount?: number;
  grandTotal?: number;
  downPaymentAmount?: number;
  note?: string;
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
    lineTotal?: number;
  }>;
}

/**
 * PURCHASE_ORDER PDF — supplier-facing document.
 *
 * Sections: header (logo + QR), supplier block, payment block, lines
 * table, totals, signature row. The QR encodes the public tracking
 * URL so the supplier can scan and see status.
 */
export const buildPurchaseOrderPdf = (
  data: PoPdfData,
): TDocumentDefinitions => {
  const currency = data.currencySymbol ?? '';

  return {
    content: [
      buildHeader({
        title: 'SATIN ALMA SİPARİŞİ',
        documentNumber: `${data.orderNumber}${data.revisionNumber && data.revisionNumber > 1 ? ` (rev ${data.revisionNumber})` : ''}`,
        issueDate: data.issueDate,
        tenantName: data.tenantName,
        tenantTagline: 'Tedarikçi Sipariş Belgesi',
        qrDataUrl: data.qrDataUrl,
      }),

      { text: 'TEDARİKÇİ', style: 'sectionHeader' },
      buildKeyValueBlock([
        ['Ad', data.supplierName],
        ['Adres', data.supplierAddress],
      ]),

      { text: 'KOŞULLAR', style: 'sectionHeader' },
      buildKeyValueBlock([
        ['Beklenen Teslimat', fmtDate(data.expectedDeliveryDate)],
        ['Ödeme Şartları', data.paymentTerms],
        ['Peşinat', fmtMoney(data.downPaymentAmount, currency)],
        ['Durum', data.workflowStatus],
      ]),

      { text: 'KALEMLER', style: 'sectionHeader' },
      buildTable({
        widths: [25, '*', 50, 60, 70],
        headerRows: 1,
        layout: 'lightHorizontalLines',
        rows: [
          [
            { text: '#', style: 'tableHead' },
            { text: 'Ürün', style: 'tableHead' },
            { text: 'Miktar', style: 'tableHead', alignment: 'right' },
            { text: 'Birim', style: 'tableHead', alignment: 'right' },
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
            text: data.note,
            style: 'noteText',
            margin: [0, 12, 0, 0],
          }
        : '',

      buildSignatureRow(data.preparedBy, data.approvedBy),
    ],
    styles: baseStyles,
  };
};
