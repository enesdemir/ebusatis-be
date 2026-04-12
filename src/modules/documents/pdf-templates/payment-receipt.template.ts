import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import {
  baseStyles,
  buildHeader,
  buildKeyValueBlock,
  buildTable,
  fmtDate,
  fmtMoney,
} from '../../../common/services/pdf-template-helpers';

export interface PaymentReceiptPdfData {
  receiptNumber: string;
  direction?: 'INCOMING' | 'OUTGOING';
  paymentDate?: Date;
  partnerName?: string;
  amount?: number;
  currencySymbol?: string;
  paymentMethod?: string;
  bankReference?: string;
  status?: string;
  note?: string;
  qrDataUrl?: string;
  verifyUrl?: string;
  tenantName?: string;
  matchedInvoices?: Array<{
    invoiceNumber: string;
    amountApplied: number;
  }>;
}

/**
 * PAYMENT_RECEIPT PDF — printable receipt with QR for public verify.
 *
 * Smaller content surface than the invoice template — the receipt
 * proves a single transaction, optionally with a list of invoice
 * applications (PaymentInvoiceMatch rows), and points at a public
 * verification URL via QR.
 */
export const buildPaymentReceiptPdf = (
  data: PaymentReceiptPdfData,
): TDocumentDefinitions => {
  const currency = data.currencySymbol ?? '';
  const directionLabel =
    data.direction === 'OUTGOING'
      ? 'GİDEN ÖDEME MAKBUZU'
      : 'GELEN TAHSİLAT MAKBUZU';

  return {
    content: [
      buildHeader({
        title: directionLabel,
        documentNumber: data.receiptNumber,
        issueDate: data.paymentDate,
        tenantName: data.tenantName,
        tenantTagline: 'Ödeme Belgesi',
        qrDataUrl: data.qrDataUrl,
      }),

      { text: 'TARAF', style: 'sectionHeader' },
      buildKeyValueBlock([
        ['Ad', data.partnerName],
        ['Tarih', fmtDate(data.paymentDate)],
        ['Yöntem', data.paymentMethod],
        ['Banka Referansı', data.bankReference],
        ['Durum', data.status],
      ]),

      { text: 'TUTAR', style: 'sectionHeader' },
      buildTable({
        widths: ['*'],
        layout: 'noBorders',
        rows: [
          [
            {
              text: fmtMoney(data.amount, currency),
              fontSize: 22,
              bold: true,
              alignment: 'center',
              color: '#1d4ed8',
              margin: [0, 12, 0, 12],
            },
          ],
        ],
      }),

      data.matchedInvoices && data.matchedInvoices.length > 0
        ? {
            stack: [
              { text: 'EŞLEŞTİRİLEN FATURALAR', style: 'sectionHeader' },
              buildTable({
                widths: ['*', 100],
                headerRows: 1,
                layout: 'lightHorizontalLines',
                rows: [
                  [
                    { text: 'Fatura No', style: 'tableHead' },
                    {
                      text: 'Uygulanan Tutar',
                      style: 'tableHead',
                      alignment: 'right',
                    },
                  ],
                  ...data.matchedInvoices.map((m) => [
                    { text: m.invoiceNumber, style: 'tableCell' },
                    {
                      text: fmtMoney(m.amountApplied, currency),
                      style: 'tableCell',
                      alignment: 'right',
                    },
                  ]),
                ],
              }),
            ],
          }
        : '',

      data.note
        ? { text: data.note, style: 'noteText', margin: [0, 12, 0, 0] }
        : '',

      data.verifyUrl
        ? {
            text: `Doğrulama: ${data.verifyUrl}`,
            fontSize: 8,
            color: '#6b7280',
            margin: [0, 18, 0, 0],
            alignment: 'center',
          }
        : '',
    ],
    styles: baseStyles,
  };
};
