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

export interface InvoicePdfData {
  invoiceNumber: string;
  type?: string;
  status?: string;
  issueDate?: Date;
  dueDate?: Date;
  partnerName?: string;
  partnerAddress?: string;
  currencySymbol?: string;
  subtotal?: number;
  taxAmount?: number;
  grandTotal?: number;
  paidAmount?: number;
  remainingAmount?: number;
  paymentTerms?: string;
  note?: string;
  tenantName?: string;
  preparedBy?: string;
  lines: Array<{
    description?: string;
    quantity?: number;
    unitPrice?: number;
    taxRate?: number;
    lineTotal?: number;
  }>;
}

/**
 * INVOICE PDF — internal archive copy.
 *
 * EBusatis does NOT speak GIB / e-Fatura: this PDF is for internal
 * filing and customer-facing reference. Users still upload the legal
 * invoice produced by their accounting suite via the Sprint 6 upload
 * flow.
 */
export const buildInvoicePdf = (data: InvoicePdfData): TDocumentDefinitions => {
  const currency = data.currencySymbol ?? '';

  return {
    content: [
      buildHeader({
        title: 'FATURA (İÇ ARŞİV)',
        documentNumber: data.invoiceNumber,
        issueDate: data.issueDate,
        tenantName: data.tenantName,
        tenantTagline:
          'Resmi belge için lütfen E-Fatura PDF`ini referans alınız',
      }),

      { text: 'TARAF', style: 'sectionHeader' },
      buildKeyValueBlock([
        ['Ad', data.partnerName],
        ['Adres', data.partnerAddress],
      ]),

      { text: 'KOŞULLAR', style: 'sectionHeader' },
      buildKeyValueBlock([
        ['Tip', data.type],
        ['Durum', data.status],
        ['Vade Tarihi', fmtDate(data.dueDate)],
        ['Ödeme Şartları', data.paymentTerms],
      ]),

      { text: 'KALEMLER', style: 'sectionHeader' },
      buildTable({
        widths: ['*', 50, 60, 40, 70],
        headerRows: 1,
        layout: 'lightHorizontalLines',
        rows: [
          [
            { text: 'Açıklama', style: 'tableHead' },
            { text: 'Miktar', style: 'tableHead', alignment: 'right' },
            { text: 'Birim', style: 'tableHead', alignment: 'right' },
            { text: 'KDV %', style: 'tableHead', alignment: 'right' },
            { text: 'Toplam', style: 'tableHead', alignment: 'right' },
          ],
          ...data.lines.map((l) => [
            { text: l.description ?? '-', style: 'tableCell' },
            {
              text: String(l.quantity ?? 0),
              style: 'tableCell',
              alignment: 'right',
            },
            {
              text: fmtMoney(l.unitPrice),
              style: 'tableCell',
              alignment: 'right',
            },
            {
              text: l.taxRate ? `${l.taxRate}%` : '-',
              style: 'tableCell',
              alignment: 'right',
            },
            {
              text: fmtMoney(l.lineTotal, currency),
              style: 'tableCell',
              alignment: 'right',
            },
          ]),
        ],
      }),

      { text: 'TOPLAMLAR', style: 'sectionHeader' },
      buildKeyValueBlock([
        ['Ara Toplam', fmtMoney(data.subtotal, currency)],
        ['KDV', fmtMoney(data.taxAmount, currency)],
        ['Genel Toplam', fmtMoney(data.grandTotal, currency)],
        ['Ödenen', fmtMoney(data.paidAmount, currency)],
        ['Kalan', fmtMoney(data.remainingAmount, currency)],
      ]),

      data.note
        ? { text: data.note, style: 'noteText', margin: [0, 12, 0, 0] }
        : '',

      buildSignatureRow(data.preparedBy),
    ],
    styles: baseStyles,
  };
};
