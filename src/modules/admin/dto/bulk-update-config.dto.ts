import { IsArray, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';

class ConfigItemDto {
  @IsString()
  key!: string;

  @IsString()
  value!: string;
}

export class BulkUpdateConfigDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfigItemDto)
  configs!: ConfigItemDto[];
}
