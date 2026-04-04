import { Entity, Property, Enum, Unique } from '@mikro-orm/core';
import { BaseDefinitionEntity } from '../../../common/entities/base-definition.entity';

export enum PaymentMethodType {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CREDIT_CARD = 'CREDIT_CARD',
  CHECK = 'CHECK',
  DEFERRED = 'DEFERRED',
  OFFSET = 'OFFSET',
}

/**
 * Ödeme Yöntemi (Payment Method)
 *
 * Ne işe yarar: Sipariş ve faturalarda kullanılacak ödeme şekilleri.
 * Nerede kullanılır: SalesOrder.paymentMethod, Invoice.paymentMethod, Payment.method
 */
@Entity({ tableName: 'payment_methods' })
@Unique({ properties: ['tenant', 'code'] })
export class PaymentMethod extends BaseDefinitionEntity {
  @Enum(() => PaymentMethodType)
  type!: PaymentMethodType;

  @Property({ nullable: true })
  icon?: string;

  @Property({ default: false })
  requiresReference: boolean = false; // Referans no zorunlu mu? (havale dekontu vb.)

  @Property({ nullable: true })
  defaultDueDays?: number; // Vadeli satışlarda varsayılan gün (ör: 30)
}
