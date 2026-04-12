import { IsUUID, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class StartPickingDto {
  @IsUUID()
  @IsNotEmpty()
  salesOrderId!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
