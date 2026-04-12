import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';

/**
 * Satış Raporları
 * - Satış performansı (temsilci, müşteri, dönem bazlı)
 * - Kârlılık raporu (satış - maliyet - fire)
 * - En çok satan ürünler/varyantlar
 */
@Injectable()
export class SalesReportService {
  constructor(private readonly em: EntityManager) {}

  /**
   * Satış Performansı: Dönem bazlı sipariş özeti
   */
  async salesPerformance(from?: string, to?: string): Promise<any> {
    const knex = this.em.getKnex();
    let qb = knex('sales_orders as o')
      .whereNull('o.deleted_at')
      .select(
        knex.raw('count(o.id)::int as "orderCount"'),
        knex.raw('sum(o.grand_total)::numeric(14,2) as "totalRevenue"'),
        knex.raw('avg(o.grand_total)::numeric(14,2) as "avgOrderValue"'),
      );

    if (from) qb = qb.where('o.order_date', '>=', new Date(from));
    if (to) qb = qb.where('o.order_date', '<=', new Date(to));

    const summary = await qb.first();

    // Müşteri bazlı
    let customerQb = knex('sales_orders as o')
      .join('partners as p', 'p.id', 'o.partner_id')
      .whereNull('o.deleted_at')
      .select(
        'p.id as partnerId',
        'p.name as partnerName',
        knex.raw('count(o.id)::int as "orderCount"'),
        knex.raw('sum(o.grand_total)::numeric(14,2) as "totalRevenue"'),
      )
      .groupBy('p.id', 'p.name')
      .orderByRaw('sum(o.grand_total) DESC')
      .limit(10);

    if (from)
      customerQb = customerQb.where('o.order_date', '>=', new Date(from));
    if (to) customerQb = customerQb.where('o.order_date', '<=', new Date(to));

    const topCustomers = await customerQb;

    return { summary, topCustomers };
  }

  /**
   * En Çok Satan Varyantlar
   */
  async topProducts(
    from?: string,
    to?: string,
    limit: number = 10,
  ): Promise<any[]> {
    const knex = this.em.getKnex();
    let qb = knex('sales_order_lines as l')
      .join('sales_orders as o', 'o.id', 'l.order_id')
      .join('product_variants as v', 'v.id', 'l.variant_id')
      .join('products as p', 'p.id', 'v.product_id')
      .whereNull('o.deleted_at')
      .whereNull('l.deleted_at')
      .select(
        'v.id as variantId',
        'v.name as variantName',
        'v.sku',
        'p.name as productName',
        knex.raw('sum(l.requested_quantity)::numeric(14,2) as "totalQuantity"'),
        knex.raw('sum(l.line_total)::numeric(14,2) as "totalRevenue"'),
        knex.raw('count(distinct o.id)::int as "orderCount"'),
      )
      .groupBy('v.id', 'v.name', 'v.sku', 'p.name')
      .orderByRaw('sum(l.line_total) DESC')
      .limit(limit);

    if (from) qb = qb.where('o.order_date', '>=', new Date(from));
    if (to) qb = qb.where('o.order_date', '<=', new Date(to));

    return qb;
  }

  /**
   * Kârlılık Raporu: Satış - Maliyet = Kâr (varyant bazlı)
   */
  async profitability(from?: string, to?: string): Promise<any[]> {
    const knex = this.em.getKnex();
    let qb = knex('sales_order_lines as l')
      .join('sales_orders as o', 'o.id', 'l.order_id')
      .join('product_variants as v', 'v.id', 'l.variant_id')
      .join('products as p', 'p.id', 'v.product_id')
      .whereNull('o.deleted_at')
      .whereNull('l.deleted_at')
      .select(
        'v.id as variantId',
        'v.name as variantName',
        'v.sku',
        'p.name as productName',
        knex.raw('sum(l.line_total)::numeric(14,2) as "revenue"'),
        knex.raw(
          'sum(l.requested_quantity * coalesce(v.cost_price, 0))::numeric(14,2) as "cost"',
        ),
        knex.raw(
          '(sum(l.line_total) - sum(l.requested_quantity * coalesce(v.cost_price, 0)))::numeric(14,2) as "profit"',
        ),
        knex.raw(`
          case when sum(l.line_total) > 0
          then ((sum(l.line_total) - sum(l.requested_quantity * coalesce(v.cost_price, 0))) / sum(l.line_total) * 100)::numeric(5,2)
          else 0 end as "profitMargin"
        `),
      )
      .groupBy('v.id', 'v.name', 'v.sku', 'p.name')
      .orderByRaw('"profit" DESC');

    if (from) qb = qb.where('o.order_date', '>=', new Date(from));
    if (to) qb = qb.where('o.order_date', '<=', new Date(to));

    return qb;
  }
}
