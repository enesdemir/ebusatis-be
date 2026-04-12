import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import {
  baseStyles,
  buildHeader,
  buildKeyValueBlock,
  buildSignatureRow,
  buildTable,
  fmtDate,
} from '../../../common/services/pdf-template-helpers';

export interface ShipmentPdfData {
  shipmentNumber: string;
  direction?: 'INBOUND' | 'OUTBOUND';
  status?: string;
  carrierName?: string;
  vehiclePlate?: string;
  driverName?: string;
  driverPhone?: string;
  fromWarehouse?: string;
  toWarehouse?: string;
  partnerName?: string;
  etd?: Date;
  eta?: Date;
  incoterm?: string;
  containerNo?: string;
  vessel?: string;
  trackingNumber?: string;
  note?: string;
  qrDataUrl?: string;
  tenantName?: string;
  preparedBy?: string;
  approvedBy?: string;
  lines?: Array<{
    productName?: string;
    sku?: string;
    quantity?: number;
    unit?: string;
  }>;
}

/**
 * SHIPMENT_DOC PDF — taşıma belgesi.
 *
 * Used for both inbound (supplier → warehouse) and outbound
 * (warehouse → customer) shipments. Direction tweaks the title and
 * which "from / to" labels appear; everything else is shared.
 */
export const buildShipmentPdf = (
  data: ShipmentPdfData,
): TDocumentDefinitions => {
  const isOutbound = data.direction === 'OUTBOUND';

  return {
    content: [
      buildHeader({
        title: isOutbound ? 'TAŞIMA BELGESİ (GİDEN)' : 'TAŞIMA BELGESİ (GELEN)',
        documentNumber: data.shipmentNumber,
        issueDate: data.etd,
        tenantName: data.tenantName,
        tenantTagline: 'Sevkiyat Belgesi',
        qrDataUrl: data.qrDataUrl,
      }),

      { text: 'TAŞIMA BİLGİLERİ', style: 'sectionHeader' },
      buildKeyValueBlock([
        ['Taşıyıcı', data.carrierName],
        ['Araç Plakası', data.vehiclePlate],
        ['Şoför', data.driverName],
        ['Şoför Telefon', data.driverPhone],
        ['Konteyner', data.containerNo],
        ['Gemi/Araç', data.vessel],
        ['Takip No', data.trackingNumber],
        ['Incoterm', data.incoterm],
      ]),

      { text: 'GÜZERGAH', style: 'sectionHeader' },
      buildKeyValueBlock([
        ['Çıkış', isOutbound ? data.fromWarehouse : data.partnerName],
        ['Varış', isOutbound ? data.partnerName : data.toWarehouse],
        ['ETD', fmtDate(data.etd)],
        ['ETA', fmtDate(data.eta)],
        ['Durum', data.status],
      ]),

      data.lines && data.lines.length > 0
        ? {
            stack: [
              { text: 'İÇERİK', style: 'sectionHeader' },
              buildTable({
                widths: ['*', 60, 60],
                headerRows: 1,
                layout: 'lightHorizontalLines',
                rows: [
                  [
                    { text: 'Ürün', style: 'tableHead' },
                    { text: 'Miktar', style: 'tableHead', alignment: 'right' },
                    { text: 'Birim', style: 'tableHead', alignment: 'right' },
                  ],
                  ...data.lines.map((l) => [
                    {
                      text: [
                        { text: l.productName ?? '-', bold: true },
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
                      text: l.unit ?? '-',
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

      buildSignatureRow(data.preparedBy, data.approvedBy),
    ],
    styles: baseStyles,
  };
};
