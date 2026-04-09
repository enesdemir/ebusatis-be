import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { RFQ } from './entities/rfq.entity';
import { RFQResponse } from './entities/rfq-response.entity';
import { SourcingService } from './services/sourcing.service';
import { SourcingController } from './controllers/sourcing.controller';

@Module({
  imports: [MikroOrmModule.forFeature([RFQ, RFQResponse])],
  controllers: [SourcingController],
  providers: [SourcingService],
  exports: [SourcingService, MikroOrmModule],
})
export class SourcingModule {}
