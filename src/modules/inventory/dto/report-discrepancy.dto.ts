import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DiscrepancyType } from '../entities/goods-receive-line.entity';

/**
 * Payload for flagging a discrepancy on an existing goods receive line.
 *
 * Setting `discrepancyType = NONE` (or omitting the field entirely)
 * clears the existing discrepancy. Otherwise the values describe the
 * mismatch detected during physical inspection so a SupplierClaim can
 * later be opened from this line.
 */
export class ReportDiscrepancyDto {
  @IsOptional()
  @IsEnum(DiscrepancyType)
  discrepancyType?: DiscrepancyType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discrepancyQuantity?: number;

  @IsOptional()
  @IsString()
  discrepancyReason?: string;

  @IsOptional()
  @IsString()
  conditionNotes?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  photoEvidenceUrls?: string[];
}
