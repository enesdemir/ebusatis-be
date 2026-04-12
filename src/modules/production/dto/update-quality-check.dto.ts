import { PartialType } from '@nestjs/mapped-types';
import { CreateQualityCheckDto } from './create-quality-check.dto';

/**
 * Payload for updating a quality check record.
 * All fields from `CreateQualityCheckDto` become optional.
 */
export class UpdateQualityCheckDto extends PartialType(CreateQualityCheckDto) {}
