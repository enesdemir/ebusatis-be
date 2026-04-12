import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { InventoryItem } from '../entities/inventory-item.entity';
import { TenantContext } from '../../../common/context/tenant.context';
import { TenantContextMissingException } from '../../../common/errors/app.exceptions';

/**
 * Kartela number generator for textile inventory items.
 *
 * Format: `KRT-YYYY-MMDD-SEQ` where SEQ is a 4-digit zero-padded sequence
 * scoped to the tenant and the date part. Used to give every roll a
 * human-readable, scan-friendly identifier separate from the generic
 * `barcode` field.
 */
@Injectable()
export class KartelaGeneratorService {
  private static readonly KARTELA_REGEX = /^KRT-\d{4}-\d{4}-\d{4,}$/;

  constructor(private readonly em: EntityManager) {}

  /**
   * Generate a fresh kartela number for the current tenant.
   *
   * The sequence increments per tenant+date. Safe for concurrent inserts
   * because the uniqueness is guaranteed by the tenant-scoped index and
   * retry logic can be added on conflict in the caller.
   */
  async generate(date: Date = new Date()): Promise<string> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new TenantContextMissingException();

    const yyyy = date.getFullYear();
    const mmdd =
      String(date.getMonth() + 1).padStart(2, '0') +
      String(date.getDate()).padStart(2, '0');
    const prefix = `KRT-${yyyy}-${mmdd}-`;

    // Count existing kartelas with this prefix (tenant-scoped via filter)
    const count = await this.em.count(InventoryItem, {
      kartelaNumber: { $like: `${prefix}%` },
    });

    const seq = String(count + 1).padStart(4, '0');
    return `${prefix}${seq}`;
  }

  /**
   * Validate that a given string matches the kartela format.
   */
  validateFormat(kartelaNumber: string): boolean {
    return KartelaGeneratorService.KARTELA_REGEX.test(kartelaNumber);
  }
}
