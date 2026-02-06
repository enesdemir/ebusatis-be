import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Role, Permission])],
  exports: [MikroOrmModule],
})
export class IamModule {}
