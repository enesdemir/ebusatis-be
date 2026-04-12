import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConfigModule } from '@nestjs/config';
import { Document } from './entities/document.entity';
import { PurchaseOrder } from '../orders/entities/purchase-order.entity';
import { SalesOrder } from '../orders/entities/sales-order.entity';
import { Invoice } from '../finance/entities/invoice.entity';
import { Payment } from '../finance/entities/payment.entity';
import { Shipment } from '../logistics/entities/shipment.entity';
import { SupplierClaim } from '../inventory/entities/supplier-claim.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { DocumentService } from './services/document.service';
import { TrackingService } from './services/tracking.service';
import { PdfService } from './services/pdf.service';
import { DocumentController } from './controllers/document.controller';
import { TrackingController } from './controllers/tracking.controller';
import { PdfController } from './controllers/pdf.controller';
import { StorageModule } from '../storage/storage.module';
import { AuthModule } from '../auth/auth.module';
import { PdfRendererService } from '../../common/services/pdf-renderer.service';
import { QrCodeService } from '../../common/services/qr-code.service';

/**
 * Documents module.
 *
 * Owns:
 *  - `Document` entity (uploads + system-generated PDFs with
 *    versioning)
 *  - Document CRUD controller (auth + tenant protected)
 *  - PDF renderer + 8 system templates (Sprint 7) — exposed via
 *    `/pdf/...` endpoints that stream `application/pdf` responses
 *  - Public `/track/:uuid` (PO status from QR) and
 *    `/verify/payment/:id` (receipt verification) endpoints
 */
@Module({
  imports: [
    MikroOrmModule.forFeature([
      Document,
      PurchaseOrder,
      SalesOrder,
      Invoice,
      Payment,
      Shipment,
      SupplierClaim,
      InventoryItem,
    ]),
    ConfigModule,
    StorageModule,
    AuthModule,
  ],
  controllers: [DocumentController, TrackingController, PdfController],
  providers: [
    DocumentService,
    TrackingService,
    PdfService,
    PdfRendererService,
    QrCodeService,
  ],
  exports: [DocumentService, PdfService],
})
export class DocumentsModule {}
