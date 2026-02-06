import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { InventoryItem } from './entities/inventory-item.entity';
import { InventoryTransaction } from './entities/inventory-transaction.entity';

@Module({
  imports: [MikroOrmModule.forFeature([InventoryItem, InventoryTransaction])],
  exports: [MikroOrmModule],
})
export class InventoryModule {}
