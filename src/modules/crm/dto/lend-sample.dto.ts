import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class LendSampleDto {
  @IsOptional()
  @IsUUID()
  partnerId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsDateString()
  expectedReturnDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReturnSampleDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
