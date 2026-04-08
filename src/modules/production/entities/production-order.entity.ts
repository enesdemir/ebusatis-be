import { Entity, Property, ManyToOne, OneToMany, Collection, Enum } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Product } from '../../products/entities/product.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { BillOfMaterials } from './bill-of-materials.entity';
import { User } from '../../users/entities/user.entity';

export enum ProductionStatus {
  DRAFT = 'DRAFT',
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  QC_PENDING = 'QC_PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * Üretim Emri — Hammadde → mamül dönüşüm süreci.
 * Tekstilde: İplik → Dokuma → Boyama → Apre → Kalite Kontrol → Depo
 */
@Entity({ tableName: 'production_orders' })
export class ProductionOrder extends BaseTenantEntity {
  @Property()
  orderNumber!: string;

  @ManyToOne(() => Product)
  product!: Product;

  @ManyToOne(() => ProductVariant, { nullable: true })
  variant?: ProductVariant;

  @ManyToOne(() => BillOfMaterials, { nullable: true })
  bom?: BillOfMaterials;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  plannedQuantity!: number;

  @Property({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  producedQuantity: number = 0;

  @Enum(() => ProductionStatus)
  status: ProductionStatus = ProductionStatus.DRAFT;

  @Property({ nullable: true, type: 'date' })
  plannedStartDate?: Date;

  @Property({ nullable: true, type: 'date' })
  plannedEndDate?: Date;

  @Property({ nullable: true, type: 'datetime' })
  actualStartDate?: Date;

  @Property({ nullable: true, type: 'datetime' })
  actualEndDate?: Date;

  @Property({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalCost: number = 0;

  @Property({ nullable: true })
  note?: string;

  @ManyToOne(() => User, { nullable: true })
  assignedTo?: User;

  @ManyToOne(() => User)
  createdBy!: User;

  @OneToMany('ProductionMilestone', 'productionOrder')
  milestones = new Collection<any>(this);

  @OneToMany('QualityCheck', 'productionOrder')
  qualityChecks = new Collection<any>(this);

  @OneToMany('ProductionMedia', 'productionOrder')
  media = new Collection<any>(this);
}
