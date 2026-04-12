import { IsOptional, IsArray, IsUUID } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  roleIds?: string[];
}
