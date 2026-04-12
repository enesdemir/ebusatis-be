import { Entity, Property, ManyToOne, Index, Unique } from '@mikro-orm/core';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Shipment } from './shipment.entity';
import { User } from '../../users/entities/user.entity';

/**
 * DeliveryProof (Sprint 10)
 *
 * Captured when a driver finishes a customer delivery. Carries the
 * recipient's signature (inline base64 from a canvas pad), an optional
 * photo URL (uploaded via the Storage module) and the recipient's name
 * as stated verbally at handover. One proof per shipment.
 */
@Entity({ tableName: 'delivery_proofs' })
@Unique({ properties: ['shipment'], name: 'uq_delivery_proof_shipment' })
export class DeliveryProof extends BaseTenantEntity {
  @ManyToOne(() => Shipment)
  @Index()
  shipment!: Shipment;

  @Property({ type: 'text' })
  signatureBase64!: string;

  @Property({ nullable: true })
  photoUrl?: string;

  @Property()
  recipientName!: string;

  @Property({ nullable: true, type: 'text' })
  notes?: string;

  @Property({ type: 'datetime' })
  capturedAt: Date = new Date();

  @ManyToOne(() => User, { nullable: true })
  capturedBy?: User;
}
