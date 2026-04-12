import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityManager } from '@mikro-orm/postgresql';
import { PdfRendererService } from '../../../common/services/pdf-renderer.service';
import { QrCodeService } from '../../../common/services/qr-code.service';
import { TenantContext } from '../../../common/context/tenant.context';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { PurchaseOrder } from '../../orders/entities/purchase-order.entity';
import { SalesOrder } from '../../orders/entities/sales-order.entity';
import { Invoice } from '../../finance/entities/invoice.entity';
import { Payment } from '../../finance/entities/payment.entity';
import { Shipment } from '../../logistics/entities/shipment.entity';
import { SupplierClaim } from '../../inventory/entities/supplier-claim.entity';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';
import { buildPurchaseOrderPdf } from '../pdf-templates/purchase-order.template';
import { buildSalesOrderPdf } from '../pdf-templates/sales-order.template';
import { buildInvoicePdf } from '../pdf-templates/invoice.template';
import { buildPaymentReceiptPdf } from '../pdf-templates/payment-receipt.template';
import { buildShipmentPdf } from '../pdf-templates/shipment.template';
import { buildClaimReportPdf } from '../pdf-templates/claim-report.template';
import { buildKartelaLabelsPdf } from '../pdf-templates/kartela-labels.template';
import { buildCustomerTransferPdf } from '../pdf-templates/customer-transfer.template';
import { buildShippingLabelsPdf } from '../pdf-templates/shipping-label.template';
import { Packing } from '../../orders/entities/packing.entity';
import { PackingBox } from '../../orders/entities/packing-box.entity';
import { ShipmentDirection } from '../../logistics/entities/shipment.entity';

/**
 * Result envelope returned by every render method.
 *
 * Carries the raw PDF buffer plus the suggested file name so the
 * controller can attach a `Content-Disposition` header when streaming.
 */
export interface RenderedPdf {
  fileName: string;
  buffer: Buffer;
  mimeType: 'application/pdf';
}

/**
 * High-level PDF orchestration service.
 *
 * Each public method:
 *   1. loads the entity (with the populate fan-out the template needs)
 *   2. maps the entity to the template's plain `*PdfData` shape
 *   3. delegates to `PdfRendererService.render`
 *   4. returns a `RenderedPdf` envelope
 *
 * Tenant isolation: relies on `BaseTenantEntity.@Filter('tenant')`
 * for entity lookups. Public renderers (e.g. payment receipt verify)
 * pass `filters: false` and validate ownership manually.
 */
@Injectable()
export class PdfService {
  constructor(
    private readonly em: EntityManager,
    private readonly renderer: PdfRendererService,
    private readonly qr: QrCodeService,
    private readonly config: ConfigService,
  ) {}

  // ── Helpers ────────────────────────────────────────────────

