import { IsUUID, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Payload for adjusting the stock quantity of a roll.
 */
export class AdjustStockDto {
  @IsUUID()
  rollId!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  newQuantity!: number;

  @IsOptional()
  @IsString()
  note?: string;
}
