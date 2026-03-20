import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AuditLog } from './entities/audit-log.entity';
import { PlatformConfig } from './entities/platform-config.entity';
import { AuditService } from './services/audit.service';
import { PlatformConfigService } from './services/platform-config.service';
import { AdminDashboardService } from './services/admin-dashboard.service';
import { AdminUsersService } from './services/admin-users.service';
import { AdminReportsService } from './services/admin-reports.service';
import { MenuService } from './services/menu.service';
import { AdminDashboardController } from './controllers/admin-dashboard.controller';
import { AdminAuditLogsController } from './controllers/admin-audit-logs.controller';
import { AdminUsersController } from './controllers/admin-users.controller';
import { AdminConfigController } from './controllers/admin-config.controller';
import { AdminReportsController } from './controllers/admin-reports.controller';
import { MenuController } from './controllers/menu.controller';
import { Tenant } from '../tenants/entities/tenant.entity';
import { User } from '../users/entities/user.entity';
import { MenuNode } from './entities/menu-node.entity';

@Module({
  imports: [
    MikroOrmModule.forFeature([AuditLog, PlatformConfig, Tenant, User, MenuNode]),
  ],
  controllers: [
    AdminDashboardController,
    AdminAuditLogsController,
    AdminUsersController,
    AdminConfigController,
    AdminReportsController,
    MenuController,
  ],
  providers: [
    AuditService,
    PlatformConfigService,
    AdminDashboardService,
    AdminUsersService,
    AdminReportsService,
    MenuService,
  ],
  exports: [AuditService],
})
export class AdminModule {}

