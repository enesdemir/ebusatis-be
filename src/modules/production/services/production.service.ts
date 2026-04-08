import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/postgresql';
import { ProductionOrder, ProductionStatus } from '../entities/production-order.entity';
import { ProductionMilestone, MilestoneStatus } from '../entities/production-milestone.entity';
import { QualityCheck } from '../entities/quality-check.entity';
import { ProductionMedia } from '../entities/production-media.entity';
import { BillOfMaterials } from '../entities/bill-of-materials.entity';

@Injectable()
export class ProductionService {
  constructor(
    @InjectRepository(ProductionOrder) private readonly orderRepo: EntityRepository<ProductionOrder>,
    @InjectRepository(ProductionMilestone) private readonly milestoneRepo: EntityRepository<ProductionMilestone>,
    @InjectRepository(QualityCheck) private readonly qcRepo: EntityRepository<QualityCheck>,
    @InjectRepository(ProductionMedia) private readonly mediaRepo: EntityRepository<ProductionMedia>,
    @InjectRepository(BillOfMaterials) private readonly bomRepo: EntityRepository<BillOfMaterials>,
    private readonly em: EntityManager,
  ) {}

  // ── Üretim Emirleri ──

  async findAllOrders(params?: Record<string, any>) {
    const { page = 1, limit = 20, search, status } = params || {};
    const where: any = {};
    if (search) where.orderNumber = { $like: `%${search}%` };
    if (status) where.status = status;

    const [items, total] = await this.orderRepo.findAndCount(where, {
      populate: ['product', 'variant', 'assignedTo'],
      orderBy: { createdAt: 'DESC' },
      limit,
      offset: (page - 1) * limit,
    });
    return { data: items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOrderById(id: string) {
    const order = await this.orderRepo.findOne({ id }, {
      populate: ['product', 'variant', 'bom', 'milestones', 'qualityChecks', 'media', 'assignedTo', 'createdBy'],
    });
    if (!order) throw new NotFoundException('Production order not found');
    return order;
  }

  async createOrder(data: any) {
    const order = this.orderRepo.create(data);
    await this.em.persistAndFlush(order);

    // Varsayilan milestone'lari olustur (tekstil hatti)
    const defaultMilestones = [
      { name: 'İplik Hazırlık', code: 'IPLIK', sortOrder: 0 },
      { name: 'Dokuma', code: 'DOKUMA', sortOrder: 1 },
      { name: 'Boyama', code: 'BOYAMA', sortOrder: 2 },
      { name: 'Apre (Terbiye)', code: 'APRE', sortOrder: 3 },
      { name: 'Kalite Kontrol', code: 'QC', sortOrder: 4 },
    ];

    for (const ms of defaultMilestones) {
      const milestone = this.milestoneRepo.create({
        productionOrder: order,
        name: ms.name,
        code: ms.code,
        sortOrder: ms.sortOrder,
        tenant: order.tenant,
      });
      this.em.persist(milestone);
    }
    await this.em.flush();
    return order;
  }

  async updateOrderStatus(id: string, status: ProductionStatus) {
    const order = await this.findOrderById(id);
    order.status = status;
    if (status === ProductionStatus.IN_PROGRESS && !order.actualStartDate) {
      order.actualStartDate = new Date();
    }
    if (status === ProductionStatus.COMPLETED) {
      order.actualEndDate = new Date();
    }
    await this.em.flush();
    return order;
  }

  // ── Milestone'lar ──

  async updateMilestone(id: string, data: Partial<ProductionMilestone>) {
    const ms = await this.milestoneRepo.findOne({ id });
    if (!ms) throw new NotFoundException('Milestone not found');
    if (data.status === MilestoneStatus.IN_PROGRESS && !ms.startedAt) ms.startedAt = new Date();
    if (data.status === MilestoneStatus.COMPLETED && !ms.completedAt) ms.completedAt = new Date();
    Object.assign(ms, data);
    await this.em.flush();
    return ms;
  }

  // ── QC ──

  async createQC(data: any) {
    const qc = this.qcRepo.create(data);
    await this.em.persistAndFlush(qc);
    return qc;
  }

  async updateQC(id: string, data: any) {
    const qc = await this.qcRepo.findOne({ id });
    if (!qc) throw new NotFoundException('QC check not found');
    Object.assign(qc, data);
    await this.em.flush();
    return qc;
  }

  // ── BOM ──

  async findAllBOMs() {
    return this.bomRepo.findAll({ populate: ['outputProduct', 'components'], orderBy: { name: 'ASC' } });
  }

  async createBOM(data: any) {
    const bom = this.bomRepo.create(data);
    await this.em.persistAndFlush(bom);
    return bom;
  }
}
