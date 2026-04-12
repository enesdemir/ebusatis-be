import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { BillOfMaterials } from '../../products/entities/bill-of-materials.entity';
import {
  InventoryItem,
  InventoryItemStatus,
} from '../../inventory/entities/inventory-item.entity';

/**
 * Component availability breakdown for a single BOM component.
 */
export interface ComponentAvailability {
  variantId: string;
  variantName: string;
  required: number;
  available: number;
  shortage: number;
  isRequired: boolean;
}

/**
 * Result of a BOM availability check.
 */
export interface BomCheckResult {
  hasBom: boolean;
  sufficient: boolean;
  /** Components that are short on stock (`required > available`). */
  missing: ComponentAvailability[];
  /** All component rows — useful for UI rendering. */
  components: ComponentAvailability[];
}

/**
 * Service that validates whether enough component stock exists to build
 * the requested quantity of a PRODUCT-type variant based on its BOM.
 *
 * When a product has no BOM defined, we treat the variant itself as the
 * only component (direct stock check).
 */
@Injectable()
export class BomCheckService {
  constructor(private readonly em: EntityManager) {}

  async checkMaterialAvailability(
    variantId: string,
    quantity: number,
  ): Promise<BomCheckResult> {
    const bom = await this.em.findOne(
      BillOfMaterials,
      { variant: variantId, isActive: true },
      { populate: ['components', 'components.componentVariant'] as never[] },
    );

    if (!bom) {
      // No BOM → check the variant's own stock directly.
      const direct = await this.availableForVariant(variantId);
      return {
        hasBom: false,
        sufficient: direct.available >= quantity,
        missing:
          direct.available < quantity
            ? [
                {
                  variantId,
                  variantName: direct.name,
                  required: quantity,
                  available: direct.available,
                  shortage: quantity - direct.available,
                  isRequired: true,
                },
              ]
            : [],
        components: [
          {
            variantId,
            variantName: direct.name,
            required: quantity,
            available: direct.available,
            shortage: Math.max(0, quantity - direct.available),
            isRequired: true,
          },
        ],
      };
    }

    const yieldPerRun = Number(bom.yield) || 1;
    const runs = quantity / yieldPerRun;
    const components: ComponentAvailability[] = [];

    for (const c of bom.components.getItems()) {
      const required = Number(c.quantity) * runs;
      const { available, name } = await this.availableForVariant(
        c.componentVariant.id,
      );
      components.push({
        variantId: c.componentVariant.id,
        variantName: name,
        required,
        available,
        shortage: Math.max(0, required - available),
        isRequired: c.isRequired,
      });
    }

    const missing = components.filter((c) => c.isRequired && c.shortage > 0);

    return {
      hasBom: true,
      sufficient: missing.length === 0,
      missing,
      components,
    };
  }

  /**
   * Available (i.e., not-reserved) stock for a single variant across all
   * active kartela statuses.
   */
  private async availableForVariant(
    variantId: string,
  ): Promise<{ available: number; name: string }> {
    interface Row {
      sum: string;
      name: string;
    }
    const qb = this.em.createQueryBuilder(InventoryItem, 'i');
    const rows = await qb
      .select([
        'coalesce(sum(i.current_quantity - i.reserved_quantity), 0) as "sum"',
        'max(v.name) as "name"',
      ])
      .join('i.variant', 'v')
      .where({
        variant: variantId,
        status: {
          $in: [
            InventoryItemStatus.IN_STOCK,
            InventoryItemStatus.FULL,
            InventoryItemStatus.PARTIAL,
          ],
        },
      })
      .execute<Row[]>();

    const row = rows[0];
    return {
      available: Number(row?.sum) || 0,
      name: row?.name ?? '',
    };
  }
}
