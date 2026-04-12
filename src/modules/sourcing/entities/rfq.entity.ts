import {
  Entity,
  Property,
  ManyToOne,
  OneToMany,
  Collection,
  Enum,
} from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { User } from '../../users/entities/user.entity';

export enum RFQStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  RECEIVED = 'RECEIVED',
  EVALUATED = 'EVALUATED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

@Entity({ tableName: 'rfqs' })
export class RFQ extends BaseTenantEntity {
  @Property() rfqNumber!: string;
  @Property() title!: string;
  @Property({ nullable: true }) description?: string;
  @Enum(() => RFQStatus) status: RFQStatus = RFQStatus.DRAFT;
  @Property({ nullable: true, type: 'date' }) deadline?: Date;
  @Property({ nullable: true }) note?: string;
  @Property({ type: 'json', nullable: true }) supplierIds?: string[];
  @Property({ type: 'json', nullable: true }) items?: Array<{
    variantId: string;
    quantity: number;
    note?: string;
  }>;
  @ManyToOne(() => User) createdBy!: User;
  @OneToMany('RFQResponse', 'rfq') responses = new Collection<any>(this);
}
