import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { SupplierProductionOrder } from './entities/supplier-production-order.entity';
import { ProductionMilestone } from './entities/production-milestone.entity';
import { QualityCheck } from './entities/quality-check.entity';
import { ProductionMedia } from './entities/production-media.entity';
import { ProductionService } from './services/production.service';
import { ProductionController } from './controllers/production.controller';

/**
 * Supplier production tracking module.
 *
 * Owns the production lifecycle for orders manufactured by overseas
 * suppliers in the international-import flow. The legacy in-house
 * production entities (BillOfMaterials, BOMComponent, ProductionOrder)
 * were removed in stage 0.A.
 */
@Module({
  imports: [
    MikroOrmModule.forFeature([
      SupplierProductionOrder,
      ProductionMilestone,
      QualityCheck,
      ProductionMedia,
    ]),
  ],
  controllers: [ProductionController],
  providers: [ProductionService],
  exports: [ProductionService, MikroOrmModule],
})
export class ProductionModule {}
