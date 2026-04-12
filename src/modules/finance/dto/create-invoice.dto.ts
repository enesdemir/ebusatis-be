import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsString,
  IsArray,
  IsEnum,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceType } from '../entities/invoice.entity';
import { CreateInvoiceLineDto } from './create-invoice-line.dto';

/**
 * Payload for creating an invoice.
 */
export class CreateInvoiceDto {
  @IsEnum(InvoiceType)
  @IsNotEmpty()
  type!: InvoiceType;

  @IsUUID()
  @IsNotEmpty()
  partnerId!: string;

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
  @IsString()
  issueDate?: string;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsUUID()
  paymentMethodId?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  sourceOrderId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discountAmount?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceLineDto)
  lines?: CreateInvoiceLineDto[];
}
