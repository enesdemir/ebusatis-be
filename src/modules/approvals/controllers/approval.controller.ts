import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ApprovalService } from '../services/approval.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { ApprovalActionDto } from '../dto/approval-action.dto';
import { PaginatedQueryDto } from '../../../common/dto/paginated-query.dto';
import { ApprovalEntityType } from '../entities/approval-workflow.entity';
import { ApprovalRequestStatus } from '../entities/approval-request.entity';

interface AuthenticatedRequest extends ExpressRequest {
  user?: { sub?: string; id?: string; [key: string]: unknown };
}

/**
 * Approval workflow controller.
 *
 * Endpoints:
 *  - `GET  /approvals/pending`             — current user's queue
 *  - `GET  /approvals/history`             — full approval log
 *  - `GET  /approvals/:id`                 — request detail + chain
 *  - `POST /approvals/:id/approve`         — approve current step
 *  - `POST /approvals/:id/reject`          — reject (comment required)
 *  - `POST /approvals/:id/delegate`        — delegate to another user
 *  - `PATCH /approvals/:id/cancel`         — cancel the request
 *
 * Triggering a workflow is an internal call from the entity services
 * (PO submit, SO over-credit, claim resolve), not a public endpoint.
 */
@Controller('approvals')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ApprovalController {
  constructor(private readonly service: ApprovalService) {}

  @Get('pending')
  pending(
    @Query() query: PaginatedQueryDto & { entityType?: ApprovalEntityType },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.findPendingForUser(req.user?.sub ?? '', query);
  }

  @Get('history')
  history(
    @Query()
    query: PaginatedQueryDto & {
      entityType?: ApprovalEntityType;
      status?: ApprovalRequestStatus;
    },
  ) {
    return this.service.findHistory(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/approve')
  approve(
    @Param('id') id: string,
    @Body() dto: ApprovalActionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.approve(id, req.user?.sub ?? '', dto.comment);
  }

  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() dto: ApprovalActionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.reject(id, req.user?.sub ?? '', dto.comment ?? '');
  }

  @Post(':id/delegate')
  delegate(
    @Param('id') id: string,
    @Body() dto: ApprovalActionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.delegate(
      id,
      req.user?.sub ?? '',
      dto.delegateUserId ?? '',
      dto.comment,
    );
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.service.cancel(id, req.user?.sub ?? '');
  }
}
