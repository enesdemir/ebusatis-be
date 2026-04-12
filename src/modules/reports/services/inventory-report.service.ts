import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { InventoryItemStatus } from '../../inventory/entities/inventory-item.entity';

/**
 * Stok Raporları
 * - Stok durum matrisi (varyant × depo)
 * - Hareket raporu (giriş/çıkış/fire)
 * - Yaşlandırma raporu (depoda 90+ gün kalanlar)
 */
@Injectable()
export class InventoryReportService {
  constructor(private readonly em: EntityManager) {}

  /**
   * Stok Durum Raporu: Varyant bazlı toplam metraj, top sayısı, rezerve
   */
  async stockStatus(warehouseId?: string): Promise<Record<string, unknown>[]> {
    const knex = this.em.getKnex();
    let qb = knex('inventory_items as i')
      .join('product_variants as v', 'v.id', 'i.variant_id')
      .join('products as p', 'p.id', 'v.product_id')
      .whereNull('i.deleted_at')
      .whereIn('i.status', [
        InventoryItemStatus.IN_STOCK,
        InventoryItemStatus.RESERVED,
      ])
      .select(
        'v.id as variantId',
        'v.name as variantName',
        'v.sku',
        'p.name as productName',
        'p.code as productCode',
        knex.raw('count(i.id)::int as "rollCount"'),
        knex.raw('sum(i.current_quantity)::numeric(14,2) as "totalQuantity"'),
        knex.raw('sum(i.reserved_quantity)::numeric(14,2) as "totalReserved"'),
        knex.raw(
          '(sum(i.current_quantity) - sum(i.reserved_quantity))::numeric(14,2) as "availableQuantity"',
        ),
      )
      .groupBy('v.id', 'v.name', 'v.sku', 'p.name', 'p.code')
      .orderBy('p.name');

    if (warehouseId) {
      qb = qb.where('i.warehouse_id', warehouseId);
    }

    return qb;
  }

  /**
   * Stok Hareket Raporu: Belirli tarih aralığındaki giriş/çıkış/fire
   */
  async movementReport(
    from?: string,
    to?: string,
    variantId?: string,
  ): Promise<Record<string, unknown>[]> {
    const knex = this.em.getKnex();
    let qb = knex('inventory_transactions as t')
      .join('inventory_items as i', 'i.id', 't.item_id')
      .join('product_variants as v', 'v.id', 'i.variant_id')
      .whereNull('t.deleted_at')
      .select(
        't.type',
        knex.raw('count(t.id)::int as "transactionCount"'),
        knex.raw(
          'sum(abs(t.quantity_change))::numeric(14,2) as "totalQuantity"',
        ),
      )
      .groupBy('t.type')
      .orderBy('t.type');

    if (from) qb = qb.where('t.created_at', '>=', new Date(from));
    if (to) qb = qb.where('t.created_at', '<=', new Date(to));
    if (variantId) qb = qb.where('i.variant_id', variantId);

    return qb;
  }

  /**
   * Yaşlandırma Raporu: Depoda belirli günden fazla kalan toplar
   */
  async agingReport(days: number = 90): Promise<Record<string, unknown>[]> {
    const knex = this.em.getKnex();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return knex('inventory_items as i')
      .join('product_variants as v', 'v.id', 'i.variant_id')
      .join('products as p', 'p.id', 'v.product_id')
      .whereNull('i.deleted_at')
      .whereIn('i.status', [
        InventoryItemStatus.IN_STOCK,
        InventoryItemStatus.RESERVED,
      ])
      .where('i.received_at', '<=', cutoffDate)
      .select(
        'i.id',
        'i.barcode',
        'i.batch_code as batchCode',
        'i.current_quantity as currentQuantity',
        'i.received_at as receivedAt',
        'v.name as variantName',
        'v.sku',
        'p.name as productName',
        knex.raw(`(current_date - i.received_at::date) as "daysInStock"`),
      )
      .orderByRaw('i.received_at ASC');
  }
}
