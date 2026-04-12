import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { TenantContext } from '../../common/context/tenant.context';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { TenantContextMissingException } from '../../common/errors/app.exceptions';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, TenantGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(@Request() req) {
    const tenantId = TenantContext.getTenantId() || req.user?.tenantId;
    if (!tenantId) throw new TenantContextMissingException();

    return this.usersService.findAll(tenantId);
  }

  @Post()
  async create(@Request() req, @Body() createUserDto: CreateUserDto) {
    const tenantId = TenantContext.getTenantId() || req.user?.tenantId;
    if (!tenantId) throw new TenantContextMissingException();

    return this.usersService.create(tenantId, createUserDto);
  }

  @Put(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const tenantId = TenantContext.getTenantId() || req.user?.tenantId;
    if (!tenantId) throw new TenantContextMissingException();

    return this.usersService.update(id, tenantId, updateUserDto);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    const tenantId = TenantContext.getTenantId() || req.user?.tenantId;
    if (!tenantId) throw new TenantContextMissingException();

    return this.usersService.remove(id, tenantId);
  }
}
