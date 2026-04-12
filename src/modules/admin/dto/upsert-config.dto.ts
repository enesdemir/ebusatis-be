import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ConfigCategory } from '../entities/platform-config.entity';

export class UpsertConfigDto {
  @IsString()
  value!: string;

  @IsOptional()
  @IsEnum(ConfigCategory)
  category?: ConfigCategory;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  valueType?: string;
}
