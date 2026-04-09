import { Controller, Get, Patch, Delete, Param, Query, UseGuards, Request } from '@nestjs/common';
import { NotificationService } from '../services/notification.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  /** Kullanicinin bildirimlerini listele */
  @Get()
  findAll(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('isRead') isRead?: string,
  ) {
    return this.service.findAll(req.user.id, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      type,
      isRead: isRead !== undefined ? isRead === 'true' : undefined,
    });
  }

  /** Okunmamis bildirim sayisi (badge icin) */
  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    const count = await this.service.getUnreadCount(req.user.id);
    return { count };
  }

  /** Tek bildirimi okundu isaretle */
  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @Request() req: any) {
    return this.service.markAsRead(id, req.user.id);
  }

  /** Tum bildirimleri okundu isaretle */
  @Patch('read-all')
  async markAllAsRead(@Request() req: any) {
    const count = await this.service.markAllAsRead(req.user.id);
    return { markedCount: count };
  }

  /** Tek bildirimi sil */
  @Delete(':id')
  delete(@Param('id') id: string, @Request() req: any) {
    return this.service.delete(id, req.user.id);
  }

  /** Tum okunan bildirimleri temizle */
  @Delete('clear-read')
  async clearRead(@Request() req: any) {
    const count = await this.service.clearRead(req.user.id);
    return { clearedCount: count };
  }
}
