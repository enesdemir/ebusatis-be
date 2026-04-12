import { Entity, Property, ManyToOne, Index } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { PhysicalSample } from './physical-sample.entity';
import { Partner } from '../../partners/entities/partner.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Sample Loan History
 *
 * One row per movement of a physical sample: lent out to a partner or
 * sales rep, then returned. The `returnedAt` and `returnedByUser`
 * fields are null while the sample is out on loan.
 */
@Entity({ tableName: 'sample_loan_history' })
export class SampleLoanHistory extends BaseTenantEntity {
  @ManyToOne(() => PhysicalSample)
  @Index()
  sample!: PhysicalSample;

  /** Who received the sample (dealer, showroom, etc.). */
  @ManyToOne(() => Partner, { nullable: true })
  lentToPartner?: Partner;

  /** Internal user who took the sample (sales rep). */
  @ManyToOne(() => User, { nullable: true })
  lentToUser?: User;

  @Property({ type: 'datetime' })
  lentAt: Date = new Date();

  @Property({ nullable: true, type: 'date' })
  expectedReturnDate?: Date;

  @Property({ nullable: true, type: 'datetime' })
  returnedAt?: Date;

  @ManyToOne(() => User, { nullable: true })
  lentByUser?: User;

  @ManyToOne(() => User, { nullable: true })
  returnedByUser?: User;

  @Property({ nullable: true, type: 'text' })
  notes?: string;
}
