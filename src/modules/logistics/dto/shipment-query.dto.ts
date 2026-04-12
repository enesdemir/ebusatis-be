import { IsOptional, IsEnum, IsUUID } from 'class-validator';
import { PaginatedQueryDto } from '../../../common/dto/paginated-query.dto';
import { ShipmentDirection, ShipmentStatus } from '../entities/shipment.entity';

/**
 * Query DTO for listing shipments.
 *
 * Inherits common pagination, sorting and full-text search from
 * `PaginatedQueryDto` and adds direction-, status- and order-specific
 * filters that the UI uses to slice the shipments list.
 */
export class ShipmentQueryDto extends PaginatedQueryDto {
  @IsOptional()
  @IsEnum(ShipmentDirection)
  direction?: ShipmentDirection;

  @IsOptional()
  @IsEnum(ShipmentStatus)
  status?: ShipmentStatus;

  @IsOptional()
  @IsUUID()
  purchaseOrderId?: string;

  @IsOptional()
  @IsUUID()
  salesOrderId?: string;

  @IsOptional()
  @IsUUID()
  carrierId?: string;
}
