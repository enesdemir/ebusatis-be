import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import {
  baseStyles,
  buildHeader,
  buildKeyValueBlock,
  buildSignatureRow,
  buildTable,
  fmtDate,
} from '../../../common/services/pdf-template-helpers';

export interface CustomerTransferPdfData {
  documentNumber: string;
  issueDate?: Date;
  customerName?: string;
  customerAddress?: string;
  fromWarehouse?: string;
  vehiclePlate?: string;
  driverName?: string;
  driverPhone?: string;
  trackingNumber?: string;
  totalRolls?: number;
  totalQuantity?: number;
  unit?: string;
  note?: string;
  qrDataUrl?: string;
  tenantName?: string;
  preparedBy?: string;
  rolls: Array<{
    kartelaNumber?: string;
    barcode?: string;
    productName?: string;
    quantity?: number;
    unit?: string;
  }>;
}

/**
 * CUSTOMER_TRANSFER PDF — müşteri taşıma belgesi.
 *
 * Issued when stock physically leaves the warehouse on its way to a
 * customer. Carries the per-roll list with kartela / barcode pairs
 * so the receiving party can verify on arrival.
 */
export const buildCustomerTransferPdf = (
  data: CustomerTransferPdfData,
): TDocumentDefinitions => {
  return {
    content: [
      buildHeader({
        title: 'MÜŞTERİ TAŞIMA BELGESİ',
        documentNumber: data.documentNumber,
        issueDate: data.issueDate,
        tenantName: data.tenantName,
        tenantTagline: 'Sevkiyat / Mal Çıkış Belgesi',
        qrDataUrl: data.qrDataUrl,
      }),

      { text: 'MÜŞTERİ', style: 'sectionHeader' },
      buildKeyValueBlock([
        ['Ad', data.customerName],
        ['Adres', data.customerAddress],
      ]),

      { text: 'TAŞIMA', style: 'sectionHeader' },
      buildKeyValueBlock([
        ['Çıkış Deposu', data.fromWarehouse],
        ['Araç Plakası', data.vehiclePlate],
        ['Şoför', data.driverName],
        ['Şoför Telefon', data.driverPhone],
        ['Takip No', data.trackingNumber],
        ['Tarih', fmtDate(data.issueDate)],
      ]),

      { text: 'TOPLAM', style: 'sectionHeader' },
      buildKeyValueBlock([
        [
          'Toplam Top',
          data.totalRolls !== undefined ? String(data.totalRolls) : '-',
        ],
        [
          'Toplam Miktar',
          data.totalQuantity !== undefined
            ? `${data.totalQuantity} ${data.unit ?? ''}`.trim()
            : '-',
        ],
      ]),

      { text: 'TOP DETAYI', style: 'sectionHeader' },
      buildTable({
        widths: [85, 85, '*', 60, 40],
        headerRows: 1,
        layout: 'lightHorizontalLines',
        rows: [
          [
            { text: 'Kartela No', style: 'tableHead' },
            { text: 'Barkod', style: 'tableHead' },
            { text: 'Ürün', style: 'tableHead' },
            { text: 'Miktar', style: 'tableHead', alignment: 'right' },
            { text: 'Birim', style: 'tableHead', alignment: 'right' },
          ],
          ...data.rolls.map((r) => [
            { text: r.kartelaNumber ?? '-', style: 'tableCell' },
            { text: r.barcode ?? '-', style: 'tableCell' },
            { text: r.productName ?? '-', style: 'tableCell' },
            {
              text: String(r.quantity ?? 0),
              style: 'tableCell',
              alignment: 'right',
            },
            {
              text: r.unit ?? '-',
              style: 'tableCell',
              alignment: 'right',
            },
          ]),
        ],
      }),

      data.note
        ? { text: data.note, style: 'noteText', margin: [0, 12, 0, 0] }
        : '',

      buildSignatureRow(data.preparedBy, data.customerName),
    ],
    styles: baseStyles,
  };
};
