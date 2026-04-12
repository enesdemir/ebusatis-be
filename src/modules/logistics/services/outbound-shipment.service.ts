import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import {
  Shipment,
  ShipmentDirection,
  ShipmentStatus,
} from '../entities/shipment.entity';
import { ShipmentLine } from '../entities/shipment-line.entity';
import {
  SalesOrder,
  SalesOrderStatus,
} from '../../orders/entities/sales-order.entity';
import { SalesOrderLine } from '../../orders/entities/sales-order-line.entity';
import {
  OrderRollAllocation,
  AllocationStatus,
} from '../../orders/entities/order-roll-allocation.entity';
import { Packing, PackingStatus } from '../../orders/entities/packing.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { TenantContext } from '../../../common/context/tenant.context';
import {
  TenantContextMissingException,
  EntityNotFoundException,
  SalesOrderNotPackedException,
  OutboundShipmentAlreadyExistsException,
} from '../../../common/errors/app.exceptions';

/**
 * OutboundShipmentService (Sprint 10).
 *
 * Creates a `Shipment(direction=OUTBOUND)` from a packed SalesOrder.
 * Each SalesOrderLine produces one ShipmentLine, and the rolls picked
 * for that line are listed on `rollIds`. Transitions the SalesOrder
 * from READY_FOR_SHIPMENT to SHIPPED.
 */
@Injectable()
export class OutboundShipmentService {
  constructor(
    private readonly em: EntityManager,
    @InjectRepository(Shipment)
    private readonly shipmentRepo: EntityRepository<Shipment>,
    @InjectRepository(ShipmentLine)
    private readonly lineRepo: EntityRepository<ShipmentLine>,
    @InjectRepository(SalesOrder)
    private readonly soRepo: EntityRepository<SalesOrder>,
    @InjectRepository(SalesOrderLine)
    private readonly soLineRepo: EntityRepository<SalesOrderLine>,
    @InjectRepository(OrderRollAllocation)
    private readonly allocationRepo: EntityRepository<OrderRollAllocation>,
    @InjectRepository(Packing)
    private readonly packingRepo: EntityRepository<Packing>,
  ) {}

  async createFromSalesOrder(salesOrderId: string): Promise<Shipment> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new TenantContextMissingException();

    const so = await this.soRepo.findOne(
      { id: salesOrderId },
      { populate: ['partner', 'warehouse', 'deliveryMethod'] as never[] },
    );
    if (!so) throw new EntityNotFoundException('SalesOrder', salesOrderId);
    if (so.workflowStatus !== SalesOrderStatus.READY_FOR_SHIPMENT) {
      throw new SalesOrderNotPackedException(salesOrderId);
    }

    const existing = await this.shipmentRepo.findOne({
      salesOrder: salesOrderId,
      direction: ShipmentDirection.OUTBOUND,
    });
    if (existing) {
      throw new OutboundShipmentAlreadyExistsException(
        salesOrderId,
        existing.id,
      );
    }

    const packing = await this.packingRepo.findOne(
      {
        picking: { salesOrder: salesOrderId },
        status: PackingStatus.COMPLETED,
      },
      { populate: ['picking'] as never[] },
    );
    if (!packing) throw new SalesOrderNotPackedException(salesOrderId);

    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });
    const shipmentNumber = await this.generateShipmentNumber();

    const shipment = this.shipmentRepo.create({
      tenant,
      shipmentNumber,
      direction: ShipmentDirection.OUTBOUND,
      status: ShipmentStatus.CONFIRMED,
      salesOrder: so,
      originWarehouse: so.warehouse ?? undefined,
      destinationAddress: '',
      deliveryMethod: so.deliveryMethod ?? undefined,
    } as unknown as Shipment);

    const soLines = await this.soLineRepo.find(
      { order: so.id },
      { populate: ['variant', 'allocations'] as never[] },
    );

    for (const soLine of soLines) {
      const allocations = await this.allocationRepo.find(
        {
          orderLine: soLine.id,
          status: { $in: [AllocationStatus.RESERVED, AllocationStatus.CUT] },
        },
        { populate: ['roll'] as never[] },
      );
      const rollIds = allocations.map((a) => a.roll.id);
      const quantity = allocations.reduce(
        (s, a) => s + Number(a.allocatedQuantity),
        0,
      );
      if (quantity <= 0) continue;

      const shipmentLine = this.lineRepo.create({
        tenant,
        shipment,
        salesOrderLine: soLine,
        variant: soLine.variant,
        quantity,
        rollIds,
      } as unknown as ShipmentLine);
      this.em.persist(shipmentLine);
    }

    so.workflowStatus = SalesOrderStatus.SHIPPED;
    this.em.persist(shipment);
    await this.em.flush();
    return shipment;
  }

  private async generateShipmentNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `SH-OUT-${year}-`;
    const last = await this.shipmentRepo.findOne(
      { shipmentNumber: { $like: `${prefix}%` } },
      { orderBy: { shipmentNumber: 'DESC' } },
    );
    const nextSeq = last
      ? parseInt(last.shipmentNumber.slice(prefix.length), 10) + 1
      : 1;
    return `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }
}
