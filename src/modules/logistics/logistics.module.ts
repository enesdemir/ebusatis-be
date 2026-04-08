import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ShipmentPlan } from './entities/shipment-plan.entity';
import { ContainerEvent } from './entities/container-event.entity';
import { CustomsDeclaration } from './entities/customs-declaration.entity';
import { FreightQuote } from './entities/freight-quote.entity';
import { LogisticsService } from './services/logistics.service';
import { LogisticsController } from './controllers/logistics.controller';

@Module({
  imports: [MikroOrmModule.forFeature([ShipmentPlan, ContainerEvent, CustomsDeclaration, FreightQuote])],
  controllers: [LogisticsController],
  providers: [LogisticsService],
  exports: [LogisticsService, MikroOrmModule],
})
export class LogisticsModule {}
