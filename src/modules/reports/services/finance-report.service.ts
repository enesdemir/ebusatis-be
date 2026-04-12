import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';

/**
 * Finans Raporları
 * - Cari bakiye raporu
 * - Vade analizi (vadesi geçmiş alacaklar/borçlar)
 * - Nakit akış raporu
 */
@Injectable()
export class FinanceReportService {
  constructor(private readonly em: EntityManager) {}

  /**
   * Cari Bakiye Raporu: T��m müşteri/tedarikçilerin güncel bakiyeleri
   */
  async balanceReport(): Promise<Record<string, unknown>[]> {
    const knex = this.em.getKnex();

    // Fatura toplamları (borç)
    const invoices = knex('invoices as i')
      .join('partners as p', 'p.id', 'i.partner_id')
      .whereNull('i.deleted_at')
      .where('i.type', 'SALES')
      .select(
        'p.id as partnerId',
        'p.name as partnerName',
        knex.raw('sum(i.grand_total)::numeric(14,2) as "totalInvoiced"'),
        knex.raw('sum(i.paid_amount)::numeric(14,2) as "totalPaid"'),
        knex.raw(
          '(sum(i.grand_total) - sum(i.paid_amount))::numeric(14,2) as "balance"',
        ),
        knex.raw('count(i.id)::int as "invoiceCount"'),
      )
      .groupBy('p.id', 'p.name')
      .orderByRaw('"balance" DESC');

    return invoices;
  }

  /**
   * Vade Analizi: Vadesi geçmiş faturalar
   */
  async agingAnalysis(): Promise<Record<string, unknown>[]> {
    const knex = this.em.getKnex();
    const today = new Date().toISOString().split('T')[0];

    const result = await knex('invoices as i')
      .join('partners as p', 'p.id', 'i.partner_id')
      .whereNull('i.deleted_at')
      .where('i.type', 'SALES')
      .whereNotIn('i.status', ['PAID', 'CANCELLED'])
      .where(function () {
        this.whereNotNull('i.due_date');
      })
      .select(
        'p.id as partnerId',
        'p.name as partnerName',
        'i.invoice_number as invoiceNumber',
        'i.grand_total as grandTotal',
        'i.paid_amount as paidAmount',
        knex.raw(
          '(i.grand_total - i.paid_amount)::numeric(14,2) as "remaining"',
        ),
        'i.due_date as dueDate',
        knex.raw(`(current_date - i.due_date::date) as "overdueDays"`),
        knex.raw(`
          case
            when i.due_date >= '${today}' then 'NOT_DUE'
            when current_date - i.due_date::date <= 30 then 'OVERDUE_30'
            when current_date - i.due_date::date <= 60 then 'OVERDUE_60'
            when current_date - i.due_date::date <= 90 then 'OVERDUE_90'
            else 'OVERDUE_90_PLUS'
          end as "agingBucket"
        `),
      )
      .orderByRaw('i.due_date ASC');

    return result;
  }

  /**
   * Nakit Akış Raporu: Dönem bazlı tahsilat ve ödeme
   */
  async cashFlow(
    from?: string,
    to?: string,
  ): Promise<{ incoming: number; outgoing: number; netCashFlow: number }> {
    const knex = this.em.getKnex();

    let incomingQb = knex('payments')
      .where('direction', 'INCOMING')
      .whereNull('deleted_at')
      .select(knex.raw('sum(amount)::numeric(14,2) as total'));

    let outgoingQb = knex('payments')
      .where('direction', 'OUTGOING')
      .whereNull('deleted_at')
      .select(knex.raw('sum(amount)::numeric(14,2) as total'));

    if (from) {
      incomingQb = incomingQb.where('payment_date', '>=', new Date(from));
      outgoingQb = outgoingQb.where('payment_date', '>=', new Date(from));
    }
    if (to) {
      incomingQb = incomingQb.where('payment_date', '<=', new Date(to));
      outgoingQb = outgoingQb.where('payment_date', '<=', new Date(to));
    }

    const [incoming, outgoing]: Array<{ total?: string } | undefined> =
      await Promise.all([incomingQb.first(), outgoingQb.first()]);

    return {
      incoming: Number(incoming?.total || 0),
      outgoing: Number(outgoing?.total || 0),
      netCashFlow: Number(incoming?.total || 0) - Number(outgoing?.total || 0),
    };
  }
}
