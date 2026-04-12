import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

import { SalesOrder } from './entities/sales-order.entity';
import { SalesOrderLine } from './entities/sales-order-line.entity';
import { OrderRollAllocation } from './entities/order-roll-allocation.entity';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderLine } from './entities/purchase-order-line.entity';
import { Picking } from './entities/picking.entity';
import { PickingLine } from './entities/picking-line.entity';
import { Packing } from './entities/packing.entity';
import { PackingBox } from './entities/packing-box.entity';
import { Partner } from '../partners/entities/partner.entity';
import { Invoice } from '../finance/entities/invoice.entity';
import { BillOfMaterials } from '../products/entities/bill-of-materials.entity';
import { BomComponent } from '../products/entities/bom-component.entity';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';

import { SalesOrderService } from './services/sales-order.service';
import { PurchaseOrderService } from './services/purchase-order.service';
import { PricingService } from './services/pricing.service';
import { CreditStatusService } from './services/credit-status.service';
import { AllocationService } from './services/allocation.service';
import { BomCheckService } from './services/bom-check.service';
import { PickingService } from './services/picking.service';
import { PackingService } from './services/packing.service';
import { SalesOrderController } from './controllers/sales-order.controller';
import { PurchaseOrderController } from './controllers/purchase-order.controller';
import { PickingController } from './controllers/picking.controller';
import { PackingController } from './controllers/packing.controller';

import { AuthModule } from '../auth/auth.module';
import { InventoryModule } from '../inventory/inventory.module';
import { QrCodeService } from '../../common/services/qr-code.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      SalesOrder,
      SalesOrderLine,
      OrderRollAllocation,
      PurchaseOrder,
      PurchaseOrderLine,
      Picking,
      PickingLine,
      Packing,
      PackingBox,
      Partner,
      Invoice,
      BillOfMaterials,
      BomComponent,
      InventoryItem,
    ]),
    AuthModule,
    InventoryModule,
  ],
  controllers: [
    SalesOrderController,
    PurchaseOrderController,
    PickingController,
    PackingController,
  ],
  providers: [
    SalesOrderService,
    PurchaseOrderService,
    PricingService,
    CreditStatusService,
    AllocationService,
    BomCheckService,
    PickingService,
    PackingService,
    QrCodeService,
  ],
  exports: [
    MikroOrmModule,
    SalesOrderService,
    PurchaseOrderService,
    PricingService,
    CreditStatusService,
    AllocationService,
    BomCheckService,
    PickingService,
    PackingService,
  ],
})
export class OrdersModule {}
