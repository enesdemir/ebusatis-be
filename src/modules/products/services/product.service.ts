import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { EntityManager, FilterQuery } from '@mikro-orm/postgresql';
import { Product } from '../entities/product.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { TenantContext } from '../../../common/context/tenant.context';
import { QueryBuilderHelper, PaginatedResponse } from '../../../common/helpers/query-builder.helper';
import { PaginatedQueryDto } from '../../../common/dto/paginated-query.dto';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Injectable()
export class ProductService {
  constructor(private readonly em: EntityManager) {}

  // ─── Product CRUD ─────────────────────────────────────────

  async findAll(query: PaginatedQueryDto & { categoryId?: string }): Promise<PaginatedResponse<Product>> {
    const where: FilterQuery<Product> = {};
    if (query.categoryId) {
      where.category = query.categoryId;
    }
    return QueryBuilderHelper.paginate(this.em, Product, query, {
      searchFields: ['name', 'code', 'collectionName'],
      defaultSortBy: 'name',
      where,
      populate: ['category', 'unit', 'tags'] as any,
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.em.findOne(Product, { id }, {
      populate: ['category', 'unit', 'taxRate', 'tags', 'variants', 'variants.currency', 'attributeValues', 'attributeValues.attribute'] as any,
    });
    if (!product) throw new NotFoundException(`Ürün bulunamadı: ${id}`);
    return product;
  }

  async create(data: any): Promise<Product> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new ConflictException('Tenant context bulunamadı');
    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });

    const product = this.em.create(Product, {
      ...data,
      tenant,
      category: data.categoryId ? this.em.getReference('Category', data.categoryId) : undefined,
      unit: data.unitId ? this.em.getReference('UnitOfMeasure', data.unitId) : undefined,
      taxRate: data.taxRateId ? this.em.getReference('TaxRate', data.taxRateId) : undefined,
    } as any);

    await this.em.persistAndFlush(product);
    return product;
  }

  async update(id: string, data: any): Promise<Product> {
    const product = await this.findOne(id);
    this.em.assign(product, {
      ...data,
      category: data.categoryId ? this.em.getReference('Category', data.categoryId) : product.category,
      unit: data.unitId ? this.em.getReference('UnitOfMeasure', data.unitId) : product.unit,
      taxRate: data.taxRateId ? this.em.getReference('TaxRate', data.taxRateId) : product.taxRate,
    } as any);
    await this.em.flush();
    return product;
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    product.deletedAt = new Date();
    await this.em.flush();
  }

  // ─── Variant CRUD ─────────────────────────────────────────

  async getVariants(productId: string): Promise<ProductVariant[]> {
    return this.em.find(
      ProductVariant,
      { product: productId, deletedAt: null } as any,
      { orderBy: { name: 'ASC' }, populate: ['currency'] as any },
    );
  }

  async createVariant(productId: string, data: any): Promise<ProductVariant> {
    const tenantId = TenantContext.getTenantId();
    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });
    const product = await this.em.findOneOrFail(Product, { id: productId });

    const variant = this.em.create(ProductVariant, {
      ...data,
      tenant,
      product,
      currency: data.currencyId ? this.em.getReference('Currency', data.currencyId) : undefined,
    } as any);

    await this.em.persistAndFlush(variant);
    return variant;
  }

  async updateVariant(variantId: string, data: any): Promise<ProductVariant> {
    const variant = await this.em.findOneOrFail(ProductVariant, { id: variantId });
    this.em.assign(variant, {
      ...data,
      currency: data.currencyId ? this.em.getReference('Currency', data.currencyId) : variant.currency,
    } as any);
    await this.em.flush();
    return variant;
  }

  async removeVariant(variantId: string): Promise<void> {
    const variant = await this.em.findOneOrFail(ProductVariant, { id: variantId });
    variant.deletedAt = new Date();
    await this.em.flush();
  }
}
