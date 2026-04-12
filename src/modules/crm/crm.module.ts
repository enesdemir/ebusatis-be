import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Fair } from './entities/fair.entity';
import { FairParticipant } from './entities/fair-participant.entity';
import { Lead } from './entities/lead.entity';
import { LeadSource } from './entities/lead-source.entity';
import { Partner } from '../partners/entities/partner.entity';
import { PhysicalSample } from '../products/entities/physical-sample.entity';
import { SampleLoanHistory } from '../products/entities/sample-loan-history.entity';
import { CrmService } from './services/crm.service';
import { PhysicalSampleService } from './services/physical-sample.service';
import { CrmController } from './controllers/crm.controller';
import { PhysicalSampleController } from './controllers/physical-sample.controller';
import { AuthModule } from '../auth/auth.module';

/**
 * CRM module (Sprint 12).
 *
 * Owns: Fair calendar + FairParticipant list, Lead kanban + stage
 * transitions + conversion to a CUSTOMER Partner, LeadSource lookup,
 * and the PhysicalSample lend/return lifecycle with an overdue-loan
 * query used by the cron-backed reminder engine.
 */
@Module({
  imports: [
    MikroOrmModule.forFeature([
      Fair,
      FairParticipant,
      Lead,
      LeadSource,
      Partner,
      PhysicalSample,
      SampleLoanHistory,
    ]),
    AuthModule,
  ],
  controllers: [CrmController, PhysicalSampleController],
  providers: [CrmService, PhysicalSampleService],
  exports: [CrmService, PhysicalSampleService],
})
export class CrmModule {}
