import { Entity, Property, ManyToOne, Enum } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { ProductionOrder } from './production-order.entity';
import { User } from '../../users/entities/user.entity';

export enum QCResult {
  PENDING = 'PENDING',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  CONDITIONAL = 'CONDITIONAL',
}

/**
 * Kalite Kontrol Testi.
 * Tekstilde: Martindale, Yıkama Haslığı, Renk Haslığı, Gramaj, Pilling, Boncuklanma, Çekme
 */
@Entity({ tableName: 'quality_checks' })
export class QualityCheck extends BaseTenantEntity {
  @ManyToOne(() => ProductionOrder)
  productionOrder!: ProductionOrder;

  @Property()
  testType!: string;

  @Property({ nullable: true })
  testStandard?: string;

  @Enum(() => QCResult)
  result: QCResult = QCResult.PENDING;

  @Property({ nullable: true })
  measuredValue?: string;

  @Property({ nullable: true })
  expectedValue?: string;

  @Property({ nullable: true, type: 'datetime' })
  testedAt?: Date;

  @ManyToOne(() => User, { nullable: true })
  inspector?: User;

  @Property({ nullable: true })
  note?: string;

  @Property({ type: 'json', nullable: true })
  attachments?: string[];
}
