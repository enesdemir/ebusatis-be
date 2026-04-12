import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * One entry in a purchase order's delivery-warning schedule.
 *
 * The cron engine (Sprint 9) will iterate these entries daily and,
 * when `daysBefore` matches the gap to `expectedDeliveryDate`, fire a
 * notification to the listed user groups / users.
 */
export class DeliveryWarningEntryDto {
  @IsInt()
  @Min(0)
  @Max(365)
  daysBefore!: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recipientGroupCodes?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recipientUserIds?: string[];
}

/**
 * Payload that overwrites the entire delivery-warning schedule for a
 * purchase order. Passing an empty array clears it.
 */
export class UpdateDeliveryWarningConfigDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliveryWarningEntryDto)
  entries!: DeliveryWarningEntryDto[];
}
