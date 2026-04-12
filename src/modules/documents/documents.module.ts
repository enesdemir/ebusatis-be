import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Document } from './entities/document.entity';
import { PurchaseOrder } from '../orders/entities/purchase-order.entity';
import { DocumentService } from './services/document.service';
import { TrackingService } from './services/tracking.service';
import { DocumentController } from './controllers/document.controller';
import { TrackingController } from './controllers/tracking.controller';
import { StorageModule } from '../storage/storage.module';
import { AuthModule } from '../auth/auth.module';

/**
 * Documents module.
 *
 * Owns:
 *  - `Document` entity (uploads + system-generated PDFs with
 *    versioning)
 *  - Document CRUD controller (auth + tenant protected)
 *  - Public `/track/:uuid` endpoint that resolves the QR-code payload
 *    to a minimal summary (PO for now; shipments / invoices can be
 *    added to `TrackingService.resolve` without changing the wire
 *    format)
 */
@Module({
  imports: [
    MikroOrmModule.forFeature([Document, PurchaseOrder]),
    StorageModule,
    AuthModule,
  ],
  controllers: [DocumentController, TrackingController],
  providers: [DocumentService, TrackingService],
  exports: [DocumentService],
})
export class DocumentsModule {}
