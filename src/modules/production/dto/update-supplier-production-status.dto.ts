import { IsEnum } from 'class-validator';
import { SupplierProductionStatus } from '../entities/supplier-production-order.entity';

/**
 * Payload for updating the status of a supplier production order.
 *
 * Status transitions trigger automatic date stamping in the service:
 *  - IN_DYEHOUSE              → sets `actualStartDate`
 *  - READY_TO_SHIP / SHIPPED  → sets `actualCompletionDate`
 */
export class UpdateSupplierProductionStatusDto {
  @IsEnum(SupplierProductionStatus)
  status!: SupplierProductionStatus;
}
