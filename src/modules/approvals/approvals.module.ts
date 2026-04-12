import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ApprovalWorkflow } from './entities/approval-workflow.entity';
import { ApprovalStep } from './entities/approval-step.entity';
import { ApprovalRequest } from './entities/approval-request.entity';
import { ApprovalAction } from './entities/approval-action.entity';
import { ApprovalService } from './services/approval.service';
import { ApprovalController } from './controllers/approval.controller';
import { AuthModule } from '../auth/auth.module';

/**
 * Approvals module — Sprint 8.
 *
 * Owns the multi-step approval workflow used by PO (amount-based),
 * SO (credit-limit-based) and SUPPLIER_CLAIM (resolution sign-off).
 *
 * Other modules import this and call `ApprovalService.requestApproval`
 * from their own service layer when an entity transitions into a
 * state that needs human sign-off.
 */
@Module({
  imports: [
    MikroOrmModule.forFeature([
      ApprovalWorkflow,
      ApprovalStep,
      ApprovalRequest,
      ApprovalAction,
    ]),
    AuthModule,
  ],
  controllers: [ApprovalController],
  providers: [ApprovalService],
  exports: [ApprovalService, MikroOrmModule],
})
export class ApprovalsModule {}
