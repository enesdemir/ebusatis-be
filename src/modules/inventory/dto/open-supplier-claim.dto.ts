import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ClaimType } from '../entities/supplier-claim.entity';

/**
 * One affected variant inside a supplier claim.
 *
 * Each line points back to the originating goods receive line for
 * traceability and stores the per-unit price the claim is asserted at.
 */
export class OpenSupplierClaimLineDto {
  @IsUUID()
  goodsReceiveLineId!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  affectedQuantity!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  unitPrice!: number;

  @IsOptional()
  @IsString()
  note?: string;
}

/**
 * Payload for opening a supplier claim against a goods receive.
 *
 * The service derives the totals from the line items, picks the
 * supplier and PO from the goods receive, and refuses to open a claim
 * if any of the referenced goods receive lines have no discrepancy
 * recorded yet.
 */
export class OpenSupplierClaimDto {
  @IsUUID()
  goodsReceiveId!: string;

  @IsEnum(ClaimType)
  claimType!: ClaimType;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsOptional()
  @IsUUID()
  currencyId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  photoUrls?: string[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OpenSupplierClaimLineDto)
  lines!: OpenSupplierClaimLineDto[];
}
