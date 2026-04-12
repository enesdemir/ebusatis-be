import {
  Entity,
  Enum,
  Property,
  Index,
  OneToMany,
  Collection,
} from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';

/**
 * What kind of business object an `ApprovalWorkflow` applies to.
 *
 * Mirrors the entity types that need approval per guide §25:
 * tutar-bazlı PO, kredi-bazlı SO and SUPPLIER_CLAIM resolution.
 */
export enum ApprovalEntityType {
  PURCHASE_ORDER = 'PURCHASE_ORDER',
  SALES_ORDER = 'SALES_ORDER',
  SUPPLIER_CLAIM = 'SUPPLIER_CLAIM',
}

/**
 * Approval Workflow
 *
 * Tenant-configurable rule set that decides which approval steps are
 * required for an entity. Steps are ordered (`stepOrder` on
 * `ApprovalStep`) and each step is scoped by an amount range
 * (`minAmount` ≤ entity amount < `maxAmount`).
 *
 * Keeping the workflow definition in the database (rather than code)
 * lets each tenant tune their own thresholds without a deploy.
 */
@Entity({ tableName: 'approval_workflows' })
export class ApprovalWorkflow extends BaseTenantEntity {
  @Property()
  @Index()
  code!: string; // e.g. 'PO_AMOUNT_BASED'

  @Property()
  name!: string;

  @Enum(() => ApprovalEntityType)
  @Index()
  entityType!: ApprovalEntityType;

  @Property({ default: true })
  isActive: boolean = true;

  @Property({ nullable: true, type: 'text' })
  description?: string;

  @OneToMany('ApprovalStep', 'workflow')
  steps = new Collection<object>(this);
}
