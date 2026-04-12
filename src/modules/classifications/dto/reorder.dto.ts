import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { IsString, IsNumber } from 'class-validator';

/**
 * A single item in the reorder list.
 */
export class ReorderItemDto {
  @IsString()
  id!: string;

  @IsNumber()
  sortOrder!: number;
}

/**
 * Payload for reordering sibling classification nodes.
 */
export class ReorderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items!: ReorderItemDto[];
}
