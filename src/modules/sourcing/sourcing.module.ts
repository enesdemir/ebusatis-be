import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { RFQ } from './entities/rfq.entity';
import { RFQResponse } from './entities/rfq-response.entity';
import { PurchaseOrder } from '../orders/entities/purchase-order.entity';
import { PurchaseOrderLine } from '../orders/entities/purchase-order-line.entity';
import { SourcingService } from './services/sourcing.service';
import { SourcingController } from './controllers/sourcing.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      RFQ,
      RFQResponse,
      PurchaseOrder,
      PurchaseOrderLine,
    ]),
    AuthModule,
  ],
  controllers: [SourcingController],
  providers: [SourcingService],
  exports: [SourcingService, MikroOrmModule],
})
export class SourcingModule {}
