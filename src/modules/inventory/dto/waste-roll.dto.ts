import {
  IsUUID,
  IsOptional,
  IsString,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Payload for marking waste on a roll.
 */
export class WasteRollDto {
  @IsUUID()
  rollId!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;

  @IsOptional()
  @IsString()
  note?: string;
}
