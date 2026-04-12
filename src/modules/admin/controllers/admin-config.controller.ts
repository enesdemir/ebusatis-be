import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../../common/guards/super-admin.guard';
import { PlatformConfigService } from '../services/platform-config.service';
import { ConfigCategory } from '../entities/platform-config.entity';
import { UpsertConfigDto } from '../dto/upsert-config.dto';
import { BulkUpdateConfigDto } from '../dto/bulk-update-config.dto';

@ApiTags('Admin - Platform Config')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('admin/config')
export class AdminConfigController {
  constructor(private readonly configService: PlatformConfigService) {}

  @Get()
  @ApiOperation({ summary: 'List all platform configurations' })
  async findAll(@Query('category') category?: ConfigCategory) {
    return this.configService.findAll(category);
  }

  @Put(':key')
  @ApiOperation({ summary: 'Create or update a config value' })
  async upsert(@Param('key') key: string, @Body() body: UpsertConfigDto) {
    return this.configService.upsert(
      key,
      body.value,
      body.category,
      body.description,
      body.valueType,
    );
  }

  @Put()
  @ApiOperation({ summary: 'Bulk update config values' })
  async bulkUpdate(@Body() body: BulkUpdateConfigDto) {
    return this.configService.bulkUpdate(body.configs);
  }
}
