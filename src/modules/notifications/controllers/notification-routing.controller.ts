import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { NotificationRoutingService } from '../services/notification-routing.service';
import {
  CreateNotificationRoutingConfigDto,
  UpdateNotificationRoutingConfigDto,
} from '../dto/notification-routing-config.dto';

/**
 * Notification routing config controller.
 *
 * Tenant admins use these endpoints to wire `eventCode → group +
 * channels` rules. Endpoints are tenant-scoped by `TenantGuard`; a
 * future role guard can pin them to admins only once the IAM
 * decorator surface stabilises.
 */
@Controller('notifications/routing')
@UseGuards(JwtAuthGuard, TenantGuard)
export class NotificationRoutingController {
  constructor(private readonly service: NotificationRoutingService) {}

  @Get()
  list(@Query('eventCode') eventCode?: string) {
    return eventCode
      ? this.service.findByEvent(eventCode)
      : this.service.findAll();
  }

  @Post()
  create(@Body() dto: CreateNotificationRoutingConfigDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateNotificationRoutingConfigDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
