import { NotFoundException, ConflictException } from '@nestjs/common';
import { EntityManager, FilterQuery } from '@mikro-orm/postgresql';
import { BaseDefinitionEntity } from '../entities/base-definition.entity';
import { TenantContext } from '../context/tenant.context';
import { QueryBuilderHelper, PaginatedResponse } from '../helpers/query-builder.helper';
import { PaginatedQueryDto } from '../dto/paginated-query.dto';
import { Tenant } from '../../modules/tenants/entities/tenant.entity';

/**
 * Generic CRUD service for all definition (master data) entities.
 * Tenant-scoped: MikroORM filter + manual TenantContext kontrolü (defense-in-depth).
 *
 * Kullanım:
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
    protected readonly entityClass: new (...args: any[]) => T,
    /** Arama yapılacak alanlar (search parametresi ile) */
    protected readonly searchFields: string[] = ['name', 'code'],
  ) {}

  /**
   * Paginated list with search, sort, pagination.
   * Tenant filtresi MikroORM @Filter ile otomatik uygulanır.
   */
  async findAll(query: PaginatedQueryDto): Promise<PaginatedResponse<T>> {
    return QueryBuilderHelper.paginate(this.em, this.entityClass, query, {
      searchFields: this.searchFields,
      defaultSortBy: 'sortOrder',
    });
  }

  /**
   * Find one by ID.
   */
  async findOne(id: string): Promise<T> {
    const entity = await this.em.findOne(this.entityClass, { id } as FilterQuery<T>);
    if (!entity) {
      throw new NotFoundException(`Kayıt bulunamadı: ${id}`);
    }
    return entity;
  }

  /**
   * Create a new definition entity.
   * Tenant context'ten tenant'ı alır ve code uniqueness kontrolü yapar.
   */
  async create(data: Partial<T>): Promise<T> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new ConflictException('Tenant context bulunamadı');
    }

    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });

    // Code uniqueness kontrolü (tenant + code)
    if (data.code) {
      const existing = await this.em.findOne(this.entityClass, {
        code: data.code,
      } as FilterQuery<T>);
      if (existing) {
        throw new ConflictException(`Bu kod zaten kullanılıyor: ${data.code}`);
      }
    }

    const entity = this.em.create(this.entityClass, {
      ...data,
      tenant,
    } as any);

    await this.em.persistAndFlush(entity);
    return entity;
  }

  /**
   * Update an existing definition entity.
   */
  async update(id: string, data: Partial<T>): Promise<T> {
    const entity = await this.findOne(id);

    // Code değişiyorsa uniqueness kontrolü
    if (data.code && data.code !== entity.code) {
      const existing = await this.em.findOne(this.entityClass, {
        code: data.code,
        id: { $ne: id },
      } as FilterQuery<T>);
      if (existing) {
        throw new ConflictException(`Bu kod zaten kullanılıyor: ${data.code}`);
      }
    }

    this.em.assign(entity, data as any);
    await this.em.flush();
    return entity;
  }

  /**
   * Soft delete by setting deletedAt.
   */
  async remove(id: string): Promise<void> {
    const entity = await this.findOne(id);
    entity.deletedAt = new Date();
    await this.em.flush();
  }

  /**
   * Reorder: Toplu sortOrder güncelleme.
   * Body: [{ id: "xxx", sortOrder: 0 }, { id: "yyy", sortOrder: 1 }]
   */
  async reorder(items: Array<{ id: string; sortOrder: number }>): Promise<void> {
    for (const item of items) {
      const entity = await this.findOne(item.id);
      entity.sortOrder = item.sortOrder;
    }
    await this.em.flush();
  }

  /**
   * Toggle isActive durumu.
   */
  async toggleActive(id: string): Promise<T> {
    const entity = await this.findOne(id);
    entity.isActive = !entity.isActive;
    await this.em.flush();
    return entity;
  }
}
