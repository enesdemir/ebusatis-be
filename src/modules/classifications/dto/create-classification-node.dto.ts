import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsObject,
  IsArray,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Payload for creating a classification tree node.
 */
export class CreateClassificationNodeDto {
  @IsString()
  @IsNotEmpty()
  classificationType!: string;

  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsObject()
  names!: Record<string, string>;

  @IsOptional()
  @IsObject()
  descriptions?: Record<string, string>;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsObject()
  properties?: Record<string, any>;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsBoolean()
  isRoot?: boolean;

  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  selectable?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sortOrder?: number;
}
