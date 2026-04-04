import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

import { SalesOrder } from './entities/sales-order.entity';
import { SalesOrderLine } from './entities/sales-order-line.entity';
import { OrderRollAllocation } from './entities/order-roll-allocation.entity';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderLine } from './entities/purchase-order-line.entity';

import { SalesOrderService } from './services/sales-order.service';
import { PurchaseOrderService } from './services/purchase-order.service';
import { SalesOrderController } from './controllers/sales-order.controller';
import { PurchaseOrderController } from './controllers/purchase-order.controller';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      SalesOrder,
      SalesOrderLine,
      OrderRollAllocation,
      PurchaseOrder,
      PurchaseOrderLine,
    ]),
    AuthModule,
  ],
  controllers: [SalesOrderController, PurchaseOrderController],
  providers: [SalesOrderService, PurchaseOrderService],
  exports: [MikroOrmModule, SalesOrderService, PurchaseOrderService],
})
export class OrdersModule {}
