import {
  EntityManager,
  FilterQuery,
  FindOptions,
  QueryOrder,
} from '@mikro-orm/postgresql';
import { PaginatedQueryDto } from '../dto/paginated-query.dto';

/**
 * Paginated response formatı.
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * QueryBuilderHelper - Tüm liste endpoint'leri için ortak filtreleme, sıralama, sayfalama.
 *
 * MikroORM tenant filtresi otomatik aktif olduğundan, bu helper'ı kullanan
 * her sorgu zaten tenant-scoped'dır.
 *
 * Kullanım:
 *   const result = await QueryBuilderHelper.paginate(em, Product, query, {
 *     searchFields: ['name', 'code'],
 *     defaultSortBy: 'createdAt',
 *     populate: ['variants'],
 *   });
 */
export class QueryBuilderHelper {
  /**
   * Generic paginated find with search, sort, and pagination.
   */
  static async paginate<T extends object>(
    em: EntityManager,
    entityClass: new (...args: any[]) => T,
    query: PaginatedQueryDto,
    options?: {
      /** Arama yapılacak alanlar (search parametresi ile) */
      searchFields?: string[];
      /** Varsayılan sıralama alanı */
      defaultSortBy?: string;
      /** MikroORM populate parametresi */
      populate?: string[];
      /** Ek where koşulları */
      where?: FilterQuery<T>;
      /** MikroORM filter override (ör: SuperAdmin için tenant: false) */
      filters?: Record<string, boolean | Record<string, any>>;
    },
  ): Promise<PaginatedResponse<T>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    // Where koşullarını oluştur
    const where: FilterQuery<any> = { ...(options?.where || {}) };

    // Search filtresi: birden fazla alanda OR ile arama
    if (query.search && options?.searchFields?.length) {
      where.$or = options.searchFields.map((field) => ({
        [field]: { $ilike: `%${query.search}%` },
      }));
    }

    // Soft delete filtresi
    where.deletedAt = null;

    // Sıralama
    const sortBy = query.sortBy || options?.defaultSortBy || 'createdAt';
    const sortOrder =
      query.sortOrder === 'ASC' ? QueryOrder.ASC : QueryOrder.DESC;

    // FindOptions
    const findOptions: FindOptions<T> = {
      orderBy: { [sortBy]: sortOrder } as any,
      limit,
      offset,
    };

    if (options?.populate?.length) {
      findOptions.populate = options.populate as any;
    }

    if (options?.filters) {
      findOptions.filters = options.filters;
    }

    const [data, total] = await em.findAndCount(
      entityClass,
      where,
      findOptions,
    );

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
}
