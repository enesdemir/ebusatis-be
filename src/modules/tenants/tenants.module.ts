import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Tenant } from './entities/tenant.entity';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { TenantOnboardingService } from './services/tenant-onboarding.service';

import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [MikroOrmModule.forFeature([Tenant]), AuthModule],
  controllers: [TenantsController],
  providers: [TenantsService, TenantOnboardingService],
  exports: [MikroOrmModule, TenantsService, TenantOnboardingService],
})
export class TenantsModule {}
