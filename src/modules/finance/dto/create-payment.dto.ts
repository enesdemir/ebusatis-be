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
import { PaymentDirection } from '../entities/payment.entity';
import { CreatePaymentMatchDto } from './create-payment-match.dto';

/**
 * Payload for creating a payment record.
 */
export class CreatePaymentDto {
  @IsEnum(PaymentDirection)
  @IsNotEmpty()
  direction!: PaymentDirection;

  @IsUUID()
  @IsNotEmpty()
  partnerId!: string;

  @IsOptional()
  @IsUUID()
  counterpartyId?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount!: number;

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
  paymentDate?: string;

  @IsOptional()
  @IsUUID()
  methodId?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  bankAccount?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePaymentMatchDto)
  matchedInvoices?: CreatePaymentMatchDto[];
}
