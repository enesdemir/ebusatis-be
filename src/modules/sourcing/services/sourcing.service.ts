import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  EntityRepository,
  EntityManager,
  FilterQuery,
} from '@mikro-orm/postgresql';
import { RFQ, RFQStatus } from '../entities/rfq.entity';
import { RFQResponse } from '../entities/rfq-response.entity';
import { EntityNotFoundException } from '../../../common/errors/app.exceptions';
import { PaginatedQueryDto } from '../../../common/dto/paginated-query.dto';
import { CreateRfqDto, CreateRfqResponseDto } from '../dto';

@Injectable()
export class SourcingService {
  constructor(
    @InjectRepository(RFQ) private readonly rfqRepo: EntityRepository<RFQ>,
    @InjectRepository(RFQResponse)
    private readonly responseRepo: EntityRepository<RFQResponse>,
    private readonly em: EntityManager,
  ) {}

  async findAllRFQs(params?: PaginatedQueryDto & { status?: RFQStatus }) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const search = params?.search;
    const where: FilterQuery<RFQ> = {};
    if (search)
      (where as Record<string, unknown>).$or = [
        { rfqNumber: { $like: `%${search}%` } },
        { title: { $like: `%${search}%` } },
      ];
    if (params?.status)
      (where as Record<string, unknown>).status = params.status;
    const [items, total] = await this.rfqRepo.findAndCount(where, {
      populate: ['createdBy'],
      orderBy: { createdAt: 'DESC' },
      limit,
      offset: (page - 1) * limit,
    });
    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findRFQById(id: string) {
    const rfq = await this.rfqRepo.findOne(
      { id },
      { populate: ['responses', 'createdBy'] },
    );
    if (!rfq) throw new EntityNotFoundException('RFQ', id);
    return rfq;
  }

  async createRFQ(data: CreateRfqDto & { createdBy?: string }) {
    const rfq = this.rfqRepo.create(data as unknown as RFQ);
    await this.em.persistAndFlush(rfq);
    return rfq;
  }

  async updateRFQStatus(id: string, status: RFQStatus) {
    const rfq = await this.findRFQById(id);
    rfq.status = status;
    await this.em.flush();
    return rfq;
  }

  async addResponse(rfqId: string, data: CreateRfqResponseDto) {
    const rfq = await this.findRFQById(rfqId);
    const resp = this.responseRepo.create({
      ...data,
      rfq,
      tenant: rfq.tenant,
      receivedAt: new Date(),
    } as unknown as RFQResponse);
    await this.em.persistAndFlush(resp);
    return resp;
  }

  async selectResponse(id: string) {
    const resp = await this.responseRepo.findOne({ id }, { populate: ['rfq'] });
    if (!resp) throw new EntityNotFoundException('RFQResponse', id);
    const others = await this.responseRepo.find({
      rfq: (resp.rfq as { id: string }).id || resp.rfq,
      isSelected: true,
    } as FilterQuery<RFQResponse>);
    for (const o of others) o.isSelected = false;
    resp.isSelected = true;
    await this.em.flush();
    return resp;
  }

  // Teklif karsilastirma — bir RFQ'nun tum cevaplarini karsilastir
  async compareResponses(rfqId: string) {
    const rfq = await this.findRFQById(rfqId);
    const responses = await this.responseRepo.find(
      { rfq: rfqId } as FilterQuery<RFQResponse>,
      { orderBy: { totalPrice: 'ASC' } },
    );
    return {
      rfq,
      responses,
      cheapest: responses[0] || null,
      fastest:
        [...responses].sort(
          (a, b) => (a.leadTimeDays || 999) - (b.leadTimeDays || 999),
        )[0] || null,
    };
  }
}
