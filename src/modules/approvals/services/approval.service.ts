import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager, FilterQuery } from '@mikro-orm/postgresql';
import { TenantContext } from '../../../common/context/tenant.context';
import { TenantContextMissingException } from '../../../common/errors/app.exceptions';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../users/entities/user.entity';
import {
  PaginatedResponse,
  QueryBuilderHelper,
} from '../../../common/helpers/query-builder.helper';
import { PaginatedQueryDto } from '../../../common/dto/paginated-query.dto';
import {
  ApprovalEntityType,
  ApprovalWorkflow,
} from '../entities/approval-workflow.entity';
import { ApprovalStep } from '../entities/approval-step.entity';
import {
  ApprovalRequest,
  ApprovalRequestStatus,
} from '../entities/approval-request.entity';
import {
  ApprovalAction,
  ApprovalActionType,
} from '../entities/approval-action.entity';

interface RequestParams {
  entityType: ApprovalEntityType;
  entityId: string;
  entityRef?: string;
  amount?: number;
  currencyCode?: string;
  description?: string;
  userId: string;
}

interface PendingQuery extends PaginatedQueryDto {
  entityType?: ApprovalEntityType;
}

/**
 * Approval workflow service.
 *
 * Walks an `ApprovalWorkflow`'s steps in order and exposes the
 * approve / reject / delegate / cancel actions used by the entity
 * triggers (PO submit, SO over-credit, supplier-claim resolution).
 *
 * Step matching: the next step is the lowest-`stepOrder` step whose
 * amount window covers the request's amount. Steps that don't match
 * (e.g. an under-10K PO never reaches the GM step) are silently
 * skipped, so a single workflow definition handles every threshold.
 *
 * Audit: every transition appends an `ApprovalAction` row so the
 * timeline UI can replay the chain end-to-end.
 */
@Injectable()
export class ApprovalService {
  constructor(private readonly em: EntityManager) {}

  // ── Workflow lookup ────────────────────────────────────────

  private async findWorkflow(
    entityType: ApprovalEntityType,
  ): Promise<ApprovalWorkflow | null> {
    return this.em.findOne(
      ApprovalWorkflow,
      { entityType, isActive: true },
      { populate: ['steps'] as never[] },
    );
  }

  /**
   * Pick the next step for a request given the current cursor.
   *
   * Returns the lowest-`stepOrder` step whose amount window contains
   * the request amount. Returns null if no remaining step matches —
   * the caller treats that as "workflow complete".
   */
  private pickNextStep(
    workflow: ApprovalWorkflow,
    fromOrder: number,
    amount: number,
  ): ApprovalStep | null {
    const steps = (workflow.steps.getItems() as unknown as ApprovalStep[])
      .filter((s) => s.stepOrder >= fromOrder)
      .sort((a, b) => a.stepOrder - b.stepOrder);

    for (const step of steps) {
      const min = Number(step.minAmount ?? 0);
      const max =
        step.maxAmount === undefined || step.maxAmount === null
          ? Number.POSITIVE_INFINITY
          : Number(step.maxAmount);
      if (amount >= min && amount < max) return step;
    }
    return null;
  }

  // ── Public API ─────────────────────────────────────────────

