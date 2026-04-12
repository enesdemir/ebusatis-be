import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { SalesChannel } from './entities/sales-channel.entity';
import { ChannelProductMapping } from './entities/channel-product-mapping.entity';
import { ChannelOrder } from './entities/channel-order.entity';
import { SalesChannelsService } from './services/sales-channels.service';
import { SalesChannelsController } from './controllers/sales-channels.controller';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      SalesChannel,
      ChannelProductMapping,
      ChannelOrder,
    ]),
  ],
  controllers: [SalesChannelsController],
  providers: [SalesChannelsService],
  exports: [SalesChannelsService, MikroOrmModule],
})
export class SalesChannelsModule {}
