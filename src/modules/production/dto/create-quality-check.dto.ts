import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsEnum,
  IsDateString,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';
import { QCResult, QCType } from '../entities/quality-check.entity';

/**
 * Payload for creating a quality check record.
 *
 * Available types:
 *  - SUPPLIER_PRE_SHIPMENT: reported by the supplier before goods leave
 *    the factory. This is the default.
 *  - OUR_INCOMING: performed by our team during goods receive.
 *  - OUR_RANDOM_AUDIT: random sampling from inventory in the warehouse.
 */
export class CreateQualityCheckDto {
  @IsUUID()
  productionOrderId!: string;

  @IsOptional()
  @IsEnum(QCType)
  qcType?: QCType;

  @IsString()
  @IsNotEmpty()
  testType!: string;

  @IsOptional()
  @IsString()
  testStandard?: string;

  @IsOptional()
  @IsEnum(QCResult)
  result?: QCResult;

  @IsOptional()
  @IsString()
  measuredValue?: string;

  @IsOptional()
  @IsString()
  expectedValue?: string;

  @IsOptional()
  @IsDateString()
  testedAt?: string;

  @IsOptional()
  @IsUUID()
  inspectorId?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  attachments?: string[];
}
