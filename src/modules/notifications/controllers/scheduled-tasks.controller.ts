import { Controller, Post, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { ScheduledTasksService } from '../services/scheduled-tasks.service';

/**
 * Manual trigger endpoints for scheduled jobs (dev only).
 *
 * Useful for QA / integration tests — invoking each cron's body
 * outside of its scheduled time. Disabled in production by guarding
 * on `NODE_ENV !== 'production'` at the handler level.
 */
@Controller('notifications/scheduled')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ScheduledTasksController {
  constructor(
    private readonly tasks: ScheduledTasksService,
    private readonly config: ConfigService,
  ) {}

  @Post('delivery-warning/run')
  async runDeliveryWarning() {
    this.assertDevOnly();
    await this.tasks.deliveryWarningJob();
    return { ok: true };
  }

  @Post('invoice-due/run')
  async runInvoiceDue() {
    this.assertDevOnly();
    await this.tasks.invoiceDueJob();
    return { ok: true };
  }

  @Post('overdue-invoice/run')
  async runOverdueInvoice() {
    this.assertDevOnly();
    await this.tasks.overdueInvoiceJob();
    return { ok: true };
  }

  @Post('approval-timeout/run')
  async runApprovalTimeout() {
    this.assertDevOnly();
    await this.tasks.approvalTimeoutJob();
    return { ok: true };
  }

  private assertDevOnly() {
    if (this.config.get<string>('NODE_ENV') === 'production') {
      throw new Error('Manual cron triggers disabled in production');
    }
  }
}
