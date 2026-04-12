import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { Partner, RiskScore } from '../../partners/entities/partner.entity';
import { SalesOrder, SalesOrderStatus } from '../entities/sales-order.entity';
import { Invoice, InvoiceStatus } from '../../finance/entities/invoice.entity';

/**
 * Credit status snapshot for a partner.
 */
export interface CreditStatus {
  partnerId: string;
  limit: number;
  used: number;
  available: number;
  riskScore: RiskScore;
  /** True when additional orders would exceed the limit. */
  overLimit: boolean;
}

/**
 * Result of a credit check for a new order amount.
 */
export interface CreditCheckResult {
  allowed: boolean;
  limit: number;
  currentUsed: number;
  newTotal: number;
  excess: number;
  riskScore: RiskScore;
  reason?: 'OVER_LIMIT' | 'RISK_BLOCKED';
}

/**
 * Service for real-time credit limit validation on sales orders.
 *
 * `used` is computed from the live state rather than stored, so cancellations
 * and payments are reflected automatically:
 *   - Sum of open invoices (not fully paid)
 *   - Plus sum of open orders (not yet invoiced, i.e. APPROVED → SHIPPED)
 *
 * The `RiskScore` on Partner acts as an override — `BLOCKED` always fails
 * the check regardless of available limit.
 */
@Injectable()
export class CreditStatusService {
  constructor(private readonly em: EntityManager) {}

  /**
   * Snapshot of credit status for a partner.
   */
  async getCreditStatus(partnerId: string): Promise<CreditStatus> {
    const partner = await this.em.findOneOrFail(Partner, { id: partnerId });
    const used = await this.calculateUsedCredit(partnerId);
    const limit = Number(partner.creditLimit);
    const available = Math.max(0, limit - used);
    return {
      partnerId,
      limit,
      used: Number(used.toFixed(2)),
      available: Number(available.toFixed(2)),
      riskScore: partner.riskScore,
      overLimit: used > limit,
    };
  }

  /**
   * Check whether an additional order amount would be allowed under the
   * partner's credit limit and risk rules.
   */
  async checkOrderAllowed(
    partnerId: string,
    amount: number,
  ): Promise<CreditCheckResult> {
    const status = await this.getCreditStatus(partnerId);
    const newTotal = status.used + amount;
    const excess = Math.max(0, newTotal - status.limit);

    if (status.riskScore === RiskScore.BLOCKED) {
      return {
        allowed: false,
        limit: status.limit,
        currentUsed: status.used,
        newTotal,
        excess,
        riskScore: status.riskScore,
        reason: 'RISK_BLOCKED',
      };
    }

    if (excess > 0) {
      return {
        allowed: false,
        limit: status.limit,
        currentUsed: status.used,
        newTotal,
        excess,
        riskScore: status.riskScore,
        reason: 'OVER_LIMIT',
      };
    }

    return {
      allowed: true,
      limit: status.limit,
      currentUsed: status.used,
      newTotal,
      excess: 0,
      riskScore: status.riskScore,
    };
  }

  /**
   * Computes live "used credit" as unpaid invoices + in-flight orders.
   */
  private async calculateUsedCredit(partnerId: string): Promise<number> {
    // Open invoices: grandTotal - paidAmount, only for non-paid statuses
    const openInvoices = await this.em.find(
      Invoice,
      {
        partner: partnerId,
        status: {
          $in: [
            InvoiceStatus.DRAFT,
            InvoiceStatus.ISSUED,
            InvoiceStatus.PARTIALLY_PAID,
            InvoiceStatus.OVERDUE,
          ],
        },
      },
      { fields: ['grandTotal', 'paidAmount'] },
    );
    const invoicesOpen = openInvoices.reduce(
      (sum, inv) =>
        sum + (Number(inv.grandTotal) - Number(inv.paidAmount || 0)),
      0,
    );

    // Orders in-flight: approved or beyond but not yet delivered (not invoiced).
    const openOrders = await this.em.find(
      SalesOrder,
      {
        partner: partnerId,
        workflowStatus: {
          $in: [
            SalesOrderStatus.APPROVED,
            SalesOrderStatus.ALLOCATED,
            SalesOrderStatus.READY_FOR_SHIPMENT,
            SalesOrderStatus.SHIPPED,
          ],
        },
      },
      { fields: ['grandTotal'] },
    );
    const ordersOpen = openOrders.reduce(
      (sum, o) => sum + Number(o.grandTotal),
      0,
    );

    return invoicesOpen + ordersOpen;
  }
}
