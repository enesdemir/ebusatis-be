import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

/**
 * Payload for updating a product. All fields optional.
 */
export class UpdateProductDto extends PartialType(CreateProductDto) {}
