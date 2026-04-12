import {
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsNumber,
  IsDateString,
  IsString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CarrierPaymentTrigger,
  CarrierPaymentStatus,
} from '../entities/carrier-payment-schedule.entity';

/**
 * Payload for adding a carrier payment installment to a shipment leg.
 */
export class CreateCarrierPaymentDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  installmentNumber?: number;

  @IsEnum(CarrierPaymentTrigger)
  trigger!: CarrierPaymentTrigger;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  percentage?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsEnum(CarrierPaymentStatus)
  status?: CarrierPaymentStatus;

  @IsOptional()
  @IsUUID()
  paymentId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
