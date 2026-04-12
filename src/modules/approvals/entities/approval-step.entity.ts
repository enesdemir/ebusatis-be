import { Entity, Property, ManyToOne, Index } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { ApprovalWorkflow } from './approval-workflow.entity';

/**
 * One step inside an `ApprovalWorkflow`.
 *
 * Each step targets either a single role or a user group; the
 * service evaluates the step against the entity's amount range
 * (`minAmount` ≤ amount < `maxAmount`) and creates an
 * `ApprovalRequest` for the matching approver(s).
 *
 * `timeoutHours` drives the cron-based escalation: requests older
 * than this without action get bumped to the next step (or marked as
 * timed out). Zero / null means no timeout.
 */
@Entity({ tableName: 'approval_steps' })
export class ApprovalStep extends BaseTenantEntity {
  @ManyToOne(() => ApprovalWorkflow)
  @Index()
  workflow!: ApprovalWorkflow;

  @Property()
  stepOrder!: number; // 0-based — first step runs first

  @Property()
  name!: string; // 'Manager Approval', 'GM Approval'

  /** Lower bound of the amount window (inclusive). */
  @Property({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  minAmount: number = 0;

  /** Upper bound (exclusive); null means "+infinity". */
  @Property({ type: 'decimal', precision: 14, scale: 2, nullable: true })
  maxAmount?: number;

  /** Code of the role that may approve this step ('MANAGER', 'GM'). */
  @Property({ nullable: true })
  approverRoleCode?: string;

  /** Code of the user group that may approve this step. */
  @Property({ nullable: true })
  approverGroupCode?: string;

  @Property({ nullable: true })
  timeoutHours?: number;

  /** If true, every approver in the group must approve (parallel). */
  @Property({ default: false })
  requireAll: boolean = false;
}
