import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AuditLog } from './entities/audit-log.entity';
import { AuditService } from './services/audit.service';
import { AdminDashboardService } from './services/admin-dashboard.service';
import { AdminUsersService } from './services/admin-users.service';
import { AdminDashboardController } from './controllers/admin-dashboard.controller';
import { AdminAuditLogsController } from './controllers/admin-audit-logs.controller';
import { AdminUsersController } from './controllers/admin-users.controller';
import { Tenant } from '../tenants/entities/tenant.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    MikroOrmModule.forFeature([AuditLog, Tenant, User]),
  ],
  controllers: [
    AdminDashboardController,
    AdminAuditLogsController,
    AdminUsersController,
  ],
  providers: [
    AuditService,
    AdminDashboardService,
    AdminUsersService,
  ],
  exports: [AuditService],
})
export class AdminModule {}
