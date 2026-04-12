import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  EntityRepository,
  EntityManager,
  FilterQuery,
} from '@mikro-orm/postgresql';
import {
  Notification,
  NotificationType,
  NotificationSeverity,
} from '../entities/notification.entity';

export interface CreateNotificationDto {
  type: NotificationType;
  severity?: NotificationSeverity;
  title: string;
  message: string;
  icon?: string;
  actionUrl?: string;
  referenceType?: string;
  referenceId?: string;
}

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: EntityRepository<Notification>,
    private readonly em: EntityManager,
  ) {}

  /**
   * Tek kullaniciya bildirim olustur.
   */
  async create(
    tenantId: string,
    recipientId: string,
    dto: CreateNotificationDto,
  ): Promise<Notification> {
    const notif = this.repo.create({
      tenant: this.em.getReference(
        'Tenant',
        tenantId,
      ) as unknown as Notification['tenant'],
      recipient: this.em.getReference(
        'User',
        recipientId,
      ) as unknown as Notification['recipient'],
      type: dto.type,
      severity: dto.severity || NotificationSeverity.INFO,
      title: dto.title,
      message: dto.message,
      icon: dto.icon,
      actionUrl: dto.actionUrl,
      referenceType: dto.referenceType,
      referenceId: dto.referenceId,
    });
    await this.em.persistAndFlush(notif);
    return notif;
  }

  /**
   * Birden fazla kullaniciya ayni bildirim.
   */
  async createForMultiple(
    tenantId: string,
    recipientIds: string[],
    dto: CreateNotificationDto,
  ): Promise<void> {
    for (const recipientId of recipientIds) {
      const notif = this.repo.create({
        tenant: this.em.getReference(
          'Tenant',
          tenantId,
        ) as unknown as Notification['tenant'],
        recipient: this.em.getReference(
          'User',
          recipientId,
        ) as unknown as Notification['recipient'],
        type: dto.type,
        severity: dto.severity || NotificationSeverity.INFO,
        title: dto.title,
        message: dto.message,
        icon: dto.icon,
        actionUrl: dto.actionUrl,
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
      });
      this.em.persist(notif);
    }
    await this.em.flush();
  }

  /**
   * Tenant'taki tum kullanicilara bildirim (broadcast).
   */
  async createForTenant(
    tenantId: string,
    dto: CreateNotificationDto,
  ): Promise<void> {
    const users = await this.em.find('User', {
      tenant: tenantId,
      isActive: true,
    } as Parameters<typeof this.em.find>[1]);
    const userIds = (users as Array<{ id: string }>).map((u) => u.id);
    if (userIds.length > 0) {
      await this.createForMultiple(tenantId, userIds, dto);
    }
  }

  /**
   * Kullanicinin bildirimlerini listele.
   */
  async findAll(
    recipientId: string,
    params?: { page?: number; limit?: number; type?: string; isRead?: boolean },
  ) {
    const { page = 1, limit = 20, type, isRead } = params || {};
    const where: FilterQuery<Notification> = {
      recipient: recipientId,
    } as FilterQuery<Notification>;
    if (type) (where as Record<string, unknown>).type = type;
    if (isRead !== undefined)
      (where as Record<string, unknown>).isRead = isRead;

    const [items, total] = await this.repo.findAndCount(where, {
      orderBy: { createdAt: 'DESC' },
      limit,
      offset: (page - 1) * limit,
    });

    const unreadCount = await this.repo.count({
      recipient: recipientId,
      isRead: false,
    });

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        unreadCount,
      },
    };
  }

  /**
   * Okunmamis bildirim sayisi.
   */
  async getUnreadCount(recipientId: string): Promise<number> {
    return this.repo.count({ recipient: recipientId, isRead: false });
  }

  /**
   * Tek bildirimi okundu isaretle.
   */
  async markAsRead(notificationId: string, recipientId: string): Promise<void> {
    const notif = await this.repo.findOne({
      id: notificationId,
      recipient: recipientId,
    } as FilterQuery<Notification>);
    if (notif && !notif.isRead) {
      notif.isRead = true;
      notif.readAt = new Date();
      await this.em.flush();
    }
  }

  /**
   * Tum bildirimleri okundu isaretle.
   */
  async markAllAsRead(recipientId: string): Promise<number> {
    const unread = await this.repo.find({
      recipient: recipientId,
      isRead: false,
    } as FilterQuery<Notification>);
    const now = new Date();
    for (const n of unread) {
      n.isRead = true;
      n.readAt = now;
    }
    await this.em.flush();
    return unread.length;
  }

  /**
   * Tek bildirimi sil.
   */
  async delete(notificationId: string, recipientId: string): Promise<void> {
    const notif = await this.repo.findOne({
      id: notificationId,
      recipient: recipientId,
    } as FilterQuery<Notification>);
    if (notif) {
      notif.deletedAt = new Date();
      await this.em.flush();
    }
  }

  /**
   * Tum okunan bildirimleri temizle.
   */
  async clearRead(recipientId: string): Promise<number> {
    const read = await this.repo.find({
      recipient: recipientId,
      isRead: true,
    } as FilterQuery<Notification>);
    const now = new Date();
    for (const n of read) {
      n.deletedAt = now;
    }
    await this.em.flush();
    return read.length;
  }
}
