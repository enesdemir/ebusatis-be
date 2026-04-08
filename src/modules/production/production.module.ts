import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ProductionOrder } from './entities/production-order.entity';
import { ProductionMilestone } from './entities/production-milestone.entity';
import { QualityCheck } from './entities/quality-check.entity';
import { ProductionMedia } from './entities/production-media.entity';
import { BillOfMaterials } from './entities/bill-of-materials.entity';
import { BOMComponent } from './entities/bom-component.entity';
import { ProductionService } from './services/production.service';
import { ProductionController } from './controllers/production.controller';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      ProductionOrder,
      ProductionMilestone,
      QualityCheck,
      ProductionMedia,
      BillOfMaterials,
      BOMComponent,
    ]),
  ],
  controllers: [ProductionController],
  providers: [ProductionService],
  exports: [ProductionService, MikroOrmModule],
})
export class ProductionModule {}