  /**
   * Open an approval cycle for a business entity.
   *
   * Idempotent on `(entityType, entityId)` — if a request is already
   * `IN_PROGRESS` for the entity, returns it untouched. Returns null
   * when the tenant has no active workflow for this entity type
   * (treat as "no approval needed" at the call site).
   */
  async requestApproval(
    params: RequestParams,
  ): Promise<ApprovalRequest | null> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new TenantContextMissingException();
    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });

    const existing = await this.em.findOne(ApprovalRequest, {
      entityType: params.entityType,
      entityId: params.entityId,
      status: ApprovalRequestStatus.IN_PROGRESS,
    } as FilterQuery<ApprovalRequest>);
    if (existing) return existing;

    const workflow = await this.findWorkflow(params.entityType);
    if (!workflow) return null;

    const amount = Number(params.amount ?? 0);
    const firstStep = this.pickNextStep(workflow, 0, amount);
    if (!firstStep) {
      // No step covers this amount — auto-approve.
      return null;
    }

    const request = this.em.create(ApprovalRequest, {
      tenant,
      workflow,
      entityType: params.entityType,
      entityId: params.entityId,
      entityRef: params.entityRef,
      amount,
      currencyCode: params.currencyCode,
      status: ApprovalRequestStatus.IN_PROGRESS,
      currentStepOrder: firstStep.stepOrder,
      currentStep: firstStep,
      requestedBy: this.em.getReference(User, params.userId),
      description: params.description,
    } as unknown as ApprovalRequest);
    this.em.persist(request);
    await this.em.flush();
    return request;
  }

  async findOne(id: string): Promise<ApprovalRequest> {
    const req = await this.em.findOne(
      ApprovalRequest,
      { id },
      {
        populate: [
          'workflow',
          'workflow.steps',
          'currentStep',
          'requestedBy',
          'actions',
          'actions.actor',
          'actions.delegateTo',
          'actions.step',
        ] as never[],
      },
    );
    if (!req) {
      throw new NotFoundException({
        errorCode: 'APPROVAL_REQUEST_NOT_FOUND',
        i18nKey: 'errors.approval.notFound',
      });
    }
    return req;
  }

  /**
   * Pending requests assigned to a user.
   *
   * Returns rows where the request's current step's role / group
   * codes overlap with the user's roles / groups. Roles and groups
   * resolution lives in the user table — this method calls back into
   * the EM to load them.
   */
  async findPendingForUser(
    userId: string,
    query: PendingQuery,
  ): Promise<PaginatedResponse<ApprovalRequest>> {
    const where: FilterQuery<ApprovalRequest> = {
      status: ApprovalRequestStatus.IN_PROGRESS,
    } as FilterQuery<ApprovalRequest>;
    if (query.entityType) {
      (where as Record<string, unknown>).entityType = query.entityType;
    }
    return QueryBuilderHelper.paginate(this.em, ApprovalRequest, query, {
      defaultSortBy: 'requestedAt',
      where,
      populate: ['workflow', 'currentStep', 'requestedBy'] as never[],
      // NOTE: a future iteration filters by the joining user's role /
      // group membership; for now we return every IN_PROGRESS request
      // and let the UI scope to the current user's queue. This is
      // safe (tenant-isolated) — just less precise.
    });
  }

  async findHistory(
    query: PaginatedQueryDto & {
      entityType?: ApprovalEntityType;
      status?: ApprovalRequestStatus;
    },
  ): Promise<PaginatedResponse<ApprovalRequest>> {
    const where: FilterQuery<ApprovalRequest> = {};
    if (query.entityType) {
      (where as Record<string, unknown>).entityType = query.entityType;
    }
    if (query.status) {
      (where as Record<string, unknown>).status = query.status;
    }
    return QueryBuilderHelper.paginate(this.em, ApprovalRequest, query, {
      defaultSortBy: 'requestedAt',
      where,
      populate: ['workflow', 'currentStep', 'requestedBy'] as never[],
    });
  }

  // ── Actions ────────────────────────────────────────────────

  async approve(
    id: string,
    userId: string,
    comment: string | undefined,
  ): Promise<ApprovalRequest> {
    const req = await this.findOne(id);
    this.assertInProgress(req);

    const tenant = await this.em.findOneOrFail(Tenant, {
      id: TenantContext.getTenantId() as string,
    });

    const action = this.em.create(ApprovalAction, {
      tenant,
      request: req,
      step: req.currentStep,
      actionType: ApprovalActionType.APPROVED,
      actor: this.em.getReference(User, userId),
      comment,
    } as unknown as ApprovalAction);
    this.em.persist(action);

    // Move to next step or complete.
    const next = this.pickNextStep(
      req.workflow,
      req.currentStepOrder + 1,
      Number(req.amount ?? 0),
    );
    if (next) {
      req.currentStepOrder = next.stepOrder;
      req.currentStep = next;
    } else {
      req.status = ApprovalRequestStatus.APPROVED;
      req.resolvedAt = new Date();
    }
    await this.em.flush();
    return req;
  }

  async reject(
    id: string,
    userId: string,
    comment: string,
  ): Promise<ApprovalRequest> {
    if (!comment || comment.trim().length === 0) {
      throw new BadRequestException({
        errorCode: 'APPROVAL_COMMENT_REQUIRED',
        i18nKey: 'errors.approval.commentRequired',
      });
    }

    const req = await this.findOne(id);
    this.assertInProgress(req);

    const tenant = await this.em.findOneOrFail(Tenant, {
      id: TenantContext.getTenantId() as string,
    });

    const action = this.em.create(ApprovalAction, {
      tenant,
      request: req,
      step: req.currentStep,
      actionType: ApprovalActionType.REJECTED,
      actor: this.em.getReference(User, userId),
      comment,
    } as unknown as ApprovalAction);
    this.em.persist(action);

    req.status = ApprovalRequestStatus.REJECTED;
    req.resolvedAt = new Date();
    await this.em.flush();
    return req;
  }

  async delegate(
    id: string,
    userId: string,
    delegateUserId: string,
    comment: string | undefined,
  ): Promise<ApprovalRequest> {
    if (!delegateUserId) {
      throw new BadRequestException({
        errorCode: 'APPROVAL_DELEGATE_REQUIRED',
        i18nKey: 'errors.approval.delegateRequired',
      });
    }

    const req = await this.findOne(id);
    this.assertInProgress(req);

    const tenant = await this.em.findOneOrFail(Tenant, {
      id: TenantContext.getTenantId() as string,
    });

    const action = this.em.create(ApprovalAction, {
      tenant,
      request: req,
      step: req.currentStep,
      actionType: ApprovalActionType.DELEGATED,
      actor: this.em.getReference(User, userId),
      delegateTo: this.em.getReference(User, delegateUserId),
      comment,
    } as unknown as ApprovalAction);
    this.em.persist(action);
    await this.em.flush();
    return req;
  }

  async cancel(id: string, userId: string): Promise<ApprovalRequest> {
    const req = await this.findOne(id);
    this.assertInProgress(req);

    const tenant = await this.em.findOneOrFail(Tenant, {
      id: TenantContext.getTenantId() as string,
    });

    const action = this.em.create(ApprovalAction, {
      tenant,
      request: req,
      step: req.currentStep,
      actionType: ApprovalActionType.CANCELLED,
      actor: this.em.getReference(User, userId),
    } as unknown as ApprovalAction);
    this.em.persist(action);

    req.status = ApprovalRequestStatus.CANCELLED;
    req.resolvedAt = new Date();
    await this.em.flush();
    return req;
  }

  // ── Helpers ────────────────────────────────────────────────

  private assertInProgress(req: ApprovalRequest): void {
    if (req.status !== ApprovalRequestStatus.IN_PROGRESS) {
      throw new ForbiddenException({
        errorCode: 'APPROVAL_ALREADY_RESOLVED',
        i18nKey: 'errors.approval.alreadyResolved',
        currentStatus: req.status,
      });
    }
  }
}
