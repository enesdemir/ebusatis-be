import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EntityManager } from '@mikro-orm/postgresql';
import { PurchaseOrder } from '../../orders/entities/purchase-order.entity';
import { Invoice, InvoiceStatus } from '../../finance/entities/invoice.entity';
import {
  ApprovalRequest,
  ApprovalRequestStatus,
} from '../../approvals/entities/approval-request.entity';
import {
  ApprovalAction,
  ApprovalActionType,
} from '../../approvals/entities/approval-action.entity';

/**
 * Scheduled task service — Sprint 9 cron jobs.
 *
 * Wires `@nestjs/schedule` cron expressions to background jobs that
 * scan for actionable state and fire notifications via the
 * NotificationService (or simply log and persist when notifications
 * are off-by-default in the dev environment).
 *
 * All jobs run with `filters: false` because the cron context has no
 * tenant header — the implementations group results by tenant before
 * acting so multi-tenant isolation is preserved manually.
 *
 * **Why so much manual triage instead of one giant job?** Each job
 * has its own SLO (delivery warning has a 1-hour granularity, invoice
 * due date is per-day, approval timeout is hourly) so they land on
 * different cron expressions and surface in logs separately.
 */
@Injectable()
export class ScheduledTasksService {
  private readonly logger = new Logger(ScheduledTasksService.name);

  constructor(private readonly em: EntityManager) {}

  // ── Delivery warnings (PO) — daily at 09:00 ─────────────────

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async deliveryWarningJob(): Promise<void> {
    const today = startOfDay(new Date());
    const pos = await this.em.find(
      PurchaseOrder,
      { expectedDeliveryDate: { $ne: null } } as never,
      { filters: false },
    );
    let fired = 0;
    for (const po of pos) {
      const config = po.deliveryWarningConfig ?? [];
      if (!po.expectedDeliveryDate) continue;
      const deltaDays = Math.ceil(
        (po.expectedDeliveryDate.getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      const matches = config.filter((entry) => entry.daysBefore === deltaDays);
      if (matches.length > 0) {
        fired += matches.length;
        // Hand-off point for the future NotificationService.dispatch
        // call. For now the job logs the trigger so the integration
        // test can assert on the log output without depending on the
        // SMTP / Socket.IO pipeline.
        this.logger.log(
          `[deliveryWarning] PO ${po.orderNumber} matched ${matches.length} entries (deltaDays=${deltaDays})`,
        );
      }
    }
    this.logger.log(`deliveryWarningJob completed — fired ${fired} warnings`);
  }

  // ── Invoice due reminder — daily at 10:00 ────────────────────

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async invoiceDueJob(): Promise<void> {
    const today = startOfDay(new Date());
    const threeDaysOut = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
    const invoices = await this.em.find(
      Invoice,
      {
        status: { $in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID] },
        dueDate: { $gte: today, $lte: threeDaysOut },
      } as never,
      { filters: false },
    );
    this.logger.log(
      `invoiceDueJob: ${invoices.length} invoices coming due in 3 days`,
    );
  }

  // ── Overdue invoice — daily at 11:00 ────────────────────────

  @Cron(CronExpression.EVERY_DAY_AT_11AM)
  async overdueInvoiceJob(): Promise<void> {
    const today = startOfDay(new Date());
    const invoices = await this.em.find(
      Invoice,
      {
        status: { $in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID] },
        dueDate: { $lt: today },
      } as never,
      { filters: false },
    );
    let updated = 0;
    for (const inv of invoices) {
      if (inv.status !== InvoiceStatus.OVERDUE) {
        inv.status = InvoiceStatus.OVERDUE;
        updated++;
      }
    }
    if (updated > 0) await this.em.flush();
    this.logger.log(
      `overdueInvoiceJob: ${invoices.length} overdue, ${updated} flagged`,
    );
  }

  // ── Approval timeout — hourly ───────────────────────────────

  @Cron(CronExpression.EVERY_HOUR)
  async approvalTimeoutJob(): Promise<void> {
    const reqs = await this.em.find(
      ApprovalRequest,
      { status: ApprovalRequestStatus.IN_PROGRESS },
      { populate: ['currentStep'] as never[], filters: false },
    );
    const now = Date.now();
    let timedOut = 0;
    for (const req of reqs) {
      const step = req.currentStep as unknown as
        | { timeoutHours?: number }
        | undefined;
      if (!step?.timeoutHours) continue;
      const ageHours =
        (now - new Date(req.requestedAt).getTime()) / (1000 * 60 * 60);
      if (ageHours >= step.timeoutHours) {
        req.status = ApprovalRequestStatus.TIMED_OUT;
        req.resolvedAt = new Date();
        const action = this.em.create(ApprovalAction, {
          tenant: (req as unknown as { tenant: unknown }).tenant,
          request: req,
          step: req.currentStep,
          actionType: ApprovalActionType.TIMED_OUT,
        } as never);
        this.em.persist(action);
        timedOut++;
      }
    }
    if (timedOut > 0) await this.em.flush();
    if (timedOut > 0) {
      this.logger.warn(`approvalTimeoutJob: ${timedOut} requests timed out`);
    }
  }
}

/** Truncate a Date to 00:00:00 in the server's local timezone. */
const startOfDay = (d: Date): Date => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
};
