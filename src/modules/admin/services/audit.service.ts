import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, FilterQuery } from '@mikro-orm/postgresql';
import { AuditLog, AuditAction } from '../entities/audit-log.entity';

/** Input shape for creating an audit log entry */
interface CreateAuditLogInput {
  action: AuditAction;
  actorId: string;
  actorEmail: string;
  tenantId?: string;
  tenantName?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
  entityType?: string;
  entityId?: string;
}

/** Query parameters for listing audit logs */
interface AuditLogQueryInput {
  action?: AuditAction;
  actorId?: string;
  tenantId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: EntityRepository<AuditLog>,
  ) {}

  /**
   * Records a new audit log entry.
   */
  async logAction(input: CreateAuditLogInput): Promise<AuditLog> {
    const entry = new AuditLog(input.action, input.actorId, input.actorEmail);
    entry.tenantId = input.tenantId;
    entry.tenantName = input.tenantName;
    entry.ipAddress = input.ipAddress;
    entry.userAgent = input.userAgent;
    entry.details = input.details;
    entry.entityType = input.entityType;
    entry.entityId = input.entityId;
    const em = this.auditLogRepository.getEntityManager();
    await em.persistAndFlush(entry);
    return entry;
  }

  /**
   * Retrieves paginated audit log entries with optional filters.
   */
  async findAll(query: AuditLogQueryInput) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const offset = (page - 1) * limit;
    const where: FilterQuery<AuditLog> = {};
    if (query.action) {
      where.action = query.action;
    }
    if (query.actorId) {
      where.actorId = query.actorId;
    }
    if (query.tenantId) {
      where.tenantId = query.tenantId;
    }
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) {
        (where.createdAt as any).$gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        (where.createdAt as any).$lte = new Date(query.dateTo);
      }
    }
    const [data, total] = await this.auditLogRepository.findAndCount(where, {
      orderBy: { createdAt: 'DESC' },
      limit,
      offset,
    });
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retrieves a single audit log by ID.
   */
  async findOne(id: string): Promise<AuditLog | null> {
    return this.auditLogRepository.findOne({ id });
  }
}
