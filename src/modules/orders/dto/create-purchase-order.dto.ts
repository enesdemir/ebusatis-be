import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsString,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePurchaseOrderLineDto } from './create-purchase-order-line.dto';

/**
 * Payload for creating a purchase order.
 */
export class CreatePurchaseOrderDto {
  @IsUUID()
  @IsNotEmpty()
  supplierId!: string;

  @IsOptional()
  @IsUUID()
  counterpartyId?: string;

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
  expectedDeliveryDate?: string;

  @IsOptional()
  @IsString()
  containerInfo?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderLineDto)
  lines?: CreatePurchaseOrderLineDto[];
}
