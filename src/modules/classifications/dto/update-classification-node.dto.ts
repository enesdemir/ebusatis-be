import { PartialType } from '@nestjs/mapped-types';
import { CreateClassificationNodeDto } from './create-classification-node.dto';

/**
 * Payload for updating a classification tree node. All fields optional.
 */
export class UpdateClassificationNodeDto extends PartialType(
  CreateClassificationNodeDto,
) {}
