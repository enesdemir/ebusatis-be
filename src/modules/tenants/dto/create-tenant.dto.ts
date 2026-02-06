import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TenantType } from '../entities/tenant.entity';

export class CreateTenantDto {
  @ApiProperty({ example: 'My Textile Co.', description: 'The name of the tenant company' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'mytextile', description: 'Subdomain or domain for the tenant' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, { message: 'Domain must contain only lowercase letters, numbers, and hyphens' })
  domain: string;

  @ApiPropertyOptional({ enum: TenantType, default: TenantType.SAAS })
  @IsOptional()
  @IsEnum(TenantType)
  type?: TenantType;
}
