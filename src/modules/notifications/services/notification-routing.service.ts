import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { TenantContext } from '../../../common/context/tenant.context';
import { TenantContextMissingException } from '../../../common/errors/app.exceptions';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { UserGroup } from '../../iam/entities/user-group.entity';
import { NotificationRoutingConfig } from '../entities/notification-routing-config.entity';
import {
  CreateNotificationRoutingConfigDto,
  UpdateNotificationRoutingConfigDto,
} from '../dto/notification-routing-config.dto';

/**
 * Notification routing config service.
 *
 * Plain CRUD over `NotificationRoutingConfig` rows so the admin UI
 * can manage the event × group × channel matrix per tenant. The
 * cron jobs and ad-hoc emitters consume rows via `findByEvent`.
 */
@Injectable()
export class NotificationRoutingService {
  constructor(private readonly em: EntityManager) {}

  async findAll(): Promise<NotificationRoutingConfig[]> {
    return this.em.find(
      NotificationRoutingConfig,
      {},
      {
        populate: ['recipientGroup'] as never[],
        orderBy: { eventCode: 'ASC' } as never,
      },
    );
  }

  async findByEvent(eventCode: string): Promise<NotificationRoutingConfig[]> {
    return this.em.find(
      NotificationRoutingConfig,
      { eventCode, isActive: true },
      { populate: ['recipientGroup'] as never[] },
    );
  }

  async create(
    dto: CreateNotificationRoutingConfigDto,
  ): Promise<NotificationRoutingConfig> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new TenantContextMissingException();
    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });

    const row = this.em.create(NotificationRoutingConfig, {
      tenant,
      eventCode: dto.eventCode,
      recipientGroup: dto.recipientGroupId
        ? this.em.getReference(UserGroup, dto.recipientGroupId)
        : undefined,
      channels: dto.channels,
      isActive: dto.isActive ?? true,
      description: dto.description,
    } as never);
    this.em.persist(row);
    await this.em.flush();
    return row;
  }

  async update(
    id: string,
    dto: UpdateNotificationRoutingConfigDto,
  ): Promise<NotificationRoutingConfig> {
    const row = await this.em.findOne(NotificationRoutingConfig, { id });
    if (!row) {
      throw new NotFoundException({
        errorCode: 'NOTIFICATION_ROUTING_NOT_FOUND',
        i18nKey: 'errors.notificationRouting.notFound',
      });
    }
    if (dto.recipientGroupId !== undefined) {
      row.recipientGroup = dto.recipientGroupId
        ? this.em.getReference(UserGroup, dto.recipientGroupId)
        : undefined;
    }
    if (dto.channels) row.channels = dto.channels;
    if (dto.isActive !== undefined) row.isActive = dto.isActive;
    if (dto.description !== undefined) row.description = dto.description;
    await this.em.flush();
    return row;
  }

  async remove(id: string): Promise<void> {
    const row = await this.em.findOne(NotificationRoutingConfig, { id });
    if (!row) {
      throw new NotFoundException({
        errorCode: 'NOTIFICATION_ROUTING_NOT_FOUND',
        i18nKey: 'errors.notificationRouting.notFound',
      });
    }
    await this.em.removeAndFlush(row);
  }
}
