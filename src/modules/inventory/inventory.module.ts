import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { InventoryItem } from './entities/inventory-item.entity';
import { InventoryTransaction } from './entities/inventory-transaction.entity';
import { GoodsReceive } from './entities/goods-receive.entity';
import { GoodsReceiveLine } from './entities/goods-receive-line.entity';

import { InventoryService } from './services/inventory.service';
import { GoodsReceiveService } from './services/goods-receive.service';
import { InventoryController } from './controllers/inventory.controller';
import { GoodsReceiveController } from './controllers/goods-receive.controller';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      InventoryItem,
      InventoryTransaction,
      GoodsReceive,
      GoodsReceiveLine,
    ]),
    AuthModule,
  ],
  controllers: [InventoryController, GoodsReceiveController],
  providers: [InventoryService, GoodsReceiveService],
  exports: [MikroOrmModule, InventoryService, GoodsReceiveService],
})
export class InventoryModule {}
