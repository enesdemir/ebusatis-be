import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { v4 } from 'uuid';

import { Tenant } from '../modules/tenants/entities/tenant.entity';
import { User } from '../modules/users/entities/user.entity';
import { Partner, PartnerType, SupplierSubtype, CustomerSubtype } from '../modules/partners/entities/partner.entity';
import { Currency } from '../modules/definitions/entities/currency.entity';
import { Warehouse, WarehouseType } from '../modules/definitions/entities/warehouse.entity';
import { UnitOfMeasure } from '../modules/definitions/entities/unit-of-measure.entity';
import { Product, TrackingStrategy } from '../modules/products/entities/product.entity';
import { ProductVariant } from '../modules/products/entities/product-variant.entity';
import { StatusDefinition } from '../modules/definitions/entities/status-definition.entity';
import { PurchaseOrder } from '../modules/orders/entities/purchase-order.entity';
import { PurchaseOrderLine } from '../modules/orders/entities/purchase-order-line.entity';
import {
  SupplierProductionOrder,
  SupplierProductionStatus,
} from '../modules/production/entities/supplier-production-order.entity';
import {
  ProductionMilestone,
  MilestoneStatus,
  StandardMilestoneCode,
} from '../modules/production/entities/production-milestone.entity';
import {
  Shipment,
  ShipmentDirection,
  ShipmentStatus,
  Incoterm,
} from '../modules/logistics/entities/shipment.entity';
import { ShipmentLeg, ShipmentLegType } from '../modules/logistics/entities/shipment-leg.entity';
import {
  CarrierPaymentSchedule,
  CarrierPaymentTrigger,
  CarrierPaymentStatus,
} from '../modules/logistics/entities/carrier-payment-schedule.entity';
import { ContainerEvent, ContainerEventType } from '../modules/logistics/entities/container-event.entity';
import { CustomsDeclaration, CustomsStatus } from '../modules/logistics/entities/customs-declaration.entity';
import { GoodsReceive, GoodsReceiveStatus } from '../modules/inventory/entities/goods-receive.entity';
import {
  GoodsReceiveLine,
  DiscrepancyType,
} from '../modules/inventory/entities/goods-receive-line.entity';
import {
  SupplierClaim,
  ClaimType,
  ClaimStatus,
} from '../modules/inventory/entities/supplier-claim.entity';
import { SupplierClaimLine } from '../modules/inventory/entities/supplier-claim-line.entity';
import {
  LandedCostCalculation,
  LandedCostLineAllocation,
} from '../modules/accounting/entities/landed-cost-calculation.entity';

/**
 * Pilot end-to-end seeder (stage 0.D).
 *
 * Creates a realistic international-import scenario so the full
 * pipeline can be verified from PO to landed cost:
 *
 *   Supplier (China) → PO (50,000 USD, 100 units) →
 *   SupplierProductionOrder (6 milestones, 5 completed, 1 pending) →
 *   Shipment (INBOUND, 3 legs: factory→port, sea, port→warehouse) →
 *   CarrierPaymentSchedule (50% on booking, 50% on delivery) →
 *   CustomsDeclaration (duty 5,000 + VAT 9,000 + broker 500 + insurance 300) →
 *   ContainerEvents (5 timeline events) →
 *   GoodsReceive (vehicle/driver, 1 line OK, 1 line with 5-unit discrepancy) →
 *   SupplierClaim (DAMAGED, 5 units × 500 = 2,500 USD) →
 *   LandedCostCalculation (total 74,500 / 100 = 745 USD/unit)
 */
