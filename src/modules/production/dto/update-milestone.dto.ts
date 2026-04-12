import { IsEnum, IsOptional, IsString, IsDateString, IsUUID } from 'class-validator';
import { MilestoneStatus } from '../entities/production-milestone.entity';

/**
 * Payload for an internal user updating a milestone.
 *
 * Reports coming from the supplier portal go through
 * `SupplierMilestoneReportDto` instead.
 */
export class UpdateMilestoneDto {
  @IsOptional()
  @IsEnum(MilestoneStatus)
  status?: MilestoneStatus;

  @IsOptional()
  @IsDateString()
  startedAt?: string;

  @IsOptional()
  @IsDateString()
  completedAt?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsUUID()
  assignedToId?: string;
}
