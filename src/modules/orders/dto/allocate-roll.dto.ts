import { IsUUID, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Payload for allocating a roll (inventory item) to a sales order line.
 */
export class AllocateRollDto {
  @IsUUID()
  @IsNotEmpty()
  rollId!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  quantity!: number;
}
