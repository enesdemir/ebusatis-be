import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { BaseDefinitionService } from '../../../common/services/base-definition.service';
import { Category } from '../entities/category.entity';
import { PaginatedQueryDto } from '../../../common/dto/paginated-query.dto';

@Injectable()
export class CategoryService extends BaseDefinitionService<Category> {
  constructor(em: EntityManager) {
    super(em, Category, ['name', 'code']);
  }

  /**
   * Kategori ağacını (tree) döndürür. Sadece kök kategorileri çeker, children populate ile gelir.
   */
  async findTree(): Promise<Category[]> {
    return this.em.find(
      Category,
      { parent: null, deletedAt: null },
      { populate: ['children', 'children.children'], orderBy: { sortOrder: 'ASC' } },
    );
  }
}
