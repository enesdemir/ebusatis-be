import {
  Entity,
  Enum,
  Property,
  ManyToOne,
  OneToMany,
  Collection,
  Index,
} from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { User } from '../../users/entities/user.entity';
import {
  ApprovalEntityType,
  ApprovalWorkflow,
} from './approval-workflow.entity';
import { ApprovalStep } from './approval-step.entity';

/**
 * Lifecycle state of a single approval request.
 *
 * `IN_PROGRESS` covers any step still waiting for an approver.
 * Terminal states (`APPROVED` / `REJECTED` / `TIMED_OUT` /
 * `CANCELLED`) are immutable — the workflow is done with this
 * request once it lands here.
 */
export enum ApprovalRequestStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  TIMED_OUT = 'TIMED_OUT',
  CANCELLED = 'CANCELLED',
}

/**
 * Approval Request
 *
 * One in-flight approval cycle for a specific business entity. The
 * service walks the workflow steps in order and stamps each
 * approval/rejection as an `ApprovalAction`.
 *
 * `currentStepOrder` is the cursor that drives the cron timeout job
 * and the "who's next?" UI on the entity detail page.
 */
@Entity({ tableName: 'approval_requests' })
export class ApprovalRequest extends BaseTenantEntity {
  @ManyToOne(() => ApprovalWorkflow)
  @Index()
  workflow!: ApprovalWorkflow;

  @Enum(() => ApprovalEntityType)
  @Index()
  entityType!: ApprovalEntityType;

  @Property()
  @Index()
  entityId!: string;

  /** Reference number ('PO-2026-0007') for display in lists. */
  @Property({ nullable: true })
  entityRef?: string;

  /** Amount that triggered the workflow (may differ from current). */
  @Property({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  amount?: number;

  @Property({ nullable: true })
  currencyCode?: string;

  @Enum(() => ApprovalRequestStatus)
  status: ApprovalRequestStatus = ApprovalRequestStatus.IN_PROGRESS;

  @Property({ default: 0 })
  currentStepOrder: number = 0;

  @ManyToOne(() => ApprovalStep, { nullable: true })
  currentStep?: ApprovalStep;

  @ManyToOne(() => User)
  requestedBy!: User;

  @Property({ type: 'datetime' })
  requestedAt: Date = new Date();

  @Property({ nullable: true, type: 'datetime' })
  resolvedAt?: Date;

  @Property({ nullable: true, type: 'text' })
  description?: string;

  @OneToMany('ApprovalAction', 'request')
  actions = new Collection<object>(this);
}
