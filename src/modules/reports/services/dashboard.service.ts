import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PurchaseOrder,
  PurchaseOrderWorkflowStatus,
} from '../../orders/entities/purchase-order.entity';
import {
  SalesOrder,
  SalesOrderStatus,
} from '../../orders/entities/sales-order.entity';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';
import { Invoice, InvoiceStatus } from '../../finance/entities/invoice.entity';
import {
  Shipment,
  ShipmentDirection,
  ShipmentStatus,
} from '../../logistics/entities/shipment.entity';
import {
  SupplierProductionOrder,
  SupplierProductionStatus,
} from '../../production/entities/supplier-production-order.entity';

export interface GroupKpis {
  group: string;
  widgets: Array<{
    code: string;
    label: string;
    value: number;
    unit?: string;
  }>;
}

/**
 * DashboardService (Sprint 15).
 *
 * Tenant-scoped KPI aggregation grouped by functional role
 * (PURCHASING, WAREHOUSE, SALES, FINANCE, PRODUCTION, LOGISTICS).
 * The frontend asks for a group and gets the set of widgets meant
 * for that role, each carrying a single numeric value the widget
 * card can render.
 */
@Injectable()
export class DashboardService {
  constructor(private readonly em: EntityManager) {}

  async getKpisForGroup(group: string): Promise<GroupKpis> {
    const g = group.toUpperCase();
    switch (g) {
      case 'PURCHASING':
        return this.purchasingKpis();
      case 'WAREHOUSE':
        return this.warehouseKpis();
      case 'SALES':
        return this.salesKpis();
      case 'FINANCE':
        return this.financeKpis();
      case 'PRODUCTION':
        return this.productionKpis();
      case 'LOGISTICS':
        return this.logisticsKpis();
      default:
        return { group: g, widgets: [] };
    }
  }

  async getRecentActivity(limit = 20): Promise<
    Array<{
      at: Date;
      type: string;
      number: string;
      partner?: string;
    }>
  > {
    const [pos, sos, shipments] = await Promise.all([
      this.em.find(
        PurchaseOrder,
        {},
        {
          populate: ['supplier'] as never[],
          orderBy: { createdAt: 'DESC' },
          limit: Math.ceil(limit / 3),
        },
      ),
      this.em.find(
        SalesOrder,
        {},
        {
          populate: ['partner'] as never[],
          orderBy: { createdAt: 'DESC' },
          limit: Math.ceil(limit / 3),
        },
      ),
      this.em.find(
        Shipment,
        {},
        { orderBy: { createdAt: 'DESC' }, limit: Math.ceil(limit / 3) },
      ),
    ]);

    const entries = [
      ...pos.map((po) => ({
        at: po.createdAt,
        type: 'PO',
        number: po.orderNumber,
        partner: (po.supplier as unknown as { name?: string } | undefined)
          ?.name,
      })),
      ...sos.map((so) => ({
        at: so.createdAt,
        type: 'SO',
        number: so.orderNumber,
        partner: (so.partner as unknown as { name?: string } | undefined)?.name,
      })),
      ...shipments.map((s) => ({
        at: s.createdAt,
        type: `SHIPMENT-${s.direction}`,
        number: s.shipmentNumber,
      })),
    ];
    return entries
      .sort((a, b) => b.at.getTime() - a.at.getTime())
      .slice(0, limit);
  }

  // ── Group-specific KPIs ──

  private async purchasingKpis(): Promise<GroupKpis> {
    const [openPOs, draftPOs, approvedPOs] = await Promise.all([
      this.em.count(PurchaseOrder, {
        workflowStatus: {
          $in: [
            PurchaseOrderWorkflowStatus.APPROVED,
            PurchaseOrderWorkflowStatus.PENDING_APPROVAL,
          ],
        },
      }),
      this.em.count(PurchaseOrder, {
        workflowStatus: PurchaseOrderWorkflowStatus.DRAFT,
      }),
      this.em.count(PurchaseOrder, {
        workflowStatus: PurchaseOrderWorkflowStatus.APPROVED,
      }),
    ]);
    return {
      group: 'PURCHASING',
      widgets: [
        {
          code: 'po_open',
          label: 'dashboard.purchasing.po_open',
          value: openPOs,
        },
        {
          code: 'po_draft',
          label: 'dashboard.purchasing.po_draft',
          value: draftPOs,
        },
        {
          code: 'po_approved',
          label: 'dashboard.purchasing.po_approved',
          value: approvedPOs,
        },
      ],
    };
  }

