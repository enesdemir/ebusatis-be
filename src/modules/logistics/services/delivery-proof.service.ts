import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import {
  Shipment,
  ShipmentStatus,
  ShipmentDirection,
} from '../entities/shipment.entity';
import { DeliveryProof } from '../entities/delivery-proof.entity';
import {
  SalesOrder,
  SalesOrderStatus,
} from '../../orders/entities/sales-order.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { User } from '../../users/entities/user.entity';
import { TenantContext } from '../../../common/context/tenant.context';
import {
  TenantContextMissingException,
  ShipmentNotFoundException,
  ShipmentNotShippedException,
  DeliveryProofAlreadyRecordedException,
  DeliveryProofSignatureRequiredException,
} from '../../../common/errors/app.exceptions';
import { RecordDeliveryProofDto } from '../dto/record-delivery-proof.dto';

/**
 * DeliveryProofService (Sprint 10).
 *
 * Records the final customer-delivery evidence and flips the linked
 * Shipment/SalesOrder to DELIVERED. A shipment can only receive one
 * proof; a second attempt throws a 409.
 */
@Injectable()
export class DeliveryProofService {
  constructor(
    private readonly em: EntityManager,
    @InjectRepository(Shipment)
    private readonly shipmentRepo: EntityRepository<Shipment>,
    @InjectRepository(DeliveryProof)
    private readonly proofRepo: EntityRepository<DeliveryProof>,
  ) {}

  async record(
    shipmentId: string,
    dto: RecordDeliveryProofDto,
    userId?: string,
  ): Promise<DeliveryProof> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new TenantContextMissingException();

    if (!dto.signatureBase64 || dto.signatureBase64.length < 32) {
      throw new DeliveryProofSignatureRequiredException();
    }

    const shipment = await this.shipmentRepo.findOne(
      { id: shipmentId },
      { populate: ['salesOrder'] as never[] },
    );
    if (!shipment) throw new ShipmentNotFoundException(shipmentId);
    if (
      shipment.status !== ShipmentStatus.OUT_FOR_DELIVERY &&
      shipment.status !== ShipmentStatus.IN_TRANSIT &&
      shipment.status !== ShipmentStatus.CONFIRMED
    ) {
      throw new ShipmentNotShippedException(shipmentId, shipment.status);
    }

    const existing = await this.proofRepo.findOne({ shipment: shipmentId });
    if (existing) {
      throw new DeliveryProofAlreadyRecordedException(shipmentId);
    }

    const tenant = await this.em.findOneOrFail(Tenant, { id: tenantId });
    const capturedBy = userId
      ? await this.em.findOne(User, { id: userId })
      : null;

    const proof = this.proofRepo.create({
      tenant,
      shipment,
      signatureBase64: dto.signatureBase64,
      photoUrl: dto.photoUrl,
      recipientName: dto.recipientName,
      notes: dto.notes,
      capturedAt: new Date(),
      capturedBy: capturedBy ?? undefined,
    } as unknown as DeliveryProof);

    shipment.status = ShipmentStatus.DELIVERED;
    shipment.actualArrival = new Date();

    if (
      shipment.direction === ShipmentDirection.OUTBOUND &&
      shipment.salesOrder
    ) {
      const so = await this.em.findOneOrFail(SalesOrder, {
        id: shipment.salesOrder.id,
      });
      so.workflowStatus = SalesOrderStatus.DELIVERED;
    }

    await this.em.persistAndFlush(proof);
    return proof;
  }

  async findByShipment(shipmentId: string): Promise<DeliveryProof | null> {
    return this.proofRepo.findOne({ shipment: shipmentId });
  }
}
