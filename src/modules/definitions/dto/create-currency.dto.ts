import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { CurrencyPosition } from '../entities/currency.entity';

export class CreateCurrencyDto {
  @IsString() name: string;
  @IsString() code: string;
  @IsOptional() @IsString() description?: string;
  @IsString() symbol: string;
  @IsOptional() @IsNumber() @Min(0) @Max(4) decimalPlaces?: number;
  @IsOptional() @IsBoolean() isDefault?: boolean;
  @IsOptional() @IsEnum(CurrencyPosition) position?: CurrencyPosition;
}

export class UpdateCurrencyDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() symbol?: string;
  @IsOptional() @IsNumber() @Min(0) @Max(4) decimalPlaces?: number;
  @IsOptional() @IsBoolean() isDefault?: boolean;
  @IsOptional() @IsEnum(CurrencyPosition) position?: CurrencyPosition;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsNumber() sortOrder?: number;
}
