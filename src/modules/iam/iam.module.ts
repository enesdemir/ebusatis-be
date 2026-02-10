import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { PermissionsController } from './controllers/permissions.controller';
import { SystemRolesController } from './controllers/system-roles.controller';
import { PermissionsService } from './services/permissions.service';
import { RolesService } from './services/roles.service';

import { RolesController } from './controllers/roles.controller';

@Module({
  imports: [MikroOrmModule.forFeature([Role, Permission])],
  controllers: [PermissionsController, SystemRolesController, RolesController],
  providers: [PermissionsService, RolesService],
  exports: [MikroOrmModule, RolesService, PermissionsService],
})
export class IamModule {}
