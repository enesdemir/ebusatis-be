import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/postgresql';
import { ShipmentPlan, ShipmentPlanStatus } from '../entities/shipment-plan.entity';
import { ContainerEvent } from '../entities/container-event.entity';
import { CustomsDeclaration } from '../entities/customs-declaration.entity';
import { FreightQuote } from '../entities/freight-quote.entity';

@Injectable()
export class LogisticsService {
  constructor(
    @InjectRepository(ShipmentPlan) private readonly planRepo: EntityRepository<ShipmentPlan>,
    @InjectRepository(ContainerEvent) private readonly eventRepo: EntityRepository<ContainerEvent>,
    @InjectRepository(CustomsDeclaration) private readonly customsRepo: EntityRepository<CustomsDeclaration>,
    @InjectRepository(FreightQuote) private readonly quoteRepo: EntityRepository<FreightQuote>,
    private readonly em: EntityManager,
  ) {}

  // ── Sevkiyat Planlari ──

  async findAllPlans(params?: Record<string, any>) {
    const { page = 1, limit = 20, search, status } = params || {};
    const where: any = {};
    if (search) where.$or = [{ planNumber: { $like: `%${search}%` } }, { containerNo: { $like: `%${search}%` } }];
    if (status) where.status = status;

    const [items, total] = await this.planRepo.findAndCount(where, {
      populate: ['createdBy'],
      orderBy: { createdAt: 'DESC' },
      limit, offset: (page - 1) * limit,
    });
    return { data: items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findPlanById(id: string) {
    const plan = await this.planRepo.findOne({ id }, { populate: ['events', 'createdBy'] });
    if (!plan) throw new NotFoundException('Shipment plan not found');
    return plan;
  }

  async createPlan(data: any) {
    const plan = this.planRepo.create(data);
    await this.em.persistAndFlush(plan);
    return plan;
  }

  async updatePlanStatus(id: string, status: ShipmentPlanStatus) {
    const plan = await this.findPlanById(id);
    plan.status = status;
    if (status === ShipmentPlanStatus.IN_TRANSIT && !plan.actualDeparture) plan.actualDeparture = new Date();
    if (status === ShipmentPlanStatus.DELIVERED && !plan.actualArrival) plan.actualArrival = new Date();
    await this.em.flush();
    return plan;
  }

  async addEvent(planId: string, data: any) {
    const plan = await this.findPlanById(planId);
    const event = this.eventRepo.create({ ...data, shipmentPlan: plan, tenant: plan.tenant });
    await this.em.persistAndFlush(event);
    return event;
  }

  // ── Gumruk ──

  async findAllCustoms(params?: Record<string, any>) {
    const { page = 1, limit = 20 } = params || {};
    const [items, total] = await this.customsRepo.findAndCount({}, {
      populate: ['shipmentPlan'],
      orderBy: { createdAt: 'DESC' },
      limit, offset: (page - 1) * limit,
    });
    return { data: items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async createCustoms(data: any) {
    const decl = this.customsRepo.create(data);
    await this.em.persistAndFlush(decl);
    return decl;
  }

  // ── Nakliye Teklifleri ──

  async findQuotes(shipmentPlanId?: string) {
    const where: any = {};
    if (shipmentPlanId) where.shipmentPlan = shipmentPlanId;
    return this.quoteRepo.find(where, { orderBy: { price: 'ASC' } });
  }

  async createQuote(data: any) {
    const quote = this.quoteRepo.create(data);
    await this.em.persistAndFlush(quote);
    return quote;
  }

  async selectQuote(id: string) {
    const quote = await this.quoteRepo.findOne({ id });
    if (!quote) throw new NotFoundException('Quote not found');
    // Diger teklifleri iptal et
    if (quote.shipmentPlan) {
      const others = await this.quoteRepo.find({ shipmentPlan: (quote.shipmentPlan as any).id || quote.shipmentPlan, isSelected: true });
      for (const o of others) o.isSelected = false;
    }
    quote.isSelected = true;
    await this.em.flush();
    return quote;
  }
}
