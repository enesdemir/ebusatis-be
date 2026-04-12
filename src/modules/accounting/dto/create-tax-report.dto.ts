import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

/** Tax report type. */
export enum TaxReportType {
  KDV = 'KDV',
  STOPAJ = 'STOPAJ',
  GUMRUK = 'GUMRUK',
}

/** Tax report status. */
export enum TaxReportStatus {
  DRAFT = 'DRAFT',
  CALCULATED = 'CALCULATED',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
}

/**
 * Payload for creating a tax report.
 */
export class CreateTaxReportDto {
  @IsString()
  @IsNotEmpty()
  period!: string;

  @IsEnum(TaxReportType)
  type!: TaxReportType;

  @IsOptional()
  @IsEnum(TaxReportStatus)
  status?: TaxReportStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalTaxBase?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalTax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  deductibleTax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  payableTax?: number;

  @IsOptional()
  @IsArray()
  lines?: Record<string, unknown>[];

  @IsOptional()
  @IsString()
  note?: string;
}
