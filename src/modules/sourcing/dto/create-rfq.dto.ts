import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RFQStatus } from '../entities/rfq.entity';
import { CreateRfqItemDto } from './create-rfq-item.dto';

/**
 * Payload for creating a Request for Quotation (RFQ).
 */
export class CreateRfqDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(RFQStatus)
  status?: RFQStatus;

  @IsOptional()
  @IsString()
  deadline?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsArray()
  supplierIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRfqItemDto)
  items?: CreateRfqItemDto[];
}
