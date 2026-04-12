import { PartialType } from '@nestjs/mapped-types';
import { CreateTaxReportDto } from './create-tax-report.dto';

/**
 * Payload for updating a tax report. All fields optional.
 */
export class UpdateTaxReportDto extends PartialType(CreateTaxReportDto) {}