  private async warehouseKpis(): Promise<GroupKpis> {
    const totalRolls = await this.em.count(InventoryItem, {});
    const stockItems = await this.em.find(InventoryItem, {});
    const totalMeters = stockItems.reduce(
      (s, i) => s + Number(i.currentQuantity),
      0,
    );
    return {
      group: 'WAREHOUSE',
      widgets: [
        {
          code: 'rolls_total',
          label: 'dashboard.warehouse.rolls_total',
          value: totalRolls,
        },
        {
          code: 'meters_total',
          label: 'dashboard.warehouse.meters_total',
          value: Math.round(totalMeters * 100) / 100,
          unit: 'm',
        },
      ],
    };
  }

  private async salesKpis(): Promise<GroupKpis> {
    const [pendingAllocation, readyForShipment, shipped] = await Promise.all([
      this.em.count(SalesOrder, {
        workflowStatus: {
          $in: [SalesOrderStatus.APPROVED, SalesOrderStatus.PENDING_PAYMENT],
        },
      }),
      this.em.count(SalesOrder, {
        workflowStatus: SalesOrderStatus.READY_FOR_SHIPMENT,
      }),
      this.em.count(SalesOrder, {
        workflowStatus: SalesOrderStatus.SHIPPED,
      }),
    ]);
    return {
      group: 'SALES',
      widgets: [
        {
          code: 'so_pending_allocation',
          label: 'dashboard.sales.so_pending_allocation',
          value: pendingAllocation,
        },
        {
          code: 'so_ready_for_shipment',
          label: 'dashboard.sales.so_ready_for_shipment',
          value: readyForShipment,
        },
        {
          code: 'so_shipped',
          label: 'dashboard.sales.so_shipped',
          value: shipped,
        },
      ],
    };
  }

  private async financeKpis(): Promise<GroupKpis> {
    const [overdueInvoices, unpaidInvoices] = await Promise.all([
      this.em.count(Invoice, { status: InvoiceStatus.OVERDUE }),
      this.em.count(Invoice, {
        status: {
          $in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID],
        },
      }),
    ]);
    return {
      group: 'FINANCE',
      widgets: [
        {
          code: 'invoices_overdue',
          label: 'dashboard.finance.invoices_overdue',
          value: overdueInvoices,
        },
        {
          code: 'invoices_unpaid',
          label: 'dashboard.finance.invoices_unpaid',
          value: unpaidInvoices,
        },
      ],
    };
  }

  private async productionKpis(): Promise<GroupKpis> {
    const [active, inQc, ready] = await Promise.all([
      this.em.count(SupplierProductionOrder, {
        status: {
          $in: [
            SupplierProductionStatus.IN_DYEHOUSE,
            SupplierProductionStatus.IN_WEAVING,
            SupplierProductionStatus.IN_FINISHING,
          ],
        },
      }),
      this.em.count(SupplierProductionOrder, {
        status: SupplierProductionStatus.IN_QC,
      }),
      this.em.count(SupplierProductionOrder, {
        status: SupplierProductionStatus.READY_TO_SHIP,
      }),
    ]);
    return {
      group: 'PRODUCTION',
      widgets: [
        {
          code: 'spo_active',
          label: 'dashboard.production.spo_active',
          value: active,
        },
        {
          code: 'spo_in_qc',
          label: 'dashboard.production.spo_in_qc',
          value: inQc,
        },
        {
          code: 'spo_ready',
          label: 'dashboard.production.spo_ready',
          value: ready,
        },
      ],
    };
  }

  private async logisticsKpis(): Promise<GroupKpis> {
    const [inbound, outbound, inTransit] = await Promise.all([
      this.em.count(Shipment, {
        direction: ShipmentDirection.INBOUND,
        status: { $nin: [ShipmentStatus.DELIVERED, ShipmentStatus.CANCELLED] },
      }),
      this.em.count(Shipment, {
        direction: ShipmentDirection.OUTBOUND,
        status: { $nin: [ShipmentStatus.DELIVERED, ShipmentStatus.CANCELLED] },
      }),
      this.em.count(Shipment, { status: ShipmentStatus.IN_TRANSIT }),
    ]);
    return {
      group: 'LOGISTICS',
      widgets: [
        {
          code: 'inbound_open',
          label: 'dashboard.logistics.inbound_open',
          value: inbound,
        },
        {
          code: 'outbound_open',
          label: 'dashboard.logistics.outbound_open',
          value: outbound,
        },
        {
          code: 'in_transit',
          label: 'dashboard.logistics.in_transit',
          value: inTransit,
        },
      ],
    };
  }
}
