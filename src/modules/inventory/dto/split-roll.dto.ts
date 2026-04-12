import { IsNumber, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Payload for splitting a roll into two kartelas (parent + child).
 *
 * The parent is updated in-place (currentQuantity reduced, status
 * transitions to PARTIAL/SOLD). A new child kartela is created with
 * the given amount and status ALLOCATED.
 */
export class SplitRollDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amountToCut!: number;
}
