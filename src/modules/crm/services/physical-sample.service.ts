import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import {
  PhysicalSample,
  SampleStatus,
} from '../../products/entities/physical-sample.entity';
import { SampleLoanHistory } from '../../products/entities/sample-loan-history.entity';
import { Partner } from '../../partners/entities/partner.entity';
import { User } from '../../users/entities/user.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { TenantContext } from '../../../common/context/tenant.context';
import {
  TenantContextMissingException,
  EntityNotFoundException,
} from '../../../common/errors/app.exceptions';

/**
 * PhysicalSampleService (Sprint 12) — lend / return lifecycle.
 *
 * `lend()` moves a sample out of stock, captures who holds it and
 * writes a SampleLoanHistory row. `returnSample()` closes the open
 * history row and flips the sample back to IN_STOCK.
 */
@Injectable()
export class PhysicalSampleService {
  constructor(
    private readonly em: EntityManager,
    @InjectRepository(PhysicalSample)
    private readonly sampleRepo: EntityRepository<PhysicalSample>,
    @InjectRepository(SampleLoanHistory)
    private readonly historyRepo: EntityRepository<SampleLoanHistory>,
  ) {}

  list() {
    return this.sampleRepo.find(
      {},
      {
        populate: ['product', 'currentHolder', 'currentHolderUser'] as never[],
      },
    );
  }

  async findById(id: string) {
    const sample = await this.sampleRepo.findOne(
      { id },
      { populate: ['loanHistory'] as never[] },
    );
    if (!sample) throw new EntityNotFoundException('PhysicalSample', id);
    return sample;
  }

  async lend(
    sampleId: string,
    data: {
      partnerId?: string;
      userId?: string;
      expectedReturnDate?: string | Date;
      notes?: string;
    },
    lentByUserId?: string,
  ) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new TenantContextMissingException();
    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });

    const sample = await this.findById(sampleId);
    sample.status = SampleStatus.LENT;
    sample.currentHolder = data.partnerId
      ? this.em.getReference(Partner, data.partnerId)
      : undefined;
    sample.currentHolderUser = data.userId
      ? this.em.getReference(User, data.userId)
      : undefined;

    const history = this.historyRepo.create({
      tenant,
      sample,
      lentToPartner: data.partnerId
        ? this.em.getReference(Partner, data.partnerId)
        : undefined,
      lentToUser: data.userId
        ? this.em.getReference(User, data.userId)
        : undefined,
      lentByUser: lentByUserId
        ? this.em.getReference(User, lentByUserId)
        : undefined,
      expectedReturnDate: data.expectedReturnDate
        ? new Date(data.expectedReturnDate)
        : undefined,
      notes: data.notes,
      lentAt: new Date(),
    } as unknown as SampleLoanHistory);

    await this.em.persistAndFlush(history);
    return { sample, history };
  }

  async returnSample(
    sampleId: string,
    returnedByUserId?: string,
    notes?: string,
  ) {
    const sample = await this.findById(sampleId);
    const openHistory = await this.historyRepo.findOne(
      { sample: sample.id, returnedAt: null },
      { orderBy: { lentAt: 'DESC' } },
    );
    if (openHistory) {
      openHistory.returnedAt = new Date();
      openHistory.returnedByUser = returnedByUserId
        ? this.em.getReference(User, returnedByUserId)
        : undefined;
      if (notes) openHistory.notes = `${openHistory.notes ?? ''}\n${notes}`;
    }
    sample.status = SampleStatus.IN_STOCK;
    sample.currentHolder = undefined;
    sample.currentHolderUser = undefined;
    await this.em.flush();
    return sample;
  }

  /**
   * Scan for overdue loans — history rows with `expectedReturnDate`
   * in the past and still open. Used by the Sprint 12 cron to
   * generate notifications.
   */
  async findOverdueLoans(): Promise<SampleLoanHistory[]> {
    const now = new Date();
    return this.historyRepo.find(
      {
        returnedAt: null,
        expectedReturnDate: { $lt: now },
      },
      { populate: ['sample', 'lentToPartner', 'lentToUser'] as never[] },
    );
  }
}
