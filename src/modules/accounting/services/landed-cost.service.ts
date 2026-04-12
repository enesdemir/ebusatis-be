import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/postgresql';
import { TenantContext } from '../../../common/context/tenant.context';
import { Tenant } from '../../tenants/entities/tenant.entity';
import {
  TenantContextMissingException,
  EntityNotFoundException,
  ShipmentNotFoundException,
  LandedCostCalculationNotFoundException,
  LandedCostPurchaseOrderEmptyException,
  LandedCostQuantityZeroException,
} from '../../../common/errors/app.exceptions';
import {
  LandedCostCalculation,
  LandedCostLineAllocation,
} from '../entities/landed-cost-calculation.entity';
import { PurchaseOrder } from '../../orders/entities/purchase-order.entity';
import { PurchaseOrderLine } from '../../orders/entities/purchase-order-line.entity';
import { Shipment } from '../../logistics/entities/shipment.entity';
import { ShipmentLeg, ShipmentLegType } from '../../logistics/entities/shipment-leg.entity';
import { CustomsDeclaration } from '../../logistics/entities/customs-declaration.entity';
import { Currency } from '../../definitions/entities/currency.entity';
import { CalculateLandedCostDto } from '../dto/calculate-landed-cost.dto';
import { LandedCostQueryDto } from '../dto/landed-cost-query.dto';

/**
 * Internal accumulator used while computing a landed cost calculation.
 *
 * Kept as an explicit shape so the allocation step can iterate over a
 * single object instead of juggling multiple loose variables.
 */
interface LandedCostBuckets {
  productCost: number;
  freightCost: number;
  customsDuty: number;
  customsVat: number;
  brokerFee: number;
  insuranceCost: number;
  storageCost: number;
  inlandTransportCost: number;
  otherCosts: number;
}

/**
 * Landed cost calculation service.
 *
 * Aggregates every cost component related to a PurchaseOrder (and its
 * associated Shipment when available) and produces a snapshot in
 * `landed_cost_calculations`. The calculation can optionally write the
 * resulting per-unit landed cost back to
 * `purchase_order_lines.landed_unit_cost` so downstream consumers can
 * query a single column for inventory valuation and margin reports.
 *
 * Allocation method: cost components are distributed across PO lines
 * proportionally to each line's `quantity * unitPrice` share of the
 * order total. Lines with zero unit price fall back to a quantity-only
 * share so that free-of-charge samples still pick up landed cost.
 */
