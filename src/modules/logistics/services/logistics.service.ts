import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/postgresql';
import { TenantContext } from '../../../common/context/tenant.context';
import { Tenant } from '../../tenants/entities/tenant.entity';
import {
  TenantContextMissingException,
  ShipmentNotFoundException,
  ShipmentOrderReferenceRequiredException,
  ContainerEventNotFoundException,
  CustomsDeclarationNotFoundException,
  FreightQuoteNotFoundException,
  ShipmentLegNotFoundException,
  CarrierPaymentNotFoundException,
} from '../../../common/errors/app.exceptions';
import {
  Shipment,
  ShipmentDirection,
  ShipmentStatus,
} from '../entities/shipment.entity';
import { ShipmentLeg } from '../entities/shipment-leg.entity';
import { CarrierPaymentSchedule } from '../entities/carrier-payment-schedule.entity';
import { ContainerEvent } from '../entities/container-event.entity';
import { CustomsDeclaration } from '../entities/customs-declaration.entity';
import { FreightQuote } from '../entities/freight-quote.entity';
import { CreateShipmentDto } from '../dto/create-shipment.dto';
import { UpdateShipmentDto } from '../dto/update-shipment.dto';
import { ShipmentQueryDto } from '../dto/shipment-query.dto';
import { AddContainerEventDto } from '../dto/add-container-event.dto';
import { CreateCustomsDeclarationDto } from '../dto/create-customs-declaration.dto';
import { CustomsDeclarationQueryDto } from '../dto/customs-declaration-query.dto';
import { CreateFreightQuoteDto } from '../dto/create-freight-quote.dto';
import { FreightQuoteQueryDto } from '../dto/freight-quote-query.dto';
import { CreateShipmentLegDto } from '../dto/create-shipment-leg.dto';
import { UpdateShipmentLegDto } from '../dto/update-shipment-leg.dto';
import { CreateCarrierPaymentDto } from '../dto/create-carrier-payment.dto';
import { UpdateCarrierPaymentDto } from '../dto/update-carrier-payment.dto';

/**
 * Logistics service.
 *
 * Owns the unified Shipment lifecycle for both INBOUND (supplier →
 * our warehouse) and OUTBOUND (our warehouse → customer) directions.
 * Container timeline events, customs declarations and freight quotes
 * are all attached to a shipment from this service.
 *
 * Multi-tenant: enforced via `BaseTenantEntity.@Filter('tenant')` and
 * a manual `TenantContext` check on every write path (defense in depth).
 *
 * Error contract: every failure path throws a custom AppException so
 * the response carries a stable error code and an i18n key — no raw
 * TR/EN strings ever leave this layer.
 */
@Injectable()
export class LogisticsService {
  constructor(
    @InjectRepository(Shipment)
    private readonly shipmentRepo: EntityRepository<Shipment>,
    @InjectRepository(ShipmentLeg)
    private readonly legRepo: EntityRepository<ShipmentLeg>,
    @InjectRepository(CarrierPaymentSchedule)
    private readonly carrierPaymentRepo: EntityRepository<CarrierPaymentSchedule>,
    @InjectRepository(ContainerEvent)
    private readonly eventRepo: EntityRepository<ContainerEvent>,
    @InjectRepository(CustomsDeclaration)
    private readonly customsRepo: EntityRepository<CustomsDeclaration>,
    @InjectRepository(FreightQuote)
    private readonly quoteRepo: EntityRepository<FreightQuote>,
    private readonly em: EntityManager,
  ) {}

  // ── Shipments ──

