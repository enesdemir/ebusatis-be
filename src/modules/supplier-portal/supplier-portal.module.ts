import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PurchaseOrder } from '../orders/entities/purchase-order.entity';
import { PurchaseOrderLine } from '../orders/entities/purchase-order-line.entity';
import { Partner } from '../partners/entities/partner.entity';
import { SupplierProductionOrder } from '../production/entities/supplier-production-order.entity';
import { ProductionMilestone } from '../production/entities/production-milestone.entity';
import { ProductionMedia } from '../production/entities/production-media.entity';
import { RFQ } from '../sourcing/entities/rfq.entity';
import { RFQResponse } from '../sourcing/entities/rfq-response.entity';
import { SupplierPortalService } from './services/supplier-portal.service';
import { SupplierPortalTokenAdminService } from './services/supplier-portal-token-admin.service';
import { SupplierPortalController } from './controllers/supplier-portal.controller';
import { SupplierPortalAdminController } from './controllers/supplier-portal-admin.controller';
import { AuthModule } from '../auth/auth.module';

/**
 * SupplierPortalModule (Sprint 11).
 *
 * Hosts the public, token-protected surface that external suppliers
 * use to view their POs, update SPO milestones, upload production
 * media and respond to RFQs — without needing a full User row. Admin
 * endpoints for issuing / revoking portal tokens live alongside.
 */
@Module({
  imports: [
    MikroOrmModule.forFeature([
      PurchaseOrder,
      PurchaseOrderLine,
      Partner,
      SupplierProductionOrder,
      ProductionMilestone,
      ProductionMedia,
      RFQ,
      RFQResponse,
    ]),
    AuthModule,
  ],
  controllers: [SupplierPortalController, SupplierPortalAdminController],
  providers: [SupplierPortalService, SupplierPortalTokenAdminService],
  exports: [SupplierPortalService, SupplierPortalTokenAdminService],
})
export class SupplierPortalModule {}
