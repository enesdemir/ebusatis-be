import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { InventoryItem } from './entities/inventory-item.entity';
import { InventoryTransaction } from './entities/inventory-transaction.entity';
import { GoodsReceive } from './entities/goods-receive.entity';
import { GoodsReceiveLine } from './entities/goods-receive-line.entity';
import { SupplierClaim } from './entities/supplier-claim.entity';
import { SupplierClaimLine } from './entities/supplier-claim-line.entity';

import { InventoryService } from './services/inventory.service';
import { GoodsReceiveService } from './services/goods-receive.service';
import { SupplierClaimService } from './services/supplier-claim.service';
import { InventoryController } from './controllers/inventory.controller';
import { GoodsReceiveController } from './controllers/goods-receive.controller';
import { SupplierClaimController } from './controllers/supplier-claim.controller';

import { AuthModule } from '../auth/auth.module';

/**
 * Inventory module.
 *
 * Owns the warehouse-side flows: inventory items / rolls, the
 * `PURCHASE` and `CUT` transaction streams, goods receive (with the
 * stage 0.C vehicle / driver / discrepancy fields) and supplier
 * claims raised from goods receive discrepancies.
 */
@Module({
  imports: [
    MikroOrmModule.forFeature([
      InventoryItem,
      InventoryTransaction,
      GoodsReceive,
      GoodsReceiveLine,
      SupplierClaim,
      SupplierClaimLine,
    ]),
    AuthModule,
  ],
  controllers: [InventoryController, GoodsReceiveController, SupplierClaimController],
  providers: [InventoryService, GoodsReceiveService, SupplierClaimService],
  exports: [
    MikroOrmModule,
    InventoryService,
    GoodsReceiveService,
    SupplierClaimService,
  ],
})
export class InventoryModule {}