  private async tenantName(): Promise<string | undefined> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) return undefined;
    const t = await this.em.findOne(Tenant, { id: tenantId });
    return (t as { name?: string } | null)?.name;
  }

  private get publicBaseUrl(): string {
    return (
      this.config.get<string>('PUBLIC_FRONTEND_URL') ?? 'http://localhost:5173'
    );
  }

  // ── Purchase Order ─────────────────────────────────────────

  async renderPurchaseOrder(id: string): Promise<RenderedPdf> {
    const po = await this.em.findOne(
      PurchaseOrder,
      { id },
      {
        populate: [
          'supplier',
          'currency',
          'createdBy',
          'lines',
          'lines.variant',
          'lines.variant.product',
        ] as never[],
      },
    );
    if (!po) throw new NotFoundException(`PurchaseOrder ${id}`);

    let qrDataUrl: string | undefined;
    if (po.trackingUuid) {
      qrDataUrl = await this.qr.generate(
        `${this.publicBaseUrl}/track/${po.trackingUuid}`,
      );
    }

    const supplier = po.supplier as unknown as
      | { name?: string; address?: string }
      | undefined;
    const currency = po.currency as unknown as { symbol?: string } | undefined;
    const createdBy = po.createdBy as unknown as
      | { fullName?: string }
      | undefined;

    const lines = (
      po.lines.getItems() as unknown as Array<{
        id: string;
        lineNumber?: number;
        quantity?: number;
        unitPrice?: number;
        lineTotal?: number;
        variant?: { name?: string; sku?: string; product?: { name?: string } };
      }>
    ).map((l, i) => ({
      lineNumber: l.lineNumber ?? i + 1,
      productName: l.variant?.product?.name ?? l.variant?.name,
      sku: l.variant?.sku,
      quantity: Number(l.quantity ?? 0),
      unitPrice: Number(l.unitPrice ?? 0),
      lineTotal: Number(l.lineTotal ?? 0),
    }));

    const def = buildPurchaseOrderPdf({
      orderNumber: po.orderNumber,
      revisionNumber: po.revisionNumber,
      workflowStatus: po.workflowStatus,
      issueDate: po.createdAt,
      supplierName: supplier?.name,
      supplierAddress: supplier?.address,
      expectedDeliveryDate: po.expectedDeliveryDate,
      paymentTerms: po.paymentTerms,
      currencySymbol: currency?.symbol,
      totalAmount: Number(po.totalAmount ?? 0),
      taxAmount: Number(po.taxAmount ?? 0),
      grandTotal: Number(po.grandTotal ?? 0),
      downPaymentAmount: Number(po.downPaymentAmount ?? 0),
      note: po.note,
      qrDataUrl,
      tenantName: await this.tenantName(),
      preparedBy: createdBy?.fullName,
      lines,
    });

    return {
      fileName: `${po.orderNumber}.pdf`,
      mimeType: 'application/pdf',
      buffer: await this.renderer.render(def),
    };
  }

  // ── Sales Order ────────────────────────────────────────────

  async renderSalesOrder(id: string): Promise<RenderedPdf> {
    const so = await this.em.findOne(
      SalesOrder,
      { id },
      {
        populate: [
          'partner',
          'currency',
          'warehouse',
          'createdBy',
          'lines',
          'lines.variant',
          'lines.variant.product',
        ] as never[],
      },
    );
    if (!so) throw new NotFoundException(`SalesOrder ${id}`);

    const partner = so.partner as unknown as {
      name?: string;
      address?: string;
    };
    const currency = so.currency as unknown as { symbol?: string } | undefined;
    const warehouse = so.warehouse as unknown as { name?: string } | undefined;
    const createdBy = so.createdBy as unknown as
      | { fullName?: string }
      | undefined;

    const lines = (
      so.lines.getItems() as unknown as Array<{
        id: string;
        lineNumber?: number;
        quantity?: number;
        unitPrice?: number;
        discountPct?: number;
        lineTotal?: number;
        variant?: { name?: string; sku?: string; product?: { name?: string } };
      }>
    ).map((l, i) => ({
      lineNumber: l.lineNumber ?? i + 1,
      productName: l.variant?.product?.name ?? l.variant?.name,
      sku: l.variant?.sku,
      quantity: Number(l.quantity ?? 0),
      unitPrice: Number(l.unitPrice ?? 0),
      discountPct: l.discountPct ? Number(l.discountPct) : undefined,
      lineTotal: Number(l.lineTotal ?? 0),
    }));

    const soShape = so as unknown as {
      orderNumber: string;
      workflowStatus?: string;
      orderType?: 'FABRIC' | 'PRODUCT';
      paymentType?: string;
      createdAt: Date;
      expectedDeliveryDate?: Date;
      totalAmount?: number;
      taxAmount?: number;
      grandTotal?: number;
      note?: string;
    };

    const def = buildSalesOrderPdf({
      orderNumber: soShape.orderNumber,
      workflowStatus: soShape.workflowStatus,
      orderType: soShape.orderType,
      paymentType: soShape.paymentType,
      issueDate: soShape.createdAt,
      customerName: partner?.name,
      customerAddress: partner?.address,
      expectedDeliveryDate: soShape.expectedDeliveryDate,
      warehouseName: warehouse?.name,
      currencySymbol: currency?.symbol,
      totalAmount: Number(soShape.totalAmount ?? 0),
      taxAmount: Number(soShape.taxAmount ?? 0),
      grandTotal: Number(soShape.grandTotal ?? 0),
      note: soShape.note,
      tenantName: await this.tenantName(),
      preparedBy: createdBy?.fullName,
      lines,
    });

    return {
      fileName: `${soShape.orderNumber}.pdf`,
      mimeType: 'application/pdf',
      buffer: await this.renderer.render(def),
    };
  }

  // ── Invoice ─────────────────────────────────────────────────

  async renderInvoice(id: string): Promise<RenderedPdf> {
    const inv = await this.em.findOne(
      Invoice,
      { id },
      {
        populate: [
          'partner',
          'currency',
          'createdBy',
          'lines',
          'lines.variant',
          'lines.variant.product',
        ] as never[],
      },
    );
    if (!inv) throw new NotFoundException(`Invoice ${id}`);

    const partner = inv.partner as unknown as {
      name?: string;
      address?: string;
    };
    const currency = inv.currency as unknown as { symbol?: string } | undefined;
    const createdBy = inv.createdBy as unknown as
      | { fullName?: string }
      | undefined;

    const invShape = inv as unknown as {
      invoiceNumber: string;
      type?: string;
      status?: string;
      issueDate?: Date;
      dueDate?: Date;
      subtotal?: number;
      taxAmount?: number;
      grandTotal?: number;
      paidAmount?: number;
      remainingAmount?: number;
      paymentTerms?: string;
      note?: string;
    };

    const lines = (
      inv.lines.getItems() as unknown as Array<{
        id: string;
        description?: string;
        quantity?: number;
        unitPrice?: number;
        taxRate?: number;
        lineTotal?: number;
        variant?: { name?: string; sku?: string; product?: { name?: string } };
      }>
    ).map((l) => ({
      description:
        l.description ?? l.variant?.product?.name ?? l.variant?.name ?? '-',
      quantity: Number(l.quantity ?? 0),
      unitPrice: Number(l.unitPrice ?? 0),
      taxRate: l.taxRate ? Number(l.taxRate) : undefined,
      lineTotal: Number(l.lineTotal ?? 0),
    }));

    const def = buildInvoicePdf({
      invoiceNumber: invShape.invoiceNumber,
      type: invShape.type,
      status: invShape.status,
      issueDate: invShape.issueDate,
      dueDate: invShape.dueDate,
      partnerName: partner?.name,
      partnerAddress: partner?.address,
      currencySymbol: currency?.symbol,
      subtotal: Number(invShape.subtotal ?? 0),
      taxAmount: Number(invShape.taxAmount ?? 0),
      grandTotal: Number(invShape.grandTotal ?? 0),
      paidAmount: Number(invShape.paidAmount ?? 0),
      remainingAmount: Number(invShape.remainingAmount ?? 0),
      paymentTerms: invShape.paymentTerms,
      note: invShape.note,
      tenantName: await this.tenantName(),
      preparedBy: createdBy?.fullName,
      lines,
    });

    return {
      fileName: `${invShape.invoiceNumber}.pdf`,
      mimeType: 'application/pdf',
      buffer: await this.renderer.render(def),
    };
  }

  // ── Payment Receipt ────────────────────────────────────────

  async renderPaymentReceipt(id: string): Promise<RenderedPdf> {
    const pay = await this.em.findOne(
      Payment,
      { id },
      {
        populate: [
          'partner',
          'currency',
          'paymentMethod',
          'matches',
          'matches.invoice',
        ] as never[],
      },
    );
    if (!pay) throw new NotFoundException(`Payment ${id}`);

    const payShape = pay as unknown as {
      receiptNumber: string;
      direction?: 'INCOMING' | 'OUTGOING';
      paymentDate?: Date;
      amount?: number;
      bankReference?: string;
      status?: string;
      note?: string;
    };
    const partner = pay.partner as unknown as { name?: string };
    const currency = pay.currency as unknown as { symbol?: string } | undefined;
    const method = (pay as unknown as { paymentMethod?: { name?: string } })
      .paymentMethod;

    const verifyUrl = `${this.publicBaseUrl}/verify/payment/${id}`;
    const qrDataUrl = await this.qr.generate(verifyUrl);

    const matches = ((
      pay as unknown as { matches?: { getItems(): unknown[] } }
    ).matches?.getItems() ?? []) as Array<{
      amountApplied?: number;
      invoice?: { invoiceNumber?: string };
    }>;

    const def = buildPaymentReceiptPdf({
      receiptNumber: payShape.receiptNumber,
      direction: payShape.direction,
      paymentDate: payShape.paymentDate,
      partnerName: partner?.name,
      amount: Number(payShape.amount ?? 0),
      currencySymbol: currency?.symbol,
      paymentMethod: method?.name,
      bankReference: payShape.bankReference,
      status: payShape.status,
      note: payShape.note,
      qrDataUrl,
      verifyUrl,
      tenantName: await this.tenantName(),
      matchedInvoices: matches
        .filter((m) => m.invoice?.invoiceNumber)
        .map((m) => ({
          invoiceNumber: m.invoice!.invoiceNumber!,
          amountApplied: Number(m.amountApplied ?? 0),
        })),
    });

    return {
      fileName: `${payShape.receiptNumber}.pdf`,
      mimeType: 'application/pdf',
      buffer: await this.renderer.render(def),
    };
  }

  // ── Shipment ───────────────────────────────────────────────

  async renderShipment(id: string): Promise<RenderedPdf> {
    const sh = await this.em.findOne(
      Shipment,
      { id },
      {
        populate: [
          'fromWarehouse',
          'toWarehouse',
          'carrier',
          'lines',
          'lines.variant',
          'lines.variant.product',
        ] as never[],
      },
    );
    if (!sh) throw new NotFoundException(`Shipment ${id}`);

    const shShape = sh as unknown as {
      shipmentNumber: string;
      direction?: 'INBOUND' | 'OUTBOUND';
      status?: string;
      vehiclePlate?: string;
      driverName?: string;
      driverPhone?: string;
      etd?: Date;
      eta?: Date;
      incoterm?: string;
      containerNo?: string;
      vessel?: string;
      trackingNumber?: string;
      note?: string;
    };
    const carrier = (sh as unknown as { carrier?: { name?: string } }).carrier;
    const fromWh = (sh as unknown as { fromWarehouse?: { name?: string } })
      .fromWarehouse;
    const toWh = (sh as unknown as { toWarehouse?: { name?: string } })
      .toWarehouse;

    const lines = ((
      sh as unknown as { lines?: { getItems(): unknown[] } }
    ).lines?.getItems() ?? []) as Array<{
      quantity?: number;
      unit?: string;
      variant?: { name?: string; sku?: string; product?: { name?: string } };
    }>;

    const def = buildShipmentPdf({
      shipmentNumber: shShape.shipmentNumber,
      direction: shShape.direction,
      status: shShape.status,
      carrierName: carrier?.name,
      vehiclePlate: shShape.vehiclePlate,
      driverName: shShape.driverName,
      driverPhone: shShape.driverPhone,
      fromWarehouse: fromWh?.name,
      toWarehouse: toWh?.name,
      etd: shShape.etd,
      eta: shShape.eta,
      incoterm: shShape.incoterm,
      containerNo: shShape.containerNo,
      vessel: shShape.vessel,
      trackingNumber: shShape.trackingNumber,
      note: shShape.note,
      tenantName: await this.tenantName(),
      lines: lines.map((l) => ({
        productName: l.variant?.product?.name ?? l.variant?.name,
        sku: l.variant?.sku,
        quantity: Number(l.quantity ?? 0),
        unit: l.unit,
      })),
    });

    return {
      fileName: `${shShape.shipmentNumber}.pdf`,
      mimeType: 'application/pdf',
      buffer: await this.renderer.render(def),
    };
  }

  // ── Supplier Claim ─────────────────────────────────────────

  async renderClaimReport(id: string): Promise<RenderedPdf> {
    const claim = await this.em.findOne(
      SupplierClaim,
      { id },
      {
        populate: [
          'supplier',
          'currency',
          'goodsReceive',
          'purchaseOrder',
          'lines',
          'lines.variant',
          'lines.variant.product',
        ] as never[],
      },
    );
    if (!claim) throw new NotFoundException(`SupplierClaim ${id}`);

    const supplier = (claim as unknown as { supplier?: { name?: string } })
      .supplier;
    const currency = (claim as unknown as { currency?: { symbol?: string } })
      .currency;
    const gr = (
      claim as unknown as { goodsReceive?: { receiveNumber?: string } }
    ).goodsReceive;
    const po = (
      claim as unknown as { purchaseOrder?: { orderNumber?: string } }
    ).purchaseOrder;

    const lines = ((
      claim as unknown as { lines?: { getItems(): unknown[] } }
    ).lines?.getItems() ?? []) as Array<{
      quantity?: number;
      claimedAmount?: number;
      note?: string;
      variant?: { name?: string; sku?: string; product?: { name?: string } };
    }>;

    const def = buildClaimReportPdf({
      claimNumber: claim.claimNumber,
      claimType: claim.claimType,
      status: claim.status,
      openedAt: claim.openedAt,
      resolvedAt: claim.resolvedAt,
      supplierName: supplier?.name,
      goodsReceiveNumber: gr?.receiveNumber,
      purchaseOrderNumber: po?.orderNumber,
      description: claim.description,
      claimedAmount: Number(claim.claimedAmount ?? 0),
      settledAmount:
        claim.settledAmount !== undefined
          ? Number(claim.settledAmount)
          : undefined,
      currencySymbol: currency?.symbol,
      tenantName: await this.tenantName(),
      lines: lines.map((l) => ({
        variantName: l.variant?.product?.name ?? l.variant?.name,
        sku: l.variant?.sku,
        quantity: Number(l.quantity ?? 0),
        claimedAmount: Number(l.claimedAmount ?? 0),
        note: l.note,
      })),
    });

    return {
      fileName: `${claim.claimNumber}.pdf`,
      mimeType: 'application/pdf',
      buffer: await this.renderer.render(def),
    };
  }

  // ── Kartela Labels ─────────────────────────────────────────

  async renderKartelaLabels(rollIds: string[]): Promise<RenderedPdf> {
    if (rollIds.length === 0) {
      throw new NotFoundException(`No kartela ids supplied`);
    }
    const rolls = await this.em.find(
      InventoryItem,
      { id: { $in: rollIds } },
      {
        populate: [
          'variant',
          'variant.product',
          'warehouse',
          'location',
        ] as never[],
      },
    );
    if (rolls.length === 0) {
      throw new NotFoundException(`Kartela rolls not found`);
    }

    const labels = await Promise.all(
      rolls.map(async (roll) => {
        const r = roll as unknown as {
          id: string;
          kartelaNumber?: string;
          barcode: string;
          shadeGroup?: string;
          shadeReference?: string;
          actualGSM?: number;
          currentQuantity?: number;
          variant?: {
            name?: string;
            sku?: string;
            product?: { name?: string; baseUnit?: string };
          };
          warehouse?: { name?: string };
          location?: { code?: string };
        };
        const trackingPayload = `${this.publicBaseUrl}/track/kartela/${r.id}`;
        const qrDataUrl = await this.qr.generate(trackingPayload, 200);
        return {
          kartelaNumber: r.kartelaNumber ?? r.barcode,
          barcode: r.barcode,
          productName: r.variant?.product?.name,
          variantName: r.variant?.name,
          sku: r.variant?.sku,
          shadeGroup: r.shadeGroup,
          shadeReference: r.shadeReference,
          actualGSM: r.actualGSM ? Number(r.actualGSM) : undefined,
          quantity: r.currentQuantity ? Number(r.currentQuantity) : undefined,
          unit: r.variant?.product?.baseUnit,
          qrDataUrl,
          warehouseName: r.warehouse?.name,
          locationCode: r.location?.code,
        };
      }),
    );

    const def = buildKartelaLabelsPdf(labels, await this.tenantName());

    return {
      fileName: `kartela-labels-${labels.length}.pdf`,
      mimeType: 'application/pdf',
      buffer: await this.renderer.render(def),
    };
  }

  // ── Customer Transfer ──────────────────────────────────────

  /**
   * Build a customer-transfer PDF from an outbound shipment (the
   * `Shipment` row already carries everything we need: customer FK,
   * vehicle, driver, and per-line roll allocations).
   */
  async renderCustomerTransfer(shipmentId: string): Promise<RenderedPdf> {
    const sh = await this.em.findOne(
      Shipment,
      { id: shipmentId },
      {
        populate: [
          'partner',
          'fromWarehouse',
          'lines',
          'lines.variant',
          'lines.variant.product',
        ] as never[],
      },
    );
    if (!sh) throw new NotFoundException(`Shipment ${shipmentId}`);

    const shShape = sh as unknown as {
      shipmentNumber: string;
      etd?: Date;
      vehiclePlate?: string;
      driverName?: string;
      driverPhone?: string;
      trackingNumber?: string;
      note?: string;
    };
    const partner = (
      sh as unknown as { partner?: { name?: string; address?: string } }
    ).partner;
    const fromWh = (sh as unknown as { fromWarehouse?: { name?: string } })
      .fromWarehouse;

    const lines = ((
      sh as unknown as { lines?: { getItems(): unknown[] } }
    ).lines?.getItems() ?? []) as Array<{
      quantity?: number;
      unit?: string;
      variant?: { name?: string; sku?: string; product?: { name?: string } };
    }>;

    const totalQuantity = lines.reduce(
      (sum, l) => sum + Number(l.quantity ?? 0),
      0,
    );

    const def = buildCustomerTransferPdf({
      documentNumber: shShape.shipmentNumber,
      issueDate: shShape.etd,
      customerName: partner?.name,
      customerAddress: partner?.address,
      fromWarehouse: fromWh?.name,
      vehiclePlate: shShape.vehiclePlate,
      driverName: shShape.driverName,
      driverPhone: shShape.driverPhone,
      trackingNumber: shShape.trackingNumber,
      totalRolls: lines.length,
      totalQuantity,
      unit: lines[0]?.unit,
      note: shShape.note,
      tenantName: await this.tenantName(),
      rolls: lines.map((l) => ({
        productName: l.variant?.product?.name ?? l.variant?.name,
        quantity: Number(l.quantity ?? 0),
        unit: l.unit,
      })),
    });

    return {
      fileName: `transfer-${shShape.shipmentNumber}.pdf`,
      mimeType: 'application/pdf',
      buffer: await this.renderer.render(def),
    };
  }

  // ── Shipping Labels (Sprint 10) ────────────────────────────

  /**
   * Render one shipping label per PackingBox for a given Packing.
   * Each label carries a QR that deep-links to the public tracking
   * page and a copy of the box barcode for fast handover scans.
   */
  async renderShippingLabels(packingId: string): Promise<RenderedPdf> {
    const packing = await this.em.findOne(
      Packing,
      { id: packingId },
      {
        populate: [
          'picking',
          'picking.salesOrder',
          'picking.salesOrder.partner',
        ] as never[],
      },
    );
    if (!packing) throw new NotFoundException(`Packing ${packingId}`);

    const boxes = await this.em.find(
      PackingBox,
      { packing: packing.id },
      { orderBy: { boxNumber: 'ASC' } },
    );
    if (boxes.length === 0) {
      throw new NotFoundException(`No boxes on packing ${packingId}`);
    }

    const so = (packing as unknown as { picking: { salesOrder: unknown } })
      .picking.salesOrder as {
      id: string;
      orderNumber?: string;
      partner?: { name?: string; address?: string };
    };

    const shipment = await this.em.findOne(
      Shipment,
      { salesOrder: so.id, direction: ShipmentDirection.OUTBOUND },
      { populate: ['carrier'] as never[] },
    );
    const shipmentNumber =
      (shipment as unknown as { shipmentNumber?: string } | null)
        ?.shipmentNumber ??
      so.orderNumber ??
      packing.packingNumber;
    const carrierName = (
      shipment as unknown as { carrier?: { name?: string } } | null
    )?.carrier?.name;
    const trackingNumber = (
      shipment as unknown as { carrierTrackingNumber?: string } | null
    )?.carrierTrackingNumber;

    const totalBoxes = boxes.length;
    const labels = await Promise.all(
      boxes.map(async (box) => {
        const qrPayload = `${this.publicBaseUrl}/track/shipment/${shipment?.id ?? so.id}/box/${box.id}`;
        const qrDataUrl = await this.qr.generate(qrPayload, 240);
        return {
          boxBarcode: box.barcode,
          boxNumber: box.boxNumber,
          totalBoxes,
          qrDataUrl,
          shipmentNumber,
          salesOrderNumber: so.orderNumber,
          customerName: so.partner?.name ?? '-',
          customerAddress: so.partner?.address,
          carrierName,
          trackingNumber,
          weightKg: box.weightKg ? Number(box.weightKg) : undefined,
          dimensionsCm: box.dimensionsCm,
        };
      }),
    );

    const def = buildShippingLabelsPdf(labels, await this.tenantName());
    return {
      fileName: `shipping-labels-${packing.packingNumber}.pdf`,
      mimeType: 'application/pdf',
      buffer: await this.renderer.render(def),
    };
  }

  // ── Public payment verify ──────────────────────────────────

  /**
   * Public-safe payload returned by `/verify/payment/:id`.
   *
   * Used by the customer-facing receipt verification page. Bypasses
   * the tenant filter (since the requester is unauthenticated) and
   * returns only non-sensitive fields.
   */
  async resolvePaymentForVerify(id: string): Promise<{
    receiptNumber: string;
    direction?: string;
    paymentDate?: Date;
    amount?: number;
    currencySymbol?: string;
    status?: string;
    partnerName?: string;
  } | null> {
    const pay = await this.em.findOne(
      Payment,
      { id },
      {
        populate: ['partner', 'currency'] as never[],
        filters: false,
      },
    );
    if (!pay) return null;
    const payShape = pay as unknown as {
      receiptNumber: string;
      direction?: string;
      paymentDate?: Date;
      amount?: number;
      status?: string;
    };
    return {
      receiptNumber: payShape.receiptNumber,
      direction: payShape.direction,
      paymentDate: payShape.paymentDate,
      amount: payShape.amount ? Number(payShape.amount) : undefined,
      currencySymbol: (
        pay.currency as unknown as { symbol?: string } | undefined
      )?.symbol,
      status: payShape.status,
      partnerName: (pay.partner as unknown as { name?: string } | undefined)
        ?.name,
    };
  }
}
