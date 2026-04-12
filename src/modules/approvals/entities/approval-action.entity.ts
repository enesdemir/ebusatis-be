import { Entity, Enum, Property, ManyToOne, Index } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { User } from '../../users/entities/user.entity';
import { ApprovalRequest } from './approval-request.entity';
import { ApprovalStep } from './approval-step.entity';

/**
 * One row in an approval request's audit trail.
 *
 * Captures every approve / reject / delegate / timeout / cancel
 * decision along with the actor, the step it applied to, the comment
 * (mandatory for rejections), and the optional delegate target.
 */
export enum ApprovalActionType {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DELEGATED = 'DELEGATED',
  TIMED_OUT = 'TIMED_OUT',
  CANCELLED = 'CANCELLED',
  ESCALATED = 'ESCALATED',
}

@Entity({ tableName: 'approval_actions' })
export class ApprovalAction extends BaseTenantEntity {
  @ManyToOne(() => ApprovalRequest)
  @Index()
  request!: ApprovalRequest;

  @ManyToOne(() => ApprovalStep, { nullable: true })
  step?: ApprovalStep;

  @Enum(() => ApprovalActionType)
  actionType!: ApprovalActionType;

  @ManyToOne(() => User, { nullable: true })
  actor?: User;

  /** When `actionType` is DELEGATED, the user who got the request. */
  @ManyToOne(() => User, { nullable: true })
  delegateTo?: User;

  @Property({ nullable: true, type: 'text' })
  comment?: string;

  @Property({ type: 'datetime' })
  occurredAt: Date = new Date();
}
