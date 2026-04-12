import {
  Controller,
  UseGuards,
  Post,
  Patch,
  Body,
  Param,
} from '@nestjs/common';
import { BaseDefinitionController } from '../../../common/controllers/base-definition.controller';
import { Currency } from '../entities/currency.entity';
import { CurrencyService } from '../services/currency.service';
import {
  CreateCurrencyDto,
  UpdateCurrencyDto,
} from '../dto/create-currency.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';

@Controller('definitions/currencies')
@UseGuards(JwtAuthGuard, TenantGuard)
export class CurrencyController extends BaseDefinitionController<Currency> {
  constructor(private readonly currencyService: CurrencyService) {
    super(currencyService);
  }

  @Post()
  async create(@Body() dto: CreateCurrencyDto) {
    return this.currencyService.create(dto as any);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCurrencyDto) {
    return this.currencyService.update(id, dto as any);
  }
}
