import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';

export interface AgingBucket {
  bucket: '0-30' | '31-60' | '61-90' | '90+';
  invoiceCount: number;
  totalOutstanding: number;
}

export interface AgingReport {
  partnerId: string;
  asOf: Date;
  totalOutstanding: number;
  buckets: AgingBucket[];
  overdueInvoices: Array<{
    id: string;
    invoiceNumber: string;
    dueDate?: Date;
    remaining: number;
    daysPastDue: number;
  }>;
}

/**
 * CurrentAccountAgingService (Sprint 14).
 *
 * Classic A/R aging: every outstanding invoice for a partner bucketed
 * by days past due (0-30, 31-60, 61-90, 90+). `remaining = grandTotal
 * - paidAmount`. Future-dated invoices sit in the 0-30 bucket with
 * daysPastDue = 0.
 */
@Injectable()
export class CurrentAccountAgingService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: EntityRepository<Invoice>,
  ) {}

  async getAging(partnerId: string): Promise<AgingReport> {
    const asOf = new Date();
    const invoices = await this.invoiceRepo.find({
      partner: partnerId,
      status: {
        $in: [
          InvoiceStatus.ISSUED,
          InvoiceStatus.PARTIALLY_PAID,
          InvoiceStatus.OVERDUE,
        ],
      },
    });

    const buckets: Record<string, AgingBucket> = {
      '0-30': { bucket: '0-30', invoiceCount: 0, totalOutstanding: 0 },
      '31-60': { bucket: '31-60', invoiceCount: 0, totalOutstanding: 0 },
      '61-90': { bucket: '61-90', invoiceCount: 0, totalOutstanding: 0 },
      '90+': { bucket: '90+', invoiceCount: 0, totalOutstanding: 0 },
    };

    const overdueInvoices: AgingReport['overdueInvoices'] = [];
    let totalOutstanding = 0;

    for (const inv of invoices) {
      const remaining =
        Number(inv.grandTotal ?? 0) - Number(inv.paidAmount ?? 0);
      if (remaining <= 0) continue;
      const due = inv.dueDate ?? asOf;
      const daysPastDue = Math.max(
        0,
        Math.floor((asOf.getTime() - due.getTime()) / 86400000),
      );

      let key: keyof typeof buckets;
      if (daysPastDue <= 30) key = '0-30';
      else if (daysPastDue <= 60) key = '31-60';
      else if (daysPastDue <= 90) key = '61-90';
      else key = '90+';

      buckets[key].invoiceCount += 1;
      buckets[key].totalOutstanding += remaining;
      totalOutstanding += remaining;

      if (daysPastDue > 0) {
        overdueInvoices.push({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          dueDate: inv.dueDate,
          remaining,
          daysPastDue,
        });
      }
    }

    return {
      partnerId,
      asOf,
      totalOutstanding,
      buckets: Object.values(buckets),
      overdueInvoices: overdueInvoices.sort(
        (a, b) => b.daysPastDue - a.daysPastDue,
      ),
    };
  }
}
