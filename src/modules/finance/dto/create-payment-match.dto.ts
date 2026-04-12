import { IsUUID, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Links a payment to a specific invoice with a matched amount.
 */
export class CreatePaymentMatchDto {
  @IsUUID()
  @IsNotEmpty()
  invoiceId!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount!: number;
}
