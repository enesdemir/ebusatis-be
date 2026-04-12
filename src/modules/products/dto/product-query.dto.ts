import { IsOptional, IsUUID } from 'class-validator';
import { PaginatedQueryDto } from '../../../common/dto/paginated-query.dto';

/**
 * Query DTO for listing products.
 */
export class ProductQueryDto extends PaginatedQueryDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
