import { EntityManager, FilterQuery } from '@mikro-orm/postgresql';
import { BaseDefinitionEntity } from '../entities/base-definition.entity';
import { TenantContext } from '../context/tenant.context';
import {
  QueryBuilderHelper,
  PaginatedResponse,
} from '../helpers/query-builder.helper';
import { PaginatedQueryDto } from '../dto/paginated-query.dto';
import { Tenant } from '../../modules/tenants/entities/tenant.entity';
import {
  EntityNotFoundException,
  TenantContextMissingException,
  CodeDuplicateException,
} from '../errors/app.exceptions';

/**
 * Generic CRUD service for all definition (master data) entities.
 *
 * Tenant scoping is enforced both by the MikroORM `@Filter('tenant')`
 * (automatic, query-time) and by an explicit `TenantContext.getTenantId()`
 * check at write time (defense in depth).
 *
 * Usage:
 *   @Injectable()
 *   export class UnitOfMeasureService extends BaseDefinitionService<UnitOfMeasure> {
 *     constructor(em: EntityManager) {
 *       super(em, UnitOfMeasure, ['name', 'code']);
 *     }
 *   }
 */
export abstract class BaseDefinitionService<T extends BaseDefinitionEntity> {
  constructor(
    protected readonly em: EntityManager,
    protected readonly entityClass: new (...args: unknown[]) => T,
    /** Fields searched when the `search` query parameter is provided. */
    protected readonly searchFields: string[] = ['name', 'code'],
  ) {}

  /**
   * Paginated list with search, sort and pagination.
   * Tenant filter is applied automatically by MikroORM `@Filter('tenant')`.
   */
  async findAll(query: PaginatedQueryDto): Promise<PaginatedResponse<T>> {
    return QueryBuilderHelper.paginate(this.em, this.entityClass, query, {
      searchFields: this.searchFields,
      defaultSortBy: 'sortOrder',
    });
  }

  /**
   * Find one entity by ID.
   * Throws `EntityNotFoundException` if not found.
   */
  async findOne(id: string): Promise<T> {
    const entity = await this.em.findOne(this.entityClass, {
      id,
    } as FilterQuery<T>);
    if (!entity) {
      throw new EntityNotFoundException(this.entityClass.name, id);
    }
    return entity;
  }

  /**
   * Create a new definition entity.
   * Reads the tenant from `TenantContext` (defense in depth) and enforces
   * the (tenant_id, code) composite uniqueness contract.
   */
  async create(data: Partial<T>): Promise<T> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new TenantContextMissingException();
    }

    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });

    // (tenant_id, code) composite uniqueness check.
    if (data.code) {
      const existing = await this.em.findOne(this.entityClass, {
        code: data.code,
      } as FilterQuery<T>);
      if (existing) {
        throw new CodeDuplicateException(data.code);
      }
    }

    const entity = this.em.create(this.entityClass, {
      ...data,
      tenant,
    } as unknown as T);

    await this.em.persistAndFlush(entity);
    return entity;
  }

  /**
   * Update an existing definition entity.
   * Re-runs the (tenant_id, code) uniqueness check when `code` changes.
   */
  async update(id: string, data: Partial<T>): Promise<T> {
    const entity = await this.findOne(id);

    if (data.code && data.code !== entity.code) {
      const existing = await this.em.findOne(this.entityClass, {
        code: data.code,
        id: { $ne: id },
      } as FilterQuery<T>);
      if (existing) {
        throw new CodeDuplicateException(data.code);
      }
    }

    this.em.assign(entity, data as never);
    await this.em.flush();
    return entity;
  }

  /**
   * Soft-delete by setting `deletedAt`.
   */
  async remove(id: string): Promise<void> {
    const entity = await this.findOne(id);
    entity.deletedAt = new Date();
    await this.em.flush();
  }

  /**
   * Bulk reorder of `sortOrder`.
   * Body shape: [{ id: "xxx", sortOrder: 0 }, { id: "yyy", sortOrder: 1 }]
   */
  async reorder(
    items: Array<{ id: string; sortOrder: number }>,
  ): Promise<void> {
    for (const item of items) {
      const entity = await this.findOne(item.id);
      entity.sortOrder = item.sortOrder;
    }
    await this.em.flush();
  }

  /**
   * Toggle the `isActive` flag.
   */
  async toggleActive(id: string): Promise<T> {
    const entity = await this.findOne(id);
    entity.isActive = !entity.isActive;
    await this.em.flush();
    return entity;
  }
}
