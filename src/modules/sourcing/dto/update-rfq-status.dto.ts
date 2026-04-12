import { IsEnum, IsNotEmpty } from 'class-validator';
import { RFQStatus } from '../entities/rfq.entity';

/**
 * Payload for updating an RFQ status.
 */
export class UpdateRfqStatusDto {
  @IsEnum(RFQStatus)
  @IsNotEmpty()
  status!: RFQStatus;
}
