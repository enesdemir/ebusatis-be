import { Entity, Property, ManyToOne } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { GoodsReceive } from './goods-receive.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';

/**
 * Mal Kabul Satırı - Bir varyant için kaç top geldiğinin özeti
 */
@Entity({ tableName: 'goods_receive_lines' })
export class GoodsReceiveLine extends BaseTenantEntity {
  @ManyToOne(() => GoodsReceive)
  goodsReceive!: GoodsReceive;

  @ManyToOne(() => ProductVariant)
  variant!: ProductVariant;

  @Property({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  expectedQuantity?: number; // PO'daki beklenen miktar

  @Property({ default: 0 })
  receivedRollCount: number = 0; // Gelen top sayısı

  @Property({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalReceivedQuantity: number = 0; // Toplam gelen metraj

  @Property({ nullable: true, type: 'text' })
  note?: string;
}
