import { IsEnum } from 'class-validator';
import { LeadStage } from '../entities/lead.entity';

export class MoveLeadStageDto {
  @IsEnum(LeadStage)
  stage!: LeadStage;
}
