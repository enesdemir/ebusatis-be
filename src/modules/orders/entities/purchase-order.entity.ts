import { Entity, Property, ManyToOne, OneToMany, Collection, Index } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Partner } from '../../partners/entities/partner.entity';
import { Counterparty } from '../../partners/entities/counterparty.entity';
import { Currency } from '../../definitions/entities/currency.entity';
import { StatusDefinition } from '../../definitions/entities/status-definition.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Satınalma Siparişi (Purchase Order)
 *
 * Ne işe yarar: Tedarikçiye verilen sipariş. Mal kabul ile eşleşir.
 * Nerede kullanılır: Tedarik yönetimi, mal kabul referansı, maliyet hesaplama
 */
@Entity({ tableName: 'purchase_orders' })
export class PurchaseOrder extends BaseTenantEntity {
  @Property()
  @Index()
  orderNumber!: string; // "PO-2026-0001"

  @ManyToOne(() => Partner)
  supplier!: Partner;

  @ManyToOne(() => Counterparty, { nullable: true })
  counterparty?: Counterparty;

  @ManyToOne(() => Currency, { nullable: true })
  currency?: Currency;

  @Property({ type: 'decimal', precision: 18, scale: 6, nullable: true })
  exchangeRate?: number;

  @ManyToOne(() => StatusDefinition, { nullable: true })
  status?: StatusDefinition;

  @Property({ nullable: true, type: 'date' })
  expectedDeliveryDate?: Date;

  // ─── Tutarlar ─────────────────────────────────────────────

  @Property({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalAmount: number = 0;

  @Property({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  taxAmount: number = 0;

  @Property({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  grandTotal: number = 0;

  // ─── İthalat / Konteyner ──────────────────────────────────

  @Property({ type: 'json', nullable: true })
  containerInfo?: {
    containerNo?: string;
    vessel?: string;
    customsRef?: string; // GTD (Gümrük Beyannamesi)
  };

  @Property({ nullable: true, type: 'text' })
  note?: string;

  @ManyToOne(() => User)
  createdBy!: User;

  @OneToMany('PurchaseOrderLine', 'order')
  lines = new Collection<any>(this);
}
