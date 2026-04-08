import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SalesChannelsService } from '../services/sales-channels.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('sales-channels')
export class SalesChannelsController {
  constructor(private readonly service: SalesChannelsService) {}

  @Get()
  findAll() { return this.service.findAllChannels(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findChannelById(id); }

  @Post()
  create(@Body() data: any) { return this.service.createChannel(data); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) { return this.service.updateChannel(id, data); }

  @Get(':id/mappings')
  findMappings(@Param('id') id: string) { return this.service.findMappings(id); }

  @Post('mappings')
  createMapping(@Body() data: any) { return this.service.createMapping(data); }

  @Get('orders/all')
  findOrders(@Query('channelId') channelId?: string) { return this.service.findChannelOrders(channelId); }
}
