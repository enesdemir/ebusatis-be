import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsObject,
  IsArray,
} from 'class-validator';

export class CreateClassificationNodeDto {
  @IsString()
  classificationType!: string;

  @IsString()
  code!: string;

  @IsObject()
  names!: Record<string, string>;

  @IsOptional()
  @IsObject()
  descriptions?: Record<string, string>;

  @IsOptional()
  @IsString()
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
  selectable?: boolean;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class UpdateClassificationNodeDto {
  @IsOptional()
  @IsObject()
  names?: Record<string, string>;

  @IsOptional()
  @IsObject()
  descriptions?: Record<string, string>;

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
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  selectable?: boolean;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class MoveNodeDto {
  @IsString()
  newParentId!: string;
}

export class ReorderDto {
  @IsArray()
  items!: Array<{ id: string; sortOrder: number }>;
}
