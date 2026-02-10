
import { Controller, Get, Post, Put, Delete, Body, Param, Request } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(@Request() req) {
    const tenantId = req.user?.tenantId; 
    if(!tenantId) throw new Error("Tenant context missing");

    return this.usersService.findAll(tenantId);
  }

  @Post()
  async create(@Request() req, @Body() createUserDto: { email: string; roleIds?: string[] }) {
    const tenantId = req.user?.tenantId;
    if(!tenantId) throw new Error("Tenant context missing");

    return this.usersService.create(tenantId, createUserDto);
  }

  @Put(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateUserDto: { roleIds?: string[] },
  ) {
    const tenantId = req.user?.tenantId;
    if(!tenantId) throw new Error("Tenant context missing");

    return this.usersService.update(id, tenantId, updateUserDto);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    const tenantId = req.user?.tenantId;
    if(!tenantId) throw new Error("Tenant context missing");

    return this.usersService.remove(id, tenantId);
  }
}
