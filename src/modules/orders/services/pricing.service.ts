import { Injectable } from '@nestjs/common';
import { CustomerSubtype } from '../../partners/entities/partner.entity';
import { SalesOrderType } from '../entities/sales-order.entity';

/**
 * Customer-type pricing profile.
 * Defines automatic discount, default payment terms and minimum order quantity.
 */
export interface CustomerPricingProfile {
  discountPct: number;
  netDays: number; // payment term (0 = cash)
  minFabricMetres: number; // minimum quantity for fabric orders
  minProductUnits: number; // minimum quantity for product orders
}

/**
 * Result of applying customer discount.
 */
export interface PricedLine {
  basePrice: number;
  discountPct: number;
  finalPrice: number;
}

/**
 * Minimum quantity validation result.
 */
export interface MinQuantityResult {
  valid: boolean;
  minimum: number;
  requested: number;
}

/**
 * Pricing service for sales order lines.
 *
 * Applies customer-type based discounts, enforces minimum order quantities
 * per customer subtype, and provides default payment terms.
 *
 * Profiles are currently hardcoded but could be moved to PlatformConfig
 * in a later sprint for dynamic tuning without redeploys.
 */
@Injectable()
export class PricingService {
  private readonly profiles: Record<CustomerSubtype, CustomerPricingProfile> = {
    [CustomerSubtype.DEALER]: {
      discountPct: 10,
      netDays: 30,
      minFabricMetres: 50,
      minProductUnits: 1,
    },
    [CustomerSubtype.WHOLESALE]: {
      discountPct: 15,
      netDays: 45,
      minFabricMetres: 100,
      minProductUnits: 1,
    },
    [CustomerSubtype.RETAIL]: {
      discountPct: 0,
      netDays: 0,
      minFabricMetres: 10,
      minProductUnits: 1,
    },
    [CustomerSubtype.B2B]: {
      discountPct: 8,
      netDays: 30,
      minFabricMetres: 50,
      minProductUnits: 1,
    },
    [CustomerSubtype.SHOWROOM]: {
      discountPct: 0, // manual override expected
      netDays: 0,
      minFabricMetres: 10,
      minProductUnits: 1,
    },
    [CustomerSubtype.ONLINE]: {
      discountPct: 0,
      netDays: 0,
      minFabricMetres: 1,
      minProductUnits: 1,
    },
  };

  /**
   * Get the pricing profile for a customer subtype. Returns a safe default
   * (zero discount, cash, min 1) when no subtype is set.
   */
  getProfile(subtype?: CustomerSubtype | null): CustomerPricingProfile {
    if (!subtype) {
      return {
        discountPct: 0,
        netDays: 0,
        minFabricMetres: 1,
        minProductUnits: 1,
      };
    }
    return this.profiles[subtype];
  }

  /**
   * Apply the customer discount to a base price.
   *
   * If an explicit `overridePrice` is provided (e.g. SHOWROOM manual
   * pricing), the base is used as-is without discount.
   */
  applyCustomerDiscount(
    basePrice: number,
    subtype?: CustomerSubtype | null,
    overridePrice?: number,
  ): PricedLine {
    if (overridePrice != null) {
      return {
        basePrice,
        discountPct: 0,
        finalPrice: overridePrice,
      };
    }
    const profile = this.getProfile(subtype);
    const finalPrice = Number(
      (basePrice * (1 - profile.discountPct / 100)).toFixed(2),
    );
    return {
      basePrice,
      discountPct: profile.discountPct,
      finalPrice,
    };
  }

  /**
   * Check that a requested quantity meets the minimum for the customer
   * subtype and order type.
   */
  checkMinQuantity(
    subtype: CustomerSubtype | null | undefined,
    orderType: SalesOrderType,
    requested: number,
  ): MinQuantityResult {
    const profile = this.getProfile(subtype);
    const minimum =
      orderType === SalesOrderType.FABRIC
        ? profile.minFabricMetres
        : profile.minProductUnits;
    return {
      valid: requested >= minimum,
      minimum,
      requested,
    };
  }
}
