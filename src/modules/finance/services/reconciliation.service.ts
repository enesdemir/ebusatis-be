import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { Invoice, InvoiceType } from '../entities/invoice.entity';
import { Payment } from '../entities/payment.entity';

export interface PartnerReconciliationReport {
  partnerId: string;
  asOf: Date;
  invoices: {
    totalIssued: number;
    totalPaid: number;
    outstanding: number;
  };
  payments: {
    count: number;
    totalAmount: number;
  };
  netBalance: number;
  transactions: Array<{
    date: Date;
    type: 'INVOICE' | 'PAYMENT';
    number: string;
    debit: number;
    credit: number;
    runningBalance: number;
  }>;
}

/**
 * ReconciliationService (Sprint 14).
 *
 * Produces a partner account statement (mutabakat): chronological
 * list of invoices (debit for sales, credit for returns) and
 * payments with a running balance. Used by the accountant to mail
 * customers a statement for monthly reconciliation.
 */
@Injectable()
export class ReconciliationService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: EntityRepository<Invoice>,
    @InjectRepository(Payment)
    private readonly paymentRepo: EntityRepository<Payment>,
  ) {}

  async reconcilePartner(
    partnerId: string,
  ): Promise<PartnerReconciliationReport> {
    const asOf = new Date();
    const invoices = await this.invoiceRepo.find({ partner: partnerId });
    const payments = await this.paymentRepo.find({ partner: partnerId });

    let totalIssued = 0;
    let totalPaid = 0;
    const invoiceTxs = invoices.map((inv) => {
      const isDebit =
        inv.type === InvoiceType.SALES ||
        inv.type === InvoiceType.RETURN_PURCHASE;
      const amount = Number(inv.grandTotal ?? 0);
      totalIssued += isDebit ? amount : -amount;
      return {
        date: inv.issueDate,
        type: 'INVOICE' as const,
        number: inv.invoiceNumber,
        debit: isDebit ? amount : 0,
        credit: isDebit ? 0 : amount,
        _sortKey: inv.issueDate?.getTime() ?? 0,
      };
    });

    const paymentTxs = payments.map((p) => {
      const amount = Number(p.amount ?? 0);
      totalPaid += amount;
      return {
        date: p.paymentDate,
        type: 'PAYMENT' as const,
        number: p.paymentNumber,
        debit: 0,
        credit: amount,
        _sortKey: p.paymentDate?.getTime() ?? 0,
      };
    });

    const transactions = [...invoiceTxs, ...paymentTxs].sort(
      (a, b) => a._sortKey - b._sortKey,
    );

    let running = 0;
    const withRunning = transactions.map((t) => {
      running += t.debit - t.credit;
      return {
        date: t.date,
        type: t.type,
        number: t.number,
        debit: t.debit,
        credit: t.credit,
        runningBalance: running,
      };
    });

    return {
      partnerId,
      asOf,
      invoices: {
        totalIssued,
        totalPaid,
        outstanding: totalIssued - totalPaid,
      },
      payments: {
        count: payments.length,
        totalAmount: totalPaid,
      },
      netBalance: running,
      transactions: withRunning,
    };
  }
}
