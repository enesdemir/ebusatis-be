import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsNumber,
  IsPositive,
  IsEnum,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SupplierProductionStatus } from '../entities/supplier-production-order.entity';

/**
 * Payload for creating a new supplier production order.
 *
 * A supplier production order is always linked to a PurchaseOrder and
 * references a Partner (the overseas manufacturer factory).
 */
export class CreateSupplierProductionOrderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  productionNumber!: string;

  @IsUUID()
  purchaseOrderId!: string;

  @IsUUID()
  supplierId!: string;

  @IsOptional()
  @IsUUID()
  supplierContactId?: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsUUID()
  variantId?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  plannedQuantity!: number;

  @IsOptional()
  @IsEnum(SupplierProductionStatus)
  status?: SupplierProductionStatus;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  factoryLocation?: string;

  @IsOptional()
  @IsDateString()
  estimatedStartDate?: string;

  @IsOptional()
  @IsDateString()
  estimatedCompletionDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
