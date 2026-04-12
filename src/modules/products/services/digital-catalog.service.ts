import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { EntityManager } from '@mikro-orm/postgresql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { DigitalCatalog } from '../entities/digital-catalog.entity';
import { DigitalCatalogItem } from '../entities/digital-catalog-item.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../users/entities/user.entity';
import { TenantContext } from '../../../common/context/tenant.context';
import {
  TenantContextMissingException,
  EntityNotFoundException,
} from '../../../common/errors/app.exceptions';

/**
 * DigitalCatalogService (Sprint 13).
 *
 * Builds shareable B2B catalogs from selected variants. Public view
 * is guarded by a token (UUID) stored on the catalog row and bypasses
 * the tenant filter since unauthenticated customers hit the endpoint.
 *
 * Lifecycle:
 *   1. create(...)    — sales rep picks variants, gets a shareable URL
 *   2. public view    — customer hits /public/catalogs/:token, view count++
 *   3. rotateToken()  — invalidates the old link (leak / expiry)
 */
@Injectable()
export class DigitalCatalogService {
  constructor(
    private readonly em: EntityManager,
    @InjectRepository(DigitalCatalog)
    private readonly catalogRepo: EntityRepository<DigitalCatalog>,
    @InjectRepository(DigitalCatalogItem)
    private readonly itemRepo: EntityRepository<DigitalCatalogItem>,
  ) {}

  list() {
    return this.catalogRepo.findAll({
      populate: ['createdBy'] as never[],
      orderBy: { createdAt: 'DESC' },
    });
  }

  async findById(id: string) {
    const catalog = await this.catalogRepo.findOne(
      { id },
      {
        populate: [
          'items',
          'items.variant',
          'items.variant.product',
          'createdBy',
        ] as never[],
      },
    );
    if (!catalog) throw new EntityNotFoundException('DigitalCatalog', id);
    return catalog;
  }

  async create(
    data: {
      title: string;
      variantIds: string[];
      showPrices?: boolean;
      showStock?: boolean;
      expiresAt?: string | Date;
      partnerId?: string;
    },
    userId: string,
  ): Promise<DigitalCatalog> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new TenantContextMissingException();
    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });

    const catalog = this.catalogRepo.create({
      tenant,
      title: data.title,
      token: uuidv4(),
      showPrices: data.showPrices ?? true,
      showStock: data.showStock ?? false,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      partnerId: data.partnerId,
      createdBy: this.em.getReference(User, userId),
    } as unknown as DigitalCatalog);
    this.em.persist(catalog);

    let sortOrder = 0;
    for (const variantId of data.variantIds) {
      const item = this.itemRepo.create({
        tenant,
        catalog,
        variant: this.em.getReference(ProductVariant, variantId),
        sortOrder: sortOrder++,
      } as unknown as DigitalCatalogItem);
      this.em.persist(item);
    }

    await this.em.flush();
    return catalog;
  }

  async addVariants(id: string, variantIds: string[]): Promise<DigitalCatalog> {
    const catalog = await this.findById(id);
    const max = Math.max(
      0,
      ...catalog.items
        .getItems()
        .map((i) => (i as unknown as { sortOrder?: number }).sortOrder ?? 0),
    );
    let sortOrder = max + 1;
    for (const variantId of variantIds) {
      const item = this.itemRepo.create({
        tenant: catalog.tenant,
        catalog,
        variant: this.em.getReference(ProductVariant, variantId),
        sortOrder: sortOrder++,
      } as unknown as DigitalCatalogItem);
      this.em.persist(item);
    }
    await this.em.flush();
    return catalog;
  }

  async rotateToken(id: string): Promise<DigitalCatalog> {
    const catalog = await this.findById(id);
    catalog.token = uuidv4();
    await this.em.flush();
    return catalog;
  }

  async deactivate(id: string): Promise<DigitalCatalog> {
    const catalog = await this.findById(id);
    catalog.isActive = false;
    await this.em.flush();
    return catalog;
  }

  /**
   * Resolve a public token to a catalog payload. Bypasses the tenant
   * filter (unauthenticated request) and increments `viewCount` so
   * the sales rep can see engagement.
   */
  async findByPublicToken(token: string) {
    const catalog = await this.catalogRepo.findOne(
      { token, isActive: true },
      {
        filters: false,
        populate: [
          'items',
          'items.variant',
          'items.variant.product',
        ] as never[],
      },
    );
    if (!catalog) throw new NotFoundException(`Catalog token ${token}`);
    if (catalog.expiresAt && catalog.expiresAt < new Date()) {
      throw new NotFoundException(`Catalog token expired`);
    }
    catalog.viewCount += 1;
    await this.em.flush();
    return catalog;
  }
}
