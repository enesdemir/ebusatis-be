import { IsOptional, IsEnum, IsUUID } from 'class-validator';
import { PaginatedQueryDto } from '../../../common/dto/paginated-query.dto';
import { SupplierProductionStatus } from '../entities/supplier-production-order.entity';

/**
 * Query DTO for listing supplier production orders.
 *
 * Inherits the common pagination, sorting and full-text search shape
 * from `PaginatedQueryDto` and adds production-specific filters.
 */
export class SupplierProductionOrderQueryDto extends PaginatedQueryDto {
  @IsOptional()
  @IsEnum(SupplierProductionStatus)
  status?: SupplierProductionStatus;

  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @IsOptional()
  @IsUUID()
  purchaseOrderId?: string;
}
