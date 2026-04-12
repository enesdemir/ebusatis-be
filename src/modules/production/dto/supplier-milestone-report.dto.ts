import { IsEnum, IsOptional, IsString, IsArray, ArrayMaxSize } from 'class-validator';
import { MilestoneStatus } from '../entities/production-milestone.entity';

/**
 * Payload for a milestone report submitted by the supplier.
 *
 * Whenever a stage is completed the supplier sends a status update,
 * a list of media URLs (photos / videos) and an optional note. The
 * service automatically stamps `lastSupplierUpdateAt` on the parent
 * production order so freshness can be detected by listeners.
 *
 * NOTE: this endpoint will be moved behind a dedicated supplier-portal
 * token in a future iteration. For now it shares the regular JWT.
 */
export class SupplierMilestoneReportDto {
  @IsOptional()
  @IsEnum(MilestoneStatus)
  status?: MilestoneStatus;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  mediaUrls?: string[];

  @IsOptional()
  @IsString()
  note?: string;
}
