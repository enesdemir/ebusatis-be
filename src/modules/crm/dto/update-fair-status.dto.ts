import { IsEnum } from 'class-validator';
import { FairStatus } from '../entities/fair.entity';

export class UpdateFairStatusDto {
  @IsEnum(FairStatus)
  status!: FairStatus;
}