  async findAllShipments(query: ShipmentQueryDto) {
    const {
      page = 1,
      limit = 20,
      search,
      direction,
      status,
      purchaseOrderId,
      salesOrderId,
      carrierId,
    } = query;

    const where: Record<string, any> = {};
    if (direction) where.direction = direction;
    if (status) where.status = status;
    if (purchaseOrderId) where.purchaseOrder = purchaseOrderId;
    if (salesOrderId) where.salesOrder = salesOrderId;
    if (carrierId) where.carrier = carrierId;
    if (search) {
      where.$or = [
        { shipmentNumber: { $like: `%${search}%` } },
        { containerNumber: { $like: `%${search}%` } },
        { carrierTrackingNumber: { $like: `%${search}%` } },
      ];
    }

    const [items, total] = await this.shipmentRepo.findAndCount(where, {
      populate: [
        'purchaseOrder',
        'salesOrder',
        'carrier',
        'originWarehouse',
        'destinationWarehouse',
      ],
      orderBy: { createdAt: 'DESC' },
      limit,
      offset: (page - 1) * limit,
    });
    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findShipmentById(id: string): Promise<Shipment> {
    const shipment = await this.shipmentRepo.findOne(
      { id },
      {
        populate: [
          'purchaseOrder',
          'salesOrder',
          'carrier',
          'deliveryMethod',
          'originWarehouse',
          'destinationWarehouse',
          'costCurrency',
          'createdBy',
          'lines',
          'events',
          'freightQuotes',
          'customsDeclarations',
        ],
      },
    );
    if (!shipment) throw new ShipmentNotFoundException(id);
    return shipment;
  }

  /**
   * Create a new shipment after validating the direction-specific XOR
   * on order linkage. INBOUND requires `purchaseOrderId`, OUTBOUND
   * requires `salesOrderId`.
   */
  async createShipment(dto: CreateShipmentDto): Promise<Shipment> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new TenantContextMissingException();

    if (dto.direction === ShipmentDirection.INBOUND && !dto.purchaseOrderId) {
      throw new ShipmentOrderReferenceRequiredException(
        ShipmentDirection.INBOUND,
      );
    }
    if (dto.direction === ShipmentDirection.OUTBOUND && !dto.salesOrderId) {
      throw new ShipmentOrderReferenceRequiredException(
        ShipmentDirection.OUTBOUND,
      );
    }

    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });

    const shipment = this.shipmentRepo.create({
      tenant,
      shipmentNumber: dto.shipmentNumber,
      direction: dto.direction,
      status: dto.status ?? ShipmentStatus.DRAFT,
      purchaseOrder: dto.purchaseOrderId as any,
      salesOrder: dto.salesOrderId as any,
      originWarehouse: dto.originWarehouseId as any,
      destinationWarehouse: dto.destinationWarehouseId as any,
      originAddress: dto.originAddress,
      destinationAddress: dto.destinationAddress,
      carrier: dto.carrierId as any,
      deliveryMethod: dto.deliveryMethodId as any,
      carrierTrackingNumber: dto.carrierTrackingNumber,
      carrierTrackingUrl: dto.carrierTrackingUrl,
      containerNumber: dto.containerNumber,
      containerType: dto.containerType,
      sealNumber: dto.sealNumber,
      vessel: dto.vessel,
      voyageNumber: dto.voyageNumber,
      incoterm: dto.incoterm,
      vehiclePlate: dto.vehiclePlate,
      vehicleType: dto.vehicleType,
      driverName: dto.driverName,
      driverPhone: dto.driverPhone,
      driverIdNumber: dto.driverIdNumber,
      estimatedDeparture: dto.estimatedDeparture
        ? new Date(dto.estimatedDeparture)
        : undefined,
      estimatedArrival: dto.estimatedArrival
        ? new Date(dto.estimatedArrival)
        : undefined,
      costCurrency: dto.costCurrencyId as any,
      notes: dto.notes,
    });

    await this.em.persistAndFlush(shipment);
    return shipment;
  }

  async updateShipment(id: string, dto: UpdateShipmentDto): Promise<Shipment> {
    const shipment = await this.findShipmentById(id);
    this.em.assign(shipment, dto as any);
    await this.em.flush();
    return shipment;
  }

  /**
   * Transition a shipment to a new status.
   *
   * Some transitions auto-stamp dates so the timeline reflects what
   * actually happened without forcing the caller to do it manually:
   *  - IN_TRANSIT → sets `actualDeparture` if missing.
   *  - DELIVERED  → sets `actualArrival` if missing.
   */
  async updateShipmentStatus(
    id: string,
    status: ShipmentStatus,
  ): Promise<Shipment> {
    const shipment = await this.findShipmentById(id);
    shipment.status = status;

    if (status === ShipmentStatus.IN_TRANSIT && !shipment.actualDeparture) {
      shipment.actualDeparture = new Date();
    }
    if (status === ShipmentStatus.DELIVERED && !shipment.actualArrival) {
      shipment.actualArrival = new Date();
    }
    await this.em.flush();
    return shipment;
  }

  // ── Container events (timeline) ──

  async addContainerEvent(
    shipmentId: string,
    dto: AddContainerEventDto,
  ): Promise<ContainerEvent> {
    const shipment = await this.findShipmentById(shipmentId);
    const event = this.eventRepo.create({
      tenant: shipment.tenant,
      shipment,
      eventType: dto.eventType,
      location: dto.location,
      eventDate: new Date(dto.eventDate),
      note: dto.note,
    });
    await this.em.persistAndFlush(event);
    return event;
  }

  async findContainerEvents(shipmentId: string): Promise<ContainerEvent[]> {
    return this.eventRepo.find(
      { shipment: shipmentId },
      { orderBy: { eventDate: 'ASC' } },
    );
  }

  async removeContainerEvent(id: string): Promise<void> {
    const event = await this.eventRepo.findOne({ id });
    if (!event) throw new ContainerEventNotFoundException(id);
    await this.em.removeAndFlush(event);
  }

  // ── Customs declarations ──

  async findAllCustoms(query: CustomsDeclarationQueryDto) {
    const { page = 1, limit = 20, status, shipmentId } = query;
    const where: Record<string, any> = {};
    if (status) where.status = status;
    if (shipmentId) where.shipment = shipmentId;

    const [items, total] = await this.customsRepo.findAndCount(where, {
      populate: ['shipment', 'currency'],
      orderBy: { createdAt: 'DESC' },
      limit,
      offset: (page - 1) * limit,
    });
    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findCustomsById(id: string): Promise<CustomsDeclaration> {
    const decl = await this.customsRepo.findOne(
      { id },
      { populate: ['shipment', 'currency'] },
    );
    if (!decl) throw new CustomsDeclarationNotFoundException(id);
    return decl;
  }

  async createCustoms(
    dto: CreateCustomsDeclarationDto,
  ): Promise<CustomsDeclaration> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new TenantContextMissingException();
    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });

    const decl = this.customsRepo.create({
      tenant,
      declarationNumber: dto.declarationNumber,
      shipment: dto.shipmentId as any,
      status: dto.status,
      declarationType: dto.declarationType,
      customsDuty: dto.customsDuty ?? 0,
      customsVat: dto.customsVat ?? 0,
      brokerFee: dto.brokerFee ?? 0,
      insuranceCost: dto.insuranceCost ?? 0,
      totalCost: dto.totalCost ?? 0,
      currency: dto.currencyId as any,
      submittedAt: dto.submittedAt ? new Date(dto.submittedAt) : undefined,
      approvedAt: dto.approvedAt ? new Date(dto.approvedAt) : undefined,
      note: dto.note,
      documents: dto.documents,
    });
    await this.em.persistAndFlush(decl);
    return decl;
  }

  // ── Freight quotes ──

  async findQuotes(query: FreightQuoteQueryDto): Promise<FreightQuote[]> {
    const where: Record<string, any> = {};
    if (query.shipmentId) where.shipment = query.shipmentId;
    return this.quoteRepo.find(where, {
      populate: ['carrier', 'currency'],
      orderBy: { price: 'ASC' },
    });
  }

  async createQuote(dto: CreateFreightQuoteDto): Promise<FreightQuote> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new TenantContextMissingException();
    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });

    const quote = this.quoteRepo.create({
      tenant,
      shipment: dto.shipmentId as any,
      carrier: dto.carrierId as any,
      route: dto.route,
      price: dto.price,
      currency: dto.currencyId as any,
      transitDays: dto.transitDays,
      validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      note: dto.note,
    });
    await this.em.persistAndFlush(quote);
    return quote;
  }

  /**
   * Mark a freight quote as the selected one. Only a single quote can
   * be selected per shipment at any time, so siblings are unselected
   * in the same transaction.
   */
  async selectQuote(id: string): Promise<FreightQuote> {
    const quote = await this.quoteRepo.findOne(
      { id },
      { populate: ['shipment'] },
    );
    if (!quote) throw new FreightQuoteNotFoundException(id);

    if (quote.shipment) {
      const siblings = await this.quoteRepo.find({
        shipment: quote.shipment,
        isSelected: true,
      });
      for (const sibling of siblings) {
        sibling.isSelected = false;
      }
    }
    quote.isSelected = true;
    await this.em.flush();
    return quote;
  }

  // ── Shipment legs (multi-leg transit) ──

  async findLegs(shipmentId: string): Promise<ShipmentLeg[]> {
    // Resolve the shipment first so the tenant filter rejects cross-tenant
    // access early and we surface the same error code as everywhere else.
    await this.findShipmentById(shipmentId);
    return this.legRepo.find(
      { shipment: shipmentId },
      {
        populate: ['intermediateWarehouse', 'carrier', 'currency'],
        orderBy: { legNumber: 'ASC' },
      },
    );
  }

  async findLegById(id: string): Promise<ShipmentLeg> {
    const leg = await this.legRepo.findOne(
      { id },
      {
        populate: ['shipment', 'intermediateWarehouse', 'carrier', 'currency'],
      },
    );
    if (!leg) throw new ShipmentLegNotFoundException(id);
    return leg;
  }

  /**
   * Append a new leg to a shipment. If `legNumber` is omitted the
   * service auto-assigns the next sequence number based on the
   * existing legs of the parent shipment.
   */
  async addLeg(
    shipmentId: string,
    dto: CreateShipmentLegDto,
  ): Promise<ShipmentLeg> {
    const shipment = await this.findShipmentById(shipmentId);

    let legNumber = dto.legNumber;
    if (legNumber === undefined) {
      const existingCount = await this.legRepo.count({ shipment: shipment.id });
      legNumber = existingCount + 1;
    }

    const leg = this.legRepo.create({
      tenant: shipment.tenant,
      shipment,
      legNumber,
      legType: dto.legType,
      originLocation: dto.originLocation,
      destinationLocation: dto.destinationLocation,
      intermediateWarehouse: dto.intermediateWarehouseId as any,
      estimatedDeparture: dto.estimatedDeparture
        ? new Date(dto.estimatedDeparture)
        : undefined,
      estimatedArrival: dto.estimatedArrival
        ? new Date(dto.estimatedArrival)
        : undefined,
      actualDeparture: dto.actualDeparture
        ? new Date(dto.actualDeparture)
        : undefined,
      actualArrival: dto.actualArrival
        ? new Date(dto.actualArrival)
        : undefined,
      carrier: dto.carrierId as any,
      freightCost: dto.freightCost ?? 0,
      storageCost: dto.storageCost ?? 0,
      otherCosts: dto.otherCosts ?? 0,
      currency: dto.currencyId as any,
      notes: dto.notes,
    });
    await this.em.persistAndFlush(leg);
    return leg;
  }

  async updateLeg(id: string, dto: UpdateShipmentLegDto): Promise<ShipmentLeg> {
    const leg = await this.findLegById(id);
    if (dto.estimatedDeparture !== undefined) {
      leg.estimatedDeparture = new Date(dto.estimatedDeparture);
    }
    if (dto.estimatedArrival !== undefined) {
      leg.estimatedArrival = new Date(dto.estimatedArrival);
    }
    if (dto.actualDeparture !== undefined) {
      leg.actualDeparture = new Date(dto.actualDeparture);
    }
    if (dto.actualArrival !== undefined) {
      leg.actualArrival = new Date(dto.actualArrival);
    }
    if (dto.originLocation !== undefined)
      leg.originLocation = dto.originLocation;
    if (dto.destinationLocation !== undefined)
      leg.destinationLocation = dto.destinationLocation;
    if (dto.intermediateWarehouseId !== undefined) {
      leg.intermediateWarehouse = dto.intermediateWarehouseId as any;
    }
    if (dto.carrierId !== undefined) leg.carrier = dto.carrierId as any;
    if (dto.freightCost !== undefined) leg.freightCost = dto.freightCost;
    if (dto.storageCost !== undefined) leg.storageCost = dto.storageCost;
    if (dto.otherCosts !== undefined) leg.otherCosts = dto.otherCosts;
    if (dto.currencyId !== undefined) leg.currency = dto.currencyId as any;
    if (dto.notes !== undefined) leg.notes = dto.notes;
    await this.em.flush();
    return leg;
  }

  async removeLeg(id: string): Promise<void> {
    const leg = await this.findLegById(id);
    await this.em.removeAndFlush(leg);
  }

  // ── Carrier payment schedule ──

  async findCarrierPayments(legId: string): Promise<CarrierPaymentSchedule[]> {
    await this.findLegById(legId);
    return this.carrierPaymentRepo.find(
      { leg: legId },
      {
        populate: ['payment'],
        orderBy: { installmentNumber: 'ASC' },
      },
    );
  }

  async findCarrierPaymentById(id: string): Promise<CarrierPaymentSchedule> {
    const installment = await this.carrierPaymentRepo.findOne(
      { id },
      { populate: ['leg', 'payment'] },
    );
    if (!installment) throw new CarrierPaymentNotFoundException(id);
    return installment;
  }

  async addCarrierPayment(
    legId: string,
    dto: CreateCarrierPaymentDto,
  ): Promise<CarrierPaymentSchedule> {
    const leg = await this.findLegById(legId);

    let installmentNumber = dto.installmentNumber;
    if (installmentNumber === undefined) {
      const existingCount = await this.carrierPaymentRepo.count({
        leg: leg.id,
      });
      installmentNumber = existingCount + 1;
    }

    const installment = this.carrierPaymentRepo.create({
      tenant: leg.tenant,
      leg,
      installmentNumber,
      trigger: dto.trigger,
      amount: dto.amount,
      percentage: dto.percentage,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      status: dto.status,
      payment: dto.paymentId as any,
      notes: dto.notes,
    });
    await this.em.persistAndFlush(installment);
    return installment;
  }

  async updateCarrierPayment(
    id: string,
    dto: UpdateCarrierPaymentDto,
  ): Promise<CarrierPaymentSchedule> {
    const installment = await this.findCarrierPaymentById(id);
    if (dto.trigger !== undefined) installment.trigger = dto.trigger;
    if (dto.amount !== undefined) installment.amount = dto.amount;
    if (dto.percentage !== undefined) installment.percentage = dto.percentage;
    if (dto.dueDate !== undefined) installment.dueDate = new Date(dto.dueDate);
    if (dto.status !== undefined) installment.status = dto.status;
    if (dto.paymentId !== undefined) installment.payment = dto.paymentId as any;
    if (dto.notes !== undefined) installment.notes = dto.notes;
    if (dto.installmentNumber !== undefined) {
      installment.installmentNumber = dto.installmentNumber;
    }
    await this.em.flush();
    return installment;
  }

  async removeCarrierPayment(id: string): Promise<void> {
    const installment = await this.findCarrierPaymentById(id);
    await this.em.removeAndFlush(installment);
  }
}
