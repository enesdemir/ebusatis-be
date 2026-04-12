import {
  IsUUID,
  IsOptional,
  IsString,
  IsNumber,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Payload for cutting a quantity from a roll.
 */
export class CutRollDto {
  @IsUUID()
  rollId!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
