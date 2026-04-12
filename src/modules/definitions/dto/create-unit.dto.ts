import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UnitCategory } from '../entities/unit-of-measure.entity';

export class CreateUnitDto {
  @ApiProperty({ example: 'Metre' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'm' })
  @IsString()
  code: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: UnitCategory, example: UnitCategory.LENGTH })
  @IsEnum(UnitCategory)
  category: UnitCategory;

  @ApiProperty({ example: 'm' })
  @IsString()
  symbol: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Conversion factor to base unit',
  })
  @IsOptional()
  @IsNumber()
  baseConversionFactor?: number;

  @ApiPropertyOptional({ example: 2, description: 'Number of decimal places' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(6)
  decimalPrecision?: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isBaseUnit?: boolean;
}

export class UpdateUnitDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(UnitCategory) category?: UnitCategory;
  @IsOptional() @IsString() symbol?: string;
  @IsOptional() @IsNumber() baseConversionFactor?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(6) decimalPrecision?: number;
  @IsOptional() @IsBoolean() isBaseUnit?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsNumber() sortOrder?: number;
}