export class PilotSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    console.log('PilotSeeder: Starting end-to-end import scenario...');

    // Disable the tenant filter for seed lookups — there is no HTTP
    // request context so the filter has no parameters set. We resolve
    // the tenant manually and pass it to every entity we create.
    em.setFilterParams('tenant', { tenantId: '00000000-0000-0000-0000-000000000000' });

    // ── Resolve prerequisites ──
    const tenant = await em.findOneOrFail(Tenant, { domain: 'admin.localhost' }, { filters: false });
    const adminUser = await em.findOneOrFail(User, { email: 'admin@ebusatis.com' }, { filters: false });

    // Now set the real tenant ID for any further filtered lookups.
    em.setFilterParams('tenant', { tenantId: tenant.id });

    // Find or create definitions the pilot needs.
    let usdCurrency = await em.findOne(Currency, { code: 'USD' });
    if (!usdCurrency) {
      usdCurrency = em.create(Currency, {
        tenant, name: 'US Dollar', code: 'USD', symbol: '$',
        decimalPlaces: 2, isDefault: false, isActive: true, sortOrder: 0,
        scope: 'SYSTEM_SEED',
      } as any);
      em.persist(usdCurrency);
    }

    let metreUnit = await em.findOne(UnitOfMeasure, { code: 'm' });
    if (!metreUnit) {
      metreUnit = em.create(UnitOfMeasure, {
        tenant, name: 'Metre', code: 'm', symbol: 'm',
        category: 'LENGTH', decimalPrecision: 2, isBaseUnit: true,
        baseConversionFactor: 1, isActive: true, sortOrder: 0,
        scope: 'SYSTEM_SEED',
      } as any);
      em.persist(metreUnit);
    }

    let mainWarehouse = await em.findOne(Warehouse, { code: 'MAIN', tenant } as any);
    if (!mainWarehouse) {
      mainWarehouse = em.create(Warehouse, {
        tenant, name: 'Main Warehouse', code: 'MAIN',
        type: WarehouseType.MAIN, isDefault: true, isActive: true,
        city: 'Istanbul', country: 'Turkey', sortOrder: 0,
        scope: 'SYSTEM_SEED',
      } as any);
      em.persist(mainWarehouse);
    }

    await em.flush();

    // ── 1. Supplier (China factory) ──
    const supplier = em.create(Partner, {
      tenant, name: 'Shanghai Silk Factory Co.', code: 'SSF-001',
      types: [PartnerType.SUPPLIER], supplierSubtype: SupplierSubtype.FABRIC_FACTORY,
      email: 'orders@shanghaisilk.cn', phone: '+86-21-5555-0001',
      isActive: true,
    } as any);
    em.persist(supplier);

    // ── 2. Customer (for later outbound scenario) ──
    const customer = em.create(Partner, {
      tenant, name: 'Moscow Textiles LLC', code: 'MSC-001',
      types: [PartnerType.CUSTOMER], customerSubtype: CustomerSubtype.WHOLESALE,
      email: 'purchase@moscowtextiles.ru', isActive: true,
    } as any);
    em.persist(customer);

    // ── 3. Product + Variant ──
    const product = new Product('Premium Velvet', tenant);
    product.code = 'PRM-VLV';
    product.trackingStrategy = TrackingStrategy.SERIAL;
    product.unit = metreUnit;
    product.fabricComposition = '80% Cotton, 20% Polyester';
    product.origin = 'China';
    em.persist(product);

    const variant = new ProductVariant('Emerald Green', 'PRM-VLV-EMR', product);
    variant.tenant = tenant;
    variant.price = 500;
    variant.costPrice = 500;
    variant.currency = usdCurrency;
    variant.colorCode = '#50C878';
    variant.width = 280;
    variant.weight = 450;
    em.persist(variant);

    await em.flush();

    // ── 4. Purchase Order (50,000 USD, 100 units) ──
    const po = em.create(PurchaseOrder, {
      tenant, orderNumber: 'PO-2026-PILOT-001',
      supplier, currency: usdCurrency,
      exchangeRate: 1, totalAmount: 50000, taxAmount: 0, grandTotal: 50000,
      downPaymentAmount: 15000, paymentTerms: '30% deposit, 70% on B/L',
      expectedDeliveryDate: new Date('2026-06-15'),
      deliveryWarningConfig: [
        { daysBefore: 14, recipientGroupCodes: ['logistics_team'] },
        { daysBefore: 7, recipientGroupCodes: ['logistics_team', 'finance_team'] },
      ],
      note: 'Pilot PO for end-to-end import scenario verification.',
      createdBy: adminUser,
    } as any);
    em.persist(po);

    const poLine = em.create(PurchaseOrderLine, {
      tenant, order: po, variant, quantity: 100, unitPrice: 500,
      lineTotal: 50000, receivedQuantity: 0,
    } as any);
    em.persist(poLine);

    await em.flush();

    // ── 5. Supplier Production Order + Milestones ──
    const spo = em.create(SupplierProductionOrder, {
      tenant, productionNumber: 'SPO-2026-PILOT-001',
      purchaseOrder: po, supplier, product, variant,
      plannedQuantity: 100, producedQuantity: 95,
      status: SupplierProductionStatus.READY_TO_SHIP,
      factoryLocation: 'Shanghai, China',
      estimatedStartDate: new Date('2026-03-01'),
      estimatedCompletionDate: new Date('2026-04-15'),
      actualStartDate: new Date('2026-03-05'),
      actualCompletionDate: new Date('2026-04-12'),
      lastSupplierUpdateAt: new Date('2026-04-12'),
    } as any);
    em.persist(spo);

    const milestoneData = [
      { code: StandardMilestoneCode.DYEHOUSE, name: 'milestones.dyehouse', status: MilestoneStatus.COMPLETED, sortOrder: 0 },
      { code: StandardMilestoneCode.WEAVING, name: 'milestones.weaving', status: MilestoneStatus.COMPLETED, sortOrder: 1 },
      { code: StandardMilestoneCode.FINISHING, name: 'milestones.finishing', status: MilestoneStatus.COMPLETED, sortOrder: 2 },
      { code: StandardMilestoneCode.QC, name: 'milestones.qc', status: MilestoneStatus.COMPLETED, sortOrder: 3 },
      { code: StandardMilestoneCode.PACKAGING, name: 'milestones.packaging', status: MilestoneStatus.COMPLETED, sortOrder: 4 },
      { code: StandardMilestoneCode.READY_FOR_PICKUP, name: 'milestones.ready_for_pickup', status: MilestoneStatus.PENDING, sortOrder: 5 },
    ];
    for (const ms of milestoneData) {
      em.persist(em.create(ProductionMilestone, {
        tenant, productionOrder: spo,
        name: ms.name, code: ms.code, status: ms.status, sortOrder: ms.sortOrder,
        startedAt: ms.status === MilestoneStatus.COMPLETED ? new Date('2026-03-05') : undefined,
        completedAt: ms.status === MilestoneStatus.COMPLETED ? new Date('2026-04-10') : undefined,
        reportedBySupplierAt: ms.status === MilestoneStatus.COMPLETED ? new Date('2026-04-10') : undefined,
      } as any));
    }

    await em.flush();

    // ── 6. Shipment (INBOUND, 3 legs) ──
    const shipment = em.create(Shipment, {
      tenant, shipmentNumber: 'SH-2026-PILOT-001',
      direction: ShipmentDirection.INBOUND,
      status: ShipmentStatus.DELIVERED,
      purchaseOrder: po,
      originAddress: 'Shanghai Silk Factory, Pudong, Shanghai, China',
      destinationWarehouse: mainWarehouse,
      containerNumber: 'MSCU-1234567',
      containerType: '20ft',
      sealNumber: 'SL-2026-0042',
      vessel: 'MSC Oscar',
      voyageNumber: 'VY-2026-EU-042',
      incoterm: Incoterm.CIF,
      vehiclePlate: '34 ABC 123',
      driverName: 'Mehmet Yilmaz',
      driverPhone: '+90-532-555-0042',
      estimatedDeparture: new Date('2026-04-15'),
      estimatedArrival: new Date('2026-05-15'),
      actualDeparture: new Date('2026-04-16'),
      actualArrival: new Date('2026-05-14'),
      totalFreightCost: 10000,
      totalCustomsCost: 14800,
      totalStorageCost: 200,
      costCurrency: usdCurrency,
      createdBy: adminUser,
      notes: 'Pilot shipment for end-to-end scenario.',
    } as any);
    em.persist(shipment);

    await em.flush();

    // Leg 1: Factory → Shanghai port (inland, 500 USD)
    const leg1 = em.create(ShipmentLeg, {
      tenant, shipment, legNumber: 1,
      legType: ShipmentLegType.FACTORY_TO_PORT,
      originLocation: 'Shanghai Silk Factory', destinationLocation: 'Shanghai Port',
      estimatedDeparture: new Date('2026-04-15'), estimatedArrival: new Date('2026-04-15'),
      actualDeparture: new Date('2026-04-15'), actualArrival: new Date('2026-04-15'),
      freightCost: 500, storageCost: 0, otherCosts: 0, currency: usdCurrency,
    } as any);
    em.persist(leg1);

    // Leg 2: Sea (Shanghai → Istanbul, 8,000 USD, 30 days)
    const leg2 = em.create(ShipmentLeg, {
      tenant, shipment, legNumber: 2,
      legType: ShipmentLegType.SEA,
      originLocation: 'Shanghai Port', destinationLocation: 'Istanbul Ambarli Port',
      estimatedDeparture: new Date('2026-04-16'), estimatedArrival: new Date('2026-05-13'),
      actualDeparture: new Date('2026-04-16'), actualArrival: new Date('2026-05-12'),
      freightCost: 8000, storageCost: 200, otherCosts: 0, currency: usdCurrency,
    } as any);
    em.persist(leg2);

    // Leg 3: Port → Main warehouse (inland, 1,500 USD)
    const leg3 = em.create(ShipmentLeg, {
      tenant, shipment, legNumber: 3,
      legType: ShipmentLegType.PORT_TO_WAREHOUSE,
      originLocation: 'Istanbul Ambarli Port', destinationLocation: 'Main Warehouse, Istanbul',
      intermediateWarehouse: mainWarehouse,
      estimatedDeparture: new Date('2026-05-14'), estimatedArrival: new Date('2026-05-14'),
      actualDeparture: new Date('2026-05-14'), actualArrival: new Date('2026-05-14'),
      freightCost: 1500, storageCost: 0, otherCosts: 0, currency: usdCurrency,
    } as any);
    em.persist(leg3);

    // Carrier payment schedule (leg 2 — main sea leg)
    em.persist(em.create(CarrierPaymentSchedule, {
      tenant, leg: leg2, installmentNumber: 1,
      trigger: CarrierPaymentTrigger.ON_BOOKING,
      amount: 4000, percentage: 50, status: CarrierPaymentStatus.PAID,
      paidAt: new Date('2026-04-10'),
    } as any));
    em.persist(em.create(CarrierPaymentSchedule, {
      tenant, leg: leg2, installmentNumber: 2,
      trigger: CarrierPaymentTrigger.ON_DELIVERY,
      amount: 4000, percentage: 50, status: CarrierPaymentStatus.PENDING,
      dueDate: new Date('2026-05-20'),
    } as any));

    // ── 7. Container events (timeline) ──
    const events = [
      { type: ContainerEventType.LOADED_AT_FACTORY, date: '2026-04-15', location: 'Shanghai' },
      { type: ContainerEventType.AT_ORIGIN_PORT, date: '2026-04-15', location: 'Shanghai Port' },
      { type: ContainerEventType.LOADED_ON_VESSEL, date: '2026-04-16', location: 'Shanghai Port' },
      { type: ContainerEventType.AT_DESTINATION_PORT, date: '2026-05-12', location: 'Istanbul Ambarli' },
      { type: ContainerEventType.DELIVERED, date: '2026-05-14', location: 'Main Warehouse' },
    ];
    for (const e of events) {
      em.persist(em.create(ContainerEvent, {
        tenant, shipment, eventType: e.type,
        eventDate: new Date(e.date), location: e.location,
      } as any));
    }

    // ── 8. Customs declaration ──
    em.persist(em.create(CustomsDeclaration, {
      tenant, declarationNumber: 'GTD-2026-PILOT-001',
      shipment, status: CustomsStatus.APPROVED,
      declarationType: 'IMPORT',
      customsDuty: 5000, customsVat: 9000, brokerFee: 500,
      insuranceCost: 300, totalCost: 14800,
      currency: usdCurrency,
      submittedAt: new Date('2026-05-12'), approvedAt: new Date('2026-05-13'),
    } as any));

    await em.flush();

    // ── 9. Goods Receive ──
    const gr = em.create(GoodsReceive, {
      tenant, receiveNumber: 'GR-2026-PILOT-001',
      supplier, warehouse: mainWarehouse, purchaseOrder: po, shipment,
      vehiclePlate: '34 ABC 123', vehicleType: 'Truck',
      driverName: 'Mehmet Yilmaz', driverPhone: '+90-532-555-0042',
      driverIdNumber: 'TR-12345678',
      eta: new Date('2026-05-14T08:00:00Z'),
      receivedBy: adminUser, shipmentResponsible: adminUser,
      receivedAt: new Date('2026-05-14T09:30:00Z'),
      status: GoodsReceiveStatus.COMPLETED,
      createdBy: adminUser,
      note: 'Pilot goods receive — 95 rolls OK, 5 rolls damaged.',
    } as any);
    em.persist(gr);

    // Line 1: 95 rolls received OK
    const grLine1 = em.create(GoodsReceiveLine, {
      tenant, goodsReceive: gr, variant,
      expectedQuantity: 100, receivedRollCount: 95,
      totalReceivedQuantity: 95,
      discrepancyType: DiscrepancyType.NONE,
    } as any);
    em.persist(grLine1);

    // Line 2: 5 rolls damaged during transit
    const grLine2 = em.create(GoodsReceiveLine, {
      tenant, goodsReceive: gr, variant,
      expectedQuantity: 0, receivedRollCount: 5,
      totalReceivedQuantity: 5,
      discrepancyType: DiscrepancyType.DAMAGED,
      discrepancyQuantity: 5,
      discrepancyReason: 'Water damage from container leak during sea transit.',
      conditionNotes: 'Outer packaging wet, fabric shows watermarks on 5 rolls.',
      photoEvidenceUrls: ['https://cdn.example.com/evidence/pilot-dmg-01.jpg'],
    } as any);
    em.persist(grLine2);

    // Update PO line received quantity
    poLine.receivedQuantity = 100;

    await em.flush();

    // ── 10. Supplier Claim (5 damaged × 500 USD = 2,500 USD) ──
    const claim = em.create(SupplierClaim, {
      tenant, claimNumber: 'CLM-2026-PILOT-001',
      supplier, goodsReceive: gr, purchaseOrder: po,
      claimType: ClaimType.DAMAGED, status: ClaimStatus.OPEN,
      claimedAmount: 2500, currency: usdCurrency,
      description: '5 rolls of PRM-VLV-EMR arrived with water damage from a container leak during the Shanghai→Istanbul sea leg.',
      photoUrls: ['https://cdn.example.com/evidence/pilot-dmg-01.jpg'],
      openedAt: new Date('2026-05-14T14:00:00Z'),
      openedBy: adminUser,
    } as any);
    em.persist(claim);

    em.persist(em.create(SupplierClaimLine, {
      tenant, claim, goodsReceiveLine: grLine2, variant,
      affectedQuantity: 5, unitPrice: 500, lineTotal: 2500,
      note: 'Water-damaged rolls — not sellable as first quality.',
    } as any));

    // Back-link the claim on the GR line.
    grLine2.claim = claim;

    await em.flush();

    // ── 11. Landed Cost Calculation ──
    // Product:  50,000
    // Freight:   8,000 (sea only)
    // Inland:    2,000 (500 factory→port + 1,500 port→warehouse)
    // Storage:     200 (sea leg demurrage)
    // Customs:   5,000 (duty)
    // VAT:       9,000
    // Broker:      500
    // Insurance:   300
    // ─────────────────
    // Total:    75,000
    // Per unit: 750 USD/unit (100 units)

    const lineAllocation: LandedCostLineAllocation = {
      lineId: poLine.id,
      variantId: variant.id,
      quantity: 100,
      productCost: 50000,
      allocatedFreight: 8000,
      allocatedCustomsDuty: 5000,
      allocatedCustomsVat: 9000,
      allocatedBrokerFee: 500,
      allocatedInsurance: 300,
      allocatedStorage: 200,
      allocatedOther: 2000, // inland transport
      totalAllocated: 75000,
      landedUnitCost: 750,
    };

    em.persist(em.create(LandedCostCalculation, {
      tenant, purchaseOrder: po, shipment,
      productCost: 50000,
      freightCost: 8000,
      customsDuty: 5000, customsVat: 9000,
      brokerFee: 500, insuranceCost: 300,
      storageCost: 200,
      inlandTransportCost: 2000,
      otherCosts: 0,
      totalLandedCost: 75000,
      currency: usdCurrency,
      calculatedAt: new Date('2026-05-15'),
      calculatedBy: adminUser,
      notes: 'Pilot scenario — full end-to-end landed cost.',
      lineAllocations: [lineAllocation],
    } as any));

    // Write the per-unit landed cost back to the PO line.
    poLine.landedUnitCost = 750;

    await em.flush();

    console.log('  ✓ Supplier: Shanghai Silk Factory Co.');
    console.log('  ✓ PO: PO-2026-PILOT-001 (100 units × 500 USD = 50,000 USD)');
    console.log('  ✓ Production: SPO-2026-PILOT-001 (6 milestones, READY_TO_SHIP)');
    console.log('  ✓ Shipment: SH-2026-PILOT-001 (3 legs, CIF, DELIVERED)');
    console.log('  ✓ Customs: GTD-2026-PILOT-001 (duty 5,000 + VAT 9,000 + broker 500 + ins 300)');
    console.log('  ✓ Goods Receive: GR-2026-PILOT-001 (95 OK + 5 damaged)');
    console.log('  ✓ Claim: CLM-2026-PILOT-001 (5 × 500 = 2,500 USD)');
    console.log('  ✓ Landed Cost: 75,000 / 100 = 750 USD/unit');
    console.log('PilotSeeder: Done!');
  }
}
