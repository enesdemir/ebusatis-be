import { Entity, Property, ManyToOne, Enum, Index } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { SupplierProductionOrder } from './supplier-production-order.entity';
import { User } from '../../users/entities/user.entity';

export enum QCResult {
  PENDING = 'PENDING',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  CONDITIONAL = 'CONDITIONAL',
}

/**
 * Quality control type.
 *
 * In the international-import flow QC happens at three different points:
 *  - SUPPLIER_PRE_SHIPMENT: reported by the supplier before goods leave
 *    the factory.
 *  - OUR_INCOMING: performed by our team during goods receive.
 *  - OUR_RANDOM_AUDIT: random sampling from inventory in the warehouse.
 */
export enum QCType {
  SUPPLIER_PRE_SHIPMENT = 'SUPPLIER_PRE_SHIPMENT',
  OUR_INCOMING = 'OUR_INCOMING',
  OUR_RANDOM_AUDIT = 'OUR_RANDOM_AUDIT',
}

/**
 * Quality Check
 *
 * Textile-domain examples: Martindale, wash fastness, color fastness,
 * weight (g/m²), pilling, shrinkage.
 *
 * NOTE: a `goods_receive_line` foreign key will be added in stage 0.C
 * once the goods-receive entities expose discrepancy tracking. For now
 * the only relationship is to the SupplierProductionOrder.
 */
@Entity({ tableName: 'quality_checks' })
export class QualityCheck extends BaseTenantEntity {
  @ManyToOne(() => SupplierProductionOrder)
  @Index()
  productionOrder!: SupplierProductionOrder;

  @Enum(() => QCType)
  qcType: QCType = QCType.SUPPLIER_PRE_SHIPMENT;

  @Property()
  testType!: string;

  @Property({ nullable: true })
  testStandard?: string;

  @Enum(() => QCResult)
  result: QCResult = QCResult.PENDING;

  @Property({ nullable: true })
  measuredValue?: string;

  @Property({ nullable: true })
  expectedValue?: string;

  @Property({ nullable: true, type: 'datetime' })
  testedAt?: Date;

  @ManyToOne(() => User, { nullable: true })
  inspector?: User;

  @Property({ nullable: true, type: 'text' })
  note?: string;

  @Property({ type: 'jsonb', nullable: true })
  attachments?: string[];
}
