import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PurchaseOrder } from '../../orders/entities/purchase-order.entity';

/**
 * Public tracking service.
 *
 * Resolves the opaque `trackingUuid` embedded in a QR code to a
 * minimal, non-sensitive summary that the public `/track/:uuid`
 * endpoint can return without authentication.
 *
 * Whatever this service returns is effectively world-readable — be
 * conservative about which fields are exposed. Never leak buyer cost,
 * internal notes or tenant identifiers.
 */
@Injectable()
export class TrackingService {
  constructor(private readonly em: EntityManager) {}

  /**
   * Look up a QR payload.
   *
   * Intentionally queries with `disableFilters` because this endpoint
   * is public — the MikroORM tenant filter would block the lookup
   * without a tenant context.
   */
  async resolve(uuid: string): Promise<{
    type: 'PurchaseOrder';
    orderNumber: string;
    supplierName?: string;
    workflowStatus: string;
    expectedDeliveryDate?: Date;
    actualDeliveryDate?: Date;
    revisionNumber: number;
  }> {
    const po = await this.em.findOne(
      PurchaseOrder,
      { trackingUuid: uuid },
      {
        populate: ['supplier'] as never[],
        filters: false,
      },
    );
    if (po) {
      return {
        type: 'PurchaseOrder',
        orderNumber: po.orderNumber,
        supplierName: (po.supplier as unknown as { name?: string } | undefined)
          ?.name,
        workflowStatus: po.workflowStatus,
        expectedDeliveryDate: po.expectedDeliveryDate,
        actualDeliveryDate: po.actualDeliveryDate,
        revisionNumber: po.revisionNumber,
      };
    }

    throw new NotFoundException({
      errorCode: 'TRACKING_UUID_NOT_FOUND',
      i18nKey: 'errors.tracking.notFound',
    });
  }
}
