import { IsOptional, IsUUID } from 'class-validator';
import { PaginatedQueryDto } from '../../../common/dto/paginated-query.dto';

/**
 * Query DTO for listing landed cost calculations.
 */
export class LandedCostQueryDto extends PaginatedQueryDto {
  @IsOptional()
  @IsUUID()
  purchaseOrderId?: string;

  @IsOptional()
  @IsUUID()
  shipmentId?: string;
}
