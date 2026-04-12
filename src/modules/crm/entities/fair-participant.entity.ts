import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Fair } from './fair.entity';

/**
 * FairParticipant — a visitor met at a fair booth. Contacts that
 * convert become Leads; others stay as simple record entries used
 * for follow-up campaigns.
 */
@Entity({ tableName: 'fair_participants' })
export class FairParticipant extends BaseTenantEntity {
  @ManyToOne(() => Fair)
  fair!: Fair;

  @Property()
  fullName!: string;

  @Property({ nullable: true })
  company?: string;

  @Property({ nullable: true })
  title?: string;

  @Property({ nullable: true })
  email?: string;

  @Property({ nullable: true })
  phone?: string;

  @Property({ nullable: true, type: 'text' })
  notes?: string;

  @Property({ default: false })
  convertedToLead: boolean = false;
}
