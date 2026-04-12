import {
  Entity,
  Property,
  ManyToOne,
  OneToMany,
  Collection,
  Enum,
  Index,
} from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Product } from './product.entity';
import { ProductVariant } from './product-variant.entity';
import { Warehouse } from '../../definitions/entities/warehouse.entity';
import { Partner } from '../../partners/entities/partner.entity';
import { User } from '../../users/entities/user.entity';

/** Physical form of the sample. */
export enum SampleType {
  SWATCH = 'SWATCH',
  CUTTING = 'CUTTING',
  FULL_ROLL = 'FULL_ROLL',
  HANGER = 'HANGER',
}

/** Current lifecycle state of the physical sample. */
export enum SampleStatus {
  IN_STOCK = 'IN_STOCK',
  LENT = 'LENT',
  RETURNED = 'RETURNED',
  LOST = 'LOST',
  DESTROYED = 'DESTROYED',
}

/**
 * Physical Sample (swatch / kartela)
 *
 * Tracks a physical fabric sample that can be lent to a dealer,
 * showroom or sales rep and later returned. Each loan is recorded as
 * a `SampleLoanHistory` row so the full movement chain is auditable.
 *
 * This is NOT the digital catalogue (see DigitalCatalog entity) — it
 * models the physical artefact whose location matters.
 */
@Entity({ tableName: 'physical_samples' })
export class PhysicalSample extends BaseTenantEntity {
  @Property()
  @Index()
  sampleCode!: string; // barcode / QR — tenant-unique

  @ManyToOne(() => Product)
  product!: Product;

  @ManyToOne(() => ProductVariant, { nullable: true })
  variant?: ProductVariant;

  @Enum(() => SampleType)
  type: SampleType = SampleType.SWATCH;

  // ── Current location ──

  @Enum(() => SampleStatus)
  status: SampleStatus = SampleStatus.IN_STOCK;

  /** Warehouse the sample is stored in when status = IN_STOCK. */
  @ManyToOne(() => Warehouse, { nullable: true })
  currentWarehouse?: Warehouse;

  /** Dealer / showroom / customer currently holding the sample. */
  @ManyToOne(() => Partner, { nullable: true })
  currentHolder?: Partner;

  /** Sales rep currently holding the sample. */
  @ManyToOne(() => User, { nullable: true })
  currentHolderUser?: User;

  @Property({ nullable: true, type: 'text' })
  notes?: string;

  // ── Loan history ──

  @OneToMany('SampleLoanHistory', 'sample')
  loanHistory = new Collection<object>(this);
}
