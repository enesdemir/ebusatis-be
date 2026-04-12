import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsString,
  IsArray,
  IsEnum,
  Max,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateSalesOrderLineDto } from './create-sales-order-line.dto';
import {
  SalesOrderType,
  SalesOrderPaymentType,
} from '../entities/sales-order.entity';

/**
 * Payload for creating a sales order.
 */
export class CreateSalesOrderDto {
  @IsUUID()
  @IsNotEmpty()
  partnerId!: string;

  /** Order type — FABRIC (metre) or PRODUCT (unit). Defaults to FABRIC. */
  @IsOptional()
  @IsEnum(SalesOrderType)
  orderType?: SalesOrderType;

  /** Payment type — CASH (default), CREDIT or PARTIAL. */
  @IsOptional()
  @IsEnum(SalesOrderPaymentType)
  paymentType?: SalesOrderPaymentType;

  /** Down-payment percentage when paymentType is PARTIAL (0-100). */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  partialPaymentRate?: number;

  @IsOptional()
  @IsUUID()
  counterpartyId?: string;

  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @IsOptional()
  @IsUUID()
  currencyId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 6 })
  @Min(0)
  exchangeRate?: number;

  @IsOptional()
  @IsUUID()
  statusId?: string;

  @IsOptional()
  @IsString()
  orderDate?: string;

  @IsOptional()
  @IsString()
  expectedDeliveryDate?: string;

  @IsOptional()
  @IsUUID()
  paymentMethodId?: string;

  @IsOptional()
  @IsUUID()
  deliveryMethodId?: string;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  internalNote?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSalesOrderLineDto)
  lines?: CreateSalesOrderLineDto[];
}
