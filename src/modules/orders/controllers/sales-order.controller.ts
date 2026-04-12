import {
  Controller,
  UseGuards,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';

interface AuthenticatedRequest extends ExpressRequest {
  user?: {
    sub?: string;
    id?: string;
    [key: string]: unknown;
  };
}
import { SalesOrderService } from '../services/sales-order.service';
import { PricingService } from '../services/pricing.service';
import { CreditStatusService } from '../services/credit-status.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { PaginatedQueryDto } from '../../../common/dto/paginated-query.dto';
import {
  CreateSalesOrderDto,
  UpdateSalesOrderDto,
  AllocateRollDto,
} from '../dto';
import { SalesOrderType } from '../entities/sales-order.entity';

@Controller('orders/sales')
@UseGuards(JwtAuthGuard, TenantGuard)
export class SalesOrderController {
  constructor(
    private readonly service: SalesOrderService,
    private readonly pricing: PricingService,
    private readonly credit: CreditStatusService,
  ) {}

  /**
   * Credit status snapshot for a partner — used by the SO wizard to
   * display available credit and validate in real time.
   */
  @Get('credit-status/:partnerId')
  async getCreditStatus(@Param('partnerId') partnerId: string) {
    return this.credit.getCreditStatus(partnerId);
  }

  /**
   * Check whether an order of `amount` would be allowed under the
   * partner's credit limit and risk rules.
   */
  @Get('credit-check/:partnerId')
  async checkCredit(
    @Param('partnerId') partnerId: string,
    @Query('amount') amount: string,
  ) {
    return this.credit.checkOrderAllowed(partnerId, Number(amount));
  }

  /**
   * Apply the customer's subtype discount to a base price. Used as a
   * price preview in the SO create wizard before the user commits.
   */
  @Get('pricing/preview')
  async pricingPreview(
    @Query('subtype') subtype?: string,
    @Query('basePrice') basePrice?: string,
  ) {
    return this.pricing.applyCustomerDiscount(
      Number(basePrice || 0),
      subtype as never,
    );
  }

  /**
   * Validate a line's quantity against the customer subtype minimum.
   */
  @Get('pricing/min-quantity')
  async minQuantity(
    @Query('subtype') subtype: string,
    @Query('orderType') orderType: string,
    @Query('requested') requested: string,
  ) {
    return this.pricing.checkMinQuantity(
      subtype as never,
      orderType as SalesOrderType,
      Number(requested),
    );
  }

  @Get()
  async findAll(@Query() query: PaginatedQueryDto & { partnerId?: string }) {
    return this.service.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  async create(
    @Body() data: CreateSalesOrderDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.create(data, req.user?.sub);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: UpdateSalesOrderDto) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post('lines/:lineId/allocate')
  async allocateRoll(
    @Param('lineId') lineId: string,
    @Body() body: AllocateRollDto,
  ) {
    return this.service.allocateRoll(lineId, body.rollId, body.quantity);
  }
}
