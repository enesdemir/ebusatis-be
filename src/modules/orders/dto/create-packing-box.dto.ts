import {
  IsOptional,
  IsNumber,
  IsString,
  IsArray,
  ArrayNotEmpty,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePackingBoxDto {
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  weightKg?: number;

  @IsOptional()
  @IsString()
  dimensionsCm?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  pickingLineIds!: string[];
}
