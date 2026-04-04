import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Shipment } from './shipment.entity';
import { SalesOrderLine } from '../../orders/entities/sales-order-line.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';

/**
 * Sevkiyat Satırı - Hangi varyanttan ne kadar sevk edildi
 */
@Entity({ tableName: 'shipment_lines' })
export class ShipmentLine extends BaseTenantEntity {
  @ManyToOne(() => Shipment)
  shipment!: Shipment;

  @ManyToOne(() => SalesOrderLine, { nullable: true })
  orderLine?: SalesOrderLine;

  @ManyToOne(() => ProductVariant)
  variant!: ProductVariant;

  @Property({ type: 'decimal', precision: 10, scale: 2 })
  quantity!: number;

  @Property({ nullable: true, type: 'text' })
  note?: string;

  // Sevk edilen top ID'leri (JSON array olarak, ayrı tablo gerektirmez)
  @Property({ type: 'json', default: '[]' })
  rollIds: string[] = [];
}
