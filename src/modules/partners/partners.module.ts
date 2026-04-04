import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

import { Partner } from './entities/partner.entity';
import { PartnerAddress } from './entities/partner-address.entity';
import { PartnerContact } from './entities/partner-contact.entity';
import { PartnerRep } from './entities/partner-rep.entity';
import { Counterparty } from './entities/counterparty.entity';
import { BankAccount } from './entities/bank-account.entity';
import { Interaction } from './entities/interaction.entity';

import { PartnerService } from './services/partner.service';
import { PartnerController } from './controllers/partner.controller';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      Partner,
      PartnerAddress,
      PartnerContact,
      PartnerRep,
      Counterparty,
      BankAccount,
      Interaction,
    ]),
    AuthModule,
  ],
  controllers: [PartnerController],
  providers: [PartnerService],
  exports: [MikroOrmModule, PartnerService],
})
export class PartnersModule {}
