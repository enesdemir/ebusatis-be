import { Injectable } from '@nestjs/common';
import {
  EntityNotFoundException,
  TenantContextMissingException,
} from '../../../common/errors/app.exceptions';
import { EntityManager, FilterQuery } from '@mikro-orm/postgresql';
import { Product } from '../entities/product.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { TenantContext } from '../../../common/context/tenant.context';
import {
  QueryBuilderHelper,
  PaginatedResponse,
} from '../../../common/helpers/query-builder.helper';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Category } from '../../definitions/entities/category.entity';
import { UnitOfMeasure } from '../../definitions/entities/unit-of-measure.entity';
import { TaxRate } from '../../definitions/entities/tax-rate.entity';
import { Currency } from '../../definitions/entities/currency.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductQueryDto } from '../dto/product-query.dto';
import { CreateVariantDto } from '../dto/create-variant.dto';
import { UpdateVariantDto } from '../dto/update-variant.dto';

/**
 * Product service.
 *
 * Manages the product catalogue (product cards + variants). Each
 * product is tenant-scoped and can have N colour/pattern variants.
 *
 * Multi-tenant: BaseTenantEntity filter + manual TenantContext check.
 * Error contract: custom AppExceptions only, no raw strings.
 */
@Injectable()
export class ProductService {
  constructor(private readonly em: EntityManager) {}

  // ── Product CRUD ──

  async findAll(query: ProductQueryDto): Promise<PaginatedResponse<Product>> {
    const where: FilterQuery<Product> = {};
    if (query.categoryId) {
      where.category = query.categoryId;
    }
    return QueryBuilderHelper.paginate(this.em, Product, query, {
      searchFields: ['name', 'code', 'collectionName'],
      defaultSortBy: 'name',
      where,
      populate: ['category', 'unit', 'tags'] as never[],
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.em.findOne(
      Product,
      { id },
      {
        populate: [
          'category',
          'unit',
          'taxRate',
          'tags',
          'variants',
          'variants.currency',
          'attributeValues',
          'attributeValues.attribute',
        ] as never[],
      },
    );
    if (!product) throw new EntityNotFoundException('Product', id);
    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new TenantContextMissingException();
    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });

    const product = this.em.create(Product, {
      name: dto.name,
      code: dto.code,
      description: dto.description,
      trackingStrategy: dto.trackingStrategy,
      fabricComposition: dto.fabricComposition,
      washingInstructions: dto.washingInstructions,
      collectionName: dto.collectionName,
      moq: dto.moq,
      origin: dto.origin,
      isActive: dto.isActive ?? true,
      tenant,
      category: dto.categoryId
        ? this.em.getReference(Category, dto.categoryId)
        : undefined,
      unit: dto.unitId
        ? this.em.getReference(UnitOfMeasure, dto.unitId)
        : undefined,
      taxRate: dto.taxRateId
        ? this.em.getReference(TaxRate, dto.taxRateId)
        : undefined,
    } as Record<string, unknown>);

    await this.em.persistAndFlush(product);
    return product;
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

    const assignData: Record<string, unknown> = { ...dto };
    if (dto.categoryId !== undefined) {
      assignData.category = dto.categoryId
        ? this.em.getReference(Category, dto.categoryId)
        : null;
      delete assignData.categoryId;
    }
    if (dto.unitId !== undefined) {
      assignData.unit = dto.unitId
        ? this.em.getReference(UnitOfMeasure, dto.unitId)
        : null;
      delete assignData.unitId;
    }
    if (dto.taxRateId !== undefined) {
      assignData.taxRate = dto.taxRateId
        ? this.em.getReference(TaxRate, dto.taxRateId)
        : null;
      delete assignData.taxRateId;
    }

    this.em.assign(product, assignData);
    await this.em.flush();
    return product;
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    product.deletedAt = new Date();
    await this.em.flush();
  }

  // ── Variant CRUD ──

  async getVariants(productId: string): Promise<ProductVariant[]> {
    await this.findOne(productId);
    return this.em.find(
      ProductVariant,
      { product: productId, deletedAt: null } as FilterQuery<ProductVariant>,
      { orderBy: { name: 'ASC' }, populate: ['currency'] as never[] },
    );
  }

  async createVariant(
    productId: string,
    dto: CreateVariantDto,
  ): Promise<ProductVariant> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new TenantContextMissingException();
    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });
    const product = await this.findOne(productId);

    const variant = this.em.create(ProductVariant, {
      name: dto.name,
      sku: dto.sku,
      price: dto.price ?? 0,
      costPrice: dto.costPrice,
      minOrderQuantity: dto.minOrderQuantity,
      colorCode: dto.colorCode,
      width: dto.width,
      weight: dto.weight,
      martindale: dto.martindale,
      primaryImageUrl: dto.primaryImageUrl,
      barcode: dto.barcode,
      isActive: dto.isActive ?? true,
      tenant,
      product,
      currency: dto.currencyId
        ? this.em.getReference(Currency, dto.currencyId)
        : undefined,
    } as Record<string, unknown>);

    await this.em.persistAndFlush(variant);
    return variant;
  }

  async updateVariant(
    variantId: string,
    dto: UpdateVariantDto,
  ): Promise<ProductVariant> {
    const variant = await this.em.findOne(ProductVariant, { id: variantId });
    if (!variant)
      throw new EntityNotFoundException('ProductVariant', variantId);

    const assignData: Record<string, unknown> = { ...dto };
    if (dto.currencyId !== undefined) {
      assignData.currency = dto.currencyId
        ? this.em.getReference(Currency, dto.currencyId)
        : null;
      delete assignData.currencyId;
    }

    this.em.assign(variant, assignData);
    await this.em.flush();
    return variant;
  }

  async removeVariant(variantId: string): Promise<void> {
    const variant = await this.em.findOne(ProductVariant, { id: variantId });
    if (!variant)
      throw new EntityNotFoundException('ProductVariant', variantId);
    variant.deletedAt = new Date();
    await this.em.flush();
  }
}
