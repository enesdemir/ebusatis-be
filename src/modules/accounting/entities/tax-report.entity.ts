import { Entity, Property, Enum } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';

export enum TaxReportType {
  KDV = 'KDV',
  STOPAJ = 'STOPAJ',
  GUMRUK = 'GUMRUK',
}

export enum TaxReportStatus {
  DRAFT = 'DRAFT',
  CALCULATED = 'CALCULATED',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
}

/**
 * Vergi Raporu — KDV, Stopaj, Gumruk vergisi donem raporlari.
 */
@Entity({ tableName: 'tax_reports' })
export class TaxReport extends BaseTenantEntity {
  @Property()
  period!: string; // "2026-Q1", "2026-03"

  @Enum(() => TaxReportType)
  type!: TaxReportType;

  @Enum(() => TaxReportStatus)
  status: TaxReportStatus = TaxReportStatus.DRAFT;

  @Property({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalTaxBase: number = 0;

  @Property({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalTax: number = 0;

  @Property({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  deductibleTax: number = 0;

  @Property({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  payableTax: number = 0;

  @Property({ type: 'json', nullable: true })
  lines?: Array<{
    invoiceId: string;
    invoiceNumber: string;
    taxBase: number;
    taxAmount: number;
    taxRate: number;
  }>;

  @Property({ nullable: true })
  note?: string;
}
