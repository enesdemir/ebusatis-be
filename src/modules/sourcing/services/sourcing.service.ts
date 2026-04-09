import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/postgresql';
import { RFQ, RFQStatus } from '../entities/rfq.entity';
import { RFQResponse } from '../entities/rfq-response.entity';

@Injectable()
export class SourcingService {
  constructor(
    @InjectRepository(RFQ) private readonly rfqRepo: EntityRepository<RFQ>,
    @InjectRepository(RFQResponse) private readonly responseRepo: EntityRepository<RFQResponse>,
    private readonly em: EntityManager,
  ) {}

  async findAllRFQs(params?: Record<string, any>) {
    const { page = 1, limit = 20, search, status } = params || {};
    const where: any = {};
    if (search) where.$or = [{ rfqNumber: { $like: `%${search}%` } }, { title: { $like: `%${search}%` } }];
    if (status) where.status = status;
    const [items, total] = await this.rfqRepo.findAndCount(where, { populate: ['createdBy'], orderBy: { createdAt: 'DESC' }, limit, offset: (page - 1) * limit });
    return { data: items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findRFQById(id: string) {
    const rfq = await this.rfqRepo.findOne({ id }, { populate: ['responses', 'createdBy'] });
    if (!rfq) throw new NotFoundException('RFQ not found');
    return rfq;
  }

  async createRFQ(data: any) { const rfq = this.rfqRepo.create(data); await this.em.persistAndFlush(rfq); return rfq; }

  async updateRFQStatus(id: string, status: RFQStatus) {
    const rfq = await this.findRFQById(id);
    rfq.status = status;
    await this.em.flush();
    return rfq;
  }

  async addResponse(rfqId: string, data: any) {
    const rfq = await this.findRFQById(rfqId);
    const resp = this.responseRepo.create({ ...data, rfq, tenant: rfq.tenant, receivedAt: new Date() });
    await this.em.persistAndFlush(resp);
    return resp;
  }

  async selectResponse(id: string) {
    const resp = await this.responseRepo.findOne({ id }, { populate: ['rfq'] });
    if (!resp) throw new NotFoundException('Response not found');
    const others = await this.responseRepo.find({ rfq: (resp.rfq as any).id || resp.rfq, isSelected: true });
    for (const o of others) o.isSelected = false;
    resp.isSelected = true;
    await this.em.flush();
    return resp;
  }

  // Teklif karsilastirma — bir RFQ'nun tum cevaplarini karsilastir
  async compareResponses(rfqId: string) {
    const rfq = await this.findRFQById(rfqId);
    const responses = await this.responseRepo.find({ rfq: rfqId } as any, { orderBy: { totalPrice: 'ASC' } });
    return { rfq, responses, cheapest: responses[0] || null, fastest: [...responses].sort((a, b) => (a.leadTimeDays || 999) - (b.leadTimeDays || 999))[0] || null };
  }
}