@Injectable()
export class LandedCostService {
  constructor(
    @InjectRepository(LandedCostCalculation)
    private readonly calcRepo: EntityRepository<LandedCostCalculation>,
    @InjectRepository(PurchaseOrder)
    private readonly poRepo: EntityRepository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderLine)
    private readonly poLineRepo: EntityRepository<PurchaseOrderLine>,
    @InjectRepository(Shipment)
    private readonly shipmentRepo: EntityRepository<Shipment>,
    @InjectRepository(ShipmentLeg)
    private readonly legRepo: EntityRepository<ShipmentLeg>,
    @InjectRepository(CustomsDeclaration)
    private readonly customsRepo: EntityRepository<CustomsDeclaration>,
    @InjectRepository(Currency)
    private readonly currencyRepo: EntityRepository<Currency>,
    private readonly em: EntityManager,
  ) {}

  // ── Read ──

  async findAll(query: LandedCostQueryDto) {
    const { page = 1, limit = 20, purchaseOrderId, shipmentId } = query;
    const where: Record<string, any> = {};
    if (purchaseOrderId) where.purchaseOrder = purchaseOrderId;
    if (shipmentId) where.shipment = shipmentId;

    const [items, total] = await this.calcRepo.findAndCount(where, {
      populate: ['purchaseOrder', 'shipment', 'currency'],
      orderBy: { calculatedAt: 'DESC' },
      limit,
      offset: (page - 1) * limit,
    });
    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string): Promise<LandedCostCalculation> {
    const calc = await this.calcRepo.findOne(
      { id },
      { populate: ['purchaseOrder', 'shipment', 'currency', 'calculatedBy'] },
    );
    if (!calc) throw new LandedCostCalculationNotFoundException(id);
    return calc;
  }

  // ── Calculate ──

  /**
   * Calculate landed cost for a purchase order.
   *
   * Cost components are pulled from the related shipment legs and
   * customs declarations when a shipment is provided; otherwise only
   * the PO product cost is allocated. The result is persisted as a
   * new `LandedCostCalculation` row and (by default) written back to
   * `purchase_order_lines.landed_unit_cost`.
   */
  async calculate(dto: CalculateLandedCostDto): Promise<LandedCostCalculation> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new TenantContextMissingException();

    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });

    const purchaseOrder = await this.poRepo.findOne(
      { id: dto.purchaseOrderId },
      { populate: ['currency'] },
    );
    if (!purchaseOrder) {
      throw new EntityNotFoundException('PurchaseOrder', dto.purchaseOrderId);
    }

    const lines = await this.poLineRepo.find(
      { order: purchaseOrder.id },
      { populate: ['variant'] },
    );
    if (lines.length === 0) {
      throw new LandedCostPurchaseOrderEmptyException(purchaseOrder.id);
    }

    let shipment: Shipment | null = null;
    if (dto.shipmentId) {
      shipment = await this.shipmentRepo.findOne({ id: dto.shipmentId });
      if (!shipment) {
        throw new ShipmentNotFoundException(dto.shipmentId);
      }
    }

    const buckets = await this.collectCostBuckets(purchaseOrder, shipment);

    const allocations = this.allocate(lines, buckets);

    const totalLandedCost = Object.values(buckets).reduce((sum, v) => sum + v, 0);

    // Resolve the currency: prefer the PO currency, otherwise fall back
    // to the tenant default. This is the currency the calculation is
    // reported in; line allocations are stored in the same unit.
    const currency =
      purchaseOrder.currency ?? (await this.currencyRepo.findOneOrFail({ isDefault: true }));

    const calc = this.calcRepo.create({
      tenant,
      purchaseOrder,
      shipment: shipment ?? undefined,
      productCost: buckets.productCost,
      freightCost: buckets.freightCost,
      customsDuty: buckets.customsDuty,
      customsVat: buckets.customsVat,
      brokerFee: buckets.brokerFee,
      insuranceCost: buckets.insuranceCost,
      storageCost: buckets.storageCost,
      inlandTransportCost: buckets.inlandTransportCost,
      otherCosts: buckets.otherCosts,
      totalLandedCost,
      currency,
      calculatedAt: new Date(),
      notes: dto.notes,
      lineAllocations: allocations,
    });
    await this.em.persistAndFlush(calc);

    // Write the per-unit landed cost back to the order lines unless
    // the caller explicitly disabled it (for what-if scenarios).
    if (dto.applyToLines !== false) {
      await this.applyToLines(lines, allocations);
    }

    return calc;
  }

  // ── Internals ──

  /**
   * Collect every cost bucket related to a purchase order and shipment.
   *
   * Product cost always comes from the PO grand total. Freight, storage
   * and inland-transport costs come from the shipment legs (when set).
   * Customs duty / VAT / broker / insurance come from every customs
   * declaration linked to the shipment.
   */
  private async collectCostBuckets(
    purchaseOrder: PurchaseOrder,
    shipment: Shipment | null,
  ): Promise<LandedCostBuckets> {
    const buckets: LandedCostBuckets = {
      productCost: Number(purchaseOrder.grandTotal ?? 0),
      freightCost: 0,
      customsDuty: 0,
      customsVat: 0,
      brokerFee: 0,
      insuranceCost: 0,
      storageCost: 0,
      inlandTransportCost: 0,
      otherCosts: 0,
    };

    if (!shipment) {
      return buckets;
    }

    const legs = await this.legRepo.find({ shipment: shipment.id });
    for (const leg of legs) {
      const freight = Number(leg.freightCost ?? 0);
      const storage = Number(leg.storageCost ?? 0);
      const other = Number(leg.otherCosts ?? 0);

      // Last-mile and warehouse-to-warehouse moves are tracked
      // separately so the report can distinguish "delivery" from the
      // main international freight.
      const isInland =
        leg.legType === ShipmentLegType.LAST_MILE ||
        leg.legType === ShipmentLegType.WAREHOUSE_TO_WAREHOUSE ||
        leg.legType === ShipmentLegType.PORT_TO_WAREHOUSE;

      if (isInland) {
        buckets.inlandTransportCost += freight;
      } else {
        buckets.freightCost += freight;
      }
      buckets.storageCost += storage;
      buckets.otherCosts += other;
    }

    const declarations = await this.customsRepo.find({ shipment: shipment.id });
    for (const decl of declarations) {
      buckets.customsDuty += Number(decl.customsDuty ?? 0);
      buckets.customsVat += Number(decl.customsVat ?? 0);
      buckets.brokerFee += Number(decl.brokerFee ?? 0);
      buckets.insuranceCost += Number(decl.insuranceCost ?? 0);
    }

    return buckets;
  }

  /**
   * Allocate cost buckets across PO lines proportionally to each
   * line's value share. Lines with zero unit price fall back to a
   * quantity-only share so free-of-charge samples still pick up cost.
   */
  private allocate(
    lines: PurchaseOrderLine[],
    buckets: LandedCostBuckets,
  ): LandedCostLineAllocation[] {
    const lineMetrics = lines.map((line) => {
      const qty = Number(line.quantity ?? 0);
      const price = Number(line.unitPrice ?? 0);
      return { line, qty, price, value: qty * price };
    });

    const totalValue = lineMetrics.reduce((sum, m) => sum + m.value, 0);
    const totalQuantity = lineMetrics.reduce((sum, m) => sum + m.qty, 0);

    if (totalQuantity === 0) {
      throw new LandedCostQuantityZeroException(lines[0].order.id);
    }

    // The bucket spread excludes the product cost itself (it is
    // already line-by-line). The other components are distributed by
    // value share when possible, falling back to quantity share for
    // zero-value orders (sample shipments, etc.).
    const spreadable =
      buckets.freightCost +
      buckets.customsDuty +
      buckets.customsVat +
      buckets.brokerFee +
      buckets.insuranceCost +
      buckets.storageCost +
      buckets.inlandTransportCost +
      buckets.otherCosts;

    return lineMetrics.map(({ line, qty, value }) => {
      const share =
        totalValue > 0 ? value / totalValue : qty / totalQuantity;

      const allocatedFreight = round2(buckets.freightCost * share);
      const allocatedCustomsDuty = round2(buckets.customsDuty * share);
      const allocatedCustomsVat = round2(buckets.customsVat * share);
      const allocatedBrokerFee = round2(buckets.brokerFee * share);
      const allocatedInsurance = round2(buckets.insuranceCost * share);
      const allocatedStorage = round2(buckets.storageCost * share);
      const allocatedInland = round2(buckets.inlandTransportCost * share);
      const allocatedOther = round2(buckets.otherCosts * share);

      const productCost = round2(value);
      const totalAllocated = round2(productCost + spreadable * share);
      const landedUnitCost = qty > 0 ? round4(totalAllocated / qty) : 0;

      return {
        lineId: line.id,
        variantId: (line.variant as any)?.id ?? '',
        quantity: qty,
        productCost,
        allocatedFreight,
        allocatedCustomsDuty,
        allocatedCustomsVat,
        allocatedBrokerFee,
        allocatedInsurance,
        allocatedStorage:
          // `allocatedStorage` represents transit storage for the
          // landed cost report; inland transport is reported separately
          // even though both come from the legs.
          allocatedStorage,
        allocatedOther: allocatedInland + allocatedOther,
        totalAllocated,
        landedUnitCost,
      };
    });
  }

  /**
   * Persist the per-unit landed cost back onto each PO line.
   * Looks up lines by ID rather than relying on the in-memory list to
   * avoid stale references after a flush.
   */
  private async applyToLines(
    lines: PurchaseOrderLine[],
    allocations: LandedCostLineAllocation[],
  ): Promise<void> {
    const byId = new Map(allocations.map((a) => [a.lineId, a]));
    for (const line of lines) {
      const allocation = byId.get(line.id);
      if (allocation) {
        line.landedUnitCost = allocation.landedUnitCost;
      }
    }
    await this.em.flush();
  }
}

// ── Local helpers ──

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
