import { Entity, Property, ManyToOne, Enum, Index } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { ShipmentLeg } from './shipment-leg.entity';
import { Payment } from '../../finance/entities/payment.entity';

/**
 * Trigger event that releases a carrier payment installment.
 *
 * Carriers usually do not invoice in a single payment — they expect
 * milestone-based releases such as a deposit on booking, the bulk on
 * loading and a small remainder on delivery. Modeling each installment
 * as a row makes the cash plan deterministic and lets the UI render a
 * proper schedule.
 */
export enum CarrierPaymentTrigger {
  ON_BOOKING = 'ON_BOOKING',
  ON_LOADING = 'ON_LOADING',
  ON_DEPARTURE = 'ON_DEPARTURE',
  ON_ARRIVAL = 'ON_ARRIVAL',
  ON_DELIVERY = 'ON_DELIVERY',
  FIXED_DATE = 'FIXED_DATE',
}

/**
 * Status of a single carrier payment installment.
 */
export enum CarrierPaymentStatus {
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

/**
 * Carrier Payment Schedule
 *
 * One installment in the payment plan agreed with a carrier for a
 * specific shipment leg. When `payment` is set, the installment is
 * considered paid and the link points to the actual finance record.
 */
@Entity({ tableName: 'carrier_payment_schedules' })
export class CarrierPaymentSchedule extends BaseTenantEntity {
  @ManyToOne(() => ShipmentLeg)
  @Index()
  leg!: ShipmentLeg;

  /** 1-based installment number within the leg's plan (1, 2, 3, ...). */
  @Property()
  installmentNumber!: number;

  @Enum(() => CarrierPaymentTrigger)
  trigger!: CarrierPaymentTrigger;

  @Property({ type: 'decimal', precision: 14, scale: 2 })
  amount!: number;

  /**
   * Optional percentage of the leg total this installment represents.
   * Stored alongside the amount so the UI can display "30%, $1,500"
   * without recomputing it.
   */
  @Property({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  percentage?: number;

  @Property({ nullable: true, type: 'date' })
  dueDate?: Date;

  @Enum(() => CarrierPaymentStatus)
  status: CarrierPaymentStatus = CarrierPaymentStatus.PENDING;

  @Property({ nullable: true, type: 'datetime' })
  paidAt?: Date;

  /** Finance payment record once this installment is settled. */
  @ManyToOne(() => Payment, { nullable: true })
  payment?: Payment;

  @Property({ nullable: true, type: 'text' })
  notes?: string;
}
