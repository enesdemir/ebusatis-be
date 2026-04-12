import { PartialType } from '@nestjs/mapped-types';
import { CreateVariantDto } from './create-variant.dto';

/**
 * Payload for updating a product variant. All fields optional.
 */
export class UpdateVariantDto extends PartialType(CreateVariantDto) {}
