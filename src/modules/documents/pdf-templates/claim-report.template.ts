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

export interface ClaimReportPdfData {
  claimNumber: string;
  claimType?: string;
  status?: string;
  openedAt?: Date;
  resolvedAt?: Date;
  supplierName?: string;
  goodsReceiveNumber?: string;
  purchaseOrderNumber?: string;
  description?: string;
  claimedAmount?: number;
  settledAmount?: number;
  currencySymbol?: string;
  tenantName?: string;
  preparedBy?: string;
  approvedBy?: string;
  lines?: Array<{
    variantName?: string;
    sku?: string;
    quantity?: number;
    claimedAmount?: number;
    note?: string;
  }>;
}

/**
 * CLAIM_REPORT PDF — supplier-facing iade raporu.
 *
 * Bundled with photo evidence outside the PDF (uploaded via the
 * Documents tab). The PDF carries the textual claim summary and the
 * line-by-line breakdown.
 */
export const buildClaimReportPdf = (
  data: ClaimReportPdfData,
): TDocumentDefinitions => {
  const currency = data.currencySymbol ?? '';

  return {
    content: [
      buildHeader({
        title: 'TEDARİKÇİ İTİRAZ RAPORU',
        documentNumber: data.claimNumber,
        issueDate: data.openedAt,
        tenantName: data.tenantName,
        tenantTagline: 'Mal Kabul Tutanağı / Discrepancy Report',
      }),

      { text: 'BAĞLANTILI KAYITLAR', style: 'sectionHeader' },
      buildKeyValueBlock([
        ['Tedarikçi', data.supplierName],
        ['Mal Kabul No', data.goodsReceiveNumber],
        ['Satınalma Sipariş No', data.purchaseOrderNumber],
      ]),

      { text: 'İTİRAZ DETAYI', style: 'sectionHeader' },
      buildKeyValueBlock([
        ['Tip', data.claimType],
        ['Durum', data.status],
        ['Açılış', fmtDate(data.openedAt)],
        ['Çözüm', fmtDate(data.resolvedAt)],
        ['Talep Tutarı', fmtMoney(data.claimedAmount, currency)],
        ['Uzlaşılan Tutar', fmtMoney(data.settledAmount, currency)],
      ]),

      data.description
        ? {
            stack: [
              { text: 'AÇIKLAMA', style: 'sectionHeader' },
              { text: data.description, style: 'noteText' },
            ],
          }
        : '',

      data.lines && data.lines.length > 0
        ? {
            stack: [
              { text: 'KALEMLER', style: 'sectionHeader' },
              buildTable({
                widths: ['*', 50, 70, '*'],
                headerRows: 1,
                layout: 'lightHorizontalLines',
                rows: [
                  [
                    { text: 'Ürün', style: 'tableHead' },
                    { text: 'Miktar', style: 'tableHead', alignment: 'right' },
                    { text: 'Tutar', style: 'tableHead', alignment: 'right' },
                    { text: 'Not', style: 'tableHead' },
                  ],
                  ...data.lines.map((l) => [
                    {
                      text: [
                        { text: l.variantName ?? '-', bold: true },
                        l.sku
                          ? {
                              text: `\nSKU: ${l.sku}`,
                              fontSize: 8,
                              color: '#6b7280',
                            }
                          : '',
                      ],
                      style: 'tableCell',
                    },
                    {
                      text: String(l.quantity ?? 0),
                      style: 'tableCell',
                      alignment: 'right',
                    },
                    {
                      text: fmtMoney(l.claimedAmount, currency),
                      style: 'tableCell',
                      alignment: 'right',
                    },
                    { text: l.note ?? '-', style: 'tableCell', fontSize: 8 },
                  ]),
                ],
              }),
            ],
          }
        : '',

      buildSignatureRow(data.preparedBy, data.approvedBy),
    ],
    styles: baseStyles,
  };
};
