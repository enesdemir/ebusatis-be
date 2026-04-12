import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { UserGroup } from './entities/user-group.entity';
import { PermissionsController } from './controllers/permissions.controller';
import { SystemRolesController } from './controllers/system-roles.controller';
import { PermissionsService } from './services/permissions.service';
import { RolesService } from './services/roles.service';

import { RolesController } from './controllers/roles.controller';

/**
 * IAM (Identity & Access Management) module.
 *
 * Stage 0.C addition: UserGroup entity for department / team / functional
 * grouping used by the scheduled notification pipeline.
 */
@Module({
  imports: [MikroOrmModule.forFeature([Role, Permission, UserGroup])],
  controllers: [PermissionsController, SystemRolesController, RolesController],
  providers: [PermissionsService, RolesService],
  exports: [MikroOrmModule, RolesService, PermissionsService],
})
export class IamModule {}
