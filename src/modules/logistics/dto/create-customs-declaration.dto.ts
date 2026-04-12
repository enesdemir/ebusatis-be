import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  IsDateString,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CustomsStatus } from '../entities/customs-declaration.entity';

/**
 * Document attached to a customs declaration.
 * Validated as a free-form jsonb shape so the UI can attach any number
 * of supporting documents (commercial invoice, packing list, BL, etc.).
 */
export interface CustomsDocumentDto {
  name: string;
  type: string;
  url?: string;
}

/**
 * Payload for creating a customs declaration record.
 *
 * Cost fields default to zero so the UI can submit only the totals it
 * knows up front and append the rest later via the update endpoint.
 */
export class CreateCustomsDeclarationDto {
  @IsString()
  @IsNotEmpty()
  declarationNumber!: string;

  @IsOptional()
  @IsUUID()
  shipmentId?: string;

  @IsOptional()
  @IsEnum(CustomsStatus)
  status?: CustomsStatus;

  @IsOptional()
  @IsString()
  declarationType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  customsDuty?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  customsVat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  brokerFee?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  insuranceCost?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalCost?: number;

  @IsOptional()
  @IsUUID()
  currencyId?: string;

  @IsOptional()
  @IsDateString()
  submittedAt?: string;

  @IsOptional()
  @IsDateString()
  approvedAt?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsArray()
  documents?: CustomsDocumentDto[];
}
