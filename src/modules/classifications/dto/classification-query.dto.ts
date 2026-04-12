import { IsOptional, IsString } from 'class-validator';
import { PaginatedQueryDto } from '../../../common/dto/paginated-query.dto';

/**
 * Query DTO for listing classification nodes.
 */
export class ClassificationQueryDto extends PaginatedQueryDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  module?: string;
}
